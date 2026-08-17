"use client";

import { useEffect, useState } from "react";
import { get, ref, update } from "firebase/database";
import { toast } from "react-toastify";
import { db } from "@/lib/firebase";
import { useAppSelector } from "@/store/hooks";
import AddressMap, { type ReverseGeocodedAddress } from "./AddressMap";

const fieldClass =
  "w-full border border-blue-900 rounded-sm px-3 py-2 text-sm bg-white text-blue-950 placeholder:text-blue-900/40 focus:outline-none focus:ring-1 focus:ring-blue-900";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-blue-950 mb-1">
      {children}
    </label>
  );
}

type AddressRequiredModalProps = {
  onClose: () => void;
  onSaved: () => void;
};

export default function AddressRequiredModal({
  onClose,
  onSaved,
}: AddressRequiredModalProps) {
  const user = useAppSelector((state) => state.auth.user);
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;

    const loadAddress = async () => {
      const snapshot = await get(ref(db, `users/${uid}/address`));
      const data = snapshot.val() as {
        street?: string;
        landmark?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
        lat?: number;
        lng?: number;
      } | null;

      setStreet(data?.street ?? "");
      setLandmark(data?.landmark ?? "");
      setCity(data?.city ?? "");
      setStateName(data?.state ?? "");
      setZip(data?.zip ?? "");
      setCountry(data?.country ?? "");
      setLat(data?.lat ?? null);
      setLng(data?.lng ?? null);
    };
    loadAddress();
  }, [user?.uid]);

  const handlePinMoved = (
    nextLat: number,
    nextLng: number,
    address: ReverseGeocodedAddress,
  ) => {
    setLat(nextLat);
    setLng(nextLng);
    if (address.street) setStreet(address.street);
    if (address.city) setCity(address.city);
    if (address.state) setStateName(address.state);
    if (address.zip) setZip(address.zip);
    if (address.country) setCountry(address.country);
  };

  const handleSave = async () => {
    if (!user) return;

    const trimmedStreet = street.trim();
    const trimmedCity = city.trim();

    if (!trimmedStreet || !trimmedCity) {
      toast.error("Street and city are required.");
      return;
    }

    setSaving(true);
    try {
      await update(ref(db, `users/${user.uid}/address`), {
        street: trimmedStreet,
        landmark: landmark.trim() || null,
        city: trimmedCity,
        state: stateName.trim() || null,
        zip: zip.trim() || null,
        country: country.trim() || null,
        lat,
        lng,
      });
      toast.success("Address saved.");
      onSaved();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save address. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed flex flex-col w-full items-center justify-center h-full z-102 top-0 left-0">
      <div
        onClick={onClose}
        className="fixed backdrop-blur-xs bg-black/40 z-10 w-full h-full"
      />
      <div className="z-20 max-w-lg w-full mx-4 relative bg-white rounded-md shadow-2xl shadow-black/40 max-h-[85vh] overflow-auto p-6 flex flex-col gap-4">
        <div
          onClick={onClose}
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

        <div>
          <div className="font-black text-blue-950 text-lg">
            Delivery Address Required
          </div>
          <div className="text-xs text-blue-900/60 mt-1">
            Add a delivery address before checking out.
          </div>
        </div>

        {/* <AddressMap lat={lat} lng={lng} onChange={handlePinMoved} /> */}

        <div>
          <FieldLabel>Street Address</FieldLabel>
          <input
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <FieldLabel>Landmark</FieldLabel>
          <input
            placeholder="e.g. Near the blue gate, beside the bakery"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>City</FieldLabel>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <FieldLabel>State / Province</FieldLabel>
            <input
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>ZIP / Postal Code</FieldLabel>
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <FieldLabel>Country</FieldLabel>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-sm border border-blue-900 text-blue-950 text-sm cursor-pointer hover:bg-blue-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="bg-blue-950 px-4 py-1.5 rounded-sm text-white text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
