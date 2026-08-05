"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import DashboardOverview from "@/components/DashboardOverview";
import { useAppSelector } from "@/store/hooks";

export default function VendorDashboardPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    } else if (user.role !== "vendor") {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "vendor") {
    return <Loading />;
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 py-[3vh] bg-blue-100 flex flex-col gap-2 px-[3vh] overflow-hidden text-black">
        <DashboardOverview
          stats={[
            { label: "Total Sales", value: "$1,960,002.10" },
            { label: "Product Sold", value: "413" },
            { label: "Pending Orders", value: "24" },
            { label: "Unconfirmed orders", value: "204" },
            { label: "Confirmed orders", value: "185" },
          ]}
          topListTitle="Top Selling Products"
          secondaryPanelTitle="Orders Overview"
          thirdPanelTitle="Inventory Alerts"
        />
      </main>
    </div>
  );
}
