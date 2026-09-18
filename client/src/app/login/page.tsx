"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Mail, Lock } from "lucide-react";

import { loginSchema, LoginFormValues } from "@/schemas/auth.schema";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
      const response = await api.post("/auth/login", values);
      const data = response.data?.data;

      if (data?.accessToken && typeof window !== "undefined") {
        localStorage.setItem("flowpilot_token", data.accessToken);
      }
      if (data?.user && typeof window !== "undefined") {
        localStorage.setItem("flowpilot_user", JSON.stringify(data.user));
      }

      // Smooth transition to dashboard
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
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue managing your intelligent workflows."
      badgeText="Secure SaaS Workspace"
      badgeIcon={<ShieldCheck className="h-3.5 w-3.5 text-blue-400" />}
      bottomQuestion="Don't have an account?"
      bottomLinkText="Create one"
      bottomLinkHref="/register"
      pageType="login"
    >
      {serverError && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-950/60 p-3.5 text-xs text-rose-300 animate-fade-in shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <p className="font-semibold leading-relaxed">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            id="email"
            type="email"
            label="Email address"
            placeholder="you@company.com"
            icon={<Mail className="h-4 w-4 text-slate-500" />}
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        <div>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4 text-slate-500" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={0}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
            error={errors.password?.message}
            {...register("password")}
          />
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full mt-2 py-3 text-xs font-bold uppercase tracking-wider"
        >
          <span>Sign in</span>
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </form>
    </AuthLayout>
  );
}