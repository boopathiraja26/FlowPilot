"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound, Monitor, Moon, Palette, Plug, Save, Shield, Sun, UserCircle2 } from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { InlineError, PageLoadingState } from "@/components/ui/PageState";
import { api } from "@/lib/api";

type ThemeMode = "system" | "light" | "dark";

type SettingsUser = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  hasPassword?: boolean;
};

type AccountSettings = {
  profile: SettingsUser;
  security: {
    hasPassword: boolean;
    canChangePassword: boolean;
    signInMethods: string[];
    email: string;
    updatedAt: string;
  };
  integrations: {
    ai: { configured: boolean; model: string | null };
    email: { configured: boolean; host: string | null; from: string | null };
  };
  preferences?: {
    theme?: { mode: ThemeMode; persisted: "local"; serverBacked: boolean };
  };
  notes?: string[];
};

const THEME_KEY = "flowpilot_theme";

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const value = window.localStorage.getItem(THEME_KEY);
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

function applyTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = mode === "dark" || (mode === "system" && prefersDark);
  root.classList.toggle("dark", isDark);
  root.dataset.theme = mode;
  root.style.colorScheme = isDark ? "dark" : "light";
}

function persistTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_KEY, mode);
  applyTheme(mode);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function updateStoredUser(user: Partial<SettingsUser>) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem("flowpilot_user");
    const existing = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const next = { ...existing, ...user };
    window.localStorage.setItem("flowpilot_user", JSON.stringify(next));
  } catch {
    // ignore local storage sync issues
  }
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [themeMessage, setThemeMessage] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoadError(null);
      setLoading(true);
      const res = await api.get("/auth/settings");
      const data = (res.data?.data ?? null) as AccountSettings | null;
      if (!data) throw new Error("Settings data was not returned.");
      setSettings(data);
      setName(data.profile.name || "");
      setAvatar(data.profile.avatar || "");
      updateStoredUser(data.profile);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        router.push("/login");
        return;
      }
      setLoadError(error?.response?.data?.message || error?.message || "Failed to load account settings.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const stored = getStoredTheme();
    setThemeMode(stored);
    applyTheme(stored);
    fetchSettings();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (getStoredTheme() === "system") applyTheme("system");
    };
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, [fetchSettings]);

  const initials = useMemo(() => {
    const source = (name || settings?.profile.email || "U").trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name, settings?.profile.email]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileMessage(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 3) {
      setProfileError("Name must be at least 3 characters long.");
      return;
    }
    const trimmedAvatar = avatar.trim();
    if (trimmedAvatar) {
      try {
        new URL(trimmedAvatar);
      } catch {
        setProfileError("Avatar must be a valid URL or left blank.");
        return;
      }
    }

    try {
      setProfileSaving(true);
      const res = await api.patch("/auth/profile", {
        name: trimmedName,
        avatar: trimmedAvatar ? trimmedAvatar : null,
      });
      const updated = (res.data?.data?.user ?? null) as SettingsUser | null;
      if (updated) {
        updateStoredUser(updated);
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                profile: { ...prev.profile, ...updated },
              }
            : prev
        );
      }
      setProfileMessage("Profile updated successfully.");
    } catch (error: any) {
      setProfileError(error?.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (!settings?.security.canChangePassword) {
      setPasswordError("Password change is not available for this account.");
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please complete all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    try {
      setPasswordSaving(true);
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password changed successfully.");
    } catch (error: any) {
      setPasswordError(error?.response?.data?.message || "Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  }

  function handleThemeChange(mode: ThemeMode) {
    setThemeMode(mode);
    persistTheme(mode);
    setThemeMessage(`Theme preference saved (${mode}).`);
  }

  if (loading) {
    return (
      <DashboardShell>
        <PageLoadingState label="Loading settings" description="Fetching your account and integration details…" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your profile, account security, integrations, and workspace preferences with real account data.</p>
          </div>
        </div>
        {loadError && <InlineError title="Unable to load settings" message={loadError} onRetry={fetchSettings} />}

        {settings && (
          <>
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white overflow-hidden">
                    {settings.profile.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={settings.profile.avatar} alt="" className="h-10 w-10 object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      <UserCircle2 className="h-4 w-4 text-slate-500" />
                      Profile
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">Update your display information stored in your FlowPilot account.</p>
                  </div>
                </div>

                <form onSubmit={handleProfileSave} className="mt-5 space-y-4">
                  <Input id="settings-name" label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />

                  <div>
                    <Input id="settings-email" label="Email address" value={settings.profile.email} disabled readOnly />
                    <p className="mt-1.5 text-xs text-slate-500">Email address changes are not available in this version.</p>
                  </div>

                  <div>
                    <Input
                      id="settings-avatar"
                      label="Avatar URL"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="https://example.com/avatar.png"
                    />
                    <p className="mt-1.5 text-xs text-slate-500">Optional. Provide an image URL or leave blank to remove.</p>
                  </div>

                  {profileError && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{profileError}</div>}
                  {profileMessage && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{profileMessage}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end">
                    <Button type="submit" isLoading={profileSaving}>
                      <Save className="h-4 w-4" />
                      Save profile
                    </Button>
                  </div>
                </form>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <Shield className="h-4 w-4 text-slate-500" />
                    Account security
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Real account and sign-in details for your workspace access.</p>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                      <dt className="text-slate-500">Email</dt>
                      <dd className="text-right font-medium text-slate-900">{settings.security.email}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                      <dt className="text-slate-500">Sign-in methods</dt>
                      <dd className="text-right font-medium text-slate-900">{settings.security.signInMethods.join(", ")}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                      <dt className="text-slate-500">Password configured</dt>
                      <dd className="text-right font-medium text-slate-900">{settings.security.hasPassword ? "Yes" : "No"}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-slate-500">Account updated</dt>
                      <dd className="text-right font-medium text-slate-900">{formatDate(settings.security.updatedAt)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <Palette className="h-4 w-4 text-slate-500" />
                    Appearance
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Theme preference is saved locally in this browser and applied to the workspace.</p>
                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {([
                      { value: "system", label: "System", icon: Monitor },
                      { value: "light", label: "Light", icon: Sun },
                      { value: "dark", label: "Dark", icon: Moon },
                    ] as const).map((option) => {
                      const Icon = option.icon;
                      const active = themeMode === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleThemeChange(option.value)}
                          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                            active
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {themeMessage && <p className="mt-3 text-sm text-emerald-700">{themeMessage}</p>}
                  <p className="mt-3 text-xs text-slate-500">Note: dark appearance is applied where supported by current interface styles.</p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <KeyRound className="h-4 w-4 text-slate-500" />
                  Password
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {settings.security.canChangePassword
                    ? "Change the password for your email-and-password account."
                    : "Password management is not available because this account does not use a local password."}
                </p>

                {settings.security.canChangePassword ? (
                  <form onSubmit={handlePasswordChange} className="mt-5 space-y-4">
                    <Input id="current-password" label="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required />
                    <div>
                      <Input id="new-password" label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required />
                      <p className="mt-1.5 text-xs text-slate-500">Use at least 8 characters with upper/lowercase, number, and special character.</p>
                    </div>
                    <Input id="confirm-password" label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required />

                    {passwordError && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{passwordError}</div>}
                    {passwordMessage && (
                      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{passwordMessage}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end">
                      <Button type="submit" isLoading={passwordSaving}>
                        <Save className="h-4 w-4" />
                        Update password
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    This account signs in with an external provider or does not have a local password configured. Password changes must be managed through that provider.
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Plug className="h-4 w-4 text-slate-500" />
                  Integrations
                </h2>
                <p className="mt-1 text-sm text-slate-500">Read-only integration status based on current server configuration. Credentials are not exposed or editable here.</p>

                <div className="mt-5 space-y-4">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">AI (Gemini)</p>
                        <p className="mt-1 text-sm text-slate-500">Used for AI workflow generation and AI workflow steps.</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${settings.integrations.ai.configured ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200"}`}>
                        {settings.integrations.ai.configured ? "Configured" : "Not configured"}
                      </span>
                    </div>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-500">Model</dt>
                        <dd className="font-medium text-slate-900">{settings.integrations.ai.model || "Unavailable"}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">Email (SMTP)</p>
                        <p className="mt-1 text-sm text-slate-500">Used by workflow email actions.</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${settings.integrations.email.configured ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200"}`}>
                        {settings.integrations.email.configured ? "Configured" : "Not configured"}
                      </span>
                    </div>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-500">SMTP host</dt>
                        <dd className="font-medium text-slate-900">{settings.integrations.email.host || "Unavailable"}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-500">From address</dt>
                        <dd className="truncate pl-4 font-medium text-slate-900" title={settings.integrations.email.from || undefined}>{settings.integrations.email.from || "Unavailable"}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="font-medium text-slate-800">Credential management</p>
                    <p className="mt-1">Integration secrets are managed through secure server environment configuration. To change credentials, update deployment environment settings through your authorized infrastructure process.</p>
                  </div>

                  {settings.notes && settings.notes.length > 0 && (
                    <ul className="space-y-1 text-xs text-slate-500">
                      {settings.notes.map((note) => (
                        <li key={note}>• {note}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

