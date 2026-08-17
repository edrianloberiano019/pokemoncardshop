import React, { useState } from "react";
import { motion } from "framer-motion";
import { get, ref, serverTimestamp, set, update } from "firebase/database";
import { toast } from "react-toastify";
import { db } from "@/lib/firebase";
import { resolveProductTypeName, useProductTypes } from "@/lib/productTypes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addItem, selectCartItems } from "@/store/slices/cartSlice";

type ShopProduct = {
  id: string;
  vendorId?: string;
  name: string;
  grade?: string;
  productType?: string;
  category?: string | null;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  stockQuantity?: number;
  imageUrl?: string;
  images?: string[];
};

type SelectedCardProps = {
  card: ShopProduct;
  onClose: () => void;
};

export default function SelectedCard({ card, onClose }: SelectedCardProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const guestCartItems = useAppSelector(selectCartItems);
  const productTypes = useProductTypes();
  const [adding, setAdding] = useState(false);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const inStock = (card.stockQuantity ?? 0) > 0;
  const activeImage = hoveredImage ?? card.imageUrl;
  const otherImages = (card.images ?? [])
    .filter((url) => url !== card.imageUrl)
    .slice(0, 4);

  const handleBuy = async () => {
    if (!user) {
      const existingGuestQuantity =
        guestCartItems.find((item) => item.id === card.id)?.quantity ?? 0;

      if (
        card.stockQuantity != null &&
        existingGuestQuantity + 1 > card.stockQuantity
      ) {
        toast.error("Not enough stock available.");
        return;
      }

      dispatch(
        addItem({
          id: card.id,
          name: card.name,
          price: card.price,
          image: card.imageUrl,
          vendorId: card.vendorId,
        }),
      );
      onClose();
      return;
    }

    setAdding(true);
    try {
      const itemRef = ref(db, `carts/${user.uid}/items/${card.id}`);
      const snapshot = await get(itemRef);
      const existing = snapshot.val() as {
        quantity: number;
        addedAt?: number;
      } | null;
      const nextQuantity = (existing?.quantity ?? 0) + 1;

      if (card.stockQuantity != null && nextQuantity > card.stockQuantity) {
        toast.error("Not enough stock available.");
        return;
      }

      await set(itemRef, {
        productId: card.id,
        vendorId: card.vendorId ?? null,
        name: card.name,
        imageUrl: card.imageUrl ?? null,
        quantity: nextQuantity,
        priceAtAdd: card.price,
        addedAt: existing?.addedAt ?? serverTimestamp(),
      });
      await update(ref(db, `carts/${user.uid}`), {
        updatedAt: serverTimestamp(),
      });

      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add to cart. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed flex flex-col w-full items-center justify-center h-full z-100 top-0 left-0">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="fixed backdrop-blur-xs bg-black/40 z-10 w-full h-full"
      ></motion.div>
      <motion.div
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        className="z-20 w-[95%] sm:max-w-2xl md:max-w-3xl h-[90vh] sm:h-auto sm:max-h-[80vh] mx-4 relative border border-blue-950 bg-white rounded-md shadow-2xl shadow-black/40 grid grid-cols-1 sm:grid-cols-2 grid-rows-[auto_1fr] sm:grid-rows-1 overflow-hidden"
      >
        <div
          onClick={onClose}
          className="absolute cursor-pointer hover:scale-110 hover:bg-red-700 transition-all top-2 right-2 bg-red-600 p-1 rounded-full z-30"
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

        <div className="relative p-4 bg-white flex flex-col gap-2 h-56 sm:h-auto">
          <div className="flex-1 min-h-0">
            {activeImage ? (
              <img
                src={activeImage}
                alt={card.name}
                className="w-full h-full object-cover rounded-md"
              />
            ) : (
              <div className="w-full h-full rounded-md bg-gray-200" />
            )}
          </div>

          {otherImages.length > 0 && (
            <div className="flex gap-2 shrink-0">
              {otherImages.map((url) => (
                <button
                  key={url}
                  type="button"
                  onMouseEnter={() => setHoveredImage(url)}
                  onMouseLeave={() => setHoveredImage(null)}
                  className="size-12 rounded-sm overflow-hidden border border-blue-900/20 hover:border-blue-900 transition-all shrink-0 cursor-pointer"
                >
                  <img
                    src={url}
                    alt={card.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col justify-between overflow-hidden">
          <div className="flex h-full flex-col gap-3 pr-1">
            <div className="h-full" >
              <div className="font-black first-letter:uppercase text-blue-950 text-lg">
                {card.name}
              </div>
              <div>
                <div></div>
                <div className="flex">
                  <div className="flex gap-1 items-center">
                    {/* {[1, 2, 3, 4, 5].map((index) => (
                      <svg
                        key={index}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-6 fill-amber-500"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                        />
                      </svg>
                    ))} */}
                    <div className="text-xs text-gray-600/40 mt-2">No Reviews</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {card.grade && (
                  <div className="bg-blue-200 px-3 py-1 text-xs font-medium rounded-sm w-fit text-blue-950">
                    {card.grade}
                  </div>
                )}
                {card.productType && (
                  <div className="bg-green-300 px-3 py-1 text-xs font-medium rounded-sm w-fit text-blue-950">
                    {resolveProductTypeName(card.productType, productTypes)}
                  </div>
                )}
                {card.category && (
                  <div className="bg-blue-100 px-3 py-1 text-xs font-medium rounded-sm w-fit text-blue-950">
                    {card.category}
                  </div>
                )}
              </div>
              {card.description && (
                <div className="text-sm h-full text-blue-900/70 mt-2 whitespace-pre-line max-h-40 overflow-y-auto pr-1">
                  {card.description}
                </div>
              )}
            </div>

            <div className="flex items-end gap-2">
              <div className="text-2xl font-black text-blue-950">
                ${card.price.toLocaleString()}
              </div>
              {card.compareAtPrice != null &&
                card.compareAtPrice > card.price && (
                  <div className="text-sm text-blue-900/40 line-through mb-0.5">
                    ${card.compareAtPrice.toLocaleString()}
                  </div>
                )}
            </div>

            <div
              className={`text-xs font-semibold w-fit px-2 py-1 rounded-sm ${
                inStock
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {inStock ? (
                <div className="gap-1 flex">
                  <div>Stock:</div>
                  {card.stockQuantity}
                </div>
              ) : (
                "Out of Stock"
              )}
            </div>
          </div>

          <div className="mt-3 gap-2 flex">
            <button
              type="button"
              disabled={!inStock || adding}
              onClick={handleBuy}
              className="bg-blue-950 w-full py-2 rounded-sm text-white text-sm font-semibold uppercase cursor-pointer hover:bg-blue-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {adding ? "Adding..." : "Buy"}
            </button>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
