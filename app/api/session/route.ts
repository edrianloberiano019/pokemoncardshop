import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60;

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();

  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
