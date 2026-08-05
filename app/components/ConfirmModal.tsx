"use client";

import { motion } from "framer-motion";

type ConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  working?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  working = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <div className="fixed flex flex-col w-full items-center justify-center h-full z-200 top-0 left-0">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="fixed backdrop-blur-xs bg-black/40 z-10 w-full h-full"
      ></motion.div>
      <motion.div
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        className="z-20 max-w-sm w-full mx-4 relative border border-blue-950 bg-white rounded-md shadow-2xl shadow-black/40 p-6"
      >
        <div className="font-black text-blue-950 text-lg mb-2">{title}</div>
        <div className="text-sm text-blue-950/80 mb-5">{message}</div>
        <div className="flex w-full gap-2">
          <button
            type="button"
            disabled={working}
            onClick={onClose}
            className="border w-full border-blue-900 text-blue-950 py-2 rounded-sm text-sm cursor-pointer hover:bg-blue-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={working}
            onClick={onConfirm}
            className={`w-full text-white py-2 rounded-sm text-sm cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-950 hover:bg-blue-900"
            }`}
          >
            {working ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
