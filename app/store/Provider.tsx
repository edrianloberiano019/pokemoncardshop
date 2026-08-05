"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "./index";
import AuthListener from "./AuthListener";
import AdminRouteGuard from "./AdminRouteGuard";

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      <AuthListener />
      <AdminRouteGuard />
      {children}
    </Provider>
  );
}
