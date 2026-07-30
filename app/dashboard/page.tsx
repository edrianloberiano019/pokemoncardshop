"use client";
import Loading from "@/components/Loading";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type PokemonDetails = {
  id: string;
  name: string;
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

export default function page() {
  const [cards, setCards] = useState<PokemonDetails[]>([]);
  const [hoverCard, setHoverCard] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCards = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/featured-pokemon-cards");
        const data = await res.json();
        setCards(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getCards();
  }, []);

  useEffect(() => {
    console.log(cards);
  });

  // if (loading) {
  //   return <Loading />;
  // }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 py-[2vh] flex flex-col px-[4vh] xl:px-[15vh] overflow-auto xl:overflow-hidden">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="rounded-md h-60 sm:h-auto w-full relative overflow-hidden flex"
        >
          <div className="absolute text-white xl:gap-4 justify-center h-full flex flex-col px-4 lg:px-40 py-4 z-20">
            <div className="drop-shadow-md  text-shadow-md text-shadow-black/60 shadow-black">
              Featured Pokémon Collection
            </div>
            <div className="text-2xl text-shadow-md text-shadow-black/60 xl:text-6xl">
              <div>Power Up</div>
              <div>Your Collection</div>
            </div>
            <div className="gap-2 flex  text-shadow-md text-shadow-black/60 flex-col">
              <div className=" text-xs" >
                From iconic classics to the latest expansions, discover cards
                every Trainer wants.
              </div>
              <div className="flex">
                <div className="font-medium  text-white hover:cursor-pointer px-4 py-2 flex items-center gap-2 rounded-full bg-black">
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
              className="w-full h-full max-h-[40vh] object-cover"
              src="/images/pokemonbackground.jpg"
              alt="hero"
            />
          </div>
        </motion.div>

        <div className="w-full hidden py-4 lg:grid border-b border-black/10 grid-cols-1 md:grid-cols-5 gap-4 content-center items-center justify-center text-black">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 overflow-hidden items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
              />
            </svg>

            <div>
              <div className="" >Fast Delivery</div>
              <div className="font-medium text-xs">On orders over $50</div>
            </div>
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-2 items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
              />
            </svg>

            <div>
              <div className="">Easy Return</div>
              <div className="font-medium text-xs">30 Days return policy</div>
            </div>
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex gap-2 items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>

            <div>
              <div className="">24/7 Support</div>
              <div className="font-medium text-xs">Always here to help</div>
            </div>
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex gap-2 w-full items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>

            <div>
              <div className="">Secure Payment</div>
              <div className="font-medium text-xs">
                Your data is safe with us
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-2 items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
              />
            </svg>

            <div>
              <div className="">100% Authentic</div>
              <div className="font-medium text-xs">
                All cards are verified
              </div>
            </div>
          </motion.div>
        </div>
        <div className="min-h-0 text-black flex pb-10 sm:pb-0 flex-col py-4 rounded-md flex-1">
          <div className="flex justify-between">
            <div>Featured Products</div>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mt-4 relative gap-2 w-full h-full">
            {cards.map((item, index) => (
              <motion.div
                onHoverStart={() => setHoverCard(item.id)}
                onHoverEnd={() => setHoverCard("")}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                key={item.id}
              >
                <div className="border w-full h-50 xl:h-full overflow-hidden relative border-[#99AD7A] rounded-md flex flex-col">
                  <div className="w-full flex-1 min-h-0 flex relative">
                    <Image
                      src={item.images.small}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 20vw"
                      className={` ${hoverCard === item.id && "scale-110"} transition-all object-cover object-top `}
                    />
                  </div>
                  <div
                    className={` ${hoverCard === item.id ? "h-1/2" : "h-full"} transition-all bg-linear-to-t gap-4 from-black via-black/20 items-end  to-transparent w-full px-4 py-2 flex absolute bottom-0 flex-row font-medium justify-between `}
                  >
                    {" "}
                    <div className="font-medium truncate text-white">
                      <div className="text-base truncate" title={item.name}>
                        {item.name}
                      </div>
                      <div className="text-sm">
                        ${" "}
                        {(
                          item.cardmarket?.prices?.trendPrice ?? 0
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div className="items-center flex">
                      <div className="cursor-pointer px-3 py-1 bg-green-600 rounded-full text-white text-[0.6rem] font-semibold">
                        BUY
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
