const products = [
  { id: "p001", name: "Classic Brown Tote", price: 79.9, stock: 24 },
  { id: "p002", name: "Linen Shirt", price: 49.0, stock: 58 },
  { id: "p003", name: "Leather Belt", price: 35.5, stock: 12 },
  { id: "p004", name: "Suede Loafers", price: 129.0, stock: 7 },
];

export default function AdminProductsPage() {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-medium mb-2">Products</h1>
            <p className="text-black/70">Manage your product catalog.</p>
          </div>
          <button className="bg-black text-white rounded-full px-5 py-2 font-medium">
            + Add product
          </button>
        </div>
        <div className="border border-black/10 rounded-md overflow-hidden">
          <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-black/5 text-sm font-medium">
            <div>ID</div>
            <div>Name</div>
            <div>Price</div>
            <div>Stock</div>
          </div>
          {products.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-4 gap-4 px-4 py-3 border-t border-black/10 text-sm"
            >
              <div className="text-black/60">{p.id}</div>
              <div>{p.name}</div>
              <div>${p.price.toFixed(2)}</div>
              <div>{p.stock}</div>
            </div>
          ))}
        </div>
    </>
  );
}
