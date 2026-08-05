"use client";

import { useState } from "react";
import { push, ref, remove, set } from "firebase/database";
import { toast } from "react-toastify";
import { db } from "@/lib/firebase";

export type LookupOption = {
  id: string;
  name: string;
};

type LookupListManagerProps = {
  title: string;
  description: string;
  dbPath: string;
  items: LookupOption[];
  placeholder: string;
  emptyLabel: string;
};

export default function LookupListManager({
  title,
  description,
  dbPath,
  items,
  placeholder,
  emptyLabel,
}: LookupListManagerProps) {
  const [newItemName, setNewItemName] = useState("");

  const handleAdd = async () => {
    const name = newItemName.trim();
    if (!name) return;

    try {
      await set(push(ref(db, dbPath)), name);
      setNewItemName("");
    } catch (error) {
      console.error(error);
      toast.error(`Failed to add ${title.toLowerCase()}. Please try again.`);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await remove(ref(db, `${dbPath}/${itemId}`));
    } catch (error) {
      console.error(error);
      toast.error(
        `Failed to delete ${title.toLowerCase()}. Please try again.`,
      );
    }
  };

  return (
    <div className="border bg-white border-blue-900 rounded-md p-4 text-blue-950">
      <div className="font-black mb-1">{title}</div>
      <div className="text-xs text-gray-500 mb-3">{description}</div>

      <div className="flex gap-2 mb-3">
        <input
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder={placeholder}
          className="flex-1 border border-blue-900 rounded-sm px-3 py-2 text-xs text-blue-950 placeholder:text-blue-900/40 focus:outline-none focus:ring-1 focus:ring-blue-900"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="bg-blue-950 px-3 py-1 rounded-sm text-white text-xs cursor-pointer"
        >
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-xs text-gray-400 py-2">{emptyLabel}</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-1 bg-blue-50 text-xs px-2 py-1 rounded-sm"
            >
              {item.name}
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="text-blue-900/50 cursor-pointer hover:text-red-600"
                aria-label={`Remove ${item.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
