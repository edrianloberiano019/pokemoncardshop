"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import BackgroundImage from "../../public/images/loginBackground.png";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    router.push("/dashboard");
    // setError(null);
    // setLoading(true);

    // const res = await signIn("credentials", {
    //   email,
    //   password,
    //   redirect: false,
    // });

    // setLoading(false);

    // if (res?.error) {
    //   setError("Invalid email or password.");
    //   return;
    // }

    // const session = await getSession();
    // const role = session?.user?.role;

    // if (role === "ADMIN" || role === "SUPERADMIN") {
    //   router.push("/admin/dashboard");
    // } else if (role === "VENDOR") {
    //   router.push("/vendor/dashboard");
    // } else {
    //   router.push("/dashboard");
    // }
    // router.refresh();
  };

  return (
    <div className="h-full flex w-full items-center justify-center">
      <Image
        src={BackgroundImage}
        alt="Background"
        fill
        priority
        placeholder="blur"
        className="object-cover z-10"
        sizes="50vw"
      />

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ stiffness: 200, type: "spring" }}
        className="absolute z-20 w-120"
      >
        <DotLottieReact
          className="absolute flex -top-32.5 ml-20 w-80 z-10"
          src="assets/animation/LoginPikachu.json"
          loop
          autoplay
        />
        <div className=" flex flex-col shadow-xl shadow-black/40 bg-white px-14 py-14 rounded-md gap-4 w-full z-20">
          <div className="flex font-semibold justify-center w-full text-center items-center flex-col">
            <div className=" text-4xl uppercase">Login</div>
            <div className="text-sm font-extralight text-slate-600">
              Welcome to KOSMOS! Please enter your details.
            </div>
          </div>
          <form onSubmit={handleSubmit} className="gap-4 flex flex-col">
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
                  // required
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
                  className="outline-none font-medium  w-full"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  // required
                />
              </div>
              <div className="flex w-full mb-2 items-end justify-end">
                <div className="text-xs underline cursor-pointer">
                  Forgot Password?
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 mb-2">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="bg-[#99AD7A] text-white cursor-pointer py-2 rounded-md w-full disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Login"}
              </button>

              <div className="text-sm text-center mt-3 text-slate-600">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="underline text-black">
                  Sign up
                </Link>
              </div>
              {/* <div className="text-sm text-center text-slate-600">
                Want to sell on KOSMOS?{" "}
                <Link href="/vendor/apply" className="underline text-black">
                  Apply as a vendor
                </Link>
              </div> */}
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
