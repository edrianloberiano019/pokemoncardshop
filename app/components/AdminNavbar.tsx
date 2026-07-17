"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const adminLinks = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Users", href: "/admin/users" },
  { label: "Accounts", href: "/admin/accounts" },
  { label: "Configuration", href: "/admin/configuration" },
];

export default function AdminNavbar() {
  const pathname = usePathname();

  return (
    <div className="justify-between flex text-white bg-black px-[6vh] w-full py-[2vh]">
      <Link href="/admin/dashboard" className="text-white text-2xl flex items-center gap-2">
        KOSMOS
        <span className="text-xs bg-white text-black px-2 py-0.5 rounded-full font-medium">
          ADMIN
        </span>
      </Link>
      <div className="flex gap-8 font-medium items-center">
        {adminLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                active
                  ? "text-white border-b-2 border-white pb-0.5"
                  : "text-white/60 hover:text-white transition-colors"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </div>
      <div className="flex gap-4 items-center">
        <Link
          href="/dashboard"
          className="text-sm text-white/70 hover:text-white transition-colors"
        >
          Exit admin
        </Link>
        <Link href="/login">
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
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
