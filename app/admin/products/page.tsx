"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onValue, push, ref, serverTimestamp, set } from "firebase/database";
import { toast } from "react-toastify";
import { HelpCircle, Image as ImageIcon } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import type { CloudinaryUploadWidgetResults } from "next-cloudinary";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import EditProductModal, {
  type EditableProduct,
} from "@/components/EditProductModal";
import { db } from "@/lib/firebase";
import { resolveProductTypeName, useProductTypes } from "@/lib/productTypes";
import { CARD_GRADES } from "@/lib/cardGrades";
import { useBrands } from "@/lib/brands";
import { toJpgUrl } from "@/lib/cloudinary";
import { useAppSelector } from "@/store/hooks";
import { motion } from "framer-motion";

const fieldClass =
  "w-full border border-blue-900 rounded-sm px-3 py-2 text-sm bg-white text-blue-950 placeholder:text-blue-900/40 focus:outline-none focus:ring-1 focus:ring-blue-900";

interface AdminProduct extends EditableProduct {
  vendorId: string;
}

type Vendor = {
  userId: string;
  businessName: string;
};

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

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div>
        <div className="font-black text-blue-950">{title}</div>
        <div className="text-xs text-blue-900/70">{subtitle}</div>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);
  const brands = useBrands();
  const productTypes = useProductTypes();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null,
  );

  const [productType, setProductType] = useState("");
  const [trackInventory, setTrackInventory] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [productName, setProductName] = useState("");
  const [grade, setGrade] = useState("");
  const [brand, setBrand] = useState("");
  const [setExpansion, setSetExpansion] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("");
  const [saving, setSaving] = useState(false);

  const vendorNames = vendors.reduce<Record<string, string>>((acc, v) => {
    acc[v.userId] = v.businessName;
    return acc;
  }, {});

  const handleSaveProduct = async () => {
    if (!user) return;

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
    if (!productType) {
      toast.error("Product type is required.");
      return;
    }
    if (images.length === 0) {
      toast.error("At least 1 product image is required.");
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
      const newProductRef = push(ref(db, "products"));
      await set(newProductRef, {
        vendorId: user.uid,
        name: trimmedName,
        grade,
        imageUrl: images[0],
        images,
        productType,
        brand: brand || null,
        setExpansion: setExpansion || null,
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
        trackInventory,
        createdAt: serverTimestamp(),
      });

      toast.success("Product saved.");
      setImages([]);
      setProductName("");
      setGrade("");
      setProductType("");
      setBrand("");
      setSetExpansion("");
      setDescription("");
      setPrice("");
      setCompareAtPrice("");
      setCostPrice("");
      setSku("");
      setBarcode("");
      setStockQuantity("");
      setLowStockThreshold("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    } else if (user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const unsubscribe = onValue(ref(db, "products"), (snapshot) => {
      const data = snapshot.val() as Record<
        string,
        Omit<AdminProduct, "id">
      > | null;

      const list = data
        ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
        : [];

      setProducts(list);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const unsubscribe = onValue(ref(db, "business"), (snapshot) => {
      const data = snapshot.val() as Record<
        string,
        { userId?: string; businessName?: string }
      > | null;

      const list = data
        ? Object.values(data)
            .filter(
              (
                business,
              ): business is { userId: string; businessName: string } =>
                Boolean(business.userId && business.businessName),
            )
            .map((business) => ({
              userId: business.userId,
              businessName: business.businessName,
            }))
        : [];

      setVendors(list);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading || !user || user.role !== "admin") {
    return <Loading />;
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
      <Navbar />
      <main className=" bg-blue-100 py-[3vh] flex flex-col gap-2 px-[4vh] overflow-hidden text-black">
        <div className="grid grid-cols-3 gap-2 overflow-hidden">
          <div className="overflow-auto gap-2">
            <div className="flex flex-col gap-2">
              {products.length === 0 ? (
                <div className="h-28 border border-dashed border-blue-900/30 rounded-sm flex items-center justify-center text-xs text-blue-900/50 text-center px-4">
                  No products yet. Create one to see it here.
                </div>
              ) : (
                products.map((product, index) => (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{delay: index * 0.1}}
                    key={product.id}
                    className=" flex gap-4 items-center justify-center border p-4 bg-white border-blue-950 rounded-sm"
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-28 h-22 object-cover rounded-md"
                      />
                    ) : (
                      <div className="text-center text-xs text-gray-300 rounded-md w-28 items-center justify-center">
                        no image
                      </div>
                    )}
                    <div className="flex h-full justify-between w-full">
                      <div className="flex flex-col h-full relative justify-between">
                        <div className="flex flex-col  text-ellipsis ">
                          <div className="first-letter:uppercase text-xs">
                            {product.name}
                          </div>
                          <div className="font-normal text-xs">
                            Stock: {product.stockQuantity}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="bg-green-300 px-3 py-1 text-xs font-normal rounded-sm w-fit">
                            {resolveProductTypeName(
                              product.productType,
                              productTypes,
                            )}
                          </div>
                          {product.grade && (
                            <div className="bg-blue-200 px-3 py-1 text-xs font-normal rounded-sm w-fit">
                              {product.grade}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col justify-between items-end">
                        <div>${product.price.toFixed(2)}</div>
                        <div
                          onClick={() => setEditingProduct(product)}
                          className="px-1.5 rounded-sm cursor-pointer py-1 bg-blue-950 text-white"
                          title="Update the information"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="size-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
          <div className="border border-blue-900 bg-white rounded-sm p-4 col-span-2 flex flex-col gap-6 overflow-hidden">
            <div className="flex flex-col gap-4 overflow-auto">
              <div className="flex justify-between items-center">
                <SectionHeading
                  title="Product Information"
                  subtitle="Add basic details about the product."
                />
                <CldUploadWidget
                  uploadPreset="vendor_products"
                  options={{
                    maxFiles: 5,
                    multiple: true,
                    sources: ["local", "camera"],
                  }}
                  onSuccess={(result: CloudinaryUploadWidgetResults) => {
                    if (
                      typeof result.info === "object" &&
                      result.info?.secure_url
                    ) {
                      const url = toJpgUrl(result.info.secure_url);
                      setImages((prev) =>
                        prev.length >= 5 ? prev : [...prev, url],
                      );
                    }
                  }}
                  onError={() => {
                    toast.error("Image upload failed. Please try again.");
                  }}
                >
                  {({ open }) => (
                    <div
                      onClick={() => images.length < 5 && open()}
                      className={`border text-xs px-4 py-2 flex items-center gap-2 border-blue-950 rounded-sm transition-all ${
                        images.length >= 5
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-100 cursor-pointer"
                      }`}
                    >
                      <ImageIcon size={14} />
                      {images.length >= 5
                        ? "Max 5 images"
                        : `Upload images * (${images.length}/5)`}
                    </div>
                  )}
                </CldUploadWidget>
              </div>

              {images.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {images.map((url, index) => (
                    <div key={url} className="relative">
                      <img
                        src={url}
                        alt={`Product image ${index + 1}`}
                        className="h-16 w-16 object-cover rounded-sm border border-blue-900"
                      />
                      {index === 0 && (
                        <div className="absolute -top-1.5 -left-1.5 bg-blue-950 text-white text-[0.55rem] px-1 rounded-sm">
                          Cover
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setImages((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                        className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full size-4 flex items-center justify-center text-[0.6rem] cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <FieldLabel required>Product Name</FieldLabel>
                <input
                  placeholder="e.g. Pokémon TCG: Charizard VMAX"
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
                      className={`px-3 py-1.5 text-sm rounded-sm border ${
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
                    placeholder="Describe the product, condition, features, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 text-sm text-blue-950 placeholder:text-blue-900/40 focus:outline-none resize-none"
                  />
                  <div className="text-right text-xs text-blue-900/50 px-2 pb-1">
                    {description.length} / 2000
                  </div>
                </div>
              </div>

              <SectionHeading
                title="Pricing & Inventory"
                subtitle="Set the price, stock, and SKU for the product."
              />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <FieldLabel required>Price (USD)</FieldLabel>
                  <div className="flex items-center border border-blue-900 rounded-sm overflow-hidden">
                    <span className="px-2 text-sm text-blue-900/60">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
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
                      placeholder="0.00"
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
                      placeholder="0.00"
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
                    placeholder="e.g. CHRZ-VMAX-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <FieldLabel>Barcode (ISBN, UPC, etc.)</FieldLabel>
                  <input
                    placeholder="Enter barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center">
                <div>
                  <FieldLabel required>Stock Quantity</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
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
                    placeholder="5"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveProduct}
                className="bg-blue-950 px-3 py-1 rounded-sm text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
