import { NextRequest, NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

const PUBLIC_PATHS = new Set(["/", "/login", "/shop"]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
      algorithms: ["RS256"],
    });
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("session");
    return res;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)",
  ],
};
