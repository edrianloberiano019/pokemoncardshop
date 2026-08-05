import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "@/lib/firebase";

export type ProductType = {
  id: string;
  name: string;
};

export function useProductTypes() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);

  useEffect(() => {
    const unsubscribe = onValue(ref(db, "productTypes"), (snapshot) => {
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

      setProductTypes(list);
    });

    return () => unsubscribe();
  }, []);

  return productTypes;
}
