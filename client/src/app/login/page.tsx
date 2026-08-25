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
      await api.post("/auth/login", values);

      // Small delay gives the browser time to process the cookie
      setTimeout(() => {
        router.replace("/dashboard/workflows");
      }, 100);
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
      subtitle="Sign in to continue managing your workflows."
      badgeText="Secure SaaS Workspace"
      badgeIcon={<ShieldCheck className="h-3.5 w-3.5 text-brand-600" />}
      bottomQuestion="Don't have an account?"
      bottomLinkText="Create one"
      bottomLinkHref="/register"
      pageType="login"
    >
      {serverError && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200/90 bg-rose-50/90 p-3.5 text-xs text-rose-700 animate-fade-in shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
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
            icon={<Mail className="h-4 w-4 text-slate-400" />}
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
            icon={<Lock className="h-4 w-4 text-slate-400" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
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
          className="w-full mt-2 py-3 text-xs font-bold uppercase tracking-wider shadow-brand-glow hover:shadow-lg hover:shadow-brand-500/25 active:scale-[0.99] transition-all"
        >
          <span>Sign in</span>
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </form>
    </AuthLayout>
  );
}