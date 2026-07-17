"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackgroundImage from "../../../public/images/kosmosbackground.jpg";

export default function Page() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/vendor/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, businessName }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error || "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setSubmitted(true);
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
            <div className=" text-4xl">Apply as a vendor</div>
            <div className="text-sm font-extralight text-slate-600">
              Tell us about your business. An admin will review your application.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="gap-4 flex flex-col">
              <div className="flex gap-1 flex-col">
                <div className="font-sm">Your name</div>
                <div className="flex gap-2 border border-gray-400 px-4 rounded-md py-2">
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
                <div className="font-sm">Business name</div>
                <div className="flex gap-2 border border-gray-400 px-4 rounded-md py-2">
                  <input
                    className="outline-none w-full font-medium"
                    type="text"
                    placeholder="e.g. Acme Goods Co."
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-1 flex-col">
                <div className="font-sm">Email Address</div>
                <div className="flex gap-2 border border-gray-400 px-4 rounded-md py-2">
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
                  {loading ? "Submitting..." : "Submit application"}
                </button>

                <div className="text-sm text-center mt-3 text-slate-600">
                  Just shopping?{" "}
                  <Link href="/register" className="underline text-black">
                    Create a customer account
                  </Link>
                </div>
                <div className="text-sm text-center text-slate-600">
                  Already have an account?{" "}
                  <Link href="/login" className="underline text-black">
                    Log in
                  </Link>
                </div>
              </div>
            </form>
        </div>
      </div>

      {submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-md max-w-md w-full mx-4 p-6 text-black shadow-xl">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="size-12 rounded-full bg-black/5 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-7"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
              <div className="text-xl font-semibold">
                We&apos;re verifying your account
              </div>
              <div className="text-sm text-slate-600">
                Thanks for applying! An admin is reviewing your vendor
                application. You&apos;ll be able to log in to your vendor
                account once it&apos;s approved.
              </div>
              <button
                type="button"
                onClick={() => {
                  router.push("/login");
                  router.refresh();
                }}
                className="bg-black text-white py-2 rounded-md w-full mt-2"
              >
                Back to login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
