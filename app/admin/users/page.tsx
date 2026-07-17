const users = [
  { id: "u001", name: "Jane Cruz", email: "jane@example.com", role: "Customer" },
  { id: "u002", name: "Mark Reyes", email: "mark@example.com", role: "Customer" },
  { id: "u003", name: "Edrian L.", email: "edrian@example.com", role: "Admin" },
  { id: "u004", name: "Aria Tan", email: "aria@example.com", role: "Customer" },
];

export default function AdminUsersPage() {
  return (
    <>
      <h1 className="text-4xl font-medium mb-2">Users</h1>
      <p className="text-black/70 mb-8">Manage customers and admins.</p>
        <div className="border border-black/10 rounded-md overflow-hidden">
          <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-black/5 text-sm font-medium">
            <div>ID</div>
            <div>Name</div>
            <div>Email</div>
            <div>Role</div>
          </div>
          {users.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-4 gap-4 px-4 py-3 border-t border-black/10 text-sm"
            >
              <div className="text-black/60">{u.id}</div>
              <div>{u.name}</div>
              <div>{u.email}</div>
              <div>
                <span
                  className={
                    u.role === "Admin"
                      ? "bg-black text-white px-2 py-0.5 rounded-full text-xs"
                      : "bg-black/10 px-2 py-0.5 rounded-full text-xs"
                  }
                >
                  {u.role}
                </span>
              </div>
            </div>
          ))}
        </div>
    </>
  );
}
