"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { push, ref, serverTimestamp, set, update } from "firebase/database";
import { toast } from "react-toastify";
import { db } from "../lib/firebase";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { updateUser } from "../store/slices/authSlice";
import AddressMap, {
  type ReverseGeocodedAddress,
} from "./AddressMap";

type SellRegistrationProps = {
  onClose: () => void;
};

export default function SellRegistration({ onClose }: SellRegistrationProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePinMoved = (
    nextLat: number,
    nextLng: number,
    address: ReverseGeocodedAddress,
  ) => {
    setLat(nextLat);
    setLng(nextLng);
    const parts = [address.street, address.city, address.state, address.zip, address.country].filter(
      Boolean,
    );
    if (parts.length > 0) {
      setBusinessAddress(parts.join(", "));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const trimmedName = businessName.trim();
    const trimmedDescription = businessDescription.trim();
    const trimmedAddress = businessAddress.trim();

    if (!trimmedName) {
      toast.error("Please enter your business or shop name.");
      return;
    }

    if (!trimmedDescription) {
      toast.error("Please enter a business description.");
      return;
    }

    if (!trimmedAddress) {
      toast.error("Please enter your business address.");
      return;
    }

    setSubmitting(true);
    try {
      await update(ref(db, `users/${user.uid}`), {
        role: "vendor",
      });

      const newBusinessRef = push(ref(db, "business"));
      await set(newBusinessRef, {
        userId: user.uid,
        businessName: trimmedName,
        businessDescription: trimmedDescription,
        businessAddress: trimmedAddress,
        lat,
        lng,
        createdAt: serverTimestamp(),
      });

      dispatch(
        updateUser({
          role: "vendor",
          business: {
            id: newBusinessRef.key as string,
            userId: user.uid,
            businessName: trimmedName,
            businessDescription: trimmedDescription,
            businessAddress: trimmedAddress,
            lat,
            lng,
          },
        }),
      );

      toast.success("Your seller account is ready!");
      onClose();
      router.push("/vendor/dashboard");
    } catch (error) {
      console.warn(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
        className="z-20 max-w-120 w-full mx-4 relative bg-white p-6 rounded-md shadow-md shadow-black/40"
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
          Create your business
        </div>

        <form onSubmit={handleSubmit} className="gap-3 flex flex-col text-sm">
          <div className="flex gap-1 flex-col">
            <div className="font-sm">Business or Shop Name</div>
            <input
              className="outline-none text-xs w-full font-medium border border-gray-400 px-3 py-2 rounded-sm"
              type="text"
              placeholder="e.g. Kanto Card Corner"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-1 flex-col">
            <div className="font-sm">Business Description</div>
            <textarea
              className="outline-none text-xs w-full font-medium border border-gray-400 px-3 py-2 rounded-sm resize-none"
              rows={4}
              placeholder="Tell buyers what you sell..."
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-1 flex-col">
            <div className="font-sm">Business Address</div>
            <div className="text-[0.65rem] text-gray-500 -mt-1 mb-1">
              Click or drag the pin to your exact location — this is used to
              estimate shipping times to customers.
            </div>
            <AddressMap lat={lat} lng={lng} onChange={handlePinMoved} />
            <textarea
              className="outline-none text-xs w-full font-medium border border-gray-400 px-3 py-2 rounded-sm resize-none"
              rows={4}
              placeholder="e.g. Max Mustermann Hauptstraße 12 10115 Berlin"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-950 text-white cursor-pointer py-2 rounded-sm w-full disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save and continue"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
