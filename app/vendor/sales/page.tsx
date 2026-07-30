"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onValue, ref } from "firebase/database";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import { db } from "@/lib/firebase";
import { useAppSelector } from "@/store/hooks";

type SalesFilter = "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth";

const FILTER_OPTIONS: { value: SalesFilter; label: string }[] = [
  { value: "thisWeek", label: "This Week" },
  { value: "lastWeek", label: "Last Week" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
];

const SALES_DATA: Record<SalesFilter, { label: string; value: number }[]> = {
  thisWeek: [
    { label: "Mon", value: 845210.32 },
    { label: "Tue", value: 1102340.5 },
    { label: "Wed", value: 968540.75 },
    { label: "Thu", value: 1345670.2 },
    { label: "Fri", value: 1587230.9 },
    { label: "Sat", value: 1960002.1 },
    { label: "Sun", value: 1210450.6 },
  ],
  lastWeek: [
    { label: "Mon", value: 712430.15 },
    { label: "Tue", value: 934520.4 },
    { label: "Wed", value: 1056780.0 },
    { label: "Thu", value: 889210.6 },
    { label: "Fri", value: 1742300.45 },
    { label: "Sat", value: 1489650.8 },
    { label: "Sun", value: 1023980.25 },
  ],
  thisMonth: [
    { label: "Week 1", value: 3820540.1 },
    { label: "Week 2", value: 4210330.75 },
    { label: "Week 3", value: 4750920.4 },
    { label: "Week 4", value: 5230105.6 },
  ],
  lastMonth: [
    { label: "Week 1", value: 3120480.9 },
    { label: "Week 2", value: 3640210.3 },
    { label: "Week 3", value: 3980750.15 },
    { label: "Week 4", value: 4415630.5 },
  ],
};

const LINE_COLOR = "#1e3a8a";
const LINE_COLOR_HOVER = "#1d4ed8";

interface SalesPoint {
  label: string;
  value: number;
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as SalesPoint;
  return (
    <div className="bg-blue-950 text-white text-xs rounded-sm px-2 py-1 shadow whitespace-nowrap">
      <div className="font-black">{formatCurrency(point.value)}</div>
      <div className="text-blue-200">{point.label}</div>
    </div>
  );
}

function SalesOverviewChart() {
  const [filter, setFilter] = useState<SalesFilter>("thisWeek");
  const gradientId = useId();

  const data = SALES_DATA[filter];
  const axisMax = useMemo(() => Math.max(...data.map((d) => d.value)), [data]);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((frac) => axisMax * frac);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <div className="font-black text-blue-950">Sales Overview</div>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as SalesFilter)}
            className="appearance-none border border-blue-900 pl-3 pr-6 py-1 text-xs rounded-sm bg-white text-blue-950 font-medium cursor-pointer focus:outline-none"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
          >
            <path
              d="M2 3.5L5 6.5L8 3.5"
              stroke="#1e3a8a"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 24, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={LINE_COLOR} stopOpacity={0.28} />
                <stop offset="100%" stopColor={LINE_COLOR} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke="#e5e7eb" strokeWidth={1} />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9, fill: "#1e3a8a" }}
              padding={{ left: 8, right: 8 }}
            />

            <YAxis
              domain={[0, axisMax]}
              ticks={ticks}
              tickFormatter={(v: number) => formatCurrency(v)}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 9, fill: "#64748b" }}
              width={90}
            />

            <Tooltip
              content={ChartTooltip}
              cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke={LINE_COLOR}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={{
                r: 4,
                fill: LINE_COLOR,
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 5,
                fill: LINE_COLOR_HOVER,
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface VendorProduct {
  id: string;
  vendorId: string;
  name: string;
  price: number;
  stockQuantity: number;
  productType: string;
  lowStockThreshold?: number | null;
}

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border bg-white border-blue-900 rounded-md p-4">
      <div className="text-xs text-blue-950 uppercase font-black">{label}</div>
      <div className="text-2xl text-blue-950 font-black mt-1">{value}</div>
    </div>
  );
}

export default function VendorSalesPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);
  const [myProducts, setMyProducts] = useState<VendorProduct[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;

    const unsubscribe = onValue(ref(db, "products"), (snapshot) => {
      const data = snapshot.val() as Record<
        string,
        Omit<VendorProduct, "id">
      > | null;

      const list = data
        ? Object.entries(data)
            .map(([id, value]) => ({ id, ...value }))
            .filter((product) => product.vendorId === uid)
        : [];

      setMyProducts(list);
      setProductsLoaded(true);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    } else if (user.role !== "vendor") {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  const topProducts = useMemo(
    () => [...myProducts].sort((a, b) => b.price - a.price).slice(0, 5),
    [myProducts],
  );

  const lowStockCount = useMemo(
    () =>
      myProducts.filter(
        (p) =>
          p.lowStockThreshold != null && p.stockQuantity <= p.lowStockThreshold,
      ).length,
    [myProducts],
  );

  if (loading || !user || user.role !== "vendor") {
    return <Loading />;
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 py-[3vh] bg-blue-100 flex flex-col gap-4 px-[4vh] overflow-auto text-black">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          <StatCard label="Total Sales" value="$0.00" />
          <StatCard label="Product Sold" value="0" />
          <StatCard label="Pending Orders" value="0" />
          <StatCard label="Unconfirmed orders" value="0" />
          <StatCard label="Confirmed orders" value="0" />
        </div>

        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-2">
          <div className="border bg-white border-blue-900 rounded-md p-4 lg:col-span-2 flex flex-col">
            <SalesOverviewChart />
          </div>

          <div className="border bg-white border-blue-900 rounded-md p-4 flex flex-col gap-2 overflow-hidden">
            <div className="font-black text-blue-950">Top Selling Products</div>
            <div className="text-xs font-light flex px-2 py-1 border-b border-blue-900 text-blue-950">
              <div className="px-2">#</div>
              <div className="w-full">Product</div>
              <div className="px-2 text-nowrap">Sold</div>
              <div className="px-2">Revenue</div>
            </div>
            <div className="flex-1 overflow-auto">
              {!productsLoaded ? (
                <div className="text-xs text-blue-900/50 text-center py-6">
                  Loading products...
                </div>
              ) : topProducts.length === 0 ? (
                <div className="text-xs text-blue-900/50 text-center py-6 px-2">
                  No products yet. Add products to see them ranked here once
                  sales come in.
                </div>
              ) : (
                topProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="text-xs flex px-2 py-2 border-b border-blue-900/10 text-blue-950 items-center"
                  >
                    <div className="px-2 font-semibold">{index + 1}</div>
                    <div className="w-full truncate pr-2">{product.name}</div>
                    <div className="px-2 text-nowrap">0</div>
                    <div className="px-2 text-nowrap">$0.00</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="border bg-white border-blue-900 overflow-auto rounded-md p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="font-black text-blue-950">
              Products &amp; Units Sold
            </div>
            {lowStockCount > 0 && (
              <div className="text-xs font-semibold text-white bg-red-600 rounded-sm px-2 py-1">
                {lowStockCount} low stock
              </div>
            )}
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm text-blue-950">
              <thead>
                <tr className="text-xs uppercase text-blue-900/60 border-b border-blue-900">
                  <th className="text-left font-medium py-2 px-2">Product</th>
                  <th className="text-left font-medium py-2 px-2">Type</th>
                  <th className="text-right font-medium py-2 px-2">Price</th>
                  <th className="text-right font-medium py-2 px-2">Stock</th>
                  <th className="text-right font-medium py-2 px-2">
                    Units Sold
                  </th>
                  <th className="text-right font-medium py-2 px-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {!productsLoaded ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-xs text-blue-900/50 py-6"
                    >
                      Loading products...
                    </td>
                  </tr>
                ) : myProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-xs text-blue-900/50 py-6"
                    >
                      No products yet.{" "}
                      <a
                        href="/vendor/products"
                        className="underline font-medium"
                      >
                        Add your first product
                      </a>{" "}
                      to start tracking sales.
                    </td>
                  </tr>
                ) : (
                  myProducts.map((product) => {
                    const isLowStock =
                      product.lowStockThreshold != null &&
                      product.stockQuantity <= product.lowStockThreshold;
                    return (
                      <tr
                        key={product.id}
                        className="border-b border-blue-900/10"
                      >
                        <td className="py-2 px-2 font-medium">
                          {product.name}
                        </td>
                        <td className="py-2 px-2">
                          <span className="bg-green-300 px-2 py-0.5 text-xs rounded-sm">
                            {product.productType}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <span
                            className={
                              isLowStock ? "text-red-600 font-semibold" : ""
                            }
                          >
                            {product.stockQuantity}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right">0</td>
                        <td className="py-2 px-2 text-right">$0.00</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
