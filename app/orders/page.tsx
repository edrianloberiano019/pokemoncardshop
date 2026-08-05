"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onValue, ref, update } from "firebase/database";
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
  estimatedArrivalDays?: number;
  estimatedArrivalDate?: string;
}

interface RawOrder {
  userId: string;
  paypalOrderId?: string;
  status: OrderStatus;
  items?: unknown;
  total: number;
  createdAt?: number;
}

interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  createdAt?: number;
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

const TABS: {
  id: OrderStatus;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "to_pay",
    label: "To Pay",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="size-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-9-9.75h16.5a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5v-9a1.5 1.5 0 0 1 1.5-1.5Z"
        />
      </svg>
    ),
  },
  {
    id: "to_ship",
    label: "To Ship",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="size-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
        />
      </svg>
    ),
  },
  {
    id: "to_receive",
    label: "To Receive",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="size-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
        />
      </svg>
    ),
  },
  {
    id: "to_rate",
    label: "To Rate",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="size-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
        />
      </svg>
    ),
  },
];

const STATUS_TEXT: Record<OrderStatus, string> = {
  to_pay: "Waiting for payment",
  to_ship: "Preparing your order for shipment",
  to_receive: "Out for delivery",
  to_rate: "Delivered — let others know what you think",
};

function formatDate(value?: number | string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OrdersPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const authLoading = useAppSelector((state) => state.auth.loading);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<OrderStatus>("to_ship");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [businessNames, setBusinessNames] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user?.uid) return;

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
              items: normalizeItems(value.items),
            }))
            .filter((order) => order.userId === user.uid)
            .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
        : [];

      setOrders(list);
      setOrdersLoaded(true);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

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
  }, [user?.uid]);

  const visibleOrders = useMemo(
    () => orders.filter((order) => order.status === activeTab),
    [orders, activeTab],
  );

  const handleConfirmReceived = async (orderId: string) => {
    await update(ref(db, `orders/${orderId}`), {
      status: "to_rate",
      updatedAt: { ".sv": "timestamp" },
    });
    setActiveTab("to_rate");
  };

  if (authLoading || !user || !ordersLoaded) {
    return <Loading />;
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 py-[3vh] bg-blue-100 flex flex-col gap-4 px-[3vh] xl:px-[8vh] overflow-auto text-black">
        <div className="grid grid-cols-4 gap-2">
          {TABS.map((tab) => {
            const count = orders.filter((o) => o.status === tab.id).length;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-4 rounded-md border cursor-pointer transition-all ${
                  isActive
                    ? "bg-blue-950 border-blue-950 text-white"
                    : "bg-white border-blue-900 text-blue-950 hover:bg-blue-50"
                }`}
              >
                <div className="flex gap-2 items-center">
                  {tab.icon}
                  <div className="text font-semibold">{tab.label}</div>
                </div>
                <div
                  className={`text-[0.65rem] ${isActive ? "text-white/70" : "text-blue-900/50"}`}
                >
                  {count} order{count === 1 ? "" : "s"}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          {visibleOrders.length === 0 ? (
            <div className="border border-dashed border-blue-900/30 rounded-md flex items-center justify-center text-sm text-blue-900/50 py-16">
              No orders in this category.
            </div>
          ) : (
            visibleOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-blue-900 rounded-md p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between text-xs text-blue-900/60 border-b border-blue-900/10 pb-2">
                  <div className="font-semibold text-blue-950">
                    {order.userId}
                  </div>
                  <div>{formatDate(order.createdAt)}</div>
                </div>

                <div className="flex flex-col gap-3">
                  {groupByVendor(order.items).map((group) => (
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
                              className="w-14 h-14 object-cover rounded-sm shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-gray-200 rounded-sm shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-sm font-medium text-blue-950 truncate"
                              title={item.name}
                            >
                              {item.name}
                            </div>
                            <div className="text-xs text-blue-900/50">
                              Qty: {item.quantity}
                            </div>
                            {(order.status === "to_ship" ||
                              order.status === "to_receive") &&
                              item.estimatedArrivalDate && (
                                <div className="text-xs text-blue-900/50">
                                  Est. arrival:{" "}
                                  {formatDate(item.estimatedArrivalDate)} (
                                  {item.estimatedArrivalDays} day
                                  {item.estimatedArrivalDays === 1
                                    ? ""
                                    : "s"}
                                  )
                                </div>
                              )}
                          </div>
                          <div className="text-sm font-semibold text-blue-950">
                            $
                            {(
                              item.priceAtAdd * item.quantity
                            ).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-blue-900/10 pt-3">
                  <div className="text-xs text-blue-900/60">
                    {STATUS_TEXT[order.status]}
                  </div>
                  <div className="text-sm font-black text-blue-950">
                    Total: ${order.total.toLocaleString()}
                  </div>
                </div>

                {order.status === "to_pay" && (
                  <button
                    type="button"
                    className="bg-blue-950 py-2 rounded-sm text-white text-sm font-semibold uppercase cursor-pointer hover:bg-blue-900 transition-all"
                  >
                    Pay Now
                  </button>
                )}

                {order.status === "to_receive" && (
                  <button
                    type="button"
                    onClick={() => handleConfirmReceived(order.id)}
                    className="bg-blue-950 py-2 rounded-sm text-white text-sm font-semibold uppercase cursor-pointer hover:bg-blue-900 transition-all"
                  >
                    Confirm Received
                  </button>
                )}

                {order.status === "to_rate" && (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const filled = (ratings[order.id] ?? 0) >= star;
                        return (
                          <svg
                            key={star}
                            onClick={() =>
                              setRatings((prev) => ({
                                ...prev,
                                [order.id]: star,
                              }))
                            }
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill={filled ? "#172554" : "none"}
                            strokeWidth="1.5"
                            stroke="#172554"
                            className="size-6 cursor-pointer"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                            />
                          </svg>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      className="bg-blue-950 px-4 py-2 rounded-sm text-white text-sm font-semibold uppercase cursor-pointer hover:bg-blue-900 transition-all"
                    >
                      Submit Rating
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
