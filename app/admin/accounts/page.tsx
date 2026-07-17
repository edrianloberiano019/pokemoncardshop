import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { prisma } from "@/lib/prisma";
import AccountsTable from "./AccountsTable";

export const dynamic = "force-dynamic";

export default async function AdminAccountsPage() {
  const session = await auth();
  const role = session?.user?.role;

  // if (!role) redirect("/login");
  // if (role !== "ADMIN" && role !== "SUPERADMIN") redirect("/dashboard");

  // const applications = await prisma.user.findMany({
  //   where: { vendorStatus: { not: null } },
  //   select: {
  //     id: true,
  //     name: true,
  //     email: true,
  //     businessName: true,
  //     role: true,
  //     vendorStatus: true,
  //     createdAt: true,
  //   },
  //   orderBy: { createdAt: "desc" },
  // });

  return (
    <>
      <h1 className="text-4xl font-medium mb-2">Accounts</h1>
      <p className="text-black/70 mb-8">
        Review and approve vendor applications.
      </p>
      <AccountsTable
        // applications={applications.map((a) => ({
        //   ...a,
        //   createdAt: a.createdAt.toISOString(),
        // }))}
      />
    </>
  );
}
