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
    <div className="bg-[var(--background)] rounded-lg shadow-md p-6 h-fit border border-[var(--border)]">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">{title}</h2>

      {items?.length === 0 ? (
        <p className="text-[var(--text-secondary)]">No items available.</p>
      ) : (
        <>
          {searchEnabled && (
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}

          {/* Scrollable content */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {filteredItems?.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-[var(--surface)] rounded border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors duration-[--transition-base]"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-[var(--text-primary)]">{item.title}</h3>

                  <button
                    onClick={() => onAdd(item.id)}
                    disabled={isAddingId === item.id}
                    className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] disabled:opacity-50 transition-colors duration-[--transition-base]"
                  >
                    {isAddingId === item.id ? "Adding..." : "Add"}
                  </button>
                </div>

                <p className="text-sm text-[var(--text-secondary)] line-clamp-1 mt-1">
                  {item.description || "No description"}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[var(--border)] mt-4">
            <Link href={createLink} className="text-[var(--primary)] hover:text-[var(--primary-dark)] text-sm transition-colors duration-[--transition-base]">
              + Create New
            </Link>
          </div>
        </>
      )}
    </div>
  );
}