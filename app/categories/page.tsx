import Navbar from "@/components/Navbar";

const categories = [
  { name: "Bags", count: 24 },
  { name: "Apparel", count: 58 },
  { name: "Footwear", count: 32 },
  { name: "Accessories", count: 41 },
  { name: "Skincare", count: 19 },
  { name: "New Arrivals", count: 12 },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <Navbar />
      <main className="flex-1 px-[15vh] py-[2vh] text-black">
        <h1 className="text-4xl font-medium mb-2">Categories</h1>
        <p className="text-black/70 mb-8">Shop by category.</p>
        <div className="grid grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.name}
              className="border-2 border-[#ddcccc] rounded-md p-6 hover:scale-101 transition-all"
            >
              <div className="text-2xl font-medium">{category.name}</div>
              <div className="text-sm text-black/60">
                {category.count} products
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
