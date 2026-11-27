"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ChevronDown,
  GitFork,
  LayoutDashboard,
  Plus,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { FlowPilotWordmark } from "@/components/landing/FlowPilotWordmark";
import { useUIStore } from "@/store/useUIStore";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section: "Workspace" | "Create";
};

const navItems: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, section: "Workspace" },
  { label: "Workflows", href: "/dashboard/workflows", icon: GitFork, section: "Workspace" },
  { label: "Executions", href: "/dashboard/executions", icon: Activity, section: "Workspace" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, section: "Workspace" },
  { label: "New workflow", href: "/dashboard/workflows/new", icon: Plus, section: "Create" },
];

function isNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/dashboard") return pathname === href;
  if (href === "/dashboard/workflows") {
    return pathname === href || (pathname.startsWith("/dashboard/workflows/") && !pathname.endsWith("/new"));
  }
  if (href === "/dashboard/workflows/new") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarTooltip({ id, label, show }: { id: string; label: string; show: boolean }) {
  return (
    <span
      id={id}
      role="tooltip"
      className={`pointer-events-none absolute left-full top-1/2 z-[80] ml-2.5 -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-lg ring-1 ring-slate-900/5 transition-opacity duration-150 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:ring-white/10 motion-reduce:transition-none ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      {label}
    </span>
  );
}

function NavLink({
  item,
  pathname,
  collapsed,
  onNavigate,
  showTooltip = false,
}: {
  item: NavItem;
  pathname: string | null;
  collapsed: boolean;
  onNavigate?: () => void;
  showTooltip?: boolean;
}) {
  const Icon = item.icon;
  const active = isNavActive(pathname, item.href);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const isCreate = item.section === "Create";
  const tooltipVisible = showTooltip && collapsed && (hovered || focused);
  const tooltipId = `sidebar-tooltip-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className="relative">
      <Link
        href={item.href}
        onClick={onNavigate}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-current={active ? "page" : undefined}
        aria-label={collapsed ? item.label : undefined}
        aria-describedby={collapsed ? tooltipId : undefined}
        className={`group relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-[background-color,color,border-color] duration-200 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 ${
          collapsed ? "justify-center px-0" : ""
        } ${
          isCreate
            ? active
              ? "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
              : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
            : active
            ? "bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        }`}
      >
        <Icon
          className={`h-[18px] w-[18px] shrink-0 ${
            isCreate
              ? active
                ? "text-blue-600 dark:text-blue-300"
                : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200"
              : active
              ? "text-white dark:text-slate-950"
              : "text-slate-500 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-200"
          }`}
          aria-hidden="true"
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {collapsed && <span className="sr-only">{item.label}</span>}
      </Link>
      {showTooltip && <SidebarTooltip id={tooltipId} label={item.label} show={tooltipVisible} />}
    </div>
  );
}

function SidebarPanel({
  collapsed,
  mobile = false,
  showTooltips = false,
  onNavigate,
  onClose,
  onToggleCollapse,
}: {
  collapsed: boolean;
  mobile?: boolean;
  showTooltips?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const workspaceItems = useMemo(() => navItems.filter((i) => i.section === "Workspace"), []);
  const createItems = useMemo(() => navItems.filter((i) => i.section === "Create"), []);

  return (
    <div className="flex h-full flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className={`flex shrink-0 items-center border-b border-slate-200/80 dark:border-slate-800 ${collapsed ? "h-[76px] flex-col justify-center gap-1 py-1" : "h-16 justify-between px-4"}`}>
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
          onClick={onNavigate}
          aria-label="FlowPilot dashboard"
        >
          {collapsed ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-bold tracking-[0.08em] text-white shadow-sm ring-1 ring-slate-900/10 dark:bg-slate-100 dark:text-slate-950">
              FP
            </span>
          ) : (
            <FlowPilotWordmark theme="dark" size="sm" className="max-w-[152px] dark:hidden" />
          )}
          {!collapsed ? (
            <span className="hidden max-w-[152px] truncate text-[17px] font-semibold tracking-tight text-slate-900 dark:inline">
              FlowPilot
            </span>
          ) : null}
        </Link>

        {mobile ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white ${collapsed ? "" : "border border-slate-200 dark:border-slate-700"}`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${collapsed ? "-rotate-90" : "rotate-90"}`} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <section aria-label="Workspace">
          <p className={`px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 ${collapsed ? "sr-only" : ""}`}>
            Workspace
          </p>
          <nav aria-label="Primary workspace navigation" className="space-y-1.5">
            {workspaceItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} showTooltip={showTooltips} />
            ))}
          </nav>
        </section>

        <section aria-label="Create" className="mt-6">
          <p className={`px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 ${collapsed ? "sr-only" : ""}`}>
            Create
          </p>
          <nav aria-label="Create actions" className="space-y-1.5">
            {createItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} showTooltip={showTooltips} />
            ))}
          </nav>
        </section>
      </div>

      <div className="shrink-0 border-t border-slate-200/80 p-3 dark:border-slate-800">
        <div className="group relative">
          <Link
            href="/dashboard/settings"
            onClick={onNavigate}
            aria-label={collapsed ? "Account settings" : undefined}
            aria-describedby={collapsed ? "sidebar-tooltip-account-settings" : undefined}
            className={`flex min-h-10 items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:hover:bg-slate-800 ${collapsed ? "justify-center px-0" : ""}`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <UserRound className="h-4 w-4" />
            </span>
            {!collapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-slate-800 dark:text-slate-100">Account & preferences</span>
                <span className="mt-0.5 block truncate text-[11px] text-slate-500 dark:text-slate-400">Profile, security and theme</span>
              </span>
            )}
          </Link>
          {collapsed && (
            <span
              id="sidebar-tooltip-account-settings"
              role="tooltip"
              className="pointer-events-none invisible absolute left-full top-1/2 z-[80] ml-2.5 -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 opacity-0 shadow-lg transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 motion-reduce:transition-none"
            >
              Account settings
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const {
    isSidebarCollapsed,
    isMobileSidebarOpen,
    hasHydratedSidebarPreference,
    hydrateSidebarPreference,
    toggleSidebarCollapsed,
    closeMobileSidebar,
  } = useUIStore();

  const drawerRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    hydrateSidebarPreference();
  }, [hydrateSidebarPreference]);

  useEffect(() => {
    if (isMobileSidebarOpen) closeMobileSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!isMobileSidebarOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      const closeButton = drawerRef.current?.querySelector<HTMLElement>('button[aria-label="Close navigation menu"]');
      (closeButton || drawerRef.current)?.focus?.();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobileSidebar();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [isMobileSidebarOpen, closeMobileSidebar]);

  // Keep the server and initial client render consistent, then apply the saved preference.
  const effectiveCollapsed = hasHydratedSidebarPreference ? isSidebarCollapsed : false;
  const railWidth = effectiveCollapsed ? 72 : 256;

  return (
    <>
      {/* Single in-flow desktop sidebar; collapse changes only its persistent width. */}
      <aside
        aria-label="Main navigation"
        className="sticky top-0 z-30 hidden h-dvh shrink-0 border-r border-slate-200 bg-white transition-[width] duration-200 ease-out motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-950 lg:block"
        style={{ width: railWidth }}
      >
        <SidebarPanel
          collapsed={effectiveCollapsed}
          showTooltips={effectiveCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
        />
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${isMobileSidebarOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!isMobileSidebarOpen}
      >
        <div
          className={`absolute inset-0 bg-slate-950/45 transition-opacity duration-200 motion-reduce:transition-none ${isMobileSidebarOpen ? "opacity-100" : "opacity-0"}`}
          onClick={closeMobileSidebar}
        />
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          tabIndex={-1}
          className={`absolute inset-y-0 left-0 h-dvh w-[280px] max-w-[86vw] border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-out motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-950 ${
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarPanel
            collapsed={false}
            mobile
            onNavigate={closeMobileSidebar}
            onClose={closeMobileSidebar}
          />
        </div>
      </div>
    </>
  );
}
