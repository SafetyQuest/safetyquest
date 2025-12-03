// components/MultiSelectDropdown.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

type OptionType = {
    id: string;
    [key: string]: any; // <-- allow any additional fields
  };

type MultiSelectDropdownProps = {
  label: string;
  options: OptionType[];
  selectedIds: string[];
  onChange: (id: string) => void;
  labelField?: string;
};

export default function MultiSelectDropdown({
  label,
  options,
  selectedIds,
  onChange,
  labelField = 'name',
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOptions = options.filter(option => selectedIds.includes(option.id));
  const filteredOptions = options.filter(option =>
    (option[labelField] || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border rounded-md bg-white hover:bg-gray-50 flex items-center flex-wrap gap-1 px-2 py-1 min-h-[40px] text-left"
      >
        {selectedOptions.length === 0 ? (
          <span className="text-gray-400">Select {label}</span>
        ) : (
            selectedOptions.map(option => (
                <span
                  key={option.id}
                  className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"
                >
                  {option[labelField]}
                  <span
                    role="button"
                    className="ml-1 text-blue-800 hover:text-blue-900 font-bold cursor-pointer select-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(option.id); // toggle off
                    }}
                  >
                    ×
                  </span>
                </span>
            ))
        )}

        <svg
          className={`w-4 h-4 ml-auto transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${label}`}
              className="w-full px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length === 0 ? (
              <p className="p-2 text-gray-500 text-sm">No options found.</p>
            ) : (
              <div className="flex flex-col p-2 gap-1">
                {filteredOptions.map(option => (
                  <label
                    key={option.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded px-2 py-1"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(option.id)}
                      onChange={() => onChange(option.id)}
                    />
                    <span>{option[labelField]}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
