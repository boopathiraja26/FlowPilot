"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  GitFork,
  LayoutDashboard,
  Plus,
  Settings,
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

function SidebarTooltip({ label, show }: { label: string; show: boolean }) {
  return (
    <span
      role="tooltip"
      className={`pointer-events-none absolute left-full top-1/2 z-[80] ml-2.5 -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-lg ring-1 ring-slate-900/5 transition-opacity duration-150 motion-reduce:transition-none ${
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
        title={undefined}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-colors duration-150 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
          collapsed ? "justify-center px-0" : ""
        } ${
          isCreate
            ? active
              ? "border border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
              : "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            : active
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <Icon
          className={`h-[18px] w-[18px] shrink-0 ${
            isCreate
              ? active
                ? "text-blue-600"
                : "text-slate-500 group-hover:text-slate-700"
              : active
              ? "text-white"
              : "text-slate-500 group-hover:text-slate-700"
          }`}
          aria-hidden="true"
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {collapsed && <span className="sr-only">{item.label}</span>}
      </Link>
      {showTooltip && <SidebarTooltip label={item.label} show={tooltipVisible} />}
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
  toggleLabel,
}: {
  collapsed: boolean;
  mobile?: boolean;
  showTooltips?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
  onToggleCollapse?: () => void;
  toggleLabel?: string;
}) {
  const pathname = usePathname();
  const workspaceItems = useMemo(() => navItems.filter((i) => i.section === "Workspace"), []);
  const createItems = useMemo(() => navItems.filter((i) => i.section === "Create"), []);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className={`flex h-16 items-center border-b border-slate-200/80 ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2"
          onClick={onNavigate}
          aria-label="FlowPilot dashboard"
        >
          {collapsed ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-[11px] font-semibold tracking-[0.08em] text-white shadow-sm ring-1 ring-slate-900/10">
              FP
            </span>
          ) : (
            <FlowPilotWordmark theme="dark" size="sm" className="max-w-[152px]" />
          )}
        </Link>

        {mobile ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : !collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            aria-label={toggleLabel || "Collapse sidebar"}
            title={toggleLabel || "Collapse sidebar"}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <section aria-label="Workspace">
          <p className={`px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ${collapsed ? "sr-only" : ""}`}>
            Workspace
          </p>
          <nav aria-label="Primary workspace navigation" className="space-y-1.5">
            {workspaceItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} showTooltip={showTooltips} />
            ))}
          </nav>
        </section>

        <section aria-label="Create" className="mt-6">
          <p className={`px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ${collapsed ? "sr-only" : ""}`}>
            Create
          </p>
          <nav aria-label="Create actions" className="space-y-1.5">
            {createItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} showTooltip={showTooltips} />
            ))}
          </nav>
        </section>
      </div>

      <div className={`border-t border-slate-200/80 p-3 ${collapsed ? "flex flex-col items-center gap-2" : ""}`}>
        {collapsed && !mobile ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            aria-label={toggleLabel || "Expand sidebar"}
            title={toggleLabel || "Expand sidebar"}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
            <p className="text-xs font-semibold text-slate-800">Account & workspace</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">Manage workflows, triggers, and executions from one place.</p>
            <Link
              href="/dashboard/settings"
              onClick={onNavigate}
              className="mt-2 inline-flex text-xs font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded"
            >
              Open settings
            </Link>
          </div>
        )}
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
    setSidebarCollapsed,
    closeMobileSidebar,
  } = useUIStore();

  const [isHoverPreviewOpen, setIsHoverPreviewOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
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

  useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  // Avoid hydration mismatch: render expanded layout until client preference is hydrated.
  const effectiveCollapsed = hasHydratedSidebarPreference ? isSidebarCollapsed : false;

  const openPreview = () => {
    if (!effectiveCollapsed) return;
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsHoverPreviewOpen(true);
  };

  const scheduleClosePreview = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => setIsHoverPreviewOpen(false), 120);
  };

  const closePreviewNow = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsHoverPreviewOpen(false);
  };

  const pinExpanded = () => {
    setSidebarCollapsed(false);
    closePreviewNow();
  };

  const motion = "motion-reduce:transition-none motion-reduce:duration-0";
  const railWidth = effectiveCollapsed ? 72 : 256;

  return (
    <>
      {/* Desktop sidebar: in-flow rail (72px collapsed / 256px expanded). Collapsed preview overlays content. */}
      <aside
        className={`sticky top-0 z-30 hidden h-dvh shrink-0 border-r border-slate-200 bg-white lg:block transition-[width] duration-200 ease-out ${motion}`}
        style={{ width: railWidth }}
        onMouseEnter={openPreview}
        onMouseLeave={scheduleClosePreview}
        onFocusCapture={openPreview}
        onBlurCapture={(e) => {
          const next = e.relatedTarget as Node | null;
          if (!e.currentTarget.contains(next)) scheduleClosePreview();
        }}
      >
        <div className="h-full w-full overflow-hidden">
          <SidebarPanel
            collapsed={effectiveCollapsed}
            showTooltips={effectiveCollapsed && !isHoverPreviewOpen}
            onToggleCollapse={toggleSidebarCollapsed}
            toggleLabel={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          />
        </div>

        {effectiveCollapsed && (
          <div
            className={`absolute inset-y-0 left-0 z-40 h-dvh overflow-visible border-r border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5 transition-[transform,opacity] duration-200 ease-out ${motion} ${
              isHoverPreviewOpen ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 pointer-events-none"
            }`}
            style={{ width: 256 }}
            onMouseEnter={openPreview}
            onMouseLeave={scheduleClosePreview}
            onFocusCapture={openPreview}
            onBlurCapture={(e) => {
              const next = e.relatedTarget as Node | null;
              if (!e.currentTarget.contains(next)) scheduleClosePreview();
            }}
            aria-label="Expanded navigation preview"
            aria-hidden={!isHoverPreviewOpen}
          >
            <SidebarPanel
              collapsed={false}
              onNavigate={closePreviewNow}
              onToggleCollapse={pinExpanded}
              toggleLabel="Pin sidebar expanded"
            />
          </div>
        )}
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${isMobileSidebarOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!isMobileSidebarOpen}
      >
        <div
          className={`absolute inset-0 bg-slate-900/45 transition-opacity duration-200 ${motion} ${isMobileSidebarOpen ? "opacity-100" : "opacity-0"}`}
          onClick={closeMobileSidebar}
        />
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          tabIndex={-1}
          className={`absolute inset-y-0 left-0 h-dvh w-[280px] max-w-[86vw] border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-out ${motion} ${
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
