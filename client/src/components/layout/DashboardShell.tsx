"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

let isAuthVerifiedMemory = false;

type ThemeMode = "system" | "light" | "dark";

function applyStoredTheme() {
  if (typeof window === "undefined") return;
  const stored = window.localStorage.getItem("flowpilot_theme");
  const mode: ThemeMode = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = mode === "dark" || (mode === "system" && prefersDark);
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
  root.dataset.theme = mode;
  root.style.colorScheme = isDark ? "dark" : "light";
}

interface DashboardShellProps {
  children: ReactNode;
  contentClassName?: string;
  mainClassName?: string;
}

export function DashboardShell({
  children,
  contentClassName = "mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8",
  mainClassName = "",
}: DashboardShellProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("flowpilot_token");
      if (token && isAuthVerifiedMemory) {
        return true;
      }
    }
    return false;
  });

  useEffect(() => {
    applyStoredTheme();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const stored = window.localStorage.getItem("flowpilot_theme");
      if (stored === "system" || !stored) applyStoredTheme();
    };
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("flowpilot_token")
        : null;

    if (!token) {
      isAuthVerifiedMemory = false;
      setIsAuthorized(false);
      router.replace("/login");
      return;
    }

    isAuthVerifiedMemory = true;
    setIsAuthorized(true);
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Checking your session</p>
              <p className="mt-0.5 text-sm text-slate-500">Loading workspace access&hellip;</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className={`flex-1 min-w-0 ${mainClassName}`}>
          <div className={contentClassName}>{children}</div>
        </main>
      </div>
    </div>
  );
}
