"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackgroundImage from "../../public/images/loginBackground.png";
import { AnimatePresence, motion } from "framer-motion";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { syncSessionCookie } from "@/lib/session";
import { ref, get, set, update } from "firebase/database";
import PrismaticBurst from "@/components/PrismaticBurst";
import Grainient from "@/components/Grainient";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { toast } from "react-toastify";
import { useAppDispatch } from "@/store/hooks";
import { updateUser } from "@/store/slices/authSlice";

const PRISMATIC_BURST_COLORS = ["#172554", "#273f91", "#597cf0"];
const PRISMATIC_BURST_OFFSET = { x: 0, y: 0 };

type RegisterUserParams = {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  password: string;
};

export const loginUser = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    return {
      success: true,
      user,
    };
  } catch (error: any) {
    console.warn(error);
    return {
      success: false,
      message: error.message,
    };
  }
};

export const registerUser = async ({
  firstName,
  lastName,
  email,
  contactNumber,
  password,
}: RegisterUserParams) => {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    const user = credential.user;

    await set(ref(db, `users/${user.uid}`), {
      uid: user.uid,
      firstName,
      lastName,
      email,
      contactNumber,
      role: "customer",
      isApproved: false,
      isDisabled: false,
      isOnline: false,
      createdAt: Date.now(),
    });

    return {
      success: true,
      user,
    };
  } catch (error: any) {
    console.warn(error);
    return {
      success: false,
      message: error.message,
    };
  }
};

export default function Page() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegistrating, setIsRegistrating] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedContactNumber = contactNumber.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      const message = "Please enter your first and last name.";
      setError(message);
      toast.error(message);
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      const message = "Please enter a valid email address.";
      setError(message);
      toast.error(message);
      return;
    }

    if (!trimmedContactNumber) {
      const message = "Please enter a contact number.";
      setError(message);
      toast.error(message);
      return;
    }

    if (trimmedPassword.length < 6) {
      const message = "Password must be at least 6 characters long.";
      setError(message);
      toast.error(message);
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      const message = "Passwords do not match.";
      setError(message);
      toast.error(message);
      return;
    }

    setError(null);
    setLoading(true);

    const result = await registerUser({
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      email: trimmedEmail,
      contactNumber: trimmedContactNumber,
      password: trimmedPassword,
    });

    setLoading(false);

    if (result.success) {
      toast.success("Account created successfully!");
      setFirstName("");
      setLastName("");
      setEmail("");
      setContactNumber("");
      setPassword("");
      setConfirmPassword("");
    } else {
      toast.error("Username or password are incorrect.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      const message = "Please enter your email address.";
      setError(message);
      toast.error(message);
      return;
    }

    if (!trimmedPassword) {
      const message = "Please enter your password.";
      setError(message);
      toast.error(message);
      return;
    }

    setError(null);
    setLoading(true);

    const result = await loginUser({
      email: trimmedEmail,
      password: trimmedPassword,
    });

    setLoading(false);

    if (result.success && result.user) {
      const idToken = await result.user.getIdToken();
      await syncSessionCookie(idToken);

      const snapshot = await get(ref(db, `users/${result.user.uid}`));
      const profile = snapshot.val();
      if (
        profile?.role !== "vendor" &&
        profile?.role !== "customer" &&
        profile?.role !== "admin"
      ) {
        toast.error("This user is not authorized on this website.");
        return;
      }
      if (profile?.isDisabled === true) {
        await signOut(auth);
        await syncSessionCookie(null);
        toast.error(
          "Your account is rejected. Please contact support for assistance.",
        );
        return;
      }
      if (profile?.isApproved === false) {
        await signOut(auth);
        await syncSessionCookie(null);
        toast.info(
          "Your account is in verification. Please wait for approval.",
        );
        return;
      }
      if (profile?.disabled) {
        await signOut(auth);
        await syncSessionCookie(null);
        toast.error("This account has been disabled.");
        return;
      }

      await update(ref(db, `users/${result.user.uid}`), { isOnline: true });
      dispatch(updateUser({ isOnline: true }));

      if (profile?.role === "admin") {
        router.push("/admin/dashboard");
      } else if (profile?.role === "vendor") {
        router.push("/vendor/dashboard");
      } else {
        router.push("/dashboard");
      }
      setEmail("");
      setPassword("");
    } else {
      toast.error("Incorrect username or password.");
    }
  };

  return (
    <div className="h-full bg-black flex w-full items-center justify-center">
      <div className="h-full w-full">
        <Grainient
          color1="#4863be"
          color2="#172554"
          color3="#4973ff"
          timeSpeed={1.5}
          colorBalance={0}
          warpStrength={1}
          warpFrequency={5}
          warpSpeed={2}
          warpAmplitude={50}
          blendAngle={0}
          blendSoftness={0.05}
          rotationAmount={500}
          noiseScale={2}
          grainAmount={0.1}
          grainScale={2}
          grainAnimated={false}
          contrast={1.5}
          gamma={1}
          saturation={1}
          centerX={0}
          centerY={0}
          zoom={0.9}
        />
      </div>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          layout
          className=" flex absolute z-20 w-80 md:w-120 flex-col shadow-xl shadow-black/40 bg-white px-8 md:px-14 py-10 md:py-14 rounded-md gap-4"
        >
          {isRegistrating ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className=" text-4xl w-full text-blue-950 font-black text-center mb-4 uppercase">
                Sign up
              </div>

              <form
                onSubmit={handleRegister}
                className="gap-2 flex text-sm flex-col"
              >
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex gap-1 flex-col">
                    <div className="font-sm">First Name</div>
                    <div className="flex gap-2 border border-gray-400 px-3 rounded-sm py-1">
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
                        className="outline-none text-xs w-full font-medium"
                        type="text"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-1 flex-col">
                    <div className="font-sm">Last Name</div>
                    <div className="flex gap-2 border border-gray-400 px-3 rounded-sm py-1">
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
                        className="outline-none text-xs w-full font-medium"
                        type="text"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-1 flex-col">
                  <div className="font-sm">Email Address</div>
                  <div className="flex gap-2 border border-gray-400 px-3 rounded-sm py-1">
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
                      className="outline-none text-xs w-full font-medium"
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-1 flex-col">
                  <div className="font-sm">Contact Number</div>
                  <div className="flex gap-2 border border-gray-400 px-3 rounded-sm py-1">
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
                        d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                      />
                    </svg>

                    <input
                      className="outline-none text-xs w-full font-medium"
                      type="tel"
                      placeholder="Contact number"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-1 flex-col">
                  <div className="font-sm">Password</div>
                  <div className="flex gap-2 border border-gray-400 px-3 rounded-sm py-1">
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
                      className="outline-none text-xs w-full font-medium"
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-1 flex-col">
                  <div className="font-sm">Confirm Password</div>
                  <div className="flex gap-2 border border-gray-400 px-3 rounded-sm py-1">
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
                      className="outline-none text-xs w-full font-medium"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-950 mt-2 text-white cursor-pointer py-2 rounded-sm w-full disabled:opacity-60"
                  >
                    {loading ? "Signing up..." : "Sign up"}
                  </button>
                </div>
              </form>
              <div className="text-xs flex justify-center gap-1 md:text-sm text-center mt-3 text-slate-600">
                Already have an account?
                <div
                  onClick={() => setIsRegistrating(false)}
                  className="underline text-black cursor-pointer"
                >
                  Sign in
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <div className=" text-4xl uppercase font-black text-center text-blue-950 mb-4">
                Login
              </div>
              <form
                onSubmit={handleLogin}
                className="gap-4 mt-2 text-sm flex flex-col"
              >
                <div className="flex gap-1 flex-col">
                  <div className="font-sm">Email Address</div>
                  <div className="flex gap-2 border border-gray-400 px-3 rounded-sm py-2">
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
                        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                      />
                    </svg>

                    <input
                      className="outline-none text-xs w-full font-medium"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-1 flex-col">
                  <div className="w-full">
                    <div className="font-sm">Password</div>
                    <div className="flex gap-2">
                      <div className="flex w-full gap-2 border border-gray-400 px-3 rounded-sm py-2">
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
                            d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
                          />
                        </svg>

                        <input
                          className="outline-none text-xs font-medium  w-full"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="border border-gray-400 rounded-sm px-3 items-center flex cursor-pointer"
                      >
                        {showPassword ? (
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
                              d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                            />
                          </svg>
                        ) : (
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
                              d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full mt-2 mb-2 items-end justify-end">
                    <div className="text-[0.5rem] md:text-xs underline cursor-pointer">
                      Forgot Password?
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-950 text-white cursor-pointer py-2 rounded-sm w-full disabled:opacity-60"
                  >
                    {loading ? "Signing in..." : "Login"}
                  </button>
                </div>
              </form>
              <div
                onClick={() => setIsRegistrating(true)}
                className="text-xs flex justify-center gap-1 md:text-sm text-center mt-3 text-slate-600"
              >
                Don&apos;t have an account?{" "}
                <div className="underline text-black cursor-pointer">
                  Sign up
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
