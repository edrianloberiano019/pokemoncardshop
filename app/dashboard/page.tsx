"use client";
import Navbar from "@/components/Navbar";
import SelectedCard from "@/components/SelectedCard";
import { useBrands } from "@/lib/brands";
import { db } from "@/lib/firebase";
import { resolveProductTypeName, useProductTypes } from "@/lib/productTypes";
import { AnimatePresence, motion } from "framer-motion";
import { onValue, ref } from "firebase/database";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type FeaturedProduct = {
  id: string;
  vendorId?: string;
  name: string;
  grade?: string;
  brand?: string | null;
  productType: string;
  category?: string | null;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  stockQuantity?: number;
  imageUrl?: string;
  images?: string[];
};

const CARDS_PER_CATEGORY = 6;

const BRAND_IMAGES: Record<string, string> = {
  "pokémon": "/images/pokemon.png",
  "one piece": "/images/one%20piece.png",
  "dragon ball": "/images/dragon%20ball.png",
  "yu-gi-oh!": "/images/yu-gi-oh.png",
  "digimon": "/images/digimon.png",
  "magic: the gathering": "/images/magic:%20the%20gathering.png",
  "disney lorcana": "/images/disney%20lorcana.png",
};

const CAROUSEL_IMAGES = [
  "/images/slide1.jpeg",
  "/images/slide2.jpeg",
  "/images/slide3.jpeg",
  "/images/slide4.jpeg",
];

function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-60 sm:h-72 rounded-md overflow-hidden bg-blue-950">
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={CAROUSEL_IMAGES[index]}
            alt={`Slide ${index + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {CAROUSEL_IMAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${i === index ? "bg-white w-4" : "bg-white/50 w-2"}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function AdOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed flex flex-col w-full items-center justify-center h-full z-200 top-0 left-0">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="fixed backdrop-blur-xs bg-black/40 z-10 w-full h-full"
      />
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="z-20 w-[90%] max-w-xs mx-4 relative border border-blue-950 bg-linear-to-br from-blue-950 via-purple-900 to-fuchsia-800 text-white rounded-md shadow-2xl shadow-black/40 p-6 flex flex-col items-center text-center gap-3"
      >
        <div
          onClick={onClose}
          className="absolute cursor-pointer hover:scale-110 hover:bg-red-700 transition-all top-2 right-2 border-white bg-red-600 p-1 rounded-full z-30"
          aria-label="Close ad"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
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

        <div className="uppercase tracking-[0.3em] text-[0.6rem] text-white/70">
          Advertisement
        </div>
        <div className="text-xl font-black">Advertisement Placement</div>
        <div className="text-xs text-white/80">
          This card space is reserved for a sponsored placement. Replace with
          real creative when ready.
        </div>
        <div className="mt-1 px-5 py-2 bg-white text-blue-950 font-semibold rounded-full text-xs cursor-pointer">
          Learn more
        </div>
      </motion.div>
    </div>
  );
}

export default function page() {
  const router = useRouter();
  const [showAd, setShowAd] = useState(true);
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [hoverCard, setHoverCard] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] =
    useState<FeaturedProduct | null>(null);
  const [brandImageErrors, setBrandImageErrors] = useState<
    Record<string, boolean>
  >({});
  const productTypes = useProductTypes();
  const brands = useBrands();

  useEffect(() => {
    const unsubscribe = onValue(ref(db, "products"), (snapshot) => {
      const data = snapshot.val() as Record<
        string,
        Omit<FeaturedProduct, "id">
      > | null;

      const list = data
        ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
        : [];

      setProducts(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const categories = useMemo(() => {
    const grouped = new Map<string, FeaturedProduct[]>();
    for (const product of products) {
      const key = product.productType || "uncategorized";
      const existing = grouped.get(key);
      if (existing) {
        existing.push(product);
      } else {
        grouped.set(key, [product]);
      }
    }

    return Array.from(grouped.entries())
      .filter(([, items]) => items.length >= CARDS_PER_CATEGORY)
      .map(([productType, items]) => ({
        id: productType,
        name: resolveProductTypeName(productType, productTypes),
        items: items.slice(0, CARDS_PER_CATEGORY),
      }));
  }, [products, productTypes]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {showAd && <AdOverlay onClose={() => setShowAd(false)} />}
      {selectedProduct && (
        <SelectedCard
          card={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      <Navbar />
      <main className="flex-1 py-[2vh] h-full flex flex-col gap-4 px-[4vh] overflow-y-auto">
        <HeroCarousel />

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="rounded-md sm:h-auto w-full relative flex"
        >
          <div className="flex w-full gap-2 overflow-x-auto">
            {brands.map((brand) => {
              const imageSrc = BRAND_IMAGES[brand.name.trim().toLowerCase()];
              const showImage = imageSrc && !brandImageErrors[brand.id];

              return (
                <div
                  key={brand.id}
                  onClick={() =>
                    router.push(
                      `/shop?brand=${encodeURIComponent(brand.name)}`,
                    )
                  }
                  className="border rounded-sm border-gray-300 cursor-pointer hover:bg-gray-100 px-3 h-20 flex-1 min-w-35 shrink-0 items-center justify-center flex"
                >
                  {showImage ? (
                    <img
                      src={imageSrc}
                      alt={brand.name}
                      className="max-h-14 max-w-full object-contain"
                      onError={() =>
                        setBrandImageErrors((prev) => ({
                          ...prev,
                          [brand.id]: true,
                        }))
                      }
                    />
                  ) : (
                    <div className="first-letter:uppercase text-center">
                      {brand.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* <div className="absolute bg-white/20 backdblur-[1px] w-full text-blue-950 xl:gap-4 justify-center h-full flex flex-col px-4 lg:px-40 py-4 z-20">
            <div className="drop-shadow-md  text-shadow-md text-shadow-white/60 shadow-black">
              Featured Collection
            </div>
            <div className="text-2xl text-shadow-lg text-shadow-white/60 xl:text-6xl">
              <div>Power Up</div>
              <div>Your Collection</div>
            </div>
            <div className="gap-2 flex  text-shadow-md text-shadow-white/60 flex-col">
              <div className=" text-xs">
                From iconic classics to the latest expansions, discover cards
                every Trainer wants.
              </div>
              <div className="flex">
                <div className="font-medium text-shadow-none  text-white hover:cursor-pointer px-4 py-2 flex items-center gap-2 rounded-full bg-blue-950">
                  Shop now{" "}
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
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full h-full z-10 flex">
            <img
              className="w-full shadow-md rounded-2xl shadow-black/40 h-full max-h-[40vh] object-cover"
              src="/images/hero.png"
              alt="hero"
            />
          </div> */}
        </motion.div>

        <div className="min-h-0 text-black flex h-full sm:pb-0 flex-col gap-8 rounded-md flex-1">
          {loading ? (
            <div className="flex text-gray-400 items-center justify-center h-40">
              Loading products...
            </div>
          ) : categories.length === 0 ? (
            <div className="flex text-gray-400 items-center justify-center h-40">
              No categories with enough products yet.
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="flex h-full flex-col">
                <div className="flex justify-between">
                  <div className="first-letter:uppercase">{category.name}</div>
                  <div className="flex font-medium cursor-pointer gap-2 items-center text-sm">
                    <div>View all</div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                      className="size-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 h-full lg:grid-cols-6 mt-4 relative gap-2 w-full">
                  {category.items.map((item, index) => (
                    <motion.div
                      onHoverStart={() => setHoverCard(item.id)}
                      onHoverEnd={() => setHoverCard("")}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      key={item.id}
                    >
                      <div className="border w-full h-full overflow-hidden relative border-blue-950 rounded-md flex flex-col">
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
                          <div className="font-medium truncate text-white">
                            {" "}
                            <div
                              className="text-sm first-letter:uppercase "
                              title={item.name}
                            >
                              {item.name}
                            </div>
                            <div className="text-sm">
                              $ {item.price.toLocaleString()}
                            </div>
                          </div>
                          <div className="items-center flex">
                            <div
                              onClick={() => setSelectedProduct(item)}
                              className="cursor-pointer uppercase px-3 py-1 bg-green-600 rounded-full text-white text-[0.6rem] font-semibold"
                            >
                              buy
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
