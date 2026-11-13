"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Workflow, LayoutDashboard, GitFork, Activity, PlusCircle, ChevronRight, KeyRound, CalendarClock, BarChart3, Settings } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { useDialogFocus } from "@/hooks/useDialogFocus";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Workflows", href: "/dashboard/workflows", icon: GitFork },
  { label: "Executions", href: "/dashboard/executions", icon: Activity },
  { label: "Integrations", href: "/dashboard/integrations", icon: KeyRound },
  { label: "Schedules", href: "/dashboard/schedules", icon: CalendarClock },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "New Workflow", href: "/dashboard/workflows/new", icon: PlusCircle },
];

export function Sidebar() {
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
  const pathname = usePathname();
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const navRef = useDialogFocus<HTMLElement>(
    isMobileViewport && isSidebarOpen,
    () => setSidebarOpen(false)
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  return (
    <aside
      ref={navRef}
      id="dashboard-navigation"
      role={isMobileViewport && isSidebarOpen ? "dialog" : undefined}
      aria-modal={isMobileViewport && isSidebarOpen ? true : undefined}
      aria-label="Navigation menu"
      className={`fixed inset-y-0 left-0 z-30 h-screen shrink-0 border-r border-slate-200 bg-white transition-all duration-200 ease-in-out md:relative md:inset-auto md:visible ${
        isSidebarOpen ? "visible w-64 translate-x-0" : "invisible w-0 -translate-x-full overflow-hidden md:w-20 md:translate-x-0"
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5 transition-all duration-150 group" title="FlowPilot Brand">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-all duration-150 group-hover:bg-blue-700">
            <Workflow className="h-5 w-5" />
          </div>
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors leading-none">
                FlowPilot
              </span>
              <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase mt-0.5">
                Automations
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Primary navigation" className="flex flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => {
                if (window.matchMedia("(max-width: 767px)").matches) {
                  setSidebarOpen(false);
                }
              }}
              className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-100 font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-blue-600" />
              )}
              <Icon
                className={`h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                  isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              {isSidebarOpen ? (
                <span className="flex-1 truncate">{item.label}</span>
              ) : (
                <span className="sr-only">{item.label}</span>
              )}
              {isSidebarOpen && isActive && (
                <ChevronRight className="h-3.5 w-3.5 text-blue-600 opacity-80" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}