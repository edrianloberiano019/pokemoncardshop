"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onValue, ref } from "firebase/database";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import DashboardOverview from "@/components/DashboardOverview";
import UserStatusPieChart from "@/components/UserStatusPieChart";
import { db } from "@/lib/firebase";
import { useAppSelector } from "@/store/hooks";

type Account = {
  role?: string;
  isOnline?: boolean;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);
  const [activeVendors, setActiveVendors] = useState(0);

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

    const unsubscribe = onValue(ref(db, "users"), (snapshot) => {
      const data = snapshot.val() as Record<string, Account> | null;
      const accounts = data ? Object.values(data) : [];

      setActiveVendors(
        accounts.filter((a) => a.role === "vendor" && a.isOnline).length,
      );
    });

    return () => unsubscribe();
  }, [user]);

  if (loading || !user || user.role !== "admin") {
    return <Loading />;
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 py-[3vh] bg-blue-100 flex flex-col gap-2 px-[3vh] overflow-hidden text-black">
        <DashboardOverview
          stats={[
            { label: "Total Platform Sales", value: "$0.00" },
            { label: "Active Vendors", value: String(activeVendors) },
            { label: "Orders Today", value: "0" },
            { label: "Pending Reviews", value: "0" },
            { label: "Open Tickets", value: "0" },
          ]}
          topListTitle="Top Selling Products"
          secondaryPanelTitle="Pending Actions"
          thirdPanelTitle="System Alerts"
          topRightSlot={<UserStatusPieChart />}
        />
      </main>
    </div>
  );
}
