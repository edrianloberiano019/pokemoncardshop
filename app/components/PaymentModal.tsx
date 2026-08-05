"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { toast } from "react-toastify";

type PaymentModalProps = {
  total: number;
  itemCount: number;
  onClose: () => void;
  onPaid: () => void;
};

export default function PaymentModal({
  total,
  itemCount,
  onClose,
  onPaid,
}: PaymentModalProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  return (
    <div className="fixed flex flex-col w-full items-center justify-center h-full z-102 top-0 left-0">
      <div
        onClick={onClose}
        className="fixed backdrop-blur-xs bg-black/40 z-10 w-full h-full"
      />
      <div className="z-20 max-w-md w-full mx-4 relative bg-white rounded-md shadow-2xl shadow-black/40 p-6 flex flex-col gap-4">
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

        <div className="font-black text-blue-950 text-lg">Checkout</div>

        <div className="flex items-center justify-between text-sm text-blue-900/70">
          <div>
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </div>
          <div className="font-semibold text-blue-950">
            ${total.toLocaleString()}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-blue-950 mb-2">
            Payment Method
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 border border-blue-900 rounded-sm px-3 py-3 bg-blue-50">
              <div className="size-4 rounded-full border-2 border-blue-950 flex items-center justify-center shrink-0">
                <div className="size-2 rounded-full bg-blue-950" />
              </div>
              <div className="flex items-center gap-0.5">
                <span className="font-black italic text-[#003087] text-lg">
                  Pay
                </span>
                <span className="font-black italic text-[#009cde] text-lg">
                  Pal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 border border-blue-900/20 rounded-sm px-3 py-3 opacity-50 cursor-not-allowed">
              <div className="size-4 rounded-full border-2 border-blue-900/40 shrink-0" />
              <div className="text-sm font-medium text-blue-950">
                Cash on Delivery
              </div>
              <div className="ml-auto text-[0.65rem] font-semibold text-blue-900/50 uppercase">
                Not available
              </div>
            </div>

            <div className="flex items-center gap-3 border border-blue-900/20 rounded-sm px-3 py-3 opacity-50 cursor-not-allowed">
              <div className="size-4 rounded-full border-2 border-blue-900/40 shrink-0" />
              <div className="text-sm font-medium text-blue-950">
                Credit / Debit Card
              </div>
              <div className="ml-auto text-[0.65rem] font-semibold text-blue-900/50 uppercase">
                Not available
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-blue-900/10 pt-3">
          <div className="text-sm font-medium text-blue-950">Total</div>
          <div className="text-xl font-black text-blue-950">
            ${total.toLocaleString()}
          </div>
        </div>

        {clientId ? (
          <PayPalScriptProvider options={{ clientId, currency: "USD" }}>
            <PayPalButtons
              style={{ layout: "horizontal", tagline: false, height: 40 }}
              createOrder={async () => {
                const res = await fetch("/api/paypal/create-order", {
                  method: "POST",
                });
                const data = await res.json();
                if (!res.ok || !data.orderID) {
                  toast.error(data.error || "Failed to start checkout.");
                  throw new Error(data.error || "Failed to create order");
                }
                return data.orderID as string;
              }}
              onApprove={async (data) => {
                const res = await fetch("/api/paypal/capture-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderID: data.orderID }),
                });
                const result = await res.json();
                if (!res.ok || !result.success) {
                  toast.error(result.error || "Payment failed.");
                  return;
                }
                toast.success("Payment successful!");
                onPaid();
              }}
              onError={(err) => {
                console.error(err);
                toast.error("PayPal checkout failed. Please try again.");
              }}
            />
          </PayPalScriptProvider>
        ) : (
          <button
            type="button"
            disabled
            className="bg-blue-950 w-full py-2 rounded-sm text-white text-sm font-semibold uppercase disabled:opacity-60 disabled:cursor-not-allowed"
          >
            PayPal is not configured
          </button>
        )}
      </div>
    </div>
  );
}
