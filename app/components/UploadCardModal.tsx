"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

type UploadCardModalProps = {
  onClose: () => void;
};

export default function UploadCardModal({ onClose }: UploadCardModalProps) {
  const [name, setName] = useState("");
  const [rarity, setRarity] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !price.trim()) {
      toast.error("Please enter at least a card name and price.");
      return;
    }

    toast.success("Card info captured — uploads aren't saved yet.");
    onClose();
  };

  return (
    <div className="fixed flex flex-col w-full items-center justify-center h-full z-100 top-0 left-0">
      <div
        onClick={() => onClose()}
        className="fixed backdrop-blur-xs bg-black/40 z-10 w-full h-full"
      ></div>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="z-20 max-w-100 w-full mx-4 relative bg-white p-6 rounded-md shadow-md shadow-black/40"
      >
        <div
          onClick={() => onClose()}
          className="absolute cursor-pointer hover:scale-110 hover:bg-red-700 transition-all top-2 right-2 border-4 border-white bg-red-600 p-1 rounded-full"
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

        <div className="text-2xl uppercase text-center mb-4">
          Upload card info
        </div>

        <form onSubmit={handleSubmit} className="gap-3 flex flex-col text-sm">
          <div className="flex gap-1 flex-col">
            <div className="font-sm">Card Name</div>
            <input
              className="outline-none text-xs w-full font-medium border border-gray-400 px-3 py-2 rounded-sm"
              type="text"
              placeholder="e.g. Charizard VMAX"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <div className="flex gap-1 flex-col w-1/2">
              <div className="font-sm">Rarity</div>
              <input
                className="outline-none text-xs w-full font-medium border border-gray-400 px-3 py-2 rounded-sm"
                type="text"
                placeholder="e.g. Rare Holo"
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
              />
            </div>
            <div className="flex gap-1 flex-col w-1/2">
              <div className="font-sm">Price</div>
              <input
                className="outline-none text-xs w-full font-medium border border-gray-400 px-3 py-2 rounded-sm"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-1 flex-col">
            <div className="font-sm">Image URL</div>
            <input
              className="outline-none text-xs w-full font-medium border border-gray-400 px-3 py-2 rounded-sm"
              type="text"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <div className="flex gap-1 flex-col">
            <div className="font-sm">Description</div>
            <textarea
              className="outline-none text-xs w-full font-medium border border-gray-400 px-3 py-2 rounded-sm resize-none"
              rows={3}
              placeholder="Condition, edition, notes for buyers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="bg-[#99AD7A] mt-2 hover:bg-[#86976b] text-white cursor-pointer py-2 rounded-sm w-full"
          >
            Upload
          </button>
        </form>
      </motion.div>
    </div>
  );
}
