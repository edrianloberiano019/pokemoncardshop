"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onValue, ref } from "firebase/database";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import VendorOrderDetailsModal, {
  type VendorOrderCustomer,
  type VendorOrderDetails,
  type VendorOrderItem,
} from "@/components/VendorOrderDetailsModal";
import { db } from "@/lib/firebase";
import { useAppSelector } from "@/store/hooks";

interface RawOrderItem extends VendorOrderItem {
  vendorId?: string;
}

interface RawOrder {
  userId: string;
  status: string;
  items?: unknown;
  createdAt?: number;
}

interface Customer {
  firstName?: string;
  lastName?: string;
  email?: string;
  contactNumber?: string;
  address?: VendorOrderCustomer["address"];
}

function normalizeItems(raw: unknown): RawOrderItem[] {
  if (Array.isArray(raw)) return raw as RawOrderItem[];
  if (raw && typeof raw === "object")
    return Object.values(raw) as RawOrderItem[];
  return [];
}

function formatDate(value?: number) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_LABEL: Record<string, string> = {
  to_pay: "Waiting for payment",
  to_ship: "To Ship",
  to_receive: "To Receive",
  to_rate: "Delivered",
};

export default function VendorOrdersPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);
  const [orders, setOrders] = useState<VendorOrderDetails[]>([]);
  const [customerIds, setCustomerIds] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [selectedOrder, setSelectedOrder] = useState<VendorOrderDetails | null>(
    null,
  );

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    } else if (user.role !== "vendor") {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;

    const unsubscribe = onValue(ref(db, "orders"), (snapshot) => {
      const data = snapshot.val() as Record<string, RawOrder> | null;
      const orderIdToCustomer: Record<string, string> = {};

      const list = data
        ? Object.entries(data)
            .map(([id, value]) => {
              const vendorItems = normalizeItems(value.items).filter(
                (item) => item.vendorId === uid,
              );
              orderIdToCustomer[id] = value.userId;

              return {
                id,
                status: value.status,
                createdAt: value.createdAt,
                items: vendorItems,
                vendorTotal: vendorItems.reduce(
                  (sum, item) => sum + item.priceAtAdd * item.quantity,
                  0,
                ),
              };
            })
            .filter((order) => order.items.length > 0)
            .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
        : [];

      setOrders(list);
      setCustomerIds(orderIdToCustomer);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onValue(ref(db, "users"), (snapshot) => {
      const data = snapshot.val() as Record<string, Customer> | null;
      setCustomers(data ?? {});
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const selectedCustomer = useMemo<VendorOrderCustomer | null>(() => {
    if (!selectedOrder) return null;
    const customerId = customerIds[selectedOrder.id];
    const profile = customerId ? customers[customerId] : undefined;

    return {
      name: [profile?.firstName, profile?.lastName]
        .filter(Boolean)
        .join(" "),
      email: profile?.email,
      contactNumber: profile?.contactNumber,
      address: profile?.address,
    };
  }, [selectedOrder, customerIds, customers]);

  if (loading || !user || user.role !== "vendor") {
    return <Loading />;
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 py-[3vh] bg-blue-100 flex flex-col gap-2 px-[4vh] overflow-hidden text-black">
        <div className="border bg-white h-full border-blue-900 overflow-hidden rounded-md flex flex-col">
          <div className="overflow-auto w-full">
            <div className="text-xs grid grid-cols-6 px-4 w-full items-center uppercase bg-blue-950 text-white">
              <div className="text-left font-medium py-3 px-2 col-span-2">
                Customer
              </div>
              <div className="text-left font-medium py-2 px-2">Date</div>
              <div className="text-left font-medium py-2 px-2">Status</div>
              <div className="text-right font-medium py-2 px-2">
                Subtotal
              </div>
              <div className="text-right font-medium py-2 px-2">Action</div>
            </div>

            {orders.length === 0 ? (
              <div className="text-center text-xs text-blue-900/50 py-6">
                No orders yet.
              </div>
            ) : (
              orders.map((order) => {
                const customerId = customerIds[order.id];
                const profile = customerId ? customers[customerId] : undefined;
                const customerName =
                  [profile?.firstName, profile?.lastName]
                    .filter(Boolean)
                    .join(" ") || "—";

                return (
                  <div
                    key={order.id}
                    className="text-sm text-blue-950 px-3 grid grid-cols-6 items-center"
                  >
                    <div className="py-2 px-2 col-span-2 truncate">
                      {customerName}
                    </div>
                    <div className="py-2 px-2">
                      {formatDate(order.createdAt)}
                    </div>
                    <div className="py-2 px-2">
                      <span className="bg-green-300 px-2 py-0.5 text-xs rounded-sm">
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </div>
                    <div className="py-2 px-2 text-right">
                      ${order.vendorTotal.toLocaleString()}
                    </div>
                    <div className="py-2 px-2 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="bg-blue-950 text-white text-xs px-3 py-1.5 rounded-sm cursor-pointer hover:bg-blue-900 transition-all"
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {selectedOrder && selectedCustomer && (
        <VendorOrderDetailsModal
          order={selectedOrder}
          customer={selectedCustomer}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
