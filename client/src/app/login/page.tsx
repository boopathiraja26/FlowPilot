"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

import { loginSchema, LoginFormValues } from "@/schemas/auth.schema";
import { api } from "@/lib/api";
import { FlowPilotWordmark } from "@/components/landing/FlowPilotWordmark";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect already-authenticated users by validating token with server
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
            "Login failed. Please verify your credentials and try again."
        );
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4 py-8">
      {/* Centered Card — identical dimensions and styling to register page */}
      <div className="w-full max-w-md rounded-2xl bg-dark-900 border border-white/[0.07] p-8 shadow-xl">

        {/* Text-only FlowPilot branding matching V3 landing page */}
        <div className="mb-5 text-center">
          <Link
            href="/"
            className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded"
            aria-label="FlowPilot Home"
          >
            <FlowPilotWordmark theme="light" size="lg" />
          </Link>
        </div>

        {/* Page heading */}
        <h1 className="text-center text-2xl font-bold text-white mb-6">
          Welcome Back
        </h1>

        {/* Server error */}
        {serverError && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/60 px-4 py-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <p className="font-semibold leading-relaxed">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email address"
              className={`w-full rounded-xl border ${
                errors.email
                  ? "border-rose-500/60 bg-rose-950/20"
                  : "border-white/[0.1] bg-dark-800"
              } px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                className={`w-full rounded-xl border ${
                  errors.password
                    ? "border-rose-500/60 bg-rose-950/20"
                    : "border-white/[0.1] bg-dark-800"
                } px-4 py-3 pr-10 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>
            )}
          </div>

          {/* Sign In button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {isSubmitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {/* Register link */}
        <p className="mt-5 text-center text-xs text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-400 hover:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
