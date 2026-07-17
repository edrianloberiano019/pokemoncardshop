import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { name, email, password, businessName } = await req.json();

  if (!email || !password || !businessName) {
    return NextResponse.json(
      { error: "Email, password, and business name are required." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      password: hashed,
      role: "CUSTOMER",
      vendorStatus: "PENDING",
      businessName,
    },
    select: { id: true, email: true, name: true, vendorStatus: true },
  });

  return NextResponse.json({ user });
}
