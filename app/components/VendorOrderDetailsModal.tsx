"use client";

import { motion } from "framer-motion";

export type VendorOrderItem = {
  productId: string;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  priceAtAdd: number;
};

export type VendorOrderCustomer = {
  name: string;
  email?: string;
  contactNumber?: string;
  address?: {
    street?: string;
    landmark?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  } | null;
};

export type VendorOrderDetails = {
  id: string;
  status: string;
  createdAt?: number;
  items: VendorOrderItem[];
  vendorTotal: number;
};

const STATUS_LABEL: Record<string, string> = {
  to_pay: "Waiting for payment",
  to_ship: "To Ship",
  to_receive: "To Receive",
  to_rate: "Delivered",
};

function formatDate(value?: number) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAddress(address?: VendorOrderCustomer["address"]) {
  if (!address) return null;
  const line1 = [address.street, address.landmark].filter(Boolean).join(", ");
  const line2 = [address.city, address.state, address.zip]
    .filter(Boolean)
    .join(", ");
  const lines = [line1, line2, address.country].filter(Boolean);
  return lines.length > 0 ? lines : null;
}

type VendorOrderDetailsModalProps = {
  order: VendorOrderDetails;
  customer: VendorOrderCustomer;
  onClose: () => void;
};

export default function VendorOrderDetailsModal({
  order,
  customer,
  onClose,
}: VendorOrderDetailsModalProps) {
  const addressLines = formatAddress(customer.address);

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
        className="z-20 max-w-xl w-full mx-4 relative border border-blue-950 bg-white rounded-md shadow-2xl shadow-black/40 p-6 max-h-[80vh] overflow-auto"
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

        <div className="flex items-center justify-between mb-4">
          <div className="font-black text-blue-950 text-lg">
            Order Details
          </div>
          <div className="text-xs bg-blue-100 text-blue-950 font-semibold uppercase px-2 py-1 rounded-sm">
            {STATUS_LABEL[order.status] ?? order.status}
          </div>
        </div>

        <div className="text-xs text-blue-900/60 mb-4">
          Order #{order.id.slice(-8).toUpperCase()} · {formatDate(order.createdAt)}
        </div>

        <div className="border border-blue-900/10 rounded-sm p-3 mb-4">
          <div className="text-xs font-black text-blue-950 uppercase tracking-wide mb-2">
            Customer
          </div>
          <div className="text-sm font-medium text-blue-950">
            {customer.name || "—"}
          </div>
          {customer.email && (
            <div className="text-xs text-blue-900/60">{customer.email}</div>
          )}
          {customer.contactNumber && (
            <div className="text-xs text-blue-900/60">
              {customer.contactNumber}
            </div>
          )}
          <div className="text-xs text-blue-900/60 mt-2">
            {addressLines ? (
              addressLines.map((line, index) => <div key={index}>{line}</div>)
            ) : (
              <div className="italic">No address on file.</div>
            )}
          </div>
        </div>

        <div className="border border-blue-900/10 rounded-sm p-3">
          <div className="text-xs font-black text-blue-950 uppercase tracking-wide mb-2">
            Products
          </div>
          <div className="flex flex-col gap-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-sm shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-sm shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium text-blue-950 truncate"
                    title={item.name}
                  >
                    {item.name}
                  </div>
                  <div className="text-xs text-blue-900/50">
                    Qty: {item.quantity} × ${item.priceAtAdd.toLocaleString()}
                  </div>
                </div>
                <div className="text-sm font-semibold text-blue-950">
                  ${(item.priceAtAdd * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-blue-900/10 pt-3 mt-4">
          <div className="text-xs text-blue-900/60">Your subtotal</div>
          <div className="text-sm font-black text-blue-950">
            ${order.vendorTotal.toLocaleString()}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
