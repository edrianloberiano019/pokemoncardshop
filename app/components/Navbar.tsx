"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { get, onValue, ref, update } from "firebase/database";
import { auth, db } from "../lib/firebase";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout, updateUser, type Business } from "../store/slices/authSlice";
import SellRegistration from "./SellRegistration";
import CartDrawer from "./CartDrawer";
import AdminProfileModal from "./AdminProfileModal";

const navLinks = [
  { label: "Home", href: "/dashboard" },
  { label: "Shop", href: "/shop" },
  // { label: "Deals", href: "/deals" },
  { label: "Orders", href: "/orders" },
  { label: "About us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const vendorNavLinks = [
  { label: "Dashboard", href: "/vendor/dashboard" },
  { label: "Products", href: "/vendor/products" },
  { label: "Orders", href: "/vendor/orders" },
  { label: "Sales", href: "/vendor/sales" },
];

const adminNavLinks = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Sales", href: "/admin/sales" },
  { label: "Product", href: "/admin/product" },
  { label: "Business", href: "/admin/business" },
  { label: "Accounts", href: "/admin/accounts" },
];

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
];

export default function Navbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showAdminProfile, setShowAdminProfile] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const menuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const isVendor = user?.role === "vendor";
  const isAdmin = user?.role === "admin";
  const links = isAdmin ? adminNavLinks : isVendor ? vendorNavLinks : navLinks;

  useEffect(() => {
    if (!user?.uid) return;
    const fetchProfile = async () => {
      const [snapshot, businessSnapshot] = await Promise.all([
        get(ref(db, `users/${user.uid}`)),
        get(ref(db, "business")),
      ]);
      const profile = snapshot.val();

      const businessData = businessSnapshot.val() as Record<
        string,
        Omit<Business, "id">
      > | null;
      const business = businessData
        ? (Object.entries(businessData)
            .map(([id, value]) => ({ id, ...value }))
            .find((b) => b.userId === user.uid) ?? null)
        : null;

      if (profile) {
        dispatch(
          updateUser({
            role: profile.role,
            business,
          }),
        );
      }
    };
    fetchProfile();
  }, [user?.uid, dispatch]);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onValue(
      ref(db, `carts/${user.uid}/items`),
      (snapshot) => {
        const data = snapshot.val() as Record<
          string,
          { quantity: number }
        > | null;

        const count = data
          ? Object.values(data).reduce((sum, item) => sum + item.quantity, 0)
          : 0;

        setCartCount(count);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const visibleCartCount = user ? cartCount : 0;

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => {
    if (!langMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        langMenuRef.current &&
        !langMenuRef.current.contains(e.target as Node)
      ) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [langMenuOpen]);

  const initial =
    user?.name?.trim()?.charAt(0).toUpperCase() ||
    user?.email?.charAt(0).toUpperCase() ||
    "U";

  const handleLogout = async () => {
    setMenuOpen(false);
    if (user) {
      await update(ref(db, `users/${user.uid}`), { isOnline: false });
    }
    await signOut(auth);
    dispatch(logout());
    router.push("/login");
  };

  const handleGoToHome = async () => {
    setMenuOpen(false);
    if (user) {
      await update(ref(db, `users/${user.uid}`), { role: "customer" });
      dispatch(updateUser({ role: "customer" }));
    }
    router.push("/dashboard");
  };

  const handleGoToShop = async () => {
    setMenuOpen(false);
    if (user) {
      await update(ref(db, `users/${user.uid}`), { role: "vendor" });
      dispatch(updateUser({ role: "vendor" }));
    }
    router.push("/vendor/dashboard");
  };

  return (
    <div className="flex flex-col">
      {showSellModal && (
        <SellRegistration onClose={() => setShowSellModal(false)} />
      )}
      {showAdminProfile && (
        <AdminProfileModal onClose={() => setShowAdminProfile(false)} />
      )}
      <CartDrawer open={showCart} onClose={() => setShowCart(false)} />
      <div className="grid grid-cols-3 bg-blue-950 text-black px-[6vh] py-[2vh]">
        <Link
          href="/dashboard"
          className="text-white -top-0.5 left-2 sm:left-6 absolute text-2xl"
        ></Link>
        <div></div>

        <div className="flex gap-8 w-full justify-center items-center rounded-sm">
          {user &&
            links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white font-black text-sm transition-colors"
              >
                {link.label}
              </Link>
            ))}
        </div>

        <div className="gap-4 hidden md:flex justify-end items-center">
          <div className="relative" ref={langMenuRef}>
            <div
              onClick={() => setLangMenuOpen((v) => !v)}
              className="text-2xl cursor-pointer select-none leading-none"
              aria-label="Select language"
            >
              {language.flag}
            </div>
            {langMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-0 mt-2 w-40 bg-white border border-black/10 rounded-md shadow-lg z-50 overflow-hidden"
              >
                {LANGUAGES.map((lang) => (
                  <div
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang);
                      setLangMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-black/5 ${
                      language.code === lang.code
                        ? "font-semibold text-blue-950"
                        : "text-black"
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span>{lang.label}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
          {!isAdmin && !isVendor && (
            <>
              <div className="flex items-center cursor-pointer font-semibold text-xs gap-1 text-white">
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
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                  />
                </svg>
                <div className="text-shadow-sm text-shadow-black/5">
                  Wishlist
                </div>
              </div>

              <div
                onClick={() => setShowCart(true)}
                className="flex items-center cursor-pointer font-semibold text-xs gap-1 text-white"
              >
                <div className="relative">
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
                      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                    />
                  </svg>
                  {visibleCartCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[0.6rem] font-bold rounded-full size-4 flex items-center justify-center">
                      {visibleCartCount > 99 ? "99+" : visibleCartCount}
                    </div>
                  )}
                </div>
                <div className="text-shadow-sm text-shadow-black/5">Cart</div>
              </div>
            </>
          )}

          {loading ? (
            <div className="size-8 rounded-full bg-black/10 animate-pulse" />
          ) : user ? (
            <div className="relative " ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="size-8 rounded-full bg-white text-black flex items-center justify-center text-sm font-semibold hover:opacity-90"
                aria-label="Account menu"
              >
                {initial}
              </button>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-56 bg-white border border-black/10 rounded-md shadow-lg z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-black/10">
                    <div className="font-medium truncate">
                      {user.name || "Account"}
                    </div>
                    <div className="text-xs text-slate-600 truncate">
                      {user.email}
                    </div>
                  </div>
                  {isVendor ? (
                    <div
                      onClick={handleGoToHome}
                      className="block px-4 py-2 text-sm hover:bg-black/5 cursor-pointer"
                    >
                      Go to Home
                    </div>
                  ) : isAdmin ? null : (
                    <div
                      onClick={() => {
                        if (user.business) {
                          handleGoToShop();
                        } else {
                          setMenuOpen(false);
                          setShowSellModal(true);
                        }
                      }}
                      className="block px-4 py-2 text-sm hover:bg-black/5 cursor-pointer"
                    >
                      {user.business ? "Go to Shop" : "Sell your card"}
                    </div>
                  )}
                  {isAdmin ? (
                    <div
                      onClick={() => {
                        setMenuOpen(false);
                        setShowAdminProfile(true);
                      }}
                      className="block px-4 py-2 text-sm hover:bg-black/5 cursor-pointer"
                    >
                      Profile
                    </div>
                  ) : (
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-black/5"
                    >
                      Profile
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-black/5"
                  >
                    Sign out
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              aria-label="Log in"
              className="flex items-center cursor-pointer font-semibold text-xs gap-1 text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-4.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
              <div className="text-shadow-sm text-shadow-black/5">Account</div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
