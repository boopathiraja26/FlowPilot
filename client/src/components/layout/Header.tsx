"use client";

import { useRouter } from "next/navigation";
import { LogOut, Menu, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useUIStore } from "@/store/useUIStore";

export function Header() {
  const router = useRouter();
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error(error);
    } finally {
      router.push("/login");
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-600">Production Engine</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-brand-50/80 px-3 py-1 text-xs font-semibold text-brand-700 border border-brand-100">
          <Sparkles className="h-3.5 w-3.5 text-brand-600" />
          <span>FlowPilot Pro</span>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-150 hover:border-rose-200 hover:bg-rose-50/60 hover:text-rose-600 active:scale-[0.98]"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}