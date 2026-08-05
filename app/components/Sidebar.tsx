"use client";

import { useState } from "react";
import { useProductTypes } from "@/lib/productTypes";

export type SidebarFilters = {
  productTypes: string[];
  minPrice: string;
  maxPrice: string;
};

const toggleValue = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

const onlyDigits = (value: string) => value.replace(/[^0-9]/g, "");

type ProductTypeFilterProps = {
  selected: string[];
  onToggle: (name: string) => void;
};

const ProductTypeFilter = ({ selected, onToggle }: ProductTypeFilterProps) => {
  const productTypes = useProductTypes();

  return (
    <div>
      <div className="text-xs mt-2 font-semibold">Product Type</div>
      {productTypes.map((type) => (
        <div
          key={type.id}
          className="flex items-center mt-1 gap-2 font-medium"
        >
          <input
            className="w-4 h-4"
            type="checkbox"
            checked={selected.includes(type.name)}
            onChange={() => onToggle(type.name)}
          />
          <div className="text-xs">{type.name}</div>
        </div>
      ))}
    </div>
  );
};

type SidebarProps = {
  onApply: (filters: SidebarFilters) => void;
};

export default function Sidebar({ onApply }: SidebarProps) {
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const handleApply = () => {
    onApply({ productTypes, minPrice, maxPrice });
  };

  return (
    <div className="w-[20vh] md:w-[35vh] flex-col gap-6 h-full overflow-hidden pl-6 pb-10 pt-6 flex">
      <div className="border-r border-gray-300 flex flex-col pr-4 h-full">
        <div>Search Filter</div>

        <div className="overflow-auto">
          <ProductTypeFilter
            selected={productTypes}
            onToggle={(name) =>
              setProductTypes((prev) => toggleValue(prev, name))
            }
          />
        </div>
        <div className="mt-2">Price Range</div>
        <div className="flex items-center  mt-2 gap-2 font-medium">
          <input
            className="w-full p-2 text-xs border rounded-sm"
            type="text"
            inputMode="numeric"
            placeholder="$ Min"
            value={minPrice}
            onChange={(e) => setMinPrice(onlyDigits(e.target.value))}
          />
          <div>-</div>
          <input
            className="w-full p-2 text-xs border rounded-sm"
            type="text"
            inputMode="numeric"
            placeholder="$ Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(onlyDigits(e.target.value))}
          />
        </div>
        <div
          onClick={handleApply}
          className="bg-blue-950 transition-all text-white text-xs px-3 py-1.5 rounded-sm cursor-pointer mt-2 text-center"
        >
          Apply
        </div>
      </div>
    </div>
  );
}
