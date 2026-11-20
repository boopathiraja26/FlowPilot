"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";

import { registerSchema, RegisterFormValues } from "@/schemas/auth.schema";
import { api } from "@/lib/api";
import { FlowPilotWordmark } from "@/components/landing/FlowPilotWordmark";

function getPasswordStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: "", color: "bg-slate-700" };
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

  // Field DOM refs for reliable focus on step change
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const confirmInputRef = useRef<HTMLInputElement | null>(null);

  // Redirect already-authenticated users
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

  // Auto-focus the active field when step changes
  useEffect(() => {
    if (currentStep === 0) nameInputRef.current?.focus();
    else if (currentStep === 1) emailInputRef.current?.focus();
    else if (currentStep === 2) passwordInputRef.current?.focus();
    else if (currentStep === 3) confirmInputRef.current?.focus();
  }, [currentStep]);

  const stepKeys: Array<keyof RegisterFormValues> = [
    "name",
    "email",
    "password",
    "confirmPassword",
  ];

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
        handleNext();
      } else {
        handleSubmit(onSubmit)();
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
          respData?.message ??
            "Registration failed. Please check your information and try again."
        );
      } else {
        setServerError("Registration failed. Please check your information and try again.");
      }
    }
  };

  // Dedicated register destructurings for separate DOM inputs
  const { ref: nameRegisterRef, ...nameProps } = register("name");
  const { ref: emailRegisterRef, ...emailProps } = register("email");
  const { ref: passwordRegisterRef, ...passwordProps } = register("password");
  const { ref: confirmRegisterRef, ...confirmProps } = register("confirmPassword");

  // Progress: 25%, 50%, 75%, 100%
  const progressPct = ((currentStep + 1) / 4) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4 py-8">
      {/* Centered Card */}
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

        {/* Heading */}
        <h1 className="text-center text-2xl font-bold text-white mb-4">
          Create Account
        </h1>

        {/* Progress bar — no animation, direct width update */}
        <div className="mb-6">
          <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${progressPct}%`, transition: "none" }}
            />
          </div>
        </div>

        {/* Server error */}
        {serverError && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/60 px-4 py-3 text-xs text-rose-300">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} noValidate>
          {/* STEP 1: Full Name */}
          <div className={currentStep === 0 ? "block" : "hidden"}>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              FULL NAME
            </p>
            <p className="mb-3 text-sm font-semibold text-slate-200">
              Full Name
            </p>
            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              className={`w-full rounded-xl border ${
                errors.name
                  ? "border-rose-500/60 bg-rose-950/20"
                  : "border-white/[0.1] bg-dark-800"
              } px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
              ref={(e) => {
                nameRegisterRef(e);
                nameInputRef.current = e;
              }}
              {...nameProps}
            />
            {errors.name && (
              <p className="mt-2 text-xs text-rose-400">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* STEP 2: Email Address */}
          <div className={currentStep === 1 ? "block" : "hidden"}>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              EMAIL ADDRESS
            </p>
            <p className="mb-3 text-sm font-semibold text-slate-200">
              Email Address
            </p>
            <input
              id="email"
              type="email"
              placeholder="Enter your email address"
              autoComplete="email"
              className={`w-full rounded-xl border ${
                errors.email
                  ? "border-rose-500/60 bg-rose-950/20"
                  : "border-white/[0.1] bg-dark-800"
              } px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
              ref={(e) => {
                emailRegisterRef(e);
                emailInputRef.current = e;
              }}
              {...emailProps}
            />
            {errors.email && (
              <p className="mt-2 text-xs text-rose-400">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* STEP 3: Create Password */}
          <div className={currentStep === 2 ? "block" : "hidden"}>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              PASSWORD
            </p>
            <p className="mb-3 text-sm font-semibold text-slate-200">
              Create Password
            </p>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                autoComplete="new-password"
                className={`w-full rounded-xl border ${
                  errors.password
                    ? "border-rose-500/60 bg-rose-950/20"
                    : "border-white/[0.1] bg-dark-800"
                } px-4 py-3 pr-10 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                ref={(e) => {
                  passwordRegisterRef(e);
                  passwordInputRef.current = e;
                }}
                {...passwordProps}
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
              <p className="mt-2 text-xs text-rose-400">
                {errors.password.message}
              </p>
            )}
            {passwordValue && (
              <div className="mt-2 mb-1 flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className={`h-1.5 flex-1 rounded-full ${
                        strength.score >= n ? strength.color : "bg-slate-700"
                      }`}
                      style={{ transition: "none" }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* STEP 4: Confirm Password */}
          <div className={currentStep === 3 ? "block" : "hidden"}>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              CONFIRM PASSWORD
            </p>
            <p className="mb-3 text-sm font-semibold text-slate-200">
              Confirm Password
            </p>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className={`w-full rounded-xl border ${
                  errors.confirmPassword
                    ? "border-rose-500/60 bg-rose-950/20"
                    : "border-white/[0.1] bg-dark-800"
                } px-4 py-3 pr-10 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                ref={(e) => {
                  confirmRegisterRef(e);
                  confirmInputRef.current = e;
                }}
                {...confirmProps}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none"
                aria-label={showConfirm ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-2 text-xs text-rose-400">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Buttons: Next Step / Create Account, and Back */}
          <div className="mt-5 flex flex-col gap-2">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {isSubmitting ? "Creating account…" : "Create Account"}
              </button>
            )}

            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="w-full rounded-xl border border-white/[0.1] bg-dark-800 hover:bg-dark-700 py-2.5 text-sm font-semibold text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Back
              </button>
            )}
          </div>
        </form>

        {/* Footer Link */}
        <p className="mt-5 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-400 hover:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
