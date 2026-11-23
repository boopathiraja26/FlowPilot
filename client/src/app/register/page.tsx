"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, Sparkles, Workflow } from "lucide-react";

import { registerSchema, RegisterFormValues } from "@/schemas/auth.schema";
import { api } from "@/lib/api";
import { FlowPilotWordmark } from "@/components/landing/FlowPilotWordmark";

function getPasswordStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: "", color: "bg-slate-200" };
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500" };
  if (score <= 3) return { score: 2, label: "Medium", color: "bg-amber-500" };
  return { score: 3, label: "Strong", color: "bg-emerald-500" };
}

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const confirmInputRef = useRef<HTMLInputElement | null>(null);

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
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
  });

  const passwordValue = watch("password", "");
  const strength = getPasswordStrength(passwordValue);

  useEffect(() => {
    if (currentStep === 0) nameInputRef.current?.focus();
    else if (currentStep === 1) emailInputRef.current?.focus();
    else if (currentStep === 2) passwordInputRef.current?.focus();
    else if (currentStep === 3) confirmInputRef.current?.focus();
  }, [currentStep]);

  const stepKeys: Array<keyof RegisterFormValues> = ["name", "email", "password", "confirmPassword"];
  const stepLabels = ["Name", "Email", "Password", "Confirm"];

  const handleNext = async () => {
    const currentKey = stepKeys[currentStep];
    const valid = await trigger(currentKey);
    if (valid) {
      setServerError(null);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setServerError(null);
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (currentStep < 3) {
        void handleNext();
      } else {
        void handleSubmit(onSubmit)();
      }
    }
  };

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      const response = await api.post("/auth/register", {
        name: values.name.trim(),
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

      router.push(data?.accessToken ? "/dashboard/workflows" : "/login?registered=1");
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const respData = error.response?.data;
        if (respData?.details && typeof respData.details === "object") {
          const messages = Object.values(respData.details).flat().filter(Boolean);
          if (messages.length > 0) {
            setServerError(messages.join(". "));
            return;
          }
        }
        setServerError(
          respData?.message ?? "Registration failed. Please check your information and try again."
        );
      } else {
        setServerError("Registration failed. Please check your information and try again.");
      }
    }
  };

  const { ref: nameRegisterRef, ...nameProps } = register("name");
  const { ref: emailRegisterRef, ...emailProps } = register("email");
  const { ref: passwordRegisterRef, ...passwordProps } = register("password");
  const { ref: confirmRegisterRef, ...confirmProps } = register("confirmPassword");
  const progressPct = ((currentStep + 1) / 4) * 100;

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
                <p className="text-sm font-medium text-slate-500">Create your workspace</p>
                <h1 className="max-w-md text-3xl font-semibold tracking-tight text-slate-900">
                  Start building and running automation workflows in FlowPilot.
                </h1>
                <p className="max-w-md text-sm leading-6 text-slate-600">
                  Set up your account to create workflows, configure actions, and monitor executions from a single platform.
                </p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
                <Workflow className="mt-0.5 h-4 w-4 text-slate-700" />
                <p>Design sequential workflows with triggers, AI, email, webhook, and delay steps.</p>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
                <Sparkles className="mt-0.5 h-4 w-4 text-slate-700" />
                <p>Use AI-assisted drafting when available, with manual workflow creation always supported.</p>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-slate-700" />
                <p>Track workflow runs and outcomes through execution history and workspace dashboards.</p>
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-8 lg:p-10">
            <div className="mb-6">
              <div className="mb-5 lg:hidden">
                <Link href="/" className="inline-block focus-ring rounded-lg" aria-label="FlowPilot home">
                  <FlowPilotWordmark theme="light" size="lg" />
                </Link>
              </div>
              <p className="text-sm font-medium text-slate-500">Account setup</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Create account</h2>
              <p className="mt-2 text-sm text-slate-600">Complete a few steps to create your FlowPilot account.</p>
            </div>

            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Step {currentStep + 1} of 4 · {stepLabels[currentStep]}
                </p>
                <p className="text-xs text-slate-500">{Math.round(progressPct)}%</p>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-slate-900 transition-[width] duration-200"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {serverError && (
              <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} noValidate>
              <div className={currentStep === 0 ? "block" : "hidden"}>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-900">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus-ring ${
                    errors.name ? "border-rose-300" : "border-slate-300"
                  }`}
                  ref={(e) => {
                    nameRegisterRef(e);
                    nameInputRef.current = e;
                  }}
                  {...nameProps}
                />
                {errors.name ? <p className="mt-1.5 text-xs text-rose-600">{errors.name.message}</p> : null}
              </div>

              <div className={currentStep === 1 ? "block" : "hidden"}>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-900">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus-ring ${
                    errors.email ? "border-rose-300" : "border-slate-300"
                  }`}
                  ref={(e) => {
                    emailRegisterRef(e);
                    emailInputRef.current = e;
                  }}
                  {...emailProps}
                />
                {errors.email ? <p className="mt-1.5 text-xs text-rose-600">{errors.email.message}</p> : null}
              </div>

              <div className={currentStep === 2 ? "block" : "hidden"}>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-900">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    className={`w-full rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus-ring ${
                      errors.password ? "border-rose-300" : "border-slate-300"
                    }`}
                    ref={(e) => {
                      passwordRegisterRef(e);
                      passwordInputRef.current = e;
                    }}
                    {...passwordProps}
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
                {errors.password ? <p className="mt-1.5 text-xs text-rose-600">{errors.password.message}</p> : null}
                {passwordValue ? (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-1 gap-1">
                        {[1, 2, 3].map((n) => (
                          <div
                            key={n}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              strength.score >= n ? strength.color : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-slate-600">{strength.label}</span>
                    </div>
                    <p className="text-xs text-slate-500">Use at least 8 characters with a mix of letters, numbers, and symbols.</p>
                  </div>
                ) : null}
              </div>

              <div className={currentStep === 3 ? "block" : "hidden"}>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-900">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className={`w-full rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus-ring ${
                      errors.confirmPassword ? "border-rose-300" : "border-slate-300"
                    }`}
                    ref={(e) => {
                      confirmRegisterRef(e);
                      confirmInputRef.current = e;
                    }}
                    {...confirmProps}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-ring"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword ? (
                  <p className="mt-1.5 text-xs text-rose-600">{errors.confirmPassword.message}</p>
                ) : null}
              </div>

              <div className="mt-6 flex flex-col gap-2.5">
                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => void handleNext()}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus-ring"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus-ring"
                  >
                    {isSubmitting ? "Creating account…" : "Create account"}
                  </button>
                )}

                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-ring"
                  >
                    Back
                  </button>
                )}
              </div>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-5 text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-slate-900 hover:text-slate-700 focus-ring rounded">
                Sign in
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
