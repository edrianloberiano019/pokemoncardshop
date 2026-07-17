import AdminNavbar from "@/components/AdminNavbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full w-full flex flex-1 flex-col overflow-hidden">
      <AdminNavbar />
      <main className="px-[10vh] h-full overflow-y-auto py-[4vh]">
        {children}
      </main>
    </div>
  );
}
