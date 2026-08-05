import { NextResponse } from "next/server";
import { getVerifiedSession } from "@/lib/verifySessionServer";
import { PAYPAL_API_BASE, getPayPalAccessToken } from "@/lib/paypal";

const DATABASE_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

interface CartItem {
  quantity: number;
  priceAtAdd: number;
}

export async function POST() {
  try {
    const session = await getVerifiedSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    if (!DATABASE_URL) {
      console.error(
        "NEXT_PUBLIC_FIREBASE_DATABASE_URL is not set on the server.",
      );
      return NextResponse.json(
        { error: "Server misconfigured (database URL)" },
        { status: 500 },
      );
    }

    const cartRes = await fetch(
      `${DATABASE_URL}/carts/${session.uid}/items.json?auth=${session.idToken}`,
    );

    if (!cartRes.ok) {
      const errorBody = await cartRes.text();
      console.error("Failed to read cart from Firebase:", errorBody);
      return NextResponse.json(
        { error: "Failed to read cart" },
        { status: 502 },
      );
    }

    const cartItems = (await cartRes.json()) as Record<
      string,
      CartItem
    > | null;

    if (!cartItems || Object.keys(cartItems).length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const total = Object.values(cartItems).reduce(
      (sum, item) => sum + item.priceAtAdd * item.quantity,
      0,
    );

    if (!(total > 0)) {
      return NextResponse.json(
        { error: "Invalid cart total" },
        { status: 400 },
      );
    }

    const accessToken = await getPayPalAccessToken();

    const orderRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: total.toFixed(2),
            },
          },
        ],
      }),
    });

    if (!orderRes.ok) {
      const errorBody = await orderRes.text();
      console.error("PayPal create order failed:", errorBody);
      return NextResponse.json(
        { error: "Failed to create PayPal order" },
        { status: 502 },
      );
    }

    const order = await orderRes.json();
    return NextResponse.json({ orderID: order.id });
  } catch (error) {
    console.error("Unhandled error in /api/paypal/create-order:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create order",
      },
      { status: 500 },
    );
  }
}
