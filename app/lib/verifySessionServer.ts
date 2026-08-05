import { cookies } from "next/headers";
import { createRemoteJWKSet, jwtVerify } from "jose";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

export async function getVerifiedSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
      algorithms: ["RS256"],
    });

    if (typeof payload.sub !== "string") return null;

    return { uid: payload.sub, idToken: token };
  } catch {
    return null;
  }
}
