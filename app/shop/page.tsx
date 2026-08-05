"use client";

import LoadingSkeleton from "@/components/LoadingSkeleton";
import Navbar from "@/components/Navbar";
import Pagination from "@/components/Pagination";
import SelectedCard from "@/components/SelectedCard";
import Sidebar, { SidebarFilters } from "@/components/Sidebar";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { onValue, ref } from "firebase/database";
import { useEffect, useMemo, useState } from "react";

type ShopProduct = {
  id: string;
  vendorId: string;
  name: string;
  grade?: string;
  productType: string;
  category?: string | null;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  stockQuantity: number;
  imageUrl?: string;
};

const emptyFilters: SidebarFilters = {
  productTypes: [],
  minPrice: "",
  maxPrice: "",
};

const PAGE_SIZE = 24;

export default function ShopPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [hoverCard, setHoverCard] = useState("");
  const [filters, setFilters] = useState<SidebarFilters>(emptyFilters);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(
    null,
  );

  const handleApplyFilters = (next: SidebarFilters) => {
    setFilters(next);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  useEffect(() => {
    const unsubscribe = onValue(ref(db, "products"), (snapshot) => {
      const data = snapshot.val() as Record<
        string,
        Omit<ShopProduct, "id">
      > | null;

      const list = data
        ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
        : [];

      setProducts(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = useMemo(() => {
    const min = filters.minPrice ? Number(filters.minPrice) : null;
    const max = filters.maxPrice ? Number(filters.maxPrice) : null;
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      if (
        filters.productTypes.length > 0 &&
        !filters.productTypes.includes(product.productType)
      ) {
        return false;
      }
      if (min != null && product.price < min) return false;
      if (max != null && product.price > max) return false;
      if (query && !product.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [products, filters, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE),
  );
  const pagedProducts = filteredProducts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {selectedProduct && (
        <SelectedCard
          card={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onApply={handleApplyFilters} />
        <main className="flex-1 relative w-full flex flex-col mb-4 text-black">
          <div className="px-6 pt-[2vh]">
            <div className="flex items-center gap-2 border border-gray-300 rounded-sm px-3 py-2 max-w-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-4 text-gray-400 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search products..."
                className="outline-none text-xs w-full font-medium"
              />
            </div>
          </div>
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <div
                className={` ${pagedProducts.length > 0 && "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 "}  place-content-start relative gap-4 h-full overflow-auto px-6 py-[2vh] w-full `}
              >
                {pagedProducts.length > 0 ? (
                  pagedProducts.map((item, index) => (
                    <motion.div
                      onHoverStart={() => setHoverCard(item.id)}
                      onHoverEnd={() => setHoverCard("")}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      key={item.id}
                    >
                      <div className="border w-full h-54 overflow-hidden relative border-blue-950 rounded-md flex flex-col">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className={` ${hoverCard === item.id && "scale-110"} transition-all w-full flex-1 min-h-0 object-cover object-top `}
                          />
                        ) : (
                          <div
                            className={` ${hoverCard === item.id && "scale-110"} transition-all w-full flex-1 min-h-0 flex relative bg-gray-200 `}
                          />
                        )}
                        <div
                          className={` ${hoverCard === item.id ? "h-1/2" : "h-full"} transition-all bg-linear-to-t gap-4 from-blue-950 via-blue-950/20 items-end  to-transparent w-full px-4 py-2 flex absolute bottom-0 flex-row font-medium justify-between `}
                        >
                          <div className="font-medium text-white">
                            <div className="text-sm first-letter:uppercase " title={item.name}>
                              {item.name}
                            </div>
                            <div className="text-xs">
                              $ {item.price.toLocaleString()}
                            </div>
                          </div>
                          <div
                            onClick={() => setSelectedProduct(item)}
                            className="cursor-pointer uppercase px-3 py-1 bg-green-700 transition-all rounded-full text-white text-[0.6rem] font-semibold"
                          >
                            buy
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex text-gray-400 items-center  justify-center w-full h-full">
                    {search.trim()
                      ? `No products match "${search.trim()}".`
                      : "No products available yet."}
                  </div>
                )}
              </div>

              {pagedProducts.length > 0 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
