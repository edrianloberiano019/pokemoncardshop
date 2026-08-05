"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onValue, ref } from "firebase/database";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import BusinessDetailsModal, {
  type BusinessSummary,
} from "@/components/BusinessDetailsModal";
import { db } from "@/lib/firebase";
import { useAppSelector } from "@/store/hooks";

interface Business {
  id: string;
  userId: string;
  businessName: string;
  businessDescription?: string;
  businessAddress?: string;
}

interface OwnerInfo {
  name?: string;
  email?: string;
}

export default function AdminBusinessPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [owners, setOwners] = useState<Record<string, OwnerInfo>>({});
  const [productCounts, setProductCounts] = useState<Record<string, number>>(
    {},
  );
  const [selectedBusiness, setSelectedBusiness] =
    useState<BusinessSummary | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onValue(ref(db, "business"), (snapshot) => {
      const data = snapshot.val() as Record<
        string,
        Omit<Business, "id">
      > | null;

      const list = data
        ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
        : [];

      setBusinesses(list);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onValue(ref(db, "users"), (snapshot) => {
      const data = snapshot.val() as Record<
        string,
        { firstName?: string; lastName?: string; email?: string }
      > | null;

      const lookup: Record<string, OwnerInfo> = {};
      if (data) {
        for (const [uid, profile] of Object.entries(data)) {
          lookup[uid] = {
            name: [profile.firstName, profile.lastName]
              .filter(Boolean)
              .join(" "),
            email: profile.email,
          };
        }
      }
      setOwners(lookup);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onValue(ref(db, "products"), (snapshot) => {
      const data = snapshot.val() as Record<
        string,
        { vendorId: string }
      > | null;

      const counts: Record<string, number> = {};
      if (data) {
        for (const product of Object.values(data)) {
          counts[product.vendorId] = (counts[product.vendorId] ?? 0) + 1;
        }
      }
      setProductCounts(counts);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    } else if (user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "admin") {
    return <Loading />;
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 py-[3vh] bg-blue-100 flex flex-col gap-2 px-[4vh] overflow-auto text-black">
        <div className="border bg-white h-full border-blue-900 overflow-hidden rounded-md flex flex-col">
          <div className="overflow-auto w-full">
            <div className="text-xs grid grid-cols-5 px-4 w-full items-center uppercase bg-blue-950 text-white">
              <div className="text-left font-medium py-3 px-2 col-span-2">
                Business
              </div>
              <div className="text-left font-medium py-2 px-2">Owner</div>
              <div className="text-left font-medium py-2 px-2">Products</div>
              <div className="text-right font-medium py-2 px-2">Actions</div>
            </div>

            {businesses.length === 0 ? (
              <div className="text-center text-xs text-blue-900/50 py-6">
                No businesses registered yet.
              </div>
            ) : (
              businesses.map((business) => {
                const owner = owners[business.userId];
                return (
                  <div
                    key={business.id}
                    className="text-sm text-blue-950 px-4 grid grid-cols-5 items-center "
                  >
                    <div className="py-2 px-2 col-span-2">
                      <div className="font-medium truncate">
                        {business.businessName}
                      </div>
                      <div className="text-xs text-blue-900/60 truncate">
                        {business.businessAddress}
                      </div>
                    </div>
                    <div className="py-2 px-2 truncate">
                      {owner?.name || business.userId}
                    </div>
                    <div className="py-2 px-2">
                      {productCounts[business.userId] ?? 0}
                    </div>
                    <div className="py-2 px-2 flex justify-end">
                      <div
                        onClick={() =>
                          setSelectedBusiness({
                            id: business.id,
                            userId: business.userId,
                            businessName: business.businessName,
                            businessDescription: business.businessDescription,
                            businessAddress: business.businessAddress,
                            ownerName: owner?.name,
                            ownerEmail: owner?.email,
                          })
                        }
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
                );
              })
            )}
          </div>
        </div>
      </main>
      {selectedBusiness && (
        <BusinessDetailsModal
          business={selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
        />
      )}
    </div>
  );
}
