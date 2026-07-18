"use client";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const deals = [
  {
    imageName: "deal1",
    tag: "Sale",
    color: "bg-red-600",
    title: "Flash Sale",
    description: "Up to 30% OFF selected items!",
  },
  {
    imageName: "deal2",
    tag: "Bundle",
    color: "bg-purple-600",

    title: "Buy 2 Get 1 Free",
    description: "Buy any 2 booster packs, get 1 booster pack for FREE!",
  },
  {
    imageName: "deal3",
    tag: "Discount",
    color: "bg-blue-600",

    title: "Single Discount",
    description: "Up to 20% OFF selected items!",
  },
  {
    imageName: "deal4",
    tag: "Mystery Box",
    color: "bg-orange-600",

    title: "Mystery Box",
    description: "Chance to pull rare and ultra rare cards!",
  },
];

export default function DealsPage() {
  const [isHovered, setIsHovered] = useState("");
  return (
    <div className=" h-full w-full flex flex-col overflow-hidden">
      <Navbar />
      <main className=" gap-4  py-[2vh] flex flex-1 overflow-auto flex-col px-[15vh] justify-center text-black">
        <div className="grid grid-cols-6 gap-4 h-full">
          <motion.img
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="rounded-xl col-span-4 h-full shadow-md shadow-black/40"
            src="/images/flashsale.png"
          />
          <div className="col-start-5 gap-4 flex h-full flex-col col-span-2">
            <motion.img
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl shadow-md h-full shadow-black/40"
              src="/images/freeshipping.png"
            />
            <motion.img
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl shadow-md h-full shadow-black/40"
              src="/images/mysterygift.png"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex justify-between">
            <div>Today's Deals</div>
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
          <div className="grid grid-cols-4 gap-4 w-full">
            {deals.map((item, index) => (
              <motion.div
                onHoverStart={() => setIsHovered(item.title)}
                onHoverEnd={() => setIsHovered("")}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                key={item.imageName}
                className="relative cursor-pointer flex-col border overflow-hidden w-full h-full flex rounded-md"
              >
                <div
                  className={` ${isHovered !== item.title && "opacity-0"} bg-black/40 transition-all flex w-full items-center justify-center h-full absolute z-20  backdrop-blur-xs `}
                >
                  <div className="text-white font-normal text-shadow-2xl text-shadow-black/60 px-3 py-1 flex rounded-md">
                    Shop now
                  </div>
                </div>
                <div className="h-full">
                  <img
                    src={`/images/${item.imageName}.png`}
                    alt={item.imageName}
                    className="object-cover h-full w-full"
                  />
                </div>
                <div
                  className={` ${item.color} shadow-sm shadow-black/40 text-white text-shadow-md absolute top-2 left-2 uppercase text-xs px-3 py-1 rounded-sm `}
                >
                  {item.tag}
                </div>
                <div className=" bg-[#99AD7A]/80 h-24 justify-center backdrop-blur-sm px-4 py-2 flex flex-col bottom-0 w-full">
                  <div className="font-semibold text-sm uppercase">
                    {item.title}
                  </div>
                  <div className="font-normal text-xs ">{item.description}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
