"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { get, ref } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAppSelector } from "@/store/hooks";

const fieldClass =
  "w-full border border-blue-900 rounded-sm px-3 py-2 text-sm bg-blue-50/40 text-blue-950 focus:outline-none";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-blue-950 mb-1">
      {children}
    </label>
  );
}

type AdminProfileModalProps = {
  onClose: () => void;
};

export default function AdminProfileModal({ onClose }: AdminProfileModalProps) {
  const user = useAppSelector((state) => state.auth.user);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;

    const loadProfile = async () => {
      const snapshot = await get(ref(db, `users/${uid}`));
      const data = snapshot.val();
      setFirstName(data?.firstName ?? "");
      setLastName(data?.lastName ?? "");
      setContactNumber(data?.contactNumber ?? "");
      setLoaded(true);
    };
    loadProfile();
  }, [user?.uid]);

  return (
    <div className="fixed flex flex-col w-full items-center justify-center h-full z-100 top-0 left-0">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="fixed backdrop-blur-xs bg-black/40 z-10 w-full h-full"
      ></motion.div>
      <motion.div
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        className="z-20 max-w-md w-full mx-4 relative border border-blue-950 bg-white rounded-md shadow-2xl shadow-black/40 p-6"
      >
        <div
          onClick={onClose}
          className="absolute cursor-pointer hover:scale-110 hover:bg-red-700 transition-all top-2 right-2 border-4 border-white bg-red-600 p-1 rounded-full z-30"
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

        <div className="font-black text-blue-950 text-lg mb-4">
          Admin Profile
        </div>

        {!loaded ? (
          <div className="text-xs text-blue-900/50 text-center py-6">
            Loading...
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>First Name</FieldLabel>
                <input readOnly value={firstName || "—"} className={fieldClass} />
              </div>
              <div>
                <FieldLabel>Last Name</FieldLabel>
                <input readOnly value={lastName || "—"} className={fieldClass} />
              </div>
            </div>

            <div>
              <FieldLabel>Email</FieldLabel>
              <input
                readOnly
                value={user?.email || "—"}
                className={fieldClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Contact Number</FieldLabel>
                <input
                  readOnly
                  value={contactNumber || "—"}
                  className={fieldClass}
                />
              </div>
              <div>
                <FieldLabel>Role</FieldLabel>
                <input
                  readOnly
                  value={user?.role || "—"}
                  className={fieldClass}
                />
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
