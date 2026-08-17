"use client";

import { useEffect, useRef } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { get, ref, serverTimestamp, set, update } from "firebase/database";
import { auth, db } from "../lib/firebase";
import { syncSessionCookie } from "../lib/session";
import { useAppDispatch, useAppSelector } from "./hooks";
import { login, logout, type Business } from "./slices/authSlice";
import { clearCart, selectCartItems, type CartItem } from "./slices/cartSlice";

async function mergeGuestCartIntoFirebase(uid: string, items: CartItem[]) {
  await Promise.all(
    items.map(async (item) => {
      const itemRef = ref(db, `carts/${uid}/items/${item.id}`);
      const snapshot = await get(itemRef);
      const existing = snapshot.val() as {
        quantity?: number;
        addedAt?: number;
      } | null;

      await set(itemRef, {
        productId: item.id,
        vendorId: item.vendorId ?? null,
        name: item.name,
        imageUrl: item.image ?? null,
        quantity: (existing?.quantity ?? 0) + item.quantity,
        priceAtAdd: item.price,
        addedAt: existing?.addedAt ?? serverTimestamp(),
      });
    }),
  );

  await update(ref(db, `carts/${uid}`), { updatedAt: serverTimestamp() });
}

export default function AuthListener() {
  const dispatch = useAppDispatch();
  const guestItems = useAppSelector(selectCartItems);
  const guestItemsRef = useRef<CartItem[]>(guestItems);

  useEffect(() => {
    guestItemsRef.current = guestItems;
  }, [guestItems]);

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

        const pendingGuestItems = guestItemsRef.current;
        if (pendingGuestItems.length > 0) {
          try {
            await mergeGuestCartIntoFirebase(user.uid, pendingGuestItems);
            dispatch(clearCart());
          } catch (error) {
            console.error("Failed to merge guest cart:", error);
          }
        }
      } else {
        await syncSessionCookie(null);
        dispatch(logout());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return null;
}
