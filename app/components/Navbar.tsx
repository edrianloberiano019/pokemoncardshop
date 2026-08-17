"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { get, onValue, ref, update } from "firebase/database";
import { auth, db } from "../lib/firebase";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout, updateUser, type Business } from "../store/slices/authSlice";
import { selectCartCount as selectGuestCartCount } from "../store/slices/cartSlice";
import CartDrawer from "./CartDrawer";
import AdminProfileModal from "./AdminProfileModal";

const navLinks = [
  { label: "Home", href: "/dashboard" },
  { label: "Shop", href: "/shop" },
  // { label: "Deals", href: "/deals" },
  { label: "Orders", href: "/orders" },
];

const navIcons: Record<string, ReactNode> = {
  Home: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="size-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  ),
  Shop: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="size-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.67 0-1.189-.578-1.119-1.243l1.263-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.06.435 1.119 1.007Z"
      />
    </svg>
  ),
  Orders: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="size-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
      />
    </svg>
  ),
};

const vendorNavLinks = [
  { label: "Dashboard", href: "/vendor/dashboard" },
  { label: "Products", href: "/vendor/products" },
  { label: "Orders", href: "/vendor/orders" },
  { label: "Sales", href: "/vendor/sales" },
];

const adminNavLinks = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Sales", href: "/admin/sales" },
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Configuration", href: "/admin/accounts" },
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
  const guestCartCount = useAppSelector(selectGuestCartCount);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAdminProfile, setShowAdminProfile] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const visibleCartCount = user ? cartCount : guestCartCount;

  useEffect(() => {
    if (!user?.uid) {
      setOrderCount(0);
      return;
    }

    const unsubscribe = onValue(ref(db, "orders"), (snapshot) => {
      const data = snapshot.val() as Record<string, { userId: string }> | null;

      const count = data
        ? isAdmin
          ? Object.keys(data).length
          : Object.values(data).filter((order) => order.userId === user.uid)
              .length
        : 0;

      setOrderCount(count);
    });

    return () => unsubscribe();
  }, [user?.uid, isAdmin]);

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

  return (
    <div className="flex flex-col">
      {showAdminProfile && (
        <AdminProfileModal onClose={() => setShowAdminProfile(false)} />
      )}
      <CartDrawer open={showCart} onClose={() => setShowCart(false)} />

      <div className="md:hidden relative flex items-center justify-center bg-blue-950 text-white px-4 py-3">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="absolute left-4 p-1 cursor-pointer"
          aria-label="Open menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
            />
          </svg>
        </button>
        <div className="text-lg uppercase font-semibold">CARD DISTRICt</div>
      </div>

      <div className="hidden md:grid grid-cols-2 bg-blue-950 text-black px-[6vh] py-[2vh]">
        <div className="flex">
          <div className="text-2xl uppercase cursor-pointer text-white">
            CARD DISTRICt
          </div>
        </div>

        <div className="gap-5 flex justify-end items-center">
          {user && (
            <div className="flex gap-5 items-center">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1.5 text-white font-black text-sm transition-colors"
                >
                  <span className="relative flex items-center">
                    {navIcons[link.label]}
                    {link.label === "Orders" && orderCount > 0 && (
                      <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[0.6rem] font-bold rounded-full size-4 flex items-center justify-center">
                        {orderCount > 99 ? "99+" : orderCount}
                      </div>
                    )}
                  </span>
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {!isAdmin && !isVendor && (
            <>
              {/* <div className="flex items-center cursor-pointer font-semibold text-xs gap-1 text-white">
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
              </div> */}

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
                className="absolute -left-16 mt-3 w-40 bg-white border border-black/10 rounded-md shadow-lg z-50 overflow-hidden"
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
                  {isVendor && (
                    <div
                      onClick={handleGoToHome}
                      className="block px-4 py-2 text-sm hover:bg-black/5 cursor-pointer"
                    >
                      Go to Home
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

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed backdrop-blur-xs bg-black/40 z-100 w-full h-full top-0 left-0 md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 left-0 z-101 h-full w-full max-w-xs bg-white shadow-2xl shadow-black/40 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-blue-950 text-white">
                <div className="font-black uppercase">Menu</div>
                <div
                  onClick={() => setMobileMenuOpen(false)}
                  className="cursor-pointer hover:scale-110 hover:bg-red-700 transition-all bg-red-600 p-1 rounded-full"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-4 text-white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 flex flex-col gap-1">
                {user &&
                  links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-2 py-3 rounded-sm text-blue-950 font-semibold text-sm hover:bg-blue-50"
                    >
                      <span className="relative flex items-center">
                        {navIcons[link.label]}
                        {link.label === "Orders" && orderCount > 0 && (
                          <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[0.6rem] font-bold rounded-full size-4 flex items-center justify-center">
                            {orderCount > 99 ? "99+" : orderCount}
                          </div>
                        )}
                      </span>
                      {link.label}
                    </Link>
                  ))}

                {!isAdmin && !isVendor && (
                  <div
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowCart(true);
                    }}
                    className="flex items-center gap-3 px-2 py-3 rounded-sm text-blue-950 font-semibold text-sm hover:bg-blue-50 cursor-pointer"
                  >
                    <span className="relative flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-4"
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
                    </span>
                    Cart
                  </div>
                )}

                <div className="border-t border-blue-900/10 mt-2 pt-2">
                  <div className="px-2 text-xs font-semibold text-blue-900/50 uppercase mb-1">
                    Language
                  </div>
                  {LANGUAGES.map((lang) => (
                    <div
                      key={lang.code}
                      onClick={() => setLanguage(lang)}
                      className={`flex items-center gap-2 px-2 py-2 rounded-sm text-sm cursor-pointer hover:bg-blue-50 ${
                        language.code === lang.code
                          ? "font-semibold text-blue-950"
                          : "text-blue-900/70"
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-blue-900/10 mt-2 pt-2">
                  {loading ? null : user ? (
                    <>
                      <div className="px-2 py-2">
                        <div className="font-medium text-blue-950 truncate">
                          {user.name || "Account"}
                        </div>
                        <div className="text-xs text-blue-900/50 truncate">
                          {user.email}
                        </div>
                      </div>
                      {isVendor && (
                        <div
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleGoToHome();
                          }}
                          className="px-2 py-2 text-sm text-blue-950 hover:bg-blue-50 cursor-pointer rounded-sm"
                        >
                          Go to Home
                        </div>
                      )}
                      {isAdmin ? (
                        <div
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setShowAdminProfile(true);
                          }}
                          className="px-2 py-2 text-sm text-blue-950 hover:bg-blue-50 cursor-pointer rounded-sm"
                        >
                          Profile
                        </div>
                      ) : (
                        <Link
                          href="/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-2 py-2 text-sm text-blue-950 hover:bg-blue-50 rounded-sm"
                        >
                          Profile
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-2 py-2 text-sm text-blue-950 hover:bg-blue-50 rounded-sm"
                      >
                        Sign out
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-2 py-2 text-sm text-blue-950 hover:bg-blue-50 rounded-sm"
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
                      Account
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
