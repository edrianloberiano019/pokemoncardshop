"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { get, onValue, ref } from "firebase/database";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { toast } from "react-toastify";
import Navbar from "@/components/Navbar";
import { db } from "@/lib/firebase";
import { useAppSelector } from "@/store/hooks";

interface DisplayItem {
  id: string;
  name: string;
  image?: string | null;
  price: number;
  quantity: number;
}

interface FirebaseCartItem {
  name: string;
  imageUrl?: string | null;
  quantity: number;
  priceAtAdd: number;
}

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const authLoading = useAppSelector((state) => state.auth.loading);
  const [firebaseItems, setFirebaseItems] = useState<
    (FirebaseCartItem & { productId: string })[]
  >([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [addressChecked, setAddressChecked] = useState(false);
  const [hasAddress, setHasAddress] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);
  const [selectionLoaded, setSelectionLoaded] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    const raw = sessionStorage.getItem("checkout:selectedItems");
    if (raw) {
      try {
        setSelectedIds(JSON.parse(raw) as string[]);
      } catch {
        setSelectedIds(null);
      }
    }
    setSelectionLoaded(true);
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onValue(
      ref(db, `carts/${user.uid}/items`),
      (snapshot) => {
        const data = snapshot.val() as Record<
          string,
          FirebaseCartItem
        > | null;

        const list = data
          ? Object.entries(data).map(([productId, value]) => ({
              productId,
              ...value,
            }))
          : [];

        setFirebaseItems(list);
        setCartLoaded(true);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    const checkAddress = async () => {
      const snapshot = await get(ref(db, `users/${user.uid}/address`));
      const address = snapshot.val() as {
        street?: string;
        city?: string;
      } | null;

      setHasAddress(Boolean(address?.street && address?.city));
      setAddressChecked(true);
    };

    checkAddress();
  }, [user?.uid]);

  useEffect(() => {
    if (addressChecked && !hasAddress) router.push("/checkout");
  }, [addressChecked, hasAddress, router]);

  const items: DisplayItem[] = firebaseItems
    .filter(
      (item) => !selectedIds || selectedIds.includes(item.productId),
    )
    .map((item) => ({
      id: item.productId,
      name: item.name,
      image: item.imageUrl,
      price: item.priceAtAdd,
      quantity: item.quantity,
    }));

  useEffect(() => {
    if (
      cartLoaded &&
      selectionLoaded &&
      addressChecked &&
      hasAddress &&
      items.length === 0
    ) {
      router.push("/checkout");
    }
  }, [
    cartLoaded,
    selectionLoaded,
    addressChecked,
    hasAddress,
    items.length,
    router,
  ]);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (
    authLoading ||
    !user ||
    !cartLoaded ||
    !selectionLoaded ||
    !addressChecked ||
    !hasAddress ||
    items.length === 0
  ) {
    return null;
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 py-[3vh] bg-blue-100 px-[3vh] xl:px-[8vh] overflow-auto text-black">
        <div className="flex items-center justify-between mb-4">
          <div className="font-black text-blue-950 text-2xl">Payment</div>
          <Link
            href="/checkout"
            className="text-xs font-medium text-blue-900/70 hover:text-blue-950 underline"
          >
            Back to cart
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-blue-900/10 rounded-md p-5 flex flex-col gap-1 h-fit">
            <div className="font-black text-blue-950 text-lg mb-2">
              Order Summary
            </div>
            <div className="flex flex-col divide-y divide-blue-900/10">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-sm shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gray-200 rounded-sm shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-medium text-blue-950 truncate"
                      title={item.name}
                    >
                      {item.name}
                    </div>
                    <div className="text-xs text-blue-900/60">
                      {item.quantity} x ${item.price.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-blue-950 shrink-0">
                    ${(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-blue-900/10 pt-3 text-sm text-blue-900/70">
              <div>
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </div>
              <div>${total.toLocaleString()}</div>
            </div>
            <div className="flex items-center justify-between border-t border-blue-900/10 pt-3 font-black text-blue-950 text-lg">
              <div>Total</div>
              <div>${total.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-white border border-blue-900/10 rounded-md p-5 flex flex-col gap-4 h-fit">
            <div className="font-black text-blue-950 text-lg">
              Payment Method
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 border border-blue-900 rounded-sm px-3 py-3 bg-blue-50">
                <div className="size-4 rounded-full border-2 border-blue-950 flex items-center justify-center shrink-0">
                  <div className="size-2 rounded-full bg-blue-950" />
                </div>
                <div className="flex items-center gap-0.5">
                  <span className="font-black italic text-[#003087] text-lg">
                    Pay
                  </span>
                  <span className="font-black italic text-[#009cde] text-lg">
                    Pal
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 border border-blue-900/20 rounded-sm px-3 py-3 opacity-50 cursor-not-allowed">
                <div className="size-4 rounded-full border-2 border-blue-900/40 shrink-0" />
                <div className="text-sm font-medium text-blue-950">
                  Cash on Delivery
                </div>
                <div className="ml-auto text-[0.65rem] font-semibold text-blue-900/50 uppercase">
                  Not available
                </div>
              </div>

              <div className="flex items-center gap-3 border border-blue-900/20 rounded-sm px-3 py-3 opacity-50 cursor-not-allowed">
                <div className="size-4 rounded-full border-2 border-blue-900/40 shrink-0" />
                <div className="text-sm font-medium text-blue-950">
                  Credit / Debit Card
                </div>
                <div className="ml-auto text-[0.65rem] font-semibold text-blue-900/50 uppercase">
                  Not available
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-blue-900/10 pt-3">
              <div className="text-sm font-medium text-blue-950">
                Total due
              </div>
              <div className="text-xl font-black text-blue-950">
                ${total.toLocaleString()}
              </div>
            </div>

            {clientId ? (
              <PayPalScriptProvider options={{ clientId, currency: "USD" }}>
                <PayPalButtons
                  style={{ layout: "horizontal", tagline: false, height: 40 }}
                  createOrder={async () => {
                    const res = await fetch("/api/paypal/create-order", {
                      method: "POST",
                    });
                    const data = await res.json();
                    if (!res.ok || !data.orderID) {
                      toast.error(data.error || "Failed to start checkout.");
                      throw new Error(data.error || "Failed to create order");
                    }
                    return data.orderID as string;
                  }}
                  onApprove={async (data) => {
                    const res = await fetch("/api/paypal/capture-order", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ orderID: data.orderID }),
                    });
                    const result = await res.json();
                    if (!res.ok || !result.success) {
                      toast.error(result.error || "Payment failed.");
                      return;
                    }
                    toast.success("Payment successful!");
                    router.push("/orders");
                  }}
                  onError={(err) => {
                    console.error(err);
                    toast.error("PayPal checkout failed. Please try again.");
                  }}
                />
              </PayPalScriptProvider>
            ) : (
              <button
                type="button"
                disabled
                className="bg-blue-950 w-full py-2 rounded-sm text-white text-sm font-semibold uppercase disabled:opacity-60 disabled:cursor-not-allowed"
              >
                PayPal is not configured
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
