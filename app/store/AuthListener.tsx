"use client";

import { useEffect } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { get, ref } from "firebase/database";
import { auth, db } from "../lib/firebase";
import { syncSessionCookie } from "../lib/session";
import { useAppDispatch } from "./hooks";
import { login, logout, type Business } from "./slices/authSlice";

export default function AuthListener() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        await syncSessionCookie(idToken);

        const [profileSnapshot, businessSnapshot] = await Promise.all([
          get(ref(db, `users/${user.uid}`)),
          get(ref(db, "business")),
        ]);
        const profile = profileSnapshot.val();

        const businessData = businessSnapshot.val() as Record<
          string,
          Omit<Business, "id">
        > | null;
        const business = businessData
          ? (Object.entries(businessData)
              .map(([id, value]) => ({ id, ...value }))
              .find((b) => b.userId === user.uid) ?? null)
          : null;

        dispatch(
          login({
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            role: profile?.role,
            business,
            isOnline: profile?.isOnline,
          }),
        );
      } else {
        await syncSessionCookie(null);
        dispatch(logout());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return null;
}
