"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, Settings, User } from "lucide-react";
import { api } from "@/lib/api";
import { useUIStore } from "@/store/useUIStore";
import { Breadcrumbs } from "./Breadcrumbs";

type StoredUser = {
  name?: string;
  email?: string;
  fullName?: string;
  username?: string;
};

function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("flowpilot_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredUser;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function getDisplayName(user: StoredUser | null): string {
  if (!user) return "Account";
  return user.name || user.fullName || user.username || user.email || "Account";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Header() {
  const router = useRouter();
  const { toggleMobileSidebar } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const displayName = useMemo(() => getDisplayName(user), [user]);
  const email = user?.email || "";
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  async function handleLogout() {
    setMenuOpen(false);
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error(error);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("flowpilot_token");
        localStorage.removeItem("flowpilot_user");
      }
      router.push("/login");
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-slate-800 dark:bg-slate-950/90 dark:supports-[backdrop-filter]:bg-slate-950/80">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleMobileSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 focus-ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
          <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" aria-hidden="true" />
          <div className="min-w-0">
            <Breadcrumbs />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>System operational</span>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 shadow-sm transition-colors hover:bg-slate-50 focus-ring dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-[11px] font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
                {initials}
              </span>
              <span className="hidden min-w-0 max-w-[140px] text-left sm:block">
                <span className="block truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{displayName}</span>
                {email ? <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{email}</span> : null}
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen && (
              <div
                role="menu"
                aria-label="User menu"
                className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10"
              >
                <div className="border-b border-slate-100 px-2.5 py-2">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{displayName}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{email || "Signed in"}</p>
                </div>
                <div className="p-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/dashboard/workflows");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-ring dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <span>Workspace</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/dashboard/settings");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-ring dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <span>Settings</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-rose-700 hover:bg-rose-50 focus-ring"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}