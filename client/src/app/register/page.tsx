"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, AlertCircle, UserPlus, Sparkles, Mail, Lock, User, ShieldCheck } from "lucide-react";

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
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);

    try {
      await api.post("/auth/register", {
        name: values.name,
        email: values.email,
        password: values.password,
      });

      router.push("/dashboard");
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
      subtitle="Start building and automating your workflows."
      badgeText="Instant Access • Start Automating"
      badgeIcon={<Sparkles className="h-3.5 w-3.5 text-brand-600" />}
      bottomQuestion="Already have an account?"
      bottomLinkText="Sign in"
      bottomLinkHref="/login"
      pageType="register"
    >
      {serverError && (
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-rose-200/90 bg-rose-50/90 p-3.5 text-xs text-rose-700 animate-fade-in shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <p className="font-semibold leading-relaxed">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        <Input
          id="name"
          label="Full name"
          placeholder="John Doe"
          icon={<User className="h-4 w-4 text-slate-400" />}
          error={errors.name?.message}
          {...register("name")}
        />

        <Input
          id="email"
          type="email"
          label="Email address"
          placeholder="you@company.com"
          icon={<Mail className="h-4 w-4 text-slate-400" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          label="Password"
          placeholder="Minimum 8 characters"
          icon={<Lock className="h-4 w-4 text-slate-400" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={0}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          error={errors.password?.message}
          {...register("password")}
        />

        <Input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          label="Confirm password"
          placeholder="Re-enter password"
          icon={<ShieldCheck className="h-4 w-4 text-slate-400" />}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="mt-2 w-full py-3 text-xs font-bold uppercase tracking-wider shadow-brand-glow hover:shadow-lg hover:shadow-brand-500/25 active:scale-[0.99] transition-all"
        >
          <span>Create free account</span>
          <UserPlus className="h-4 w-4 ml-1" />
        </Button>
      </form>
    </AuthLayout>
  );
}