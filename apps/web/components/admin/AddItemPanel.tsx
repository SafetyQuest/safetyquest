"use client";

import { useState } from "react";
import Link from "next/link";

export default function AddItemsPanel({
  title,
  items,
  onAdd,
  isAddingId,
  createLink,
  searchEnabled = true
}: {
  title: string;
  items: any[];
  onAdd: (id: string) => void;
  isAddingId: string | null;
  createLink: string;
  searchEnabled?: boolean;
}) {
  const [search, setSearch] = useState("");

  const filteredItems = items?.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-fit">
      <h2 className="text-xl font-bold mb-4">{title}</h2>

      {items?.length === 0 ? (
        <p className="text-gray-600">No items available.</p>
      ) : (
        <>
          {searchEnabled && (
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-3 py-2 border rounded-md mb-3"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}

          {/* Scrollable content */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {filteredItems?.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-gray-50 rounded border hover:bg-gray-100"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{item.title}</h3>

                  <button
                    onClick={() => onAdd(item.id)}
                    disabled={isAddingId === item.id}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {isAddingId === item.id ? "Adding..." : "Add"}
                  </button>
                </div>

                <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                  {item.description || "No description"}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t mt-4">
            <Link href={createLink} className="text-blue-600 hover:text-blue-800 text-sm">
              + Create New
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
