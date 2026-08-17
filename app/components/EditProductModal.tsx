"use client";

import { useState } from "react";
import { ref, update } from "firebase/database";
import { toast } from "react-toastify";
import { HelpCircle, Image as ImageIcon } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import type { CloudinaryUploadWidgetResults } from "next-cloudinary";
import { db } from "@/lib/firebase";
import { useProductTypes } from "@/lib/productTypes";
import { CARD_GRADES } from "@/lib/cardGrades";
import { useBrands } from "@/lib/brands";
import { toJpgUrl } from "@/lib/cloudinary";
import { motion } from "framer-motion";

const fieldClass =
  "w-full border border-blue-900 rounded-sm px-3 py-2 text-sm bg-white text-blue-950 placeholder:text-blue-900/40 focus:outline-none focus:ring-1 focus:ring-blue-900";

export interface EditableProduct {
  id: string;
  name: string;
  grade?: string;
  imageUrl: string;
  productType: string;
  brand?: string | null;
  setExpansion?: string | null;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  sku: string;
  barcode?: string | null;
  stockQuantity: number;
  lowStockThreshold?: number | null;
}

function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: boolean;
}) {
  return (
    <label className="flex items-center gap-1 text-xs font-medium text-blue-950 mb-1">
      {children}
      {required && <span className="text-red-500">*</span>}
      {hint && <HelpCircle size={12} className="text-blue-900/50" />}
    </label>
  );
}

type EditProductModalProps = {
  product: EditableProduct;
  onClose: () => void;
};

export default function EditProductModal({
  product,
  onClose,
}: EditProductModalProps) {
  const brands = useBrands();
  const productTypes = useProductTypes();
  const [imageUrl, setImageUrl] = useState(product.imageUrl);
  const [productName, setProductName] = useState(product.name);
  const [grade, setGrade] = useState(product.grade ?? "");
  const [productType, setProductType] = useState(product.productType);
  const [brand, setBrand] = useState(product.brand ?? "");
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(String(product.price));
  const [compareAtPrice, setCompareAtPrice] = useState(
    product.compareAtPrice != null ? String(product.compareAtPrice) : "",
  );
  const [costPrice, setCostPrice] = useState(
    product.costPrice != null ? String(product.costPrice) : "",
  );
  const [sku, setSku] = useState(product.sku);
  const [barcode, setBarcode] = useState(product.barcode ?? "");
  const [stockQuantity, setStockQuantity] = useState(
    String(product.stockQuantity),
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    product.lowStockThreshold != null ? String(product.lowStockThreshold) : "",
  );
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    const trimmedName = productName.trim();
    const trimmedDescription = description.trim();
    const trimmedSku = sku.trim();
    const priceValue = parseFloat(price);
    const stockValue = parseInt(stockQuantity, 10);

    if (!trimmedName) {
      toast.error("Product name is required.");
      return;
    }
    if (!grade) {
      toast.error("Grade is required.");
      return;
    }
    if (!imageUrl) {
      toast.error("Product image is required.");
      return;
    }
    if (!trimmedDescription) {
      toast.error("Product description is required.");
      return;
    }
    if (!price || Number.isNaN(priceValue) || priceValue < 0) {
      toast.error("A valid price is required.");
      return;
    }
    if (!trimmedSku) {
      toast.error("SKU is required.");
      return;
    }
    if (!stockQuantity || Number.isNaN(stockValue) || stockValue < 0) {
      toast.error("A valid stock quantity is required.");
      return;
    }

    setSaving(true);
    try {
      await update(ref(db, `products/${product.id}`), {
        name: trimmedName,
        grade,
        imageUrl,
        productType,
        brand: brand || null,
        description: trimmedDescription,
        price: priceValue,
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        sku: trimmedSku,
        barcode: barcode.trim() || null,
        stockQuantity: stockValue,
        lowStockThreshold: lowStockThreshold
          ? parseInt(lowStockThreshold, 10)
          : null,
      });

      toast.success("Product updated.");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update product. Please try again.");
    } finally {
      setSaving(false);
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
        className="z-20 max-w-4xl w-full mx-4 relative border border-blue-950 bg-white rounded-md shadow-2xl shadow-black/40 grid grid-cols-2 max-h-[65vh] overflow-hidden"
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

        <div className="relative flex flex-col gap-4 p-4 bg-white">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={productName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-md shadow-md bg-gray-200" />
          )}
          <CldUploadWidget
            uploadPreset="vendor_products"
            options={{ maxFiles: 1, sources: ["local", "camera"] }}
            onSuccess={(result: CloudinaryUploadWidgetResults) => {
              if (typeof result.info === "object" && result.info?.secure_url) {
                setImageUrl(toJpgUrl(result.info.secure_url));
              }
            }}
            onError={() => {
              toast.error("Image upload failed. Please try again.");
            }}
          >
            {({ open }) => (
              <div
                onClick={() => open()}
                className="bottom-3 left-3 right-3 bg-blue-950 text-white text-xs px-3 py-2 rounded-sm text-center cursor-pointer hover:bg-blue-900 transition-all flex items-center justify-center gap-2"
              >
                <ImageIcon size={14} />
                Change image
              </div>
            )}
          </CldUploadWidget>
        </div>

        <div className="p-4 flex flex-col overflow-hidden">
          <div className="font-black text-blue-950 text-lg mb-2">Edit Product</div>

          <div className="flex flex-col gap-4 pr-4 overflow-auto" >
            <div>
              <FieldLabel required>Product Name</FieldLabel>
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Grade</FieldLabel>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Select grade</option>
                  {CARD_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Brand</FieldLabel>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Select brand</option>
                  {brand && !brands.some((b) => b.name === brand) && (
                    <option value={brand}>{brand}</option>
                  )}
                  {brands.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <FieldLabel required>Product Type</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {productTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setProductType(type.id)}
                    className={`px-1.5 py-1 text-xs rounded-sm border ${
                      productType === type.id
                        ? "border-blue-900 bg-blue-50 text-blue-950 font-semibold"
                        : "border-blue-900/30 text-blue-900/70 hover:border-blue-900"
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel required>Product Description</FieldLabel>
              <div className="border border-blue-900 rounded-sm">
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 text-sm text-blue-950 placeholder:text-blue-900/40 focus:outline-none resize-none"
                />
                <div className="text-right text-xs text-blue-900/50 px-2 pb-1">
                  {description.length} / 2000
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <FieldLabel required>Price (USD)</FieldLabel>
                <div className="flex items-center border border-blue-900 rounded-sm overflow-hidden">
                  <span className="px-2 text-sm text-blue-900/60">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full py-2 pr-3 text-sm text-blue-950 placeholder:text-blue-900/40 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <FieldLabel hint>Compare at Price</FieldLabel>
                <div className="flex items-center border border-blue-900 rounded-sm overflow-hidden">
                  <span className="px-2 text-sm text-blue-900/60">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    className="w-full py-2 pr-3 text-sm text-blue-950 placeholder:text-blue-900/40 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <FieldLabel hint>Cost Price</FieldLabel>
                <div className="flex items-center border border-blue-900 rounded-sm overflow-hidden">
                  <span className="px-2 text-sm text-blue-900/60">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full py-2 pr-3 text-sm text-blue-950 placeholder:text-blue-900/40 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel required>SKU</FieldLabel>
                <input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div>
                <FieldLabel>Barcode (ISBN, UPC, etc.)</FieldLabel>
                <input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Stock Quantity</FieldLabel>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div>
                <FieldLabel hint>Low Stock Threshold</FieldLabel>
                <input
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-sm border border-blue-900 text-blue-950 text-sm cursor-pointer hover:bg-blue-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleUpdate}
              className="bg-blue-950 px-4 py-1.5 rounded-sm text-white text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
