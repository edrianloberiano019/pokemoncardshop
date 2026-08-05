"use client";

import { useId, useMemo, useState } from "react";
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

const formatCurrency = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
  const axisMax = useMemo(
    () => Math.max(...data.map((d) => d.value)),
    [data],
  );
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
                <stop
                  offset="100%"
                  stopColor={LINE_COLOR}
                  stopOpacity={0.02}
                />
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
              dot={{ r: 4, fill: LINE_COLOR, stroke: "#ffffff", strokeWidth: 2 }}
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

export type DashboardStat = {
  label: string;
  value: string;
};

type DashboardOverviewProps = {
  stats: DashboardStat[];
  topListTitle: string;
  secondaryPanelTitle: string;
  thirdPanelTitle: string;
  topRightSlot?: React.ReactNode;
};

export default function DashboardOverview({
  stats,
  topListTitle,
  secondaryPanelTitle,
  thirdPanelTitle,
  topRightSlot,
}: DashboardOverviewProps) {
  return (
    <>
      <div className="grid grid-cols-5 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border bg-white border-blue-900 rounded-md p-4"
          >
            <div className="text-xs text-blue-950 uppercase font-black">
              {stat.label}
            </div>
            <div className="text-2xl text-blue-950 font-black mt-1">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 grid-rows-3 h-full text-blue-950 gap-2">
        <div className="border bg-white col-span-3 row-span-2 border-blue-900 rounded-md p-4 flex flex-col">
          <SalesOverviewChart />
        </div>
        <div className="col-start-4 bg-white border rounded-sm border-blue-950 p-3 overflow-hidden">
          {topRightSlot}
        </div>
        <div className="col-start-4  bg-white row-span-2 p-4 row-start-2 border rounded-sm border-blue-950">
          <div>{topListTitle}</div>
          <div className="text-xs font-light flex px-2 py-1 border-b border-blue-900">
            <div className="px-2">#</div>
            <div className="w-full">Product</div>
            <div className="px-2 text-nowrap">Unit Sold</div>
            <div className="px-2">Revenue</div>
          </div>
        </div>
        <div className="border  bg-white flex flex-col border-blue-950 rounded-sm p-4">
          <div>{secondaryPanelTitle}</div>
        </div>
        <div className="border  bg-white col-span-2 flex flex-col border-blue-950 rounded-sm p-4">
          <div>{thirdPanelTitle}</div>
        </div>
      </div>
    </>
  );
}
