"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { get, onValue, ref, remove, update } from "firebase/database";
import Navbar from "@/components/Navbar";
import AddressRequiredModal from "@/components/AddressRequiredModal";
import ConfirmModal from "@/components/ConfirmModal";
import { db } from "@/lib/firebase";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  removeItem as removeGuestItem,
  selectCartItems,
  updateQuantity as updateGuestQuantity,
} from "@/store/slices/cartSlice";

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

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const authLoading = useAppSelector((state) => state.auth.loading);
  const guestItems = useAppSelector(selectCartItems);
  const [firebaseItems, setFirebaseItems] = useState<
    (FirebaseCartItem & { productId: string })[]
  >([]);
  const [stockById, setStockById] = useState<Record<string, number>>({});
  const [checkoutStep, setCheckoutStep] = useState<"address" | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [removeTarget, setRemoveTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

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
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    const unsubscribe = onValue(ref(db, "products"), (snapshot) => {
      const data = snapshot.val() as Record<
        string,
        { stockQuantity?: number }
      > | null;

      const map: Record<string, number> = {};
      if (data) {
        for (const [productId, value] of Object.entries(data)) {
          map[productId] = value.stockQuantity ?? 0;
        }
      }
      setStockById(map);
    });

    return () => unsubscribe();
  }, []);

  const items: DisplayItem[] = user
    ? firebaseItems.map((item) => ({
        id: item.productId,
        name: item.name,
        image: item.imageUrl,
        price: item.priceAtAdd,
        quantity: item.quantity,
      }))
    : guestItems.map((item) => ({
        id: item.id,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
      }));

  const isChecked = (id: string) => selected[id] ?? true;
  const toggleItem = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !isChecked(id) }));
  };
  const allChecked = items.length > 0 && items.every((item) => isChecked(item.id));
  const toggleAll = () => {
    const next = !allChecked;
    setSelected(
      Object.fromEntries(items.map((item) => [item.id, next])),
    );
  };

  const selectedItems = items.filter((item) => isChecked(item.id));
  const total = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const itemCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  const availableFor = (id: string) => stockById[id] ?? Infinity;
  const isSoldOut = (item: DisplayItem) =>
    user ? availableFor(item.id) <= 0 : false;
  const isInsufficientStock = (item: DisplayItem) =>
    user && availableFor(item.id) > 0 && availableFor(item.id) < item.quantity;
  const hasBlockingStockIssue = selectedItems.some(
    (item) => isSoldOut(item) || isInsufficientStock(item),
  );

  const handleQuantityChange = async (id: string, quantity: number) => {
    if (quantity < 1) return;
    if (user) {
      await update(ref(db, `carts/${user.uid}/items/${id}`), { quantity });
    } else {
      dispatch(updateGuestQuantity({ id, quantity }));
    }
  };

  const handleRemove = async (id: string) => {
    if (user) {
      await remove(ref(db, `carts/${user.uid}/items/${id}`));
    } else {
      dispatch(removeGuestItem(id));
    }
  };

  const handleProceed = async () => {
    if (!user || hasBlockingStockIssue || selectedItems.length === 0) return;

    sessionStorage.setItem(
      "checkout:selectedItems",
      JSON.stringify(selectedItems.map((item) => item.id)),
    );

    const snapshot = await get(ref(db, `users/${user.uid}/address`));
    const address = snapshot.val() as {
      street?: string;
      city?: string;
    } | null;

    if (address?.street && address?.city) {
      router.push("/checkout/payment");
    } else {
      setCheckoutStep("address");
    }
  };

  if (authLoading) return null;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 py-[3vh] bg-blue-100 px-[3vh] xl:px-[8vh] overflow-auto text-black">
        <div className="font-black text-blue-950 text-2xl mb-4">Checkout</div>

        {items.length === 0 ? (
          <div className="text-center text-blue-900/50 py-20">
            Your cart is empty.{" "}
            <Link href="/shop" className="underline text-blue-950">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-3">
              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-blue-950"
                  checked={allChecked}
                  onChange={toggleAll}
                />
                <div className="text-xs font-medium text-blue-900/70">
                  Select all
                </div>
              </div>
              {items.map((item) => {
                const soldOut = isSoldOut(item);
                const insufficient = isInsufficientStock(item);
                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-md p-3 flex items-center gap-3 ${
                      soldOut || insufficient
                        ? "border-red-300"
                        : "border-blue-900/10"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-blue-950 shrink-0"
                      checked={isChecked(item.id)}
                      onChange={() => toggleItem(item.id)}
                    />
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className={`w-16 h-16 object-cover rounded-sm shrink-0 ${
                          soldOut ? "opacity-40 grayscale" : ""
                        }`}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-sm shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-medium text-blue-950 truncate"
                        title={item.name}
                      >
                        {item.name}
                      </div>
                      <div className="text-xs text-blue-900/60">
                        ${item.price.toLocaleString()} each
                      </div>
                      {soldOut && (
                        <div className="text-xs font-semibold text-red-600 mt-1">
                          Sold out
                        </div>
                      )}
                      {!soldOut && insufficient && (
                        <div className="text-xs font-semibold text-red-600 mt-1">
                          Only {stockById[item.id]} left — reduce quantity to
                          continue
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 border border-blue-900/30 rounded-sm shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity - 1)
                        }
                        className="px-2 py-0.5 text-blue-950 cursor-pointer hover:bg-blue-50"
                      >
                        -
                      </button>
                      <div className="text-xs w-4 text-center">
                        {item.quantity}
                      </div>
                      <button
                        type="button"
                        disabled={soldOut}
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1)
                        }
                        className="px-2 py-0.5 text-blue-950 cursor-pointer hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-sm font-semibold text-blue-950 w-16 text-right shrink-0">
                      ${(item.price * item.quantity).toLocaleString()}
                    </div>
                    <div
                      onClick={() =>
                        setRemoveTarget({ id: item.id, name: item.name })
                      }
                      className="cursor-pointer text-blue-900/40 hover:text-red-600 transition-all shrink-0"
                      title="Remove"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 3.75h6a1.5 1.5 0 0 1 1.5 1.5v.75H7.5v-.75a1.5 1.5 0 0 1 1.5-1.5ZM4.5 6h15m-13.5 6v12.75A2.25 2.25 0 0 0 8.25 21h7.5a2.25 2.25 0 0 0 2.25-2.25V6M9.75 10.5v6m4.5-6v6"
                        />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white border border-blue-900/10 rounded-md p-4 flex flex-col gap-3 h-fit">
              <div className="font-black text-blue-950 text-lg">
                Order Summary
              </div>
              <div className="flex items-center justify-between text-sm text-blue-900/70">
                <div>
                  {itemCount} item{itemCount === 1 ? "" : "s"}
                </div>
                <div>${total.toLocaleString()}</div>
              </div>
              <div className="flex items-center justify-between border-t border-blue-900/10 pt-3 font-black text-blue-950">
                <div>Total</div>
                <div>${total.toLocaleString()}</div>
              </div>

              {user ? (
                <>
                  {selectedItems.length === 0 ? (
                    <div className="text-xs text-red-600 text-center">
                      Select at least one item to continue.
                    </div>
                  ) : (
                    hasBlockingStockIssue && (
                      <div className="text-xs text-red-600 text-center">
                        Remove or adjust sold-out items to continue.
                      </div>
                    )
                  )}
                  <button
                    type="button"
                    disabled={hasBlockingStockIssue || selectedItems.length === 0}
                    onClick={handleProceed}
                    className="bg-blue-950 w-full py-2 rounded-sm text-white text-sm font-semibold uppercase cursor-pointer hover:bg-blue-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Proceed to Payment
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="bg-blue-950 w-full py-2 rounded-sm text-white text-sm font-semibold uppercase cursor-pointer hover:bg-blue-900 transition-all"
                >
                  Sign in to checkout
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {checkoutStep === "address" && (
        <AddressRequiredModal
          onClose={() => setCheckoutStep(null)}
          onSaved={() => router.push("/checkout/payment")}
        />
      )}

      {removeTarget && (
        <ConfirmModal
          title="Remove item"
          message={`Remove "${removeTarget.name}" from your cart?`}
          confirmLabel="Remove"
          variant="danger"
          onConfirm={async () => {
            await handleRemove(removeTarget.id);
            setRemoveTarget(null);
          }}
          onClose={() => setRemoveTarget(null)}
        />
      )}
    </div>
  );
}
