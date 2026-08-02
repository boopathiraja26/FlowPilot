"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function Header() {
  const router = useRouter();

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
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <h1 className="text-lg font-semibold text-gray-900">
        FlowPilot
      </h1>

      <button
        onClick={handleLogout}
        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      >
        Logout
      </button>
    </header>
  );
}