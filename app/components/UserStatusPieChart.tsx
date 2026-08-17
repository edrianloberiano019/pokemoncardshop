"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipContentProps } from "recharts";
import { db } from "@/lib/firebase";

type Account = {
  isOnline?: boolean;
  disabled?: boolean;
  deleted?: boolean;
};

type StatusSlice = {
  label: string;
  value: number;
  color: string;
};

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const slice = payload[0].payload as StatusSlice;
  return (
    <div className="bg-blue-950 text-white text-xs rounded-sm px-2 py-1 shadow whitespace-nowrap">
      <div className="font-black">{slice.value}</div>
      <div className="text-blue-200">{slice.label}</div>
    </div>
  );
}

export default function UserStatusPieChart() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const unsubscribe = onValue(ref(db, "users"), (snapshot) => {
      const data = snapshot.val() as Record<string, Account> | null;
      setAccounts(data ? Object.values(data) : []);
    });

    return () => unsubscribe();
  }, []);

  const online = accounts.filter((a) => a.isOnline).length;
  const offline = accounts.length - online;
  const disabled = accounts.filter((a) => a.disabled || a.deleted).length;
  const enabled = accounts.length - disabled;

  const slices: StatusSlice[] = [
    { label: "Online", value: online, color: "#16a34a" },
    { label: "Offline", value: offline, color: "#94a3b8" },
    { label: "Enabled", value: enabled, color: "#1e3a8a" },
    { label: "Disabled", value: disabled, color: "#dc2626" },
  ];

  return (
    <div className="h-full min-h-0 flex flex-col items-center">
      <div className="font-black text-blue-950 mb-1 self-start">Users</div>
      {accounts.length === 0 ? (
        <div className="flex-1 w-full flex items-center justify-center text-xs text-gray-400">
          No users yet.
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="90%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {slices.map((slice) => (
                    <Cell key={slice.label} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip content={ChartTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs shrink-0">
            {slices.map((slice) => (
              <div key={slice.label} className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-blue-950/70">{slice.label}</span>
                <span className="font-black text-blue-950">
                  {slice.value}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
