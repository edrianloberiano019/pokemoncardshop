"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { onValue, ref } from "firebase/database";
import { db } from "@/lib/firebase";

const fieldClass =
  "w-full border border-blue-900 rounded-sm px-3 py-2 text-sm bg-blue-50/40 text-blue-950 focus:outline-none";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-blue-950 mb-1">
      {children}
    </label>
  );
}

export type BusinessSummary = {
  id: string;
  userId: string;
  businessName: string;
  businessDescription?: string;
  businessAddress?: string;
  ownerName?: string;
  ownerEmail?: string;
};

interface BusinessProduct {
  id: string;
  vendorId: string;
  name: string;
  imageUrl?: string;
  productType: string;
  price: number;
  stockQuantity: number;
}

type BusinessDetailsModalProps = {
  business: BusinessSummary;
  onClose: () => void;
};

export default function BusinessDetailsModal({
  business,
  onClose,
}: BusinessDetailsModalProps) {
  const [products, setProducts] = useState<BusinessProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onValue(ref(db, "products"), (snapshot) => {
      const data = snapshot.val() as Record<
        string,
        Omit<BusinessProduct, "id">
      > | null;

      const list = data
        ? Object.entries(data)
            .map(([id, value]) => ({ id, ...value }))
            .filter((product) => product.vendorId === business.userId)
        : [];

      setProducts(list);
      setLoaded(true);
    });

    return () => unsubscribe();
  }, [business.userId]);

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
        className="z-20 max-w-2xl w-full mx-4 relative border border-blue-950 bg-white rounded-md shadow-2xl shadow-black/40 p-6 max-h-[80vh] flex flex-col"
      >
        <div
          onClick={onClose}
          className="absolute cursor-pointer hover:scale-110 hover:bg-red-700 transition-all top-2 right-2 border-4 border-white bg-red-600 p-1 rounded-full z-30"
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

        <div className="font-black text-blue-950 text-lg mb-4">
          Business Details
        </div>

        <div className="flex flex-col gap-3 overflow-auto">
          <div>
            <FieldLabel>Business Name</FieldLabel>
            <input
              readOnly
              value={business.businessName || "—"}
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Owner</FieldLabel>
              <input
                readOnly
                value={business.ownerName || "—"}
                className={fieldClass}
              />
            </div>
            <div>
              <FieldLabel>Owner Email</FieldLabel>
              <input
                readOnly
                value={business.ownerEmail || "—"}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <FieldLabel>Address</FieldLabel>
            <input
              readOnly
              value={business.businessAddress || "—"}
              className={fieldClass}
            />
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              readOnly
              rows={3}
              value={business.businessDescription || "—"}
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div>

            <div className="border border-blue-900 rounded-sm overflow-hidden">
              <div className="grid grid-cols-4 text-xs uppercase bg-blue-950 text-white">
                <div className="py-2 px-2 col-span-2">Product</div>
                <div className="py-2 px-2 text-right">Price</div>
                <div className="py-2 px-2 text-right">Stock</div>
              </div>

              {!loaded ? (
                <div className="text-xs text-blue-900/50 text-center py-6">
                  Loading products...
                </div>
              ) : products.length === 0 ? (
                <div className="text-xs text-blue-900/50 text-center py-6">
                  No products from this business yet.
                </div>
              ) : (
                products.map((product) => (
                  <div
                    key={product.id}
                    className="grid grid-cols-4 items-center text-sm text-blue-950 "
                  >
                    <div className="py-2 px-2 col-span-2 flex items-center gap-2">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-8 w-8 object-cover rounded-sm"
                        />
                      ) : (
                        <div className="h-8 w-8 bg-gray-300 rounded-sm" />
                      )}
                      <div className="truncate">{product.name}</div>
                    </div>
                    <div className="py-2 px-2 text-right">
                      ${product.price.toFixed(2)}
                    </div>
                    <div className="py-2 px-2 text-right">
                      {product.stockQuantity}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
