const stats = [
  { label: "Total Revenue", value: "$24,820", delta: "+12.4%" },
  { label: "Orders", value: "1,284", delta: "+3.1%" },
  { label: "Customers", value: "942", delta: "+8.7%" },
  { label: "Avg Order Value", value: "$19.32", delta: "-1.2%" },
];

export default function AdminDashboardPage() {
  return (
    <>
      <h1 className="text-4xl font-medium mb-2">Admin Dashboard</h1>
      <p className="text-black/70 mb-8">Overview of store performance.</p>
      <div className="grid grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="border-2 border-[#ddcccc] rounded-md p-4"
            >
              <div className="text-sm text-black/60">{stat.label}</div>
              <div className="text-3xl font-medium mt-1">{stat.value}</div>
              <div
                className={
                  stat.delta.startsWith("-")
                    ? "text-xs text-red-600 mt-1"
                    : "text-xs text-green-700 mt-1"
                }
              >
                {stat.delta} vs last month
              </div>
            </div>
          ))}
        </div>
    </>
  );
}
