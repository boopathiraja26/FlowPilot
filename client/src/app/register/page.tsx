"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, AlertCircle, UserPlus, Sparkles, Mail, Lock, User, ShieldCheck, Check } from "lucide-react";

import { registerSchema, RegisterFormValues } from "@/schemas/auth.schema";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch("password", "");

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-slate-700" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500" };
    if (score === 2 || score === 3) return { score: 2, label: "Medium", color: "bg-amber-500" };
    return { score: 3, label: "Strong", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);

    try {
      const response = await api.post("/auth/register", {
        name: values.name,
        email: values.email,
        password: values.password,
      });
      const data = response.data?.data;

      if (data?.accessToken && typeof window !== "undefined") {
        localStorage.setItem("flowpilot_token", data.accessToken);
      }
      if (data?.user && typeof window !== "undefined") {
        localStorage.setItem("flowpilot_user", JSON.stringify(data.user));
      }

      router.push("/dashboard/workflows");
    } catch (error: any) {
      setServerError(
        error?.response?.data?.message ??
          "Registration failed. Please check your information and try again."
      );
    }
  };

  return (
    <AuthLayout
      title="Create your FlowPilot account"
      subtitle="Start building and automating your workflows in seconds."
      badgeText="Instant Access • Start Automating"
      badgeIcon={<Sparkles className="h-3.5 w-3.5 text-blue-400" />}
      bottomQuestion="Already have an account?"
      bottomLinkText="Sign in"
      bottomLinkHref="/login"
      pageType="register"
    >
      {serverError && (
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-950/60 p-3.5 text-xs text-rose-300 animate-fade-in shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <p className="font-semibold leading-relaxed">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        <Input
          id="name"
          label="Full name"
          placeholder="John Doe"
          icon={<User className="h-4 w-4 text-slate-500" />}
          error={errors.name?.message}
          {...register("name")}
        />

        <Input
          id="email"
          type="email"
          label="Email address"
          placeholder="you@company.com"
          icon={<Mail className="h-4 w-4 text-slate-500" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <div>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="Minimum 8 characters"
            icon={<Lock className="h-4 w-4 text-slate-500" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={0}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            error={errors.password?.message}
            {...register("password")}
          />

          {passwordValue && (
            <div className="mt-2 flex items-center gap-2 animate-fade-in">
              <div className="flex-1 h-1.5 rounded-full bg-dark-800 overflow-hidden flex gap-1">
                <div className={`h-full flex-1 rounded-full transition-all ${strength.score >= 1 ? strength.color : "bg-dark-700"}`} />
                <div className={`h-full flex-1 rounded-full transition-all ${strength.score >= 2 ? strength.color : "bg-dark-700"}`} />
                <div className={`h-full flex-1 rounded-full transition-all ${strength.score >= 3 ? strength.color : "bg-dark-700"}`} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{strength.label}</span>
            </div>
          )}
        </div>

        <Input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          label="Confirm password"
          placeholder="Re-enter password"
          icon={<ShieldCheck className="h-4 w-4 text-slate-500" />}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="mt-2 w-full py-3 text-xs font-bold uppercase tracking-wider"
        >
          <span>Create free account</span>
          <UserPlus className="h-4 w-4 ml-1" />
        </Button>
      </form>
    </AuthLayout>
  );
}