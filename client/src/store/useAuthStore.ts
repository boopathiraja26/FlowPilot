import { create } from "zustand";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

/**
 * Auth store STRUCTURE ONLY.
 * No real login/token persistence is wired up yet - this just
 * establishes the shape the UI can bind to in a future phase.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
