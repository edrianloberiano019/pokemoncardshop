"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ref, update } from "firebase/database";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "react-toastify";
import { auth, db } from "@/lib/firebase";
import ConfirmModal from "./ConfirmModal";

export type AccountDetails = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  contactNumber?: string;
  role?: string;
  isApproved?: boolean;
  disabled?: boolean;
  deleted?: boolean;
};

const fieldClass =
  "w-full border border-blue-900 rounded-sm px-3 py-2 text-sm bg-blue-50/40 text-blue-950 focus:outline-none";

function maskEmail(email?: string) {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain) return "•".repeat(email.length);
  const visible = local.slice(0, 3);
  const masked = "•".repeat(Math.max(local.length - visible.length, 0));
  return `${visible}${masked}@${domain}`;
}

function maskContactNumber(contactNumber?: string) {
  if (!contactNumber) return "—";
  const visible = contactNumber.slice(-4);
  const masked = "•".repeat(Math.max(contactNumber.length - visible.length, 0));
  return `${masked}${visible}`;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-blue-950 mb-1">
      {children}
    </label>
  );
}

type AccountDetailsModalProps = {
  account: AccountDetails;
  onClose: () => void;
};

export default function AccountDetailsModal({
  account,
  onClose,
}: AccountDetailsModalProps) {
  const [working, setWorking] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "reset" | "toggle" | "delete" | null
  >(null);

  const handleToggleDisable = async () => {
    setWorking(true);
    try {
      await update(ref(db, `users/${account.id}`), {
        disabled: !account.disabled,
      });
      toast.success(
        account.disabled ? "Account enabled." : "Account disabled.",
      );
      onClose();
    } catch (error) {
      console.warn(error);
      toast.error("Failed to update account status.");
    } finally {
      setWorking(false);
      setConfirmAction(null);
    }
  };

  const handleResetPassword = async () => {
    if (!account.email) {
      toast.error("This account has no email on file.");
      setConfirmAction(null);
      return;
    }
    setWorking(true);
    try {
      await sendPasswordResetEmail(auth, account.email);
      toast.success(`Password reset email sent to ${account.email}.`);
    } catch (error) {
      console.warn(error);
      toast.error("Failed to send password reset email.");
    } finally {
      setWorking(false);
      setConfirmAction(null);
    }
  };

  const handleDelete = async () => {
    setWorking(true);
    try {
      await update(ref(db, `users/${account.id}`), { deleted: true });
      toast.success("Account deleted. It can be recovered from Accounts.");
      onClose();
    } catch (error) {
      console.warn(error);
      toast.error("Failed to delete account.");
    } finally {
      setWorking(false);
      setConfirmAction(null);
    }
  };

  const confirmDialog =
    confirmAction === "reset"
      ? {
          title: "Reset Password",
          message: `Send a password reset email to ${account.email || "this account"}?`,
          confirmLabel: "Send Email",
          variant: "default" as const,
          onConfirm: handleResetPassword,
        }
      : confirmAction === "toggle"
        ? {
            title: account.disabled ? "Enable Account" : "Disable Account",
            message: account.disabled
              ? "This will restore the account's ability to log in."
              : "This will prevent the account from logging in.",
            confirmLabel: account.disabled ? "Enable" : "Disable",
            variant: "default" as const,
            onConfirm: handleToggleDisable,
          }
        : confirmAction === "delete"
          ? {
              title: "Delete Account",
              message: `Delete ${[account.firstName, account.lastName].filter(Boolean).join(" ") || "this account"}? This can be recovered later from the Accounts page.`,
              confirmLabel: "Delete",
              variant: "danger" as const,
              onConfirm: handleDelete,
            }
          : null;

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
          Account Details
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>First Name</FieldLabel>
              <input
                readOnly
                value={account.firstName || "—"}
                className={fieldClass}
              />
            </div>
            <div>
              <FieldLabel>Last Name</FieldLabel>
              <input
                readOnly
                value={account.lastName || "—"}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <FieldLabel>Email</FieldLabel>
            <input
              readOnly
              value={account.email || "—"}
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Contact Number</FieldLabel>
              <input
                readOnly
                value={maskContactNumber(account.contactNumber)}
                className={fieldClass}
              />
            </div>
            <div>
              <FieldLabel>Role</FieldLabel>
              <input
                readOnly
                value={account.role || "—"}
                className={fieldClass}
              />
            </div>
          </div>
        </div>

        <div className="flex w-full gap-2 mt-5">
          <button
            type="button"
            disabled={working}
            onClick={() => setConfirmAction("reset")}
            className="border w-full border-blue-900 text-blue-950 py-2 rounded-sm text-sm cursor-pointer hover:bg-blue-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Reset Password
          </button>
          <button
            type="button"
            disabled={working}
            onClick={() => setConfirmAction("toggle")}
            className="bg-blue-950 w-full text-white py-2 rounded-sm text-sm cursor-pointer hover:bg-blue-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {account.disabled ? "Enable Account" : "Disable Account"}
          </button>
          <button
            type="button"
            disabled={working}
            onClick={() => setConfirmAction("delete")}
            className="bg-red-600 px-3 text-white py-2 rounded-sm text-sm cursor-pointer hover:bg-red-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </button>
        </div>
      </motion.div>
      {confirmDialog && (
        <ConfirmModal
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          variant={confirmDialog.variant}
          working={working}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
