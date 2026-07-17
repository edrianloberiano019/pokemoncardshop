"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Application = {
  id: string;
  name: string | null;
  email: string;
  businessName: string | null;
  role: "CUSTOMER" | "VENDOR" | "ADMIN" | "SUPERADMIN";
  vendorStatus: "PENDING" | "APPROVED" | "DENIED" | null;
  createdAt: string;
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-900",
  APPROVED: "bg-green-100 text-green-900",
  DENIED: "bg-red-100 text-red-900",
};

export default function AccountsTable({
  // applications,
}: {
  // applications: Application[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (id: string, action: "approve" | "deny") => {
    setBusyId(id);
    setError(null);

    const res = await fetch(`/api/admin/vendor-applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    setBusyId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error || "Action failed.");
      return;
    }

    startTransition(() => router.refresh());
  };

  // if (applications.length === 0) {
  //   return (
  //     <div className="border border-black/10 rounded-md p-8 text-center text-black/60">
  //       No vendor applications yet.
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <div className="text-sm text-red-600 px-2 py-1">{error}</div>
      )}
      <div className="border border-black/10 rounded-md overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-black/5 text-sm font-medium">
          <div className="col-span-3">Business</div>
          <div className="col-span-2">Applicant</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Role</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {/* {applications.map((a) => {
          const status = a.vendorStatus ?? "PENDING";
          const isPendingApp = status === "PENDING";
          const isRowBusy = busyId === a.id || isPending;
          return (
            <div
              key={a.id}
              className="grid grid-cols-12 gap-4 px-4 py-3 border-t border-black/10 text-sm items-center"
            >
              <div className="col-span-3 font-medium">
                {a.businessName || "—"}
              </div>
              <div className="col-span-2">{a.name || "—"}</div>
              <div className="col-span-3 text-black/70 truncate">
                {a.email}
              </div>
              <div className="col-span-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${statusStyles[status]}`}
                >
                  {status}
                </span>
              </div>
              <div className="col-span-1 text-xs text-black/60">{a.role}</div>
              <div className="col-span-2 flex gap-2 justify-end">
                {isPendingApp ? (
                  <>
                    <button
                      disabled={isRowBusy}
                      onClick={() => handleAction(a.id, "approve")}
                      className="bg-black text-white text-xs px-3 py-1.5 rounded-md disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      disabled={isRowBusy}
                      onClick={() => handleAction(a.id, "deny")}
                      className="border border-black/30 text-xs px-3 py-1.5 rounded-md disabled:opacity-50"
                    >
                      Deny
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-black/40 italic">
                    Resolved
                  </span>
                )}
              </div>
            </div>
          );
        })} */}
      </div>
    </div>
  );
}
