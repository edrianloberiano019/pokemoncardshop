"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "./hooks";

export default function AdminRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);

  useEffect(() => {
    if (loading) return;
    if (user?.role === "admin" && !pathname.startsWith("/admin")) {
      router.replace("/admin/dashboard");
    }
  }, [loading, user, pathname, router]);

  return null;
}
