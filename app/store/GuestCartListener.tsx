"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "./hooks";
import { hydrate, selectCartItems, type CartItem } from "./slices/cartSlice";

const STORAGE_KEY = "guestCart";

export default function GuestCartListener() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch(hydrate(parsed));
        }
      }
    } catch {
      // ignore malformed storage
    } finally {
      hydrated.current = true;
    }
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  return null;
}
