"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, GitFork, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Plus, X } from "lucide-react";
import { FlowPilotWordmark } from "@/components/landing/FlowPilotWordmark";
import { useUIStore } from "@/store/useUIStore";

const primaryNav = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Workflows", href: "/dashboard/workflows", icon: GitFork },
  { label: "Executions", href: "/dashboard/executions", icon: Activity },
];

function isNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/dashboard") {
    return pathname === href;
  }
  if (href === "/dashboard/workflows") {
    return pathname === href || (pathname.startsWith("/dashboard/workflows/") && !pathname.endsWith("/new"));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const {
    isSidebarCollapsed,
    isMobileSidebarOpen,
    toggleSidebarCollapsed,
    closeMobileSidebar,
  } = useUIStore();

  const navContent = (collapsed: boolean, mobile: boolean) => (
    <div className="flex h-full flex-col">
      <div className={`flex h-16 items-center border-b border-slate-200/80 ${collapsed && !mobile ? "justify-center px-2" : "justify-between px-4"}`}>
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2" onClick={closeMobileSidebar}>
          {collapsed && !mobile ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white">
              FP
            </span>
          ) : (
            <FlowPilotWordmark theme="dark" size="sm" className="max-w-[140px]" />
          )}
        </Link>
        {mobile ? (
          <button
            type="button"
            onClick={closeMobileSidebar}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-ring"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-ring ${collapsed ? "hidden" : ""}`}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className={`px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ${collapsed && !mobile ? "sr-only" : ""}`}>
          Workspace
        </p>
        <nav className="space-y-1">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileSidebar}
                title={collapsed && !mobile ? item.label : undefined}
                className={`group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors focus-ring ${
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                } ${collapsed && !mobile ? "justify-center px-2" : ""}`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-slate-500 group-hover:text-slate-700"}`} />
                {(!collapsed || mobile) && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6">
          <p className={`px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ${collapsed && !mobile ? "sr-only" : ""}`}>
            Actions
          </p>
          <Link
            href="/dashboard/workflows/new"
            onClick={closeMobileSidebar}
            title={collapsed && !mobile ? "New workflow" : undefined}
            className={`flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-ring ${
              pathname === "/dashboard/workflows/new" ? "border-blue-200 bg-blue-50 text-blue-700" : ""
            } ${collapsed && !mobile ? "justify-center px-2" : ""}`}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {(!collapsed || mobile) && <span>New workflow</span>}
          </Link>
        </div>
      </div>

      <div className={`border-t border-slate-200/80 p-3 ${collapsed && !mobile ? "flex justify-center" : ""}`}>
        {!mobile && isSidebarCollapsed ? (
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-ring"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        ) : (
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs font-medium text-slate-700">FlowPilot workspace</p>
            <p className="mt-0.5 text-[11px] text-slate-500">Automation operations</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`sticky top-0 z-30 hidden h-dvh shrink-0 border-r border-slate-200 bg-white transition-[width] duration-200 ease-out lg:flex ${
          isSidebarCollapsed ? "w-[72px]" : "w-64"
        }`}
      >
        {navContent(isSidebarCollapsed, false)}
      </aside>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-40 lg:hidden ${isMobileSidebarOpen ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!isMobileSidebarOpen}>
        <div
          className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-200 ${isMobileSidebarOpen ? "opacity-100" : "opacity-0"}`}
          onClick={closeMobileSidebar}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 ease-out ${
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {navContent(false, true)}
        </aside>
      </div>
    </>
  );
}