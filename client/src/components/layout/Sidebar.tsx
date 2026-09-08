"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Workflow, GitFork, Activity, PlusCircle, ChevronRight } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";

const navItems = [
  { label: "Workflows", href: "/dashboard/workflows", icon: GitFork },
  { label: "Executions", href: "/dashboard/executions", icon: Activity },
  { label: "New Workflow", href: "/dashboard/workflows/new", icon: PlusCircle },
];

import { useRouter } from "next/navigation";

export function Sidebar() {
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside
      className={`h-screen shrink-0 border-r border-slate-200/80 bg-white/95 backdrop-blur-md transition-all duration-300 ease-in-out z-20 ${
        isSidebarOpen ? "w-64" : "w-0 overflow-hidden md:w-20"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5 transition-all duration-200 group" title="FlowPilot Brand">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-brand-glow transition-all duration-200 group-hover:bg-brand-700">
            <Workflow className="h-5 w-5" />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors leading-none">
                FlowPilot
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-brand-600 uppercase mt-0.5">
                Automations
              </span>
            </div>
          )}
        </div>


      {/* Navigation Links */}
      <nav className="flex flex-col gap-1.5 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-brand-50 text-brand-700 shadow-sm border border-brand-100/80"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-brand-600" />
              )}
              <Icon
                className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              {isSidebarOpen ? (
                <span className="flex-1 truncate">{item.label}</span>
              ) : (
                <span className="sr-only">{item.label}</span>
              )}
              {isSidebarOpen && isActive && (
                <ChevronRight className="h-3.5 w-3.5 text-brand-400 opacity-80" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}