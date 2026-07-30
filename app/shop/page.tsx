"use client";

import Loading from "@/components/Loading";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Navbar from "@/components/Navbar";
import Pagination from "@/components/Pagination";
import SelectedCard from "@/components/SelectedCard";
import Sidebar, { SidebarFilters } from "@/components/Sidebar";
import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

type PokemonDetails = {
  id: string;
  name: string;
  types?: string[];
  rarity?: string;
  images: {
    small: string;
    large: string;
  };
  cardmarket?: {
    prices?: {
      trendPrice?: number;
    };
  };
};

const emptyFilters: SidebarFilters = {
  types: [],
  rarities: [],
  minPrice: "",
  maxPrice: "",
};

export default function ShopPage() {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<PokemonDetails[]>([]);
  const [hoverCard, setHoverCard] = useState("");
  const [filters, setFilters] = useState<SidebarFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCard, setSelectedCard] = useState<PokemonDetails | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    const getCards = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        filters.types.forEach((type) => params.append("type", type));
        filters.rarities.forEach((rarity) => params.append("rarity", rarity));
        if (filters.minPrice) params.set("minPrice", filters.minPrice);
        if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
        params.set("page", String(page));

        const res = await fetch(`/api/pagination-pokemon-cards?${params}`);
        const data = await res.json();
        setCards(Array.isArray(data.cards) ? data.cards : []);
        setTotalPages(
          Math.max(
            1,
            Math.ceil((data.totalCount ?? 0) / (data.pageSize ?? 60)),
          ),
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getCards();
  }, [filters, page, reloadKey]);

  useEffect(() => {
    if (loading || cards.length > 0) return;

    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setReloadKey((key) => key + 1);
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, cards.length]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {selectedCard && (
        <SelectedCard
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onApply={setFilters} />
        <main className="flex-1 relative w-full flex flex-col mb-4 text-black">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <div
                className={` ${cards.length > 0 && "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 "}  place-content-start relative gap-4 h-full overflow-auto px-6 py-[2vh] w-full `}
              >
                {cards.length > 0 ? (
                  cards.map((item, index) => (
                    <motion.div
                      onHoverStart={() => setHoverCard(item.id)}
                      onHoverEnd={() => setHoverCard("")}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      key={item.id}
                    >
                      <div className="border w-full h-54 overflow-hidden relative border-[#99AD7A] rounded-md flex flex-col">
                        <div className="w-full flex-1 min-h-0 flex relative">
                          <Image
                            src={item.images.small}
                            alt={item.name}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 16vw"
                            className={` ${hoverCard === item.id && "scale-110"} transition-all object-cover object-top `}
                          />
                        </div>
                        <div
                          className={` ${hoverCard === item.id ? "h-1/2" : "h-full"} transition-all bg-linear-to-t gap-4 from-black via-black/20 items-end  to-transparent w-full px-4 py-2 flex absolute bottom-0 flex-row font-medium justify-between `}
                        >
                          <div className="font-medium text-white">
                            <div className="text-sm " title={item.name}>
                              {item.name}
                            </div>
                            <div className="text-xs">
                              ${" "}
                              {(
                                item.cardmarket?.prices?.trendPrice ?? 0
                              ).toLocaleString()}
                            </div>
                          </div>
                          <div
                            onClick={() => setSelectedCard(item)}
                            className="cursor-pointer uppercase px-3 py-1 bg-green-600 hover:bg-green-700 transition-all rounded-full text-white text-[0.6rem] font-semibold"
                          >
                            buy
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex text-red-300/80 items-center  justify-center w-full h-full">
                    Error: Automatic load in just {countdown}..
                  </div>
                )}
              </div>

              {cards.length > 0 && (
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
