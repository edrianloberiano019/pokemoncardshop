import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "@/lib/firebase";

export type Brand = {
  id: string;
  name: string;
};

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    const unsubscribe = onValue(ref(db, "brands"), (snapshot) => {
      const data = snapshot.val() as Record<
        string,
        string | { name: string }
      > | null;

      const list = data
        ? Object.entries(data).map(([id, value]) => ({
            id,
            name: typeof value === "string" ? value : value.name,
          }))
        : [];

      setBrands(list);
    });

    return () => unsubscribe();
  }, []);

  return brands;
}
