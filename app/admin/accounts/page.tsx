"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onValue, ref, update } from "firebase/database";
import { toast } from "react-toastify";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import AccountDetailsModal from "@/components/AccountDetailsModal";
import LookupListManager from "@/components/LookupListManager";
import { db } from "@/lib/firebase";
import { useBrands } from "@/lib/brands";
import { useProductTypes } from "@/lib/productTypes";
import { useAppSelector } from "@/store/hooks";

type Account = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  contactNumber?: string;
  role?: string;
  isApproved?: boolean;
  disabled?: boolean;
  deleted?: boolean;
  isOnline?: boolean;
};

export default function AdminAccountsPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const brands = useBrands();
  const productTypes = useProductTypes();

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
      const data = snapshot.val() as Record<string, Omit<Account, "id">> | null;
      const list = data
        ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
        : [];
      setAccounts(list);
    });
    return () => unsubscribe();
  }, [user]);

  const handleRecover = async (accountId: string) => {
    try {
      await update(ref(db, `users/${accountId}`), {
        disabled: false,
        deleted: false,
      });
      toast.success("Account recovered.");
    } catch (error) {
      console.warn(error);
      toast.error("Failed to recover account.");
    }
  };

  if (loading || !user || user.role !== "admin") {
    return <Loading />;
  }

  const activeAccounts = accounts.filter((a) => !a.disabled && !a.deleted);
  const inactiveAccounts = accounts.filter((a) => a.disabled || a.deleted);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 py-[3vh] bg-blue-100 flex flex-col gap-2 px-[3vh] overflow-auto text-black">
        <div className="flex w-full gap-4 h-full">
          <div className="bg-white w-full overflow-hidden border rounded-md border-blue-950 h-full">
            <div className="flex justify-center px-4 py-2 text-white text-center bg-blue-950 border-b">
              Accounts
            </div>
            {activeAccounts.length === 0 ? (
              <div className="text-xs text-gray-400 flex items-center justify-center py-8">
                No accounts yet.
              </div>
            ) : (
              activeAccounts.map((account) => (
                <div
                  key={account.id}
                  className="grid grid-cols-5 px-3 py-2 items-center font-normal text-sm"
                >
                  <div className="flex gap-2 items-center col-span-2">
                    {account.isOnline ? (
                      <div className="relative">
                        <div
                          aria-label="success"
                          className="status z-20 size-3 status-success"
                          title="Online"
                        ></div>
                        <div
                          aria-label="success"
                          className="status z-10 size-3 absolute left-0 bottom-0.75 animate-ping status-success"
                        ></div>
                      </div>
                    ) : (
                      <div
                        aria-label="error"
                        className="status size-3 status-error"
                        title="Offline"
                      ></div>
                    )}

                    <div className="">
                      {[account.firstName, account.lastName]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </div>
                  </div>

                  <div>{account.role || "—"}</div>
                  <div>{account.email || "—"}</div>

                  <div className="flex justify-end gap-2">
                    <div
                      onClick={() => setSelectedAccount(account)}
                      className="bg-blue-900 cursor-pointer items-center flex text-white px-2 py-1.5 rounded-sm"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="bg-white w-180 overflow-hidden border rounded-md border-blue-950 h-full">
            <div className="flex justify-center px-4 py-2 text-white text-center bg-blue-950 border-b">
              Disabled / Deleted Accounts
            </div>
            {inactiveAccounts.length === 0 ? (
              <div className="text-xs text-gray-400 flex items-center justify-center py-8">
                No disabled or deleted accounts.
              </div>
            ) : (
              inactiveAccounts.map((account) => (
                <div
                  key={account.id}
                  className="grid grid-cols-4 px-3 py-2 items-center font-normal text-sm"
                >
                  <div className="col-span-2">
                    {[account.firstName, account.lastName]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </div>
                  <div>
                    <div
                      className={`w-fit font-black uppercase text-[0.65rem] px-2 py-1 rounded-sm ${
                        account.deleted
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {account.deleted ? "Deleted" : "Disabled"}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div
                      onClick={() => handleRecover(account.id)}
                      className="bg-blue-900 cursor-pointer font-black text-white px-3 py-1.5 rounded-sm"
                    >
                      Recover
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex w-full gap-4">
          <div className="flex-1 h-full">
            <LookupListManager
              title="Brands"
              description="Manage the brand options vendors pick from when creating a product."
              dbPath="brands"
              items={brands}
              placeholder="New brand name"
              emptyLabel="No brands yet. Add one above."
            />
          </div>

          <div className="flex-1 h-full">
            <LookupListManager
              title="Product Types"
              description="Manage the product type options vendors pick from when creating a product."
              dbPath="productTypes"
              items={productTypes}
              placeholder="New product type name"
              emptyLabel="No product types yet. Add one above."
            />
          </div>
        </div>
      </main>
      {selectedAccount && (
        <AccountDetailsModal
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
        />
      )}
    </div>
  );
}
