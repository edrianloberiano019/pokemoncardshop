"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import BackgroundImage from "../../public/images/kosmosbackground.jpg";

export default function Page() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error || "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.error) {
      setError("Account created, but auto sign-in failed. Try logging in.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="h-screen flex w-full">
      <div className="w-full bg-black relative">
        <Image
          src={BackgroundImage}
          alt="Background"
          fill
          priority
          placeholder="blur"
          className="object-cover"
          sizes="50vw"
        />
        <div className="absolute justify-between flex flex-col text-black p-10 top-0 left-0 w-full h-full">
          <div className="font-semibold text-4xl text-shadow-sm text-shadow-white">
            KOSMOS
          </div>
        </div>
      </div>

      <div className="w-full flex text-black items-center justify-center ">
        <div className="max-w-[50%] flex flex-col gap-4 w-full">
          <div className="flex font-semibold flex-col">
            <div className=" text-4xl">Create account</div>
            <div className="text-sm font-extralight text-slate-600">
              Join KOSMOS — it only takes a moment.
            </div>
          </div>
          <form onSubmit={handleSubmit} className="gap-4 flex flex-col">
            <div className="flex gap-1 flex-col">
              <div className="font-sm">Name</div>
              <div className="flex gap-2 border border-gray-400 px-4 rounded-md py-2">
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
                <input
                  className="outline-none w-full font-medium"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-1 flex-col">
              <div className="font-sm">Email Address</div>
              <div className="flex gap-2 border border-gray-400 px-4 rounded-md py-2">
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
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
                <input
                  className="outline-none w-full font-medium"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex gap-1 flex-col">
              <div className="font-sm">Password</div>
              <div className="flex gap-2 border border-gray-400 px-4 rounded-md py-2">
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
                    d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
                  />
                </svg>
                <input
                  className="outline-none font-medium w-full"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 mt-2">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white py-2 rounded-md w-full mt-3 disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>

              <div className="text-sm text-center mt-3 text-slate-600">
                Already have an account?{" "}
                <Link href="/login" className="underline text-black">
                  Log in
                </Link>
              </div>
              <div className="text-sm text-center text-slate-600">
                Want to sell on KOSMOS?{" "}
                <Link href="/vendor/apply" className="underline text-black">
                  Apply as a vendor
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
