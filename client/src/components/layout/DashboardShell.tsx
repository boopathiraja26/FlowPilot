"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

let isAuthVerifiedMemory = false;

export function DashboardShell({ children }: { children: ReactNode }) {
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
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="text-xs font-semibold text-slate-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <Header />
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
