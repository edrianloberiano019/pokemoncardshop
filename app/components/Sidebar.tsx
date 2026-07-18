"use client";

import { useState } from "react";

const PokemonType = [
  {
    id: 1,
    name: "Grass",
  },
  {
    id: 2,
    name: "Fire",
  },
  {
    id: 3,
    name: "Water",
  },
  {
    id: 4,
    name: "Lightning",
  },
  {
    id: 5,
    name: "Psychic",
  },
  {
    id: 6,
    name: "Fighting",
  },
  {
    id: 7,
    name: "Darkness",
  },
  {
    id: 8,
    name: "Metal",
  },
  {
    id: 9,
    name: "Dragon",
  },
  {
    id: 10,
    name: "Colorless",
  },
  {
    id: 11,
    name: "Fairy (legacy)",
  },
];

const PokemonRarities = [
  {
    id: 1,
    name: "Amazing Rare",
  },
  { id: 2, name: "Common" },
  { id: 3, name: "LEGEND" },
  { id: 4, name: "Promo" },
  { id: 5, name: "Rare" },
  { id: 6, name: "Rare ACE" },
  { id: 7, name: "Rare BREAK" },
  { id: 8, name: "Rare Holo" },
  { id: 9, name: "Rare Holo EX" },
  { id: 10, name: "Rare Holo GX" },
  { id: 11, name: "Rare Holo LV.X" },
  { id: 12, name: "Rare Holo Star" },
  { id: 13, name: "Rare Holo V" },
  { id: 14, name: "Rare Holo VMAX" },
  { id: 15, name: "Rare Prime" },
  { id: 16, name: "Rare Prism Star" },
  { id: 17, name: "Rare Rainbow" },
  { id: 18, name: "Rare Secret" },
  { id: 19, name: "Rare Shining" },
  { id: 20, name: "Rare Shiny" },
  { id: 21, name: "Rare Shiny GX" },
  { id: 22, name: "Rare Ultra" },
  { id: 23, name: "Uncommon" },
];

const PokemonGrade = [
  {
    id: 1,
    name: "Ungraded",
  },
  {
    id: 2,
    name: "Grade 7",
  },
  {
    id: 3,
    name: "Grade 8",
  },
  {
    id: 4,
    name: "Grade 9",
  },
  {
    id: 5,
    name: "Grade 9.5",
  },
  {
    id: 6,
    name: "PSA 10",
  },
];

export type SidebarFilters = {
  types: string[];
  rarities: string[];
  minPrice: string;
  maxPrice: string;
};

const toggleValue = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

const onlyDigits = (value: string) => value.replace(/[^0-9]/g, "");

type PokemonRarityFilterProps = {
  selected: string[];
  onToggle: (name: string) => void;
};

const PokemonRarityFilter = ({ selected, onToggle }: PokemonRarityFilterProps) => {
  return (
    <div>
      <div className="text-xs mt-2 font-semibold">Pokémon Rarity</div>
      {PokemonRarities.map((rarirty) => (
        <div
          key={rarirty.id}
          className="flex items-center mt-1 gap-2 font-medium"
        >
          <input
            className="w-4 h-4"
            type="checkbox"
            checked={selected.includes(rarirty.name)}
            onChange={() => onToggle(rarirty.name)}
          />
          <div className="text-xs">{rarirty.name}</div>
        </div>
      ))}
    </div>
  );
};

type PokemonTypeFilterProps = {
  selected: string[];
  onToggle: (name: string) => void;
};

const PokemonTypeFilter = ({ selected, onToggle }: PokemonTypeFilterProps) => {
  return (
    <div>
      <div className="text-xs mt-2 font-semibold">Pokémon Type</div>
      {PokemonType.map((type) => (
        <div key={type.id} className="flex items-center mt-1 gap-2 font-medium">
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

const PokemonGradeFilter = () => {
  return (
    <div>
      <div className="text-xs font-semibold">Pokémon Grade</div>
      {PokemonGrade.map((grade) => (
        <div
          key={grade.id}
          className="flex items-center mt-1 gap-2 font-medium"
        >
          <input className="w-4 h-4" type="checkbox" />
          <div className="text-xs">{grade.name}</div>
        </div>
      ))}
    </div>
  );
};

type SidebarProps = {
  onApply: (filters: SidebarFilters) => void;
};

export default function Sidebar({ onApply }: SidebarProps) {
  const [types, setTypes] = useState<string[]>([]);
  const [rarities, setRarities] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const handleApply = () => {
    onApply({ types, rarities, minPrice, maxPrice });
  };

  return (
    <div className="w-[20vh] md:w-[35vh] flex-col gap-6 h-full overflow-hidden pl-6 pb-10 pt-6 flex">
      <div className="border-r border-gray-300 flex flex-col pr-4 h-full">
        <div>Search Filter</div>

        <div className="overflow-auto">
          <PokemonGradeFilter />
          <PokemonTypeFilter
            selected={types}
            onToggle={(name) => setTypes((prev) => toggleValue(prev, name))}
          />
          <PokemonRarityFilter
            selected={rarities}
            onToggle={(name) => setRarities((prev) => toggleValue(prev, name))}
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
          className="bg-[#99AD7A] hover:bg-[#8a9c6d] transition-all text-white text-xs px-3 py-1.5 rounded-sm cursor-pointer mt-2 text-center"
        >
          Apply
        </div>
      </div>
    </div>
  );
}
