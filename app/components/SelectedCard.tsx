import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";

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

type SelectedCardProps = {
  card: PokemonDetails;
  onClose: () => void;
};

export default function SelectedCard({ card, onClose }: SelectedCardProps) {
  const price = card.cardmarket?.prices?.trendPrice ?? 0;

  return (
    <div className="absolute flex flex-col w-full items-center justify-center h-full z-100 top-0 left-0">
      <div
        onClick={() => onClose()}
        className="absolute backdrop-blur-xs bg-black/40 z-10 w-full h-full "
      ></div>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 0.8, opacity: 1 }}
        className="z-20 max-w-160 gap-4 relative justify-center bg-[#99AD7A] grid grid-cols-2 w-full h-120 p-4 rounded-md shadow-md shadow-black/40"
      >
        <div
          onClick={() => onClose()}
          className="absolute cursor-pointer hover:scale-110 hover:bg-red-700 transition-all top-2 right-2 text-whit border-4 border-[#99AD7A] bg-red-600 p-1 rounded-full"
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
        <div className="rounded-sm relative overflow-hidden">
          {card.images.small ? (
            <Image
              src={card.images.small}
              alt={card.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 16vw"
              className="object-fill scale-101 object-top "
            />
          ) : (
            <div className="skeleton bg-gray-200 w-full h-full"></div>
          )}
        </div>
        <div className="bg-[#6f7e59] justify-between h-full flex flex-col text-white p-4 rounded-sm">
          <div className="flex flex-col">
            <div className="text-lg font-semibold">{card.name}</div>
            <div className="font-normal">
              {[card.rarity, card.types?.join(", ")]
                .filter(Boolean)
                .join(" · ") || "No additional details available."}
            </div>
            <div className="font-normal mt-2">${price.toLocaleString()}</div>
          </div>
          <div className="bg-[#99AD7A] hover:bg-[#90a274] transition-all cursor-pointer px-3 text-center py-1 rounded-sm">
            BUY
          </div>
        </div>
      </motion.div>
    </div>
  );
}
