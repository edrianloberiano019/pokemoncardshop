import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "ADMIN" && role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const applications = await prisma.user.findMany({
    where: { vendorStatus: { not: null } },
    select: {
      id: true,
      name: true,
      email: true,
      businessName: true,
      role: true,
      vendorStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications });
}
