"use client";

import { useUIStore } from "@/store/useUIStore";

export function Header() {
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-gray-900">Dashboard</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-sm text-gray-500 sm:block">Welcome back</div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          U
        </div>
      </div>
    </header>
  );
}
