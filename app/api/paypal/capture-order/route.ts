import { NextRequest, NextResponse } from "next/server";
import { getVerifiedSession } from "@/lib/verifySessionServer";
import { PAYPAL_API_BASE, getPayPalAccessToken } from "@/lib/paypal";
import {
  addDays,
  estimateArrivalDays,
  haversineDistanceKm,
} from "@/lib/shipping";

const DATABASE_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

interface CartItem {
  vendorId?: string;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  priceAtAdd: number;
}

interface CustomerAddress {
  lat?: number | null;
  lng?: number | null;
}

interface BusinessRecord {
  userId: string;
  businessName?: string;
  lat?: number | null;
  lng?: number | null;
}

async function decrementStock(
  productId: string,
  qty: number,
  idToken: string,
) {
  const url = `${DATABASE_URL}/products/${productId}/stockQuantity.json?auth=${idToken}`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const getRes = await fetch(url, {
      headers: { "X-Firebase-ETag": "true" },
      cache: "no-store",
    });
    if (!getRes.ok) return;

    const etag = getRes.headers.get("ETag");
    const current = (await getRes.json()) as number | null;
    if (typeof current !== "number") return;

    const next = Math.max(0, current - qty);
    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(etag ? { "if-match": etag } : {}),
      },
      body: JSON.stringify(next),
    });

    if (putRes.ok) return;
    if (putRes.status === 412) continue;

    console.error(
      `Failed to decrement stock for product ${productId}:`,
      await putRes.text(),
    );
    return;
  }

  console.error(
    `Exhausted retries decrementing stock for product ${productId}`,
  );
}

export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { orderID } = await req.json();
    if (!orderID || typeof orderID !== "string") {
      return NextResponse.json({ error: "Missing orderID" }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();

    const captureRes = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!captureRes.ok) {
      const errorBody = await captureRes.text();
      console.error("PayPal capture failed:", errorBody);
      return NextResponse.json(
        { error: "Failed to capture payment" },
        { status: 502 },
      );
    }

    const capture = await captureRes.json();

    if (capture.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Payment was not completed" },
        { status: 402 },
      );
    }

    const [cartRes, addressRes, businessRes] = await Promise.all([
      fetch(
        `${DATABASE_URL}/carts/${session.uid}/items.json?auth=${session.idToken}`,
      ),
      fetch(
        `${DATABASE_URL}/users/${session.uid}/address.json?auth=${session.idToken}`,
      ),
      fetch(`${DATABASE_URL}/business.json?auth=${session.idToken}`),
    ]);

    const cartItems = cartRes.ok
      ? ((await cartRes.json()) as Record<string, CartItem> | null)
      : null;
    const customerAddress = addressRes.ok
      ? ((await addressRes.json()) as CustomerAddress | null)
      : null;
    const businesses = businessRes.ok
      ? ((await businessRes.json()) as Record<string, BusinessRecord> | null)
      : null;

    let orderId: string | null = null;

    if (cartItems && Object.keys(cartItems).length > 0) {
      const businessList = businesses ? Object.values(businesses) : [];

      const items = Object.entries(cartItems).map(([productId, item]) => {
        const vendor = item.vendorId
          ? businessList.find((b) => b.userId === item.vendorId)
          : undefined;

        const distanceKm =
          customerAddress?.lat != null &&
          customerAddress?.lng != null &&
          vendor?.lat != null &&
          vendor?.lng != null
            ? haversineDistanceKm(
                customerAddress.lat,
                customerAddress.lng,
                vendor.lat,
                vendor.lng,
              )
            : null;

        const estimatedArrivalDays = estimateArrivalDays(distanceKm);
        const estimatedArrivalDate = addDays(
          estimatedArrivalDays,
        ).toISOString();

        return {
          productId,
          ...item,
          estimatedArrivalDays,
          estimatedArrivalDate,
        };
      });

      const total = items.reduce(
        (sum, item) => sum + item.priceAtAdd * item.quantity,
        0,
      );

      const orderRes = await fetch(
        `${DATABASE_URL}/orders.json?auth=${session.idToken}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.uid,
            paypalOrderId: orderID,
            status: "to_ship",
            items,
            total,
            createdAt: { ".sv": "timestamp" },
            updatedAt: { ".sv": "timestamp" },
          }),
        },
      );

      if (orderRes.ok) {
        const created = await orderRes.json();
        orderId = created.name;

        const transactionRes = await fetch(
          `${DATABASE_URL}/transactions.json?auth=${session.idToken}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: session.uid,
              orderId,
              paymentMethod: "paypal",
              paypalOrderId: orderID,
              paypalCaptureId:
                capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id ??
                null,
              payerEmail: capture?.payer?.email_address ?? null,
              total,
              itemCount: items.length,
              status: "completed",
              createdAt: { ".sv": "timestamp" },
            }),
          },
        );

        if (!transactionRes.ok) {
          console.error(
            "Failed to persist transaction record:",
            await transactionRes.text(),
          );
        }

        await Promise.all(
          items.map((item) =>
            decrementStock(item.productId, item.quantity, session.idToken),
          ),
        );
      } else {
        console.error(
          "Failed to persist order record:",
          await orderRes.text(),
        );
      }
    }

    await fetch(
      `${DATABASE_URL}/carts/${session.uid}/items.json?auth=${session.idToken}`,
      { method: "DELETE" },
    );

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error("Unhandled error in /api/paypal/capture-order:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to capture order",
      },
      { status: 500 },
    );
  }
}
