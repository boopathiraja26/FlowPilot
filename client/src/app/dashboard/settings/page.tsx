"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ChangePasswordFormValues,
  changePasswordFormSchema,
  ProfileFormValues,
  profileSchema,
} from "@/schemas/auth.schema";
import { api } from "@/lib/api";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isProfileAvailable, setIsProfileAvailable] = useState(false);
  const [profileRetry, setProfileRetry] = useState(0);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: isSavingProfile },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "" },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isChangingPassword },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await api.get("/auth/me");
        const user = response.data?.data?.user as UserProfile | undefined;
        if (!user || typeof user.name !== "string" || typeof user.email !== "string") {
          throw new Error("Unexpected profile response");
        }
        if (!cancelled) {
          resetProfile({ name: user.name, email: user.email });
          setIsProfileAvailable(true);
        }
      } catch {
        if (!cancelled) {
          setProfileError("Could not load your profile. Refresh the page to try again.");
        }
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [profileRetry, resetProfile]);

  async function saveProfile(values: ProfileFormValues) {
    setProfileError(null);
    setProfileNotice(null);
    try {
      const response = await api.patch("/auth/me", values);
      const user = response.data?.data?.user as UserProfile | undefined;
      if (!user) throw new Error("Unexpected profile response");
      resetProfile({ name: user.name, email: user.email });
      if (typeof window !== "undefined") {
        localStorage.setItem("flowpilot_user", JSON.stringify(user));
      }
      setProfileNotice("Profile updated.");
    } catch {
      setProfileError("Profile could not be updated. Check your details and try again.");
    }
  }

  async function updatePassword(values: ChangePasswordFormValues) {
    setPasswordError(null);
    setPasswordNotice(null);
    try {
      const response = await api.post("/auth/password", values);
      const accessToken = response.data?.data?.accessToken;
      if (typeof accessToken !== "string") {
        throw new Error("Updated session token is unavailable.");
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("flowpilot_token", accessToken);
      }
      resetPassword();
      setPasswordNotice("Password updated successfully.");
    } catch {
      setPasswordError("Password could not be updated. Verify your current password and try again.");
      resetPassword();
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Account settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Update your profile details and account password.
          </p>
        </header>

        <section aria-labelledby="profile-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <UserRound className="h-5 w-5" />
            </span>
            <div>
              <h2 id="profile-heading" className="font-bold text-slate-900">Profile</h2>
              <p className="text-xs text-slate-500">Manage the name and email on your account.</p>
            </div>
          </div>

          {profileError && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{profileError}</p>}
          {profileNotice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{profileNotice}</p>}

          {isLoadingProfile ? (
            <div role="status" aria-label="Loading profile" className="space-y-4">
              <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : !isProfileAvailable ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Profile details are unavailable until they can be loaded.</p>
              <Button type="button" variant="secondary" onClick={() => {
                setIsLoadingProfile(true);
                setProfileError(null);
                setProfileRetry((attempt) => attempt + 1);
              }}>
                Retry loading profile
              </Button>
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit(saveProfile)} className="space-y-4">
              <Input
                id="profile-name"
                label="Full name"
                autoComplete="name"
                error={profileErrors.name?.message}
                disabled={isSavingProfile}
                {...registerProfile("name")}
              />
              <Input
                id="profile-email"
                label="Email address"
                type="email"
                autoComplete="email"
                error={profileErrors.email?.message}
                disabled={isSavingProfile}
                {...registerProfile("email")}
              />
              <Button type="submit" isLoading={isSavingProfile}>
                Save profile
              </Button>
            </form>
          )}
        </section>

        <section aria-labelledby="password-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div>
              <h2 id="password-heading" className="font-bold text-slate-900">Change password</h2>
              <p className="text-xs text-slate-500">Verify your current password before choosing a new one.</p>
            </div>
          </div>

          {passwordError && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{passwordError}</p>}
          {passwordNotice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{passwordNotice}</p>}

          <form onSubmit={handlePasswordSubmit(updatePassword)} className="space-y-4">
            <Input
              id="current-password"
              label="Current password"
              type="password"
              autoComplete="current-password"
              error={passwordErrors.currentPassword?.message}
              disabled={isChangingPassword}
              {...registerPassword("currentPassword")}
            />
            <Input
              id="new-password"
              label="New password"
              type="password"
              autoComplete="new-password"
              error={passwordErrors.newPassword?.message}
              disabled={isChangingPassword}
              {...registerPassword("newPassword")}
            />
            <Input
              id="confirm-new-password"
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              error={passwordErrors.confirmNewPassword?.message}
              disabled={isChangingPassword}
              {...registerPassword("confirmNewPassword")}
            />
            <p className="text-xs text-slate-500">
              Use at least 8 characters with uppercase and lowercase letters, a number, and a special character.
            </p>
            <p className="text-xs text-slate-500">
              This form requires an existing password and is unavailable for accounts without one.
            </p>
            <Button type="submit" isLoading={isChangingPassword}>
              Update password
            </Button>
          </form>
        </section>
      </div>
    </DashboardShell>
  );
}
