const orders = [
  { id: "#1042", customer: "Jane Cruz", total: 159.8, status: "Shipped" },
  { id: "#1041", customer: "Mark Reyes", total: 79.9, status: "Pending" },
  { id: "#1040", customer: "Aria Tan", total: 244.5, status: "Delivered" },
  { id: "#1039", customer: "Liam Park", total: 35.5, status: "Cancelled" },
];

const statusColor: Record<string, string> = {
  Shipped: "bg-blue-100 text-blue-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

export default function AdminOrdersPage() {
  return (
    <>
      <h1 className="text-4xl font-medium mb-2">Orders</h1>
      <p className="text-black/70 mb-8">Track and fulfill customer orders.</p>
        <div className="border border-black/10 rounded-md overflow-hidden">
          <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-black/5 text-sm font-medium">
            <div>Order</div>
            <div>Customer</div>
            <div>Total</div>
            <div>Status</div>
          </div>
          {orders.map((o) => (
            <div
              key={o.id}
              className="grid grid-cols-4 gap-4 px-4 py-3 border-t border-black/10 text-sm items-center"
            >
              <div>{o.id}</div>
              <div>{o.customer}</div>
              <div>${o.total.toFixed(2)}</div>
              <div>
                <span
                  className={`${statusColor[o.status]} px-2 py-0.5 rounded-full text-xs`}
                >
                  {o.status}
                </span>
              </div>
            </div>
          ))}
        </div>
    </>
  );
}
