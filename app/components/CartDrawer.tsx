"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { get, onValue, ref, remove, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  removeItem as removeGuestItem,
  selectCartItems,
  updateQuantity as updateGuestQuantity,
} from "@/store/slices/cartSlice";
import AddressRequiredModal from "./AddressRequiredModal";
import ConfirmModal from "./ConfirmModal";

interface CartItem {
  productId: string;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  priceAtAdd: number;
}

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const guestItems = useAppSelector(selectCartItems);
  const [items, setItems] = useState<CartItem[]>([]);
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
          Omit<CartItem, "productId">
        > | null;

        const list = data
          ? Object.entries(data).map(([productId, value]) => ({
              productId,
              ...value,
            }))
          : [];

        setItems(list);
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

  const changeQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return;
    if (user) {
      await update(ref(db, `carts/${user.uid}/items/${productId}`), {
        quantity,
      });
    } else {
      dispatch(updateGuestQuantity({ id: productId, quantity }));
    }
  };

  const removeItem = async (productId: string) => {
    if (user) {
      await remove(ref(db, `carts/${user.uid}/items/${productId}`));
    } else {
      dispatch(removeGuestItem(productId));
    }
  };

  const visibleItems: CartItem[] = user
    ? items
    : guestItems.map((item) => ({
        productId: item.id,
        name: item.name,
        imageUrl: item.image ?? null,
        quantity: item.quantity,
        priceAtAdd: item.price,
      }));
  const isChecked = (id: string) => selected[id] ?? true;
  const toggleItem = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !isChecked(id) }));
  };
  const allChecked =
    visibleItems.length > 0 &&
    visibleItems.every((item) => isChecked(item.productId));
  const toggleAll = () => {
    const next = !allChecked;
    setSelected(
      Object.fromEntries(visibleItems.map((item) => [item.productId, next])),
    );
  };

  const selectedItems = visibleItems.filter((item) =>
    isChecked(item.productId),
  );
  const total = selectedItems.reduce(
    (sum, item) => sum + item.priceAtAdd * item.quantity,
    0,
  );

  const availableFor = (id: string) => stockById[id] ?? Infinity;
  const isSoldOut = (item: CartItem) =>
    user ? availableFor(item.productId) <= 0 : false;
  const isInsufficientStock = (item: CartItem) =>
    user &&
    availableFor(item.productId) > 0 &&
    availableFor(item.productId) < item.quantity;
  const hasBlockingStockIssue = selectedItems.some(
    (item) => isSoldOut(item) || isInsufficientStock(item),
  );

  const handlePayClick = async () => {
    if (!user) {
      onClose();
      router.push("/checkout");
      return;
    }
    if (hasBlockingStockIssue || selectedItems.length === 0) return;

    sessionStorage.setItem(
      "checkout:selectedItems",
      JSON.stringify(selectedItems.map((item) => item.productId)),
    );

    const snapshot = await get(ref(db, `users/${user.uid}/address`));
    const address = snapshot.val() as {
      street?: string;
      city?: string;
    } | null;

    if (address?.street && address?.city) {
      onClose();
      router.push("/checkout/payment");
    } else {
      setCheckoutStep("address");
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed backdrop-blur-xs bg-black/40 z-100 w-full h-full top-0 left-0"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 z-101 h-full w-full max-w-md bg-white shadow-2xl shadow-black/40 flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-blue-950 text-white">
                <div className="font-black">Your Cart</div>
                <div
                  onClick={onClose}
                  className="cursor-pointer hover:scale-110 hover:bg-red-700 transition-all bg-red-600 p-1 rounded-full"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-4 text-white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
                {visibleItems.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-sm text-blue-900/50">
                    Your cart is empty.
                  </div>
                ) : (
                  <>
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
                    {visibleItems.map((item) => {
                      const soldOut = isSoldOut(item);
                      const insufficient = isInsufficientStock(item);
                      return (
                        <div
                          key={item.productId}
                          className={`flex gap-3 border items-center justify-center rounded-md p-2 ${
                            soldOut || insufficient
                              ? "border-red-300"
                              : "border-blue-900/10"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-blue-950"
                            checked={isChecked(item.productId)}
                            onChange={() => toggleItem(item.productId)}
                          />
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className={`w-16 h-16 object-cover rounded-sm ${
                                soldOut ? "opacity-40 grayscale" : ""
                              }`}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-sm" />
                          )}
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div
                              className="text-sm font-medium text-blue-950 truncate"
                              title={item.name}
                            >
                              {item.name}
                            </div>
                            {soldOut && (
                              <div className="text-xs font-semibold text-red-600">
                                Sold out
                              </div>
                            )}
                            {!soldOut && insufficient && (
                              <div className="text-xs font-semibold text-red-600">
                                Only {stockById[item.productId]} left
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 border border-blue-900/30 rounded-sm">
                                <button
                                  type="button"
                                  onClick={() =>
                                    changeQuantity(
                                      item.productId,
                                      item.quantity - 1,
                                    )
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
                                    changeQuantity(
                                      item.productId,
                                      item.quantity + 1,
                                    )
                                  }
                                  className="px-2 py-0.5 text-blue-950 cursor-pointer hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  +
                                </button>
                              </div>
                              <div className="text-sm font-semibold text-blue-950">
                                $
                                {(
                                  item.priceAtAdd * item.quantity
                                ).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div
                            onClick={() =>
                              setRemoveTarget({
                                id: item.productId,
                                name: item.name,
                              })
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
                                d="M9 3.75h6a1.5 1.5 0 0 1 1.5 1.5v.75H7.5v-.75a1.5 1.5 0 0 1 1.5-1.5ZM4.5 6h15m-13.5 0v12.75A2.25 2.25 0 0 0 8.25 21h7.5a2.25 2.25 0 0 0 2.25-2.25V6M9.75 10.5v6m4.5-6v6"
                              />
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
              <div className="mb-2" >
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
              </div>

              <div className="border-t border-blue-900/10 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between font-black text-blue-950">
                  <div>Total</div>
                  <div>${total.toLocaleString()}</div>
                </div>

                <button
                  type="button"
                  disabled={
                    visibleItems.length === 0 ||
                    hasBlockingStockIssue ||
                    selectedItems.length === 0
                  }
                  onClick={handlePayClick}
                  className="bg-blue-950 w-full py-2 rounded-sm text-white text-sm font-semibold uppercase cursor-pointer hover:bg-blue-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Pay
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {checkoutStep === "address" && (
        <AddressRequiredModal
          onClose={() => setCheckoutStep(null)}
          onSaved={() => {
            setCheckoutStep(null);
            onClose();
            router.push("/checkout/payment");
          }}
        />
      )}

      {removeTarget && (
        <ConfirmModal
          title="Remove item"
          message={`Remove "${removeTarget.name}" from your cart?`}
          confirmLabel="Remove"
          variant="danger"
          onConfirm={async () => {
            await removeItem(removeTarget.id);
            setRemoveTarget(null);
          }}
          onClose={() => setRemoveTarget(null)}
        />
      )}
    </>
  );
}
