"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onValue, ref } from "firebase/database";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import LookupListManager from "@/components/LookupListManager";
import { db } from "@/lib/firebase";
import { useBrands } from "@/lib/brands";
import { useProductTypes } from "@/lib/productTypes";
import { useAppSelector } from "@/store/hooks";

interface AdminProduct {
  id: string;
  vendorId: string;
  name: string;
  imageUrl: string;
  grade?: string;
  productType: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold?: number | null;
}

type VendorNameLookup = Record<string, string>;

export default function AdminProductPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);
  const [allProducts, setAllProducts] = useState<AdminProduct[]>([]);
  const [vendorNames, setVendorNames] = useState<VendorNameLookup>({});
  const brands = useBrands();
  const productTypes = useProductTypes();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onValue(ref(db, "products"), (snapshot) => {
      const data = snapshot.val() as Record<
        string,
        Omit<AdminProduct, "id">
      > | null;

      const list = data
        ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
        : [];

      setAllProducts(list);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const unsubscribeBusiness = onValue(ref(db, "business"), (snapshot) => {
      const data = snapshot.val() as Record<
        string,
        { userId: string; businessName: string }
      > | null;

      const lookup: VendorNameLookup = {};
      if (data) {
        for (const business of Object.values(data)) {
          lookup[business.userId] = business.businessName;
        }
      }
      setVendorNames((prev) => ({ ...prev, ...lookup }));
    });

    const unsubscribeUsers = onValue(ref(db, "users"), (snapshot) => {
      const data = snapshot.val() as Record<
        string,
        { firstName?: string; lastName?: string }
      > | null;

      setVendorNames((prev) => {
        const next = { ...prev };
        if (data) {
          for (const [uid, profile] of Object.entries(data)) {
            if (next[uid]) continue;
            const fullName = [profile.firstName, profile.lastName]
              .filter(Boolean)
              .join(" ");
            if (fullName) next[uid] = fullName;
          }
        }
        return next;
      });
    });

    return () => {
      unsubscribeBusiness();
      unsubscribeUsers();
    };
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    } else if (user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "admin") {
    return <Loading />;
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 py-[3vh] bg-blue-100 flex gap-2 px-[4vh] overflow-hidden text-black">
        <div className="border bg-white h-full flex-1 border-blue-900 overflow-hidden rounded-md flex flex-col">
          <div className="overflow-auto w-full">
            <div className="text-xs grid grid-cols-6 px-4 w-full items-center uppercase bg-blue-950 text-white">
              <div className="text-left font-medium py-3 px-2">Product</div>
              <div className="text-left font-medium py-2 px-2">Vendor</div>
              <div className="text-left font-medium py-2 px-2">Type</div>
              <div className="text-left font-medium py-2 px-2">Grade</div>
              <div className="text-right font-medium py-2 px-2">Price</div>
              <div className="text-right font-medium py-2 px-2">Stock</div>
            </div>

            {allProducts.length === 0 ? (
              <div className="text-center text-xs text-blue-900/50 py-6">
                No products yet across any vendor.
              </div>
            ) : (
              allProducts.map((product) => {
                const isLowStock =
                  product.lowStockThreshold != null &&
                  product.stockQuantity <= product.lowStockThreshold;
                return (
                  <div
                    key={product.id}
                    className="text-sm text-blue-950 px-3 grid grid-cols-6 items-center"
                  >
                    <div className="py-2 px-2 flex items-center gap-2">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-9 w-9 object-cover rounded-sm"
                        />
                      ) : (
                        <div className="h-9 w-9 bg-gray-300 rounded-sm" />
                      )}
                      <div className="font-medium truncate max-w-60">
                        {product.name}
                      </div>
                    </div>
                    <div className="py-2 px-2 truncate">
                      {vendorNames[product.vendorId] || product.vendorId}
                    </div>
                    <div className="py-2 px-2">
                      <span className="bg-green-300 px-2 py-0.5 text-xs rounded-sm">
                        {product.productType}
                      </span>
                    </div>
                    <div className="py-2 px-2">{product.grade || "—"}</div>
                    <div className="py-2 px-2 text-right">
                      ${product.price.toFixed(2)}
                    </div>
                    <div className="py-2 px-2 text-right">
                      <span
                        className={
                          isLowStock ? "text-red-600 font-semibold" : ""
                        }
                      >
                        {product.stockQuantity}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="w-80 shrink-0 flex flex-col gap-2 overflow-auto">
          <LookupListManager
            title="Brands"
            description="Manage the brand options vendors pick from when creating a product."
            dbPath="brands"
            items={brands}
            placeholder="New brand name"
            emptyLabel="No brands yet. Add one above."
          />

          <LookupListManager
            title="Product Types"
            description="Manage the product type options vendors pick from when creating a product."
            dbPath="productTypes"
            items={productTypes}
            placeholder="New product type name"
            emptyLabel="No product types yet. Add one above."
          />
        </div>
      </main>
    </div>
  );
}
