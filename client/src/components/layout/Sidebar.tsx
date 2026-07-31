"use client";

import Link from "next/link";
import { useUIStore } from "@/store/useUIStore";

const navItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Projects", href: "/dashboard" },
  { label: "Tasks", href: "/dashboard" },
  { label: "Team", href: "/dashboard" },
  { label: "Settings", href: "/dashboard" },
];

export function Sidebar() {
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);

  return (
    <aside
      className={`h-screen shrink-0 border-r border-gray-200 bg-white transition-all duration-200 ${
        isSidebarOpen ? "w-64" : "w-0 overflow-hidden md:w-20"
      }`}
    >
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          FP
        </div>
        {isSidebarOpen && <span className="text-lg font-semibold text-gray-900">FlowPilot</span>}
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            {isSidebarOpen ? item.label : item.label.slice(0, 1)}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
