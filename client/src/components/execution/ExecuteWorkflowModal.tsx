"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  X,
  Play,
  Loader2,
  User,
  Mail,
  Briefcase,
  Building,
  UserCheck,
  Calendar,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  Sparkles,
  Zap,
  Send,
  RotateCcw,
  Check,
  Award,
  Bot,
} from "lucide-react";

export interface RuntimeTriggerPayload {
  employee_name: string;
  employee_email: string;
  job_title: string;
  department: string;
  manager_name: string;
  manager_email: string;
  start_date: string;
  company_name: string;
  company_address: string;
  company_phone: string;
  event?: string;
}

interface ExecuteWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (payload: RuntimeTriggerPayload) => Promise<any>;
  initialValues?: Partial<RuntimeTriggerPayload>;
  workflowTitle?: string;
  isExecuting?: boolean;
  executionError?: string | null;
}

type ModalPhase = "form" | "executing" | "success" | "failed";
type StepState = "pending" | "running" | "completed" | "failed";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ExecuteWorkflowModal({
  isOpen,
  onClose,
  onExecute,
  initialValues,
  workflowTitle,
  executionError: externalError,
}: ExecuteWorkflowModalProps) {
  const [formData, setFormData] = useState<RuntimeTriggerPayload>({
    employee_name: "",
    employee_email: "",
    job_title: "",
    department: "",
    manager_name: "",
    manager_email: "",
    start_date: "",
    company_name: "",
    company_address: "",
    company_phone: "",
    event: "employee_added",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof RuntimeTriggerPayload, string>>
  >({});

  const [phase, setPhase] = useState<ModalPhase>("form");
  const [stepStates, setStepStates] = useState<StepState[]>([
    "pending",
    "pending",
    "pending",
    "pending",
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AI & Email Micro-Status details
  const [aiSubStatus, setAiSubStatus] = useState<string>("Analyzing employee information...");
  const [emailSubStatus, setEmailSubStatus] = useState<string>("Preparing email");
  const [aiPreviewText, setAiPreviewText] = useState<string>("");
  const [isTypingAi, setIsTypingAi] = useState<boolean>(false);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setFormData({
        employee_name: initialValues?.employee_name || "",
        employee_email: initialValues?.employee_email || "",
        job_title: initialValues?.job_title || "",
        department: initialValues?.department || "",
        manager_name: initialValues?.manager_name || "",
        manager_email: initialValues?.manager_email || "",
        start_date: initialValues?.start_date || "",
        company_name: initialValues?.company_name || "",
        company_address: initialValues?.company_address || "",
        company_phone: initialValues?.company_phone || "",
        event: initialValues?.event || "employee_added",
      });
      setErrors({});
      setPhase("form");
      setStepStates(["pending", "pending", "pending", "pending"]);
      setErrorMessage(null);
      setAiSubStatus("Analyzing employee information...");
      setEmailSubStatus("Preparing email");
      setAiPreviewText("");
      setIsTypingAi(false);
    }
  }, [isOpen, initialValues]);

  // Handle ESC key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && phase !== "executing") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, phase, onClose]);

  if (!isOpen) return null;

  function handleChange(field: keyof RuntimeTriggerPayload, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof RuntimeTriggerPayload, string>> = {};

    if (!formData.employee_name.trim()) {
      newErrors.employee_name = "Full Name is required.";
    }

    if (!formData.employee_email.trim()) {
      newErrors.employee_email = "Work Email is required.";
    } else if (!EMAIL_REGEX.test(formData.employee_email.trim())) {
      newErrors.employee_email = "Please enter a valid email address.";
    }

    if (
      formData.manager_email.trim() &&
      !EMAIL_REGEX.test(formData.manager_email.trim())
    ) {
      newErrors.manager_email = "Please enter a valid email address.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Typewriter effect function for AI live text preview
  async function typeAiText(fullText: string) {
    setIsTypingAi(true);
    setAiPreviewText("");
    const chunkSize = 4;
    for (let i = 0; i <= fullText.length; i += chunkSize) {
      setAiPreviewText(fullText.slice(0, i));
      await new Promise((r) => setTimeout(r, 16));
    }
    setAiPreviewText(fullText);
    setIsTypingAi(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    // Start execution animation
    setPhase("executing");
    setErrorMessage(null);

    // 1. Step 0 (Trigger): Running -> quickly Completed
    setStepStates(["running", "pending", "pending", "pending"]);
    await new Promise((r) => setTimeout(r, 350));
    setStepStates(["completed", "running", "pending", "pending"]);

    // 2. Step 1 (AI): Micro-status transitions
    setAiSubStatus("Analyzing employee information...");
    const subStatusTimer = setTimeout(() => {
      setAiSubStatus("Personalizing welcome message...");
    }, 1200);

    const subStatusTimer2 = setTimeout(() => {
      setAiSubStatus("Preparing onboarding details...");
    }, 2400);

    try {
      // Execute backend API call
      const res = await onExecute(formData);

      clearTimeout(subStatusTimer);
      clearTimeout(subStatusTimer2);
      setAiSubStatus("Finalizing message...");

      // Extract generated AI output text from execution logs if available
      const execution = res?.data?.execution || res?.execution;
      const logs = execution?.logs || [];
      const aiLog = logs.find((l: any) => l.stepType === "AI");
      const generatedMessage =
        aiLog?.message ||
        `Welcome to ${formData.company_name || "FlowPilot"}, ${formData.employee_name}! 🎉 On behalf of the team, we are excited to have you join as our new ${formData.job_title || "team member"}.`;

      // Perform typewriter preview animation
      await typeAiText(generatedMessage);
      await new Promise((r) => setTimeout(r, 300));

      // AI Step completes -> Email Step starts
      setStepStates(["completed", "completed", "running", "pending"]);

      // 3. Step 2 (Email Delivery) pipeline animation
      setEmailSubStatus("Preparing email");
      await new Promise((r) => setTimeout(r, 200));
      setEmailSubStatus("Resolving recipient");
      await new Promise((r) => setTimeout(r, 200));
      setEmailSubStatus("Building HTML email");
      await new Promise((r) => setTimeout(r, 200));
      setEmailSubStatus("Connecting to SMTP server");
      await new Promise((r) => setTimeout(r, 200));
      setEmailSubStatus("Sending email...");
      await new Promise((r) => setTimeout(r, 300));
      setEmailSubStatus("Email sent successfully!");

      // Email step completes -> Completion step completes
      setStepStates(["completed", "completed", "completed", "completed"]);
      await new Promise((r) => setTimeout(r, 300));

      setPhase("success");
    } catch (err: unknown) {
      clearTimeout(subStatusTimer);
      clearTimeout(subStatusTimer2);

      const msg =
        (err as { message?: string })?.message ||
        externalError ||
        "Execution failed. Please check inputs and server connection.";

      setErrorMessage(msg);
      setStepStates((prev) => {
        const next = [...prev];
        const runningIdx = next.indexOf("running");
        if (runningIdx !== -1) {
          next[runningIdx] = "failed";
        } else {
          next[1] = "failed";
        }
        return next;
      });
      setPhase("failed");
    }
  }

  const stepsConfig = [
    {
      id: "trigger",
      label: "Trigger Processing",
      icon: Zap,
      runningText: "Receiving employee information...",
      completedText: "Employee information received",
    },
    {
      id: "ai",
      label: "AI Personalization",
      icon: Sparkles,
      runningText: aiSubStatus,
      completedText: "Welcome message generated",
    },
    {
      id: "email",
      label: "Email Delivery Pipeline",
      icon: Send,
      runningText: emailSubStatus,
      completedText: "Welcome email sent successfully",
    },
    {
      id: "completed",
      label: "Workflow Completion",
      icon: Award,
      runningText: "Finalizing execution context...",
      completedText: "Workflow completed successfully",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-all duration-300">
      {/* Backdrop click area */}
      <div
        className="fixed inset-0"
        onClick={() => {
          if (phase !== "executing") onClose();
        }}
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-xl rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl transition-all duration-300 sm:p-7 max-h-[90vh] flex flex-col overflow-hidden z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="modal-title" className="text-lg font-extrabold text-slate-900">
                {phase === "form" ? "Execute Workflow" : "Workflow Pipeline Execution"}
              </h2>
              {phase === "executing" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 border border-brand-200">
                  <span className="h-2 w-2 rounded-full bg-brand-600 animate-ping" />
                  Live Execution
                </span>
              )}
            </div>
            {workflowTitle && (
              <p className="text-xs font-semibold text-brand-600 mt-0.5">
                {workflowTitle}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              {phase === "form"
                ? "Enter employee details for runtime execution context."
                : "FlowPilot is running your automation pipeline..."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={phase === "executing"}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-40"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content depending on Phase */}
        {phase === "form" ? (
          /* =========================================================
             FORM PHASE
             ========================================================= */
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1 text-left"
          >
            {(externalError || errorMessage) && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                {externalError || errorMessage}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1">
              <label
                htmlFor="employee_name"
                className="text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="employee_name"
                  type="text"
                  value={formData.employee_name}
                  onChange={(e) => handleChange("employee_name", e.target.value)}
                  placeholder="e.g. Boopathi"
                  className={`w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 ${
                    errors.employee_name
                      ? "border-rose-300 ring-4 ring-rose-500/10"
                      : "border-slate-200"
                  }`}
                />
              </div>
              {errors.employee_name && (
                <p className="text-xs font-medium text-rose-500 mt-1">
                  • {errors.employee_name}
                </p>
              )}
            </div>

            {/* Work Email */}
            <div className="space-y-1">
              <label
                htmlFor="employee_email"
                className="text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Work Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="employee_email"
                  type="email"
                  value={formData.employee_email}
                  onChange={(e) => handleChange("employee_email", e.target.value)}
                  placeholder="e.g. boopathiraja26ab@gmail.com"
                  className={`w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 ${
                    errors.employee_email
                      ? "border-rose-300 ring-4 ring-rose-500/10"
                      : "border-slate-200"
                  }`}
                />
              </div>
              {errors.employee_email && (
                <p className="text-xs font-medium text-rose-500 mt-1">
                  • {errors.employee_email}
                </p>
              )}
            </div>

            {/* Grid: Job Title & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="job_title"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Job Title
                </label>
                <div className="relative flex items-center">
                  <Briefcase className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="job_title"
                    type="text"
                    value={formData.job_title}
                    onChange={(e) => handleChange("job_title", e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="department"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Department
                </label>
                <div className="relative flex items-center">
                  <Building className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="department"
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleChange("department", e.target.value)}
                    placeholder="e.g. Engineering"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  />
                </div>
              </div>
            </div>

            {/* Grid: Reporting Manager & Manager Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="manager_name"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Reporting Manager
                </label>
                <div className="relative flex items-center">
                  <UserCheck className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="manager_name"
                    type="text"
                    value={formData.manager_name}
                    onChange={(e) => handleChange("manager_name", e.target.value)}
                    placeholder="e.g. Alice"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="manager_email"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Manager Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="manager_email"
                    type="email"
                    value={formData.manager_email}
                    onChange={(e) => handleChange("manager_email", e.target.value)}
                    placeholder="e.g. alice@flowpilot.com"
                    className={`w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 ${
                      errors.manager_email
                        ? "border-rose-300 ring-4 ring-rose-500/10"
                        : "border-slate-200"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Grid: Start Date & Company Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="start_date"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Start Date
                </label>
                <div className="relative flex items-center">
                  <Calendar className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="start_date"
                    type="text"
                    value={formData.start_date}
                    onChange={(e) => handleChange("start_date", e.target.value)}
                    placeholder="e.g. 08/08/2026"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="company_name"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Company Name
                </label>
                <div className="relative flex items-center">
                  <Building className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="company_name"
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleChange("company_name", e.target.value)}
                    placeholder="e.g. FlowPilot"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  />
                </div>
              </div>
            </div>

            {/* Grid: Company Address & Company Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="company_address"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Company Address
                </label>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="company_address"
                    type="text"
                    value={formData.company_address}
                    onChange={(e) => handleChange("company_address", e.target.value)}
                    placeholder="e.g. Salem, Tamil Nadu"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="company_phone"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Company Phone
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="company_phone"
                    type="text"
                    value={formData.company_phone}
                    onChange={(e) => handleChange("company_phone", e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  />
                </div>
              </div>
            </div>

            {/* Form Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.98]"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Execute Workflow</span>
              </button>
            </div>
          </form>
        ) : phase === "executing" ? (
          /* =========================================================
             EXECUTION PROGRESS PHASE
             ========================================================= */
          <div className="flex-1 overflow-y-auto py-5 space-y-5 text-left">
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Execution Target</p>
                <p className="text-sm font-extrabold text-slate-900">{formData.employee_name || "Employee"}</p>
              </div>
              <span className="text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-lg">
                {formData.employee_email}
              </span>
            </div>

            {/* Vertical Step Pipeline */}
            <div className="relative pl-2 pr-1 space-y-4">
              {stepsConfig.map((step, idx) => {
                const state = stepStates[idx];
                const IconComponent = step.icon;

                const isRunning = state === "running";
                const isCompleted = state === "completed";
                const isFailed = state === "failed";

                return (
                  <div key={step.id} className="relative">
                    {/* Vertical Connector Line */}
                    {idx < stepsConfig.length - 1 && (
                      <div
                        className={`absolute left-5 top-10 bottom-[-16px] w-0.5 transition-colors duration-500 ${
                          isCompleted
                            ? "bg-emerald-500"
                            : isRunning
                            ? "bg-brand-400"
                            : "bg-slate-200"
                        }`}
                      />
                    )}

                    <div
                      className={`flex items-start gap-3.5 rounded-2xl border p-3.5 transition-all duration-300 ${
                        isRunning
                          ? "bg-brand-50/70 border-brand-300 ring-4 ring-brand-500/10 shadow-md transform scale-[1.01]"
                          : isCompleted
                          ? "bg-emerald-50/50 border-emerald-200 shadow-sm"
                          : isFailed
                          ? "bg-rose-50 border-rose-200 shadow-sm"
                          : "bg-slate-50/60 border-slate-200/70 opacity-60"
                      }`}
                    >
                      {/* Icon Container */}
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                          isRunning
                            ? "bg-brand-600 text-white shadow-brand-glow animate-pulse"
                            : isCompleted
                            ? "bg-emerald-600 text-white"
                            : isFailed
                            ? "bg-rose-600 text-white"
                            : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        {isRunning ? (
                          <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        ) : isCompleted ? (
                          <Check className="h-4.5 w-4.5 stroke-[3]" />
                        ) : isFailed ? (
                          <XCircle className="h-4.5 w-4.5" />
                        ) : (
                          <IconComponent className="h-4.5 w-4.5" />
                        )}
                      </div>

                      {/* Step Details */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={`text-[11px] font-extrabold uppercase tracking-wider ${
                              isRunning
                                ? "text-brand-700"
                                : isCompleted
                                ? "text-emerald-700"
                                : isFailed
                                ? "text-rose-700"
                                : "text-slate-400"
                            }`}
                          >
                            Step {idx + 1}: {step.label}
                          </h4>
                          {isRunning && (
                            <span className="text-[10px] font-bold text-brand-600 animate-pulse">
                              Processing...
                            </span>
                          )}
                        </div>

                        <p
                          className={`mt-0.5 text-xs font-semibold transition-colors duration-200 ${
                            isRunning
                              ? "text-brand-900"
                              : isCompleted
                              ? "text-emerald-950"
                              : isFailed
                              ? "text-rose-950"
                              : "text-slate-500"
                          }`}
                        >
                          {isCompleted
                            ? step.completedText
                            : isRunning
                            ? step.runningText
                            : step.runningText}
                        </p>

                        {/* Live AI Streaming Preview Box */}
                        {step.id === "ai" && (isRunning || isCompleted) && aiPreviewText && (
                          <div className="mt-2.5 rounded-xl border border-brand-200/80 bg-white p-3 shadow-inner">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-700 uppercase tracking-wider mb-1">
                              <Bot className="h-3 w-3 text-brand-600" />
                              <span>AI Generated Welcome Preview</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                              {aiPreviewText}
                              {isTypingAi && (
                                <span className="inline-block w-1.5 h-3.5 bg-brand-600 ml-0.5 animate-pulse" />
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : phase === "success" ? (
          /* =========================================================
             SUCCESS PHASE
             ========================================================= */
          <div className="flex-1 overflow-y-auto py-6 px-2 text-center space-y-5">
            {/* Animated Success Badge */}
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-500/10 ring-8 ring-emerald-50">
              <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
              {/* Confetti sparkle SVG accents */}
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-brand-400 animate-ping" />
              <span className="absolute -bottom-1 -left-1 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Workflow completed successfully
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Your onboarding automation has finished executing.
              </p>
            </div>

            {/* Execution Summary Card */}
            <div className="mx-auto max-w-md rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-left space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Employee</span>
                <span className="text-sm font-bold text-slate-900">{formData.employee_name || "Abi"}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recipient</span>
                <span className="text-xs font-bold text-brand-600">{formData.employee_email}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Workflow</span>
                <span className="text-xs font-bold text-slate-700 truncate max-w-[180px]">
                  {workflowTitle || "Employee Onboarding"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Steps completed</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                  3 / 3
                </span>
              </div>
            </div>

            {/* Email Confirmation Notice */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 text-xs font-bold text-emerald-800 flex items-center justify-center gap-2">
              <Mail className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Welcome email sent successfully to {formData.employee_email}.</span>
            </div>

            {/* Done Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.98]"
              >
                <span>Done</span>
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================
             FAILURE PHASE
             ========================================================= */
          <div className="flex-1 overflow-y-auto py-6 px-2 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 ring-8 ring-rose-50">
              <XCircle className="h-10 w-10 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Workflow execution failed
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                An error occurred during workflow execution pipeline.
              </p>
            </div>

            {errorMessage && (
              <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">
                  Error Message
                </p>
                <p className="text-xs font-semibold text-rose-900 leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPhase("form")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800"
              >
                <span>Close</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
