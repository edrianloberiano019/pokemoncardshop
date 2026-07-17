import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "ADMIN" && role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { action } = await req.json();

  if (action !== "approve" && action !== "deny") {
    return NextResponse.json(
      { error: "action must be 'approve' or 'deny'." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.vendorStatus !== "PENDING") {
    return NextResponse.json(
      { error: "No pending application found for this user." },
      { status: 404 }
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data:
      action === "approve"
        ? { role: "VENDOR", vendorStatus: "APPROVED" }
        : { vendorStatus: "DENIED" },
    select: { id: true, role: true, vendorStatus: true },
  });

  return NextResponse.json({ user: updated });
}
