"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { get, ref, update } from "firebase/database";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { toast } from "react-toastify";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import AddressMap, {
  type ReverseGeocodedAddress,
} from "@/components/AddressMap";
import { auth, db } from "@/lib/firebase";
import { useAppSelector } from "@/store/hooks";

const fieldClass =
  "w-full border border-blue-900 rounded-sm px-3 py-2 text-sm bg-white text-blue-950 placeholder:text-blue-900/40 focus:outline-none focus:ring-1 focus:ring-blue-900";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-blue-950 mb-1">
      {children}
    </label>
  );
}

interface UserProfile {
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
  address?: {
    street?: string;
    landmark?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    lat?: number;
    lng?: number;
  };
}

const TABS = [
  { id: "info", label: "User Information" },
  { id: "security", label: "Security" },
  { id: "address", label: "Address" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ProfilePage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);
  const [activeTab, setActiveTab] = useState<TabId>("info");
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;

    const loadProfile = async () => {
      const snapshot = await get(ref(db, `users/${uid}`));
      const data = snapshot.val() as UserProfile | null;

      setFirstName(data?.firstName ?? "");
      setLastName(data?.lastName ?? "");
      setContactNumber(data?.contactNumber ?? "");
      setStreet(data?.address?.street ?? "");
      setLandmark(data?.address?.landmark ?? "");
      setCity(data?.address?.city ?? "");
      setStateName(data?.address?.state ?? "");
      setZip(data?.address?.zip ?? "");
      setCountry(data?.address?.country ?? "");
      setLat(data?.address?.lat ?? null);
      setLng(data?.address?.lng ?? null);
      setProfileLoaded(true);
    };
    loadProfile();
  }, [user?.uid]);

  const handleSaveInfo = async () => {
    if (!user) return;

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedContactNumber = contactNumber.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      toast.error("First and last name are required.");
      return;
    }

    setSavingInfo(true);
    try {
      await update(ref(db, `users/${user.uid}`), {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        contactNumber: trimmedContactNumber,
      });
      toast.success("Profile updated.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!user) return;

    setSavingAddress(true);
    try {
      await update(ref(db, `users/${user.uid}/address`), {
        street: street.trim() || null,
        landmark: landmark.trim() || null,
        city: city.trim() || null,
        state: stateName.trim() || null,
        zip: zip.trim() || null,
        country: country.trim() || null,
        lat,
        lng,
      });
      toast.success("Address updated.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update address. Please try again.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePinMoved = (
    nextLat: number,
    nextLng: number,
    address: ReverseGeocodedAddress,
  ) => {
    setLat(nextLat);
    setLng(nextLng);
    if (address.street) setStreet(address.street);
    if (address.city) setCity(address.city);
    if (address.state) setStateName(address.state);
    if (address.zip) setZip(address.zip);
    if (address.country) setCountry(address.country);
  };

  const handleChangePassword = async () => {
    if (!user?.email || !auth.currentUser) return;

    if (!currentPassword) {
      toast.error("Enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);

      toast.success("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      console.error(error);
      if (
        error instanceof FirebaseError &&
        (error.code === "auth/wrong-password" ||
          error.code === "auth/invalid-credential")
      ) {
        toast.error("Current password is incorrect.");
      } else {
        toast.error("Failed to update password. Please try again.");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading || !user || !profileLoaded) {
    return <Loading />;
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 p-[4vh] gap-4 flex overflow-hidden bg-blue-100">
        <div className="flex flex-col gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`text-left cursor-pointer px-3 py-2 rounded-sm text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-blue-950 border text-white"
                  : "text-blue-950 bg-white border border-blue-950 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {activeTab === "info" && (
            <div className="max-w-lg bg-white border border-blue-900 rounded-sm p-4 flex flex-col gap-4">
              <div className="font-black text-blue-950 text-lg">
                User Information
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>First Name</FieldLabel>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <FieldLabel>Last Name</FieldLabel>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Email</FieldLabel>
                <input
                  value={user.email ?? ""}
                  disabled
                  className={`${fieldClass} bg-blue-50 text-blue-900/50 cursor-not-allowed`}
                />
              </div>

              <div>
                <FieldLabel>Contact Number</FieldLabel>
                <input
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={savingInfo}
                  onClick={handleSaveInfo}
                  className="bg-blue-950 px-4 py-1.5 rounded-sm text-white text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingInfo ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="max-w-lg bg-white border border-blue-900 rounded-sm p-6 flex flex-col gap-4">
              <div className="font-black text-blue-950 text-lg">Security</div>
              <div className="text-xs text-blue-900/60 -mt-2">
                Change your account password.
              </div>

              <div>
                <FieldLabel>Current Password</FieldLabel>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div>
                <FieldLabel>New Password</FieldLabel>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div>
                <FieldLabel>Confirm New Password</FieldLabel>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={changingPassword}
                  onClick={handleChangePassword}
                  className="bg-blue-950 px-4 py-1.5 rounded-sm text-white text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {changingPassword ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "address" && (
            <div className=" bg-white border border-blue-900 rounded-sm p-6 flex flex-col gap-4">
              <div className="font-black text-blue-950 text-lg">Address</div>
              <div className="text-xs text-blue-900/60 -mt-2">
                Click or drag the pin to your exact location — the fields below
                will fill in automatically.
              </div>

              <div className="flex gap-4">
                <AddressMap lat={lat} lng={lng} onChange={handlePinMoved} />

                <div className="flex flex-col gap-2 w-full" >
                  <div>
                    <FieldLabel>Street Address</FieldLabel>
                    <input
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <FieldLabel>Landmark</FieldLabel>
                    <input
                      placeholder="e.g. Near the blue gate, beside the bakery"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>City</FieldLabel>
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <FieldLabel>State / Province</FieldLabel>
                      <input
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>ZIP / Postal Code</FieldLabel>
                      <input
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <FieldLabel>Country</FieldLabel>
                      <input
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className={fieldClass}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={savingAddress}
                  onClick={handleSaveAddress}
                  className="bg-blue-950 px-4 py-1.5 rounded-sm text-white text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingAddress ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
