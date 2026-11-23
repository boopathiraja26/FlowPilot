"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck, Workflow } from "lucide-react";

import { loginSchema, LoginFormValues } from "@/schemas/auth.schema";
import { api } from "@/lib/api";
import { FlowPilotWordmark } from "@/components/landing/FlowPilotWordmark";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("flowpilot_token") : null;
    if (!token) return;
    api
      .get("/auth/me")
      .then(() => router.replace("/dashboard/workflows"))
      .catch(() => {
        localStorage.removeItem("flowpilot_token");
        localStorage.removeItem("flowpilot_user");
      });
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const response = await api.post("/auth/login", {
        email: values.email.trim(),
        password: values.password,
      });
      const data = response.data?.data;

      if (data?.accessToken && typeof window !== "undefined") {
        localStorage.setItem("flowpilot_token", data.accessToken);
      }
      if (data?.user && typeof window !== "undefined") {
        localStorage.setItem("flowpilot_user", JSON.stringify(data.user));
      }

      router.replace("/dashboard/workflows");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setServerError(
          error.response?.data?.message ??
            "Sign in failed. Check your credentials and try again."
        );
      } else {
        setServerError("Something went wrong while signing in. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[1.05fr_1fr]">
          <section className="hidden border-r border-slate-200 bg-slate-50/70 p-8 lg:flex lg:flex-col lg:justify-between">
            <div>
              <Link href="/" className="inline-block focus-ring rounded-lg" aria-label="FlowPilot home">
                <FlowPilotWordmark theme="light" size="lg" />
              </Link>
              <div className="mt-10 space-y-4">
                <p className="text-sm font-medium text-slate-500">Workflow automation workspace</p>
                <h1 className="max-w-md text-3xl font-semibold tracking-tight text-slate-900">
                  Sign in to manage, run, and monitor your workflows.
                </h1>
                <p className="max-w-md text-sm leading-6 text-slate-600">
                  Access your visual workflows, execution history, AI-assisted drafts, and account settings from a single dashboard.
                </p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
                <Workflow className="mt-0.5 h-4 w-4 text-slate-700" />
                <p>Build and maintain sequential workflows with triggers, AI, email, webhooks, and delays.</p>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-slate-700" />
                <p>Your session is validated before dashboard access and protected routes remain authenticated.</p>
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-8 lg:p-10">
            <div className="mb-8">
              <div className="mb-5 lg:hidden">
                <Link href="/" className="inline-block focus-ring rounded-lg" aria-label="FlowPilot home">
                  <FlowPilotWordmark theme="light" size="lg" />
                </Link>
              </div>
              <p className="text-sm font-medium text-slate-500">Account access</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Sign in</h2>
              <p className="mt-2 text-sm text-slate-600">
                Use your FlowPilot account credentials to continue.
              </p>
            </div>

            {serverError && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{serverError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-900">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus-ring ${
                    errors.email ? "border-rose-300" : "border-slate-300"
                  }`}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-rose-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-900">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={`w-full rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus-ring ${
                      errors.password ? "border-rose-300" : "border-slate-300"
                    }`}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-ring"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-rose-600">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus-ring"
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
                {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-5 text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-slate-900 hover:text-slate-700 focus-ring rounded">
                Create one
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
