"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onValue, ref, update } from "firebase/database";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import { db } from "@/lib/firebase";
import { useAppSelector } from "@/store/hooks";

type OrderStatus = "to_pay" | "to_ship" | "to_receive" | "to_rate";

interface OrderItem {
  productId: string;
  vendorId?: string;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  priceAtAdd: number;
  estimatedArrivalDate?: string;
}

interface RawOrder {
  userId: string;
  status: OrderStatus;
  items?: unknown;
  total: number;
  createdAt?: number;
  readyToConfirm?: boolean;
}

interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  createdAt?: number;
  readyToConfirm?: boolean;
}

function normalizeItems(raw: unknown): OrderItem[] {
  if (Array.isArray(raw)) return raw as OrderItem[];
  if (raw && typeof raw === "object") return Object.values(raw) as OrderItem[];
  return [];
}

function groupByVendor(items: OrderItem[]) {
  const groups = new Map<string, OrderItem[]>();
  for (const item of items) {
    const key = item.vendorId ?? "unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries()).map(([vendorId, groupItems]) => ({
    vendorId,
    items: groupItems,
  }));
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  to_pay: "Waiting for payment",
  to_ship: "To Ship",
  to_receive: "To Receive",
  to_rate: "Confirmed",
};

function formatDate(value?: number) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getLatestEta(items: OrderItem[]) {
  const etas = items
    .map((item) => item.estimatedArrivalDate)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime());

  return etas.length > 0 ? Math.max(...etas) : null;
}

function isDeliveryDateReached(items: OrderItem[]) {
  const latestEta = getLatestEta(items);
  if (latestEta == null) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return latestEta <= today.getTime();
}

function isNextDayReached(createdAt?: number) {
  if (!createdAt) return true;

  const orderDate = new Date(createdAt);
  orderDate.setHours(0, 0, 0, 0);
  const nextDay = orderDate.getTime() + 24 * 60 * 60 * 1000;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today.getTime() >= nextDay;
}

type ColumnDef =
  | {
      status: OrderStatus;
      title: string;
      kind: "advance";
      nextStatus: OrderStatus;
      actionLabel: string;
    }
  | {
      status: OrderStatus;
      title: string;
      kind: "enableConfirm";
      actionLabel: string;
    }
  | { status: OrderStatus; title: string; kind: "none" };

const COLUMNS: ColumnDef[] = [
  {
    status: "to_ship",
    title: "To Ship",
    kind: "advance",
    nextStatus: "to_receive",
    actionLabel: "To Receive",
  },
  {
    status: "to_receive",
    title: "To Receive",
    kind: "enableConfirm",
    actionLabel: "Mark as Delivered",
  },
  { status: "to_rate", title: "Confirmed", kind: "none" },
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>(
    {},
  );
  const [businessNames, setBusinessNames] = useState<Record<string, string>>(
    {},
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    } else if (user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const unsubscribe = onValue(ref(db, "orders"), (snapshot) => {
      const data = snapshot.val() as Record<string, RawOrder> | null;

      const list = data
        ? Object.entries(data)
            .map(([id, value]) => ({
              id,
              userId: value.userId,
              status: value.status,
              total: value.total,
              createdAt: value.createdAt,
              readyToConfirm: value.readyToConfirm,
              items: normalizeItems(value.items),
            }))
            .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
        : [];

      setOrders(list);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const unsubscribe = onValue(ref(db, "users"), (snapshot) => {
      const data = snapshot.val() as Record<
        string,
        { firstName?: string; lastName?: string; email?: string }
      > | null;

      const map: Record<string, string> = {};
      if (data) {
        for (const [uid, profile] of Object.entries(data)) {
          map[uid] =
            [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
            profile.email ||
            uid;
        }
      }
      setCustomerNames(map);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const unsubscribe = onValue(ref(db, "business"), (snapshot) => {
      const data = snapshot.val() as Record<
        string,
        { userId?: string; businessName?: string }
      > | null;

      const map: Record<string, string> = {};
      if (data) {
        for (const business of Object.values(data)) {
          if (business.userId && business.businessName) {
            map[business.userId] = business.businessName;
          }
        }
      }
      setBusinessNames(map);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAdvanceStatus = async (order: Order, nextStatus: OrderStatus) => {
    try {
      await update(ref(db, `orders/${order.id}`), {
        status: nextStatus,
        updatedAt: { ".sv": "timestamp" },
      });
    } catch (error) {
      console.warn(error);
      toast.error("Failed to update order status.");
    }
  };

  const handleEnableConfirmation = async (order: Order) => {
    try {
      await update(ref(db, `orders/${order.id}`), {
        readyToConfirm: true,
        updatedAt: { ".sv": "timestamp" },
      });
    } catch (error) {
      console.warn(error);
      toast.error("Failed to update order.");
    }
  };

  if (loading || !user || user.role !== "admin") {
    return <Loading />;
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 py-[3vh] bg-blue-100 flex flex-col gap-2 px-[4vh] overflow-hidden text-black">
        <div className="grid grid-cols-3 gap-4 h-full overflow-hidden">
          {COLUMNS.map((column) => {
            const columnOrders = orders.filter(
              (order) => order.status === column.status,
            );

            return (
              <div
                key={column.status}
                className="border bg-white border-blue-900 rounded-md flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-blue-950 text-white">
                  <div className="text-sm font-semibold uppercase">
                    {column.title}
                  </div>
                  <div className="text-xs bg-white/10 px-2 py-0.5 rounded-sm">
                    {columnOrders.length}
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-3 flex flex-col gap-3">
                  {columnOrders.length === 0 ? (
                    <div className="text-center text-xs text-blue-900/50 py-6">
                      No orders.
                    </div>
                  ) : (
                    columnOrders.map((order) => {
                      const actionDisabled =
                        column.kind === "advance"
                          ? !isNextDayReached(order.createdAt)
                          : column.kind === "enableConfirm"
                            ? !isDeliveryDateReached(order.items)
                            : false;

                      const productSummary =
                        order.items.length === 0
                          ? "—"
                          : order.items.length === 1
                            ? order.items[0].name
                            : `${order.items[0].name} +${order.items.length - 1} more`;

                      const deliveryEta = getLatestEta(order.items);

                      return (
                        <div
                          key={order.id}
                          className="border border-blue-900/10 rounded-sm p-3 flex flex-col gap-2 text-sm text-blue-950"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium truncate">
                              {customerNames[order.userId] ?? order.userId}
                            </div>
                            <div className="text-xs text-blue-900/60 shrink-0">
                              Ordered {formatDate(order.createdAt)}
                            </div>
                          </div>
                          <div
                            className="text-xs text-blue-900/70 truncate"
                            title={order.items.map((item) => item.name).join(", ")}
                          >
                            {productSummary}
                          </div>
                          <div className="text-xs text-blue-900/60">
                            Order #{order.id.slice(-8).toUpperCase()}
                          </div>
                          {deliveryEta != null && (
                            <div className="text-xs text-blue-900/60">
                              Est. delivery: {formatDate(deliveryEta)}
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-black">
                              ${order.total.toLocaleString()}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="border border-blue-900 text-blue-950 text-xs px-2 py-1 rounded-sm cursor-pointer hover:bg-blue-50 transition-all"
                              >
                                View
                              </button>
                              {column.kind === "advance" && (
                                <button
                                  type="button"
                                  disabled={actionDisabled}
                                  onClick={() =>
                                    handleAdvanceStatus(
                                      order,
                                      column.nextStatus,
                                    )
                                  }
                                  title={
                                    actionDisabled
                                      ? "Not available until the day after the order date."
                                      : undefined
                                  }
                                  className="bg-blue-950 text-white text-xs px-2 py-1 rounded-sm cursor-pointer hover:bg-blue-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-950"
                                >
                                  {column.actionLabel}
                                </button>
                              )}
                              {column.kind === "enableConfirm" &&
                                (order.readyToConfirm ? (
                                  <span className="text-xs text-blue-900/50 italic px-2 py-1">
                                    Waiting for customer
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={actionDisabled}
                                    onClick={() =>
                                      handleEnableConfirmation(order)
                                    }
                                    title={
                                      actionDisabled
                                        ? "Not available until the estimated delivery date."
                                        : undefined
                                    }
                                    className="bg-blue-950 text-white text-xs px-2 py-1 rounded-sm cursor-pointer hover:bg-blue-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-950"
                                  >
                                    {column.actionLabel}
                                  </button>
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {selectedOrder && (
        <div className="fixed flex flex-col w-full items-center justify-center h-full z-100 top-0 left-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedOrder(null)}
            className="fixed backdrop-blur-xs bg-black/40 z-10 w-full h-full"
          />
          <motion.div
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            className="z-20 max-w-xl w-full mx-4 relative border border-blue-950 bg-white rounded-md shadow-2xl shadow-black/40 p-6 max-h-[80vh] overflow-auto"
          >
            <div
              onClick={() => setSelectedOrder(null)}
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
                {STATUS_LABEL[selectedOrder.status] ?? selectedOrder.status}
              </div>
            </div>

            <div className="text-xs text-blue-900/60 mb-4">
              Order #{selectedOrder.id.slice(-8).toUpperCase()} ·{" "}
              {formatDate(selectedOrder.createdAt)} ·{" "}
              {customerNames[selectedOrder.userId] ?? selectedOrder.userId}
            </div>

            <div className="flex flex-col gap-3">
              {groupByVendor(selectedOrder.items).map((group) => (
                <div
                  key={group.vendorId}
                  className="flex flex-col gap-2 border border-blue-900/10 rounded-sm p-2"
                >
                  <div className="text-xs font-black text-blue-950 uppercase tracking-wide">
                    {businessNames[group.vendorId] ?? "Unknown Seller"}
                  </div>
                  {group.items.map((item, index) => (
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
                          Qty: {item.quantity} × $
                          {item.priceAtAdd.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-blue-950">
                        $
                        {(item.priceAtAdd * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-blue-900/10 pt-3 mt-4">
              <div className="text-xs text-blue-900/60">Order total</div>
              <div className="text-sm font-black text-blue-950">
                ${selectedOrder.total.toLocaleString()}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
