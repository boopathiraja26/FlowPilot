"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
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
  Bot,
  ChevronRight,
  Activity,
  Terminal,
} from "lucide-react";

// =========================================================
// Public types (consumed by page.tsx)
// =========================================================

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
  onExecute: (payload: RuntimeTriggerPayload) => Promise<unknown>;
  initialValues?: Partial<RuntimeTriggerPayload>;
  workflowTitle?: string;
  isExecuting?: boolean;
  executionError?: string | null;
}

// =========================================================
// Internal types
// =========================================================

type ModalPhase = "form" | "executing" | "success" | "failed";
type StepStatus = "pending" | "running" | "completed" | "failed";

// =========================================================
// Constants
// =========================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FOOTER_MESSAGES = [
  "Connecting to workflow engine...",
  "Processing trigger event payload...",
  "Gemini AI is analyzing profile context...",
  "Generating personalized email template...",
  "Connecting to SMTP relay server...",
  "Sending email to recipient queue...",
  "Finalizing workflow execution...",
];

const EMAIL_PIPELINE = [
  "Preparing welcome email...",
  "Resolving employee payload variables...",
  "Building responsive email template...",
  "Connecting to SMTP server...",
  "Sending email...",
  "✓ Email delivered successfully",
];

// =========================================================
// Connector component — animated vertical line between steps
// =========================================================

function Connector({ from }: { from: StepStatus }) {
  return (
    <div className="flex justify-center my-0.5">
      <div className="relative w-0.5 h-7 overflow-hidden rounded-full">
        {/* Base track */}
        <div
          className={`absolute inset-0 transition-colors duration-500 ${
            from === "completed"
              ? "bg-emerald-500"
              : from === "running"
              ? "bg-blue-500"
              : "bg-slate-800"
          }`}
        />
        {/* Animated travel glow when running */}
        {from === "running" && (
          <div className="absolute inset-x-0 h-4 bg-gradient-to-b from-blue-400 to-transparent rounded-full animate-connector-flow" />
        )}
      </div>
    </div>
  );
}

// =========================================================
// StepIcon — icon with status-aware styling
// =========================================================

function StepIcon({
  status,
  FallbackIcon,
  isAi,
}: {
  status: StepStatus;
  FallbackIcon: React.ElementType;
  isAi?: boolean;
}) {
  const base =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300";

  if (status === "running") {
    return (
      <div className={`${base} bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-brand-glow animate-pulse-glow`}>
        {isAi ? (
          <Sparkles className="h-4.5 w-4.5 animate-glow-soft" />
        ) : (
          <Loader2 className="h-4.5 w-4.5 animate-spin" />
        )}
      </div>
    );
  }
  if (status === "completed") {
    return (
      <div className={`${base} bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-scale-in`}>
        <Check className="h-4.5 w-4.5 stroke-[3]" />
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className={`${base} bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]`}>
        <XCircle className="h-4.5 w-4.5" />
      </div>
    );
  }
  // pending
  return (
    <div className={`${base} border border-white/[0.08] bg-dark-850 text-slate-500`}>
      <FallbackIcon className="h-4.5 w-4.5" />
    </div>
  );
}

// =========================================================
// Main component
// =========================================================

export function ExecuteWorkflowModal({
  isOpen,
  onClose,
  onExecute,
  initialValues,
  workflowTitle,
  executionError: externalError,
  isExecuting,
}: ExecuteWorkflowModalProps) {
  const router = useRouter();

  // -- Form state --
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
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof RuntimeTriggerPayload, string>>
  >({});

  // -- Phase & step state --
  const [phase, setPhase] = useState<ModalPhase>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [steps, setSteps] = useState<StepStatus[]>(["pending", "pending", "pending"]);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  // -- AI reveal --
  const [aiRevealText, setAiRevealText] = useState("");
  const [isRevealingAi, setIsRevealingAi] = useState(false);
  const [aiSubStatus, setAiSubStatus] = useState("Analyzing employee information...");

  // -- Email pipeline --
  const [emailStatusIdx, setEmailStatusIdx] = useState(0);

  // -- Footer carousel --
  const [footerIdx, setFooterIdx] = useState(0);
  const [footerVisible, setFooterVisible] = useState(true);

  // -- Error --
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // -- Timer cleanup refs --
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRefs = useRef<ReturnType<typeof setInterval>[]>([]);

  function addTimer(id: ReturnType<typeof setTimeout>) {
    timerRefs.current.push(id);
  }
  function addInterval(id: ReturnType<typeof setInterval>) {
    intervalRefs.current.push(id);
  }
  function clearAllTimers() {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    intervalRefs.current.forEach(clearInterval);
    intervalRefs.current = [];
  }

  const prevIsOpenRef = useRef(false);

  // -- Reset on open --
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
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
      setFormErrors({});
      setPhase("form");
      setIsSubmitting(false);
      setSteps(["pending", "pending", "pending"]);
      setAiRevealText("");
      setIsRevealingAi(false);
      setAiSubStatus("Analyzing employee profile...");
      setEmailStatusIdx(0);
      setFooterIdx(0);
      setFooterVisible(true);
      setErrorMessage(null);
      setExecutionId(null);
      setLogMessages([]);
      clearAllTimers();
    }
    prevIsOpenRef.current = isOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // -- Cleanup on unmount --
  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  // -- Footer carousel during executing --
  useEffect(() => {
    if (phase !== "executing") return;
    const id = setInterval(() => {
      setFooterVisible(false);
      const t = setTimeout(() => {
        setFooterIdx((i) => (i + 1) % FOOTER_MESSAGES.length);
        setFooterVisible(true);
      }, 300);
      addTimer(t);
    }, 2400);
    addInterval(id);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // -- ESC key --
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && phase !== "executing") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, phase, onClose]);

  if (!isOpen) return null;

  // ---- Form helpers ----
  function handleChange(field: keyof RuntimeTriggerPayload, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof RuntimeTriggerPayload, string>> = {};
    if (!formData.employee_name.trim()) errs.employee_name = "Full Name is required.";
    if (!formData.employee_email.trim()) {
      errs.employee_email = "Work Email is required.";
    } else if (!EMAIL_REGEX.test(formData.employee_email.trim())) {
      errs.employee_email = "Please enter a valid email address.";
    }
    if (formData.manager_email.trim() && !EMAIL_REGEX.test(formData.manager_email.trim())) {
      errs.manager_email = "Please enter a valid email address.";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ---- AI typewriter ----
  async function revealAiText(fullText: string) {
    setIsRevealingAi(true);
    setAiRevealText("");
    const CHUNK = 5;
    for (let i = 0; i <= fullText.length; i += CHUNK) {
      setAiRevealText(fullText.slice(0, i));
      await new Promise<void>((r) => {
        const t = setTimeout(r, 18);
        addTimer(t);
      });
    }
    setAiRevealText(fullText);
    setIsRevealingAi(false);
  }

  // ---- Execute handler ----
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting || phase === "executing" || isExecuting) return;
    if (!validate()) return;

    setIsSubmitting(true);
    clearAllTimers();
    setPhase("executing");
    setErrorMessage(null);
    setSteps(["running", "pending", "pending"]);
    setLogMessages([
      "FlowPilot Execution Engine initialized",
      `Trigger payload captured for ${formData.employee_name}`,
    ]);
    setAiRevealText("");
    setIsRevealingAi(false);
    setAiSubStatus("Analyzing employee profile...");
    setEmailStatusIdx(0);
    setFooterIdx(0);
    setExecutionId(null);

    // Fire backend API call immediately in background
    const apiPromise = onExecute(formData);

    // ── STEP 1: TRIGGER ANIMATION ───────────
    await new Promise<void>((r) => { const t = setTimeout(r, 700); addTimer(t); });
    setSteps(["completed", "running", "pending"]);
    setLogMessages((prev) => [
      ...prev,
      `Trigger validated for ${formData.employee_name} (${formData.employee_email})`,
      "Starting AI Assistant node (Gemini 2.5 Flash)...",
    ]);

    // ── STEP 2: AI ASSISTANT ANIMATION ─────────
    const aiMessages = [
      "Analyzing employee profile...",
      "Personalizing welcome message...",
      "Crafting AI response...",
    ];
    let aiMsgIdx = 0;
    setAiSubStatus(aiMessages[0]);
    const aiRotateId = setInterval(() => {
      aiMsgIdx = (aiMsgIdx + 1) % aiMessages.length;
      setAiSubStatus(aiMessages[aiMsgIdx]);
    }, 600);
    addInterval(aiRotateId);

    try {
      const res = (await apiPromise) as Record<string, unknown>;
      clearInterval(aiRotateId);

      if (res && res.success === false) {
        throw new Error(
          (typeof res.message === "string" && res.message) ||
          "Workflow execution failed on server."
        );
      }

      const rawData = res?.data as Record<string, unknown> | undefined;
      const execution =
        rawData && typeof rawData === "object" && rawData.execution
          ? (rawData.execution as Record<string, unknown>)
          : (res?.execution as Record<string, unknown> | undefined) ||
            (rawData && typeof rawData === "object" && !rawData.execution ? rawData : undefined);

      if (execution && execution.status === "FAILED") {
        throw new Error(
          (typeof execution.message === "string" && execution.message) ||
          "Workflow execution failed on server."
        );
      }

      const actualExecutionId =
        (typeof execution?.id === "string" && execution.id) ||
        (typeof res?.executionId === "string" && res.executionId) ||
        (typeof rawData?.executionId === "string" && rawData.executionId) ||
        null;

      if (actualExecutionId) {
        setExecutionId(actualExecutionId);
      }

      const logs = (execution?.logs as Array<Record<string, unknown>>) || [];
      const aiLog = logs.find((l) => l.stepType === "AI");
      const aiMessage =
        (aiLog?.message as string) ||
        `Welcome to ${formData.company_name || "FlowPilot"}, ${formData.employee_name}! 🎉\n\nOn behalf of the entire team, we're thrilled to have you join us as our new ${formData.job_title || "team member"}.\n\nYour start date is ${formData.start_date || "coming soon"} — we can't wait to see the amazing things you'll accomplish.`;

      await new Promise<void>((r) => { const t = setTimeout(r, 500); addTimer(t); });
      await revealAiText(aiMessage);
      setLogMessages((prev) => [
        ...prev,
        "AI welcome message generated via Gemini AI",
        "Starting Email Dispatch node...",
      ]);

      // ── STEP 3: EMAIL DISPATCH ANIMATION ──────────────
      setSteps(["completed", "completed", "running"]);
      setEmailStatusIdx(0);
      setLogMessages((prev) => [
        ...prev,
        "Connecting to SMTP server...",
        `Sending welcome email to ${formData.employee_email}...`,
      ]);

      for (let i = 0; i < EMAIL_PIPELINE.length; i++) {
        setEmailStatusIdx(i);
        await new Promise<void>((r) => {
          const t = setTimeout(r, i === EMAIL_PIPELINE.length - 1 ? 400 : 250);
          addTimer(t);
        });
      }

      setSteps(["completed", "completed", "completed"]);
      setLogMessages((prev) => [
        ...prev,
        "Welcome email sent successfully",
        "Workflow execution completed successfully",
      ]);
      await new Promise<void>((r) => { const t = setTimeout(r, 400); addTimer(t); });
      setPhase("success");
    } catch (err: unknown) {
      clearInterval(aiRotateId);
      const msg =
        (err as { message?: string })?.message ||
        externalError ||
        "Execution failed. Please check your inputs and try again.";
      setErrorMessage(msg);
      setLogMessages((prev) => [...prev, `ERROR: ${msg}`]);
      setSteps((prev) => {
        const next = [...prev];
        const runIdx = next.indexOf("running");
        if (runIdx !== -1) next[runIdx] = "failed";
        else next[1] = "failed";
        return next;
      });
      setPhase("failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  const stepsConfig = [
    {
      id: "trigger" as const,
      label: "Trigger",
      FallbackIcon: Zap,
      runningLabel: "Receiving employee information...",
      completedLabel: "Employee payload validated",
      isAi: false,
    },
    {
      id: "ai" as const,
      label: "AI Assistant",
      FallbackIcon: Sparkles,
      runningLabel: aiSubStatus,
      completedLabel: "Welcome message generated",
      isAi: true,
    },
    {
      id: "email" as const,
      label: "Email Dispatch",
      FallbackIcon: Send,
      runningLabel: EMAIL_PIPELINE[emailStatusIdx] || "Processing...",
      completedLabel: "Welcome email sent successfully",
      isAi: false,
    },
  ];

  function inputCls(hasError?: boolean) {
    return `w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 bg-dark-950 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 ${
      hasError ? "border-rose-500/50 ring-4 ring-rose-500/10" : "border-white/[0.08] hover:border-white/[0.16]"
    }`;
  }

  return (
    <>
      <style>{`
        @keyframes connectorFlowKf {
          0%   { top: -100%; }
          100% { top: 100%;  }
        }
        .animate-connector-flow {
          animation: connectorFlowKf 1.2s linear infinite;
        }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md transition-all duration-300">
        <div
          className="fixed inset-0"
          onClick={() => {
            if (phase !== "executing") onClose();
          }}
        />

        {/* Modal card */}
        <div
          className="relative z-10 w-full max-w-xl rounded-3xl border border-white/[0.08] bg-dark-900/95 shadow-2xl backdrop-blur-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-white/[0.08] shrink-0">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-brand-glow mt-0.5">
                <Zap className="h-5 w-5 fill-current" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-white">
                    {phase === "form"
                      ? "Execute Workflow"
                      : phase === "executing"
                      ? "Running Workflow Pipeline"
                      : phase === "success"
                      ? "Workflow Pipeline Completed!"
                      : "Execution Failed"}
                  </h2>

                  {phase === "executing" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-950/70 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30 shadow-brand-glow">
                      <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
                      ● LIVE
                    </span>
                  )}

                  {phase === "success" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/70 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                      <Check className="h-3 w-3 stroke-[3]" />
                      COMPLETED
                    </span>
                  )}

                  {phase === "failed" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-950/70 px-2.5 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
                      <XCircle className="h-3 w-3" />
                      FAILED
                    </span>
                  )}
                </div>

                {workflowTitle && (
                  <p className="text-[11px] font-semibold text-blue-400 mt-0.5">
                    {workflowTitle}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={phase === "executing"}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors disabled:opacity-30"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {/* FORM PHASE */}
            {phase === "form" && (
              <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 space-y-4 text-left">
                {(externalError || errorMessage) && (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-950/60 p-3 text-xs font-semibold text-rose-300">
                    {externalError || errorMessage}
                  </div>
                )}

                {/* Full Name */}
                <div className="space-y-1">
                  <label htmlFor="employee_name" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
                    <input
                      id="employee_name"
                      type="text"
                      value={formData.employee_name}
                      onChange={(e) => handleChange("employee_name", e.target.value)}
                      placeholder="e.g. Boopathi"
                      className={inputCls(!!formErrors.employee_name)}
                    />
                  </div>
                  {formErrors.employee_name && (
                    <p className="text-xs font-medium text-rose-400 mt-1">• {formErrors.employee_name}</p>
                  )}
                </div>

                {/* Work Email */}
                <div className="space-y-1">
                  <label htmlFor="employee_email" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Work Email <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
                    <input
                      id="employee_email"
                      type="email"
                      value={formData.employee_email}
                      onChange={(e) => handleChange("employee_email", e.target.value)}
                      placeholder="e.g. boopathiraja26ab@gmail.com"
                      className={inputCls(!!formErrors.employee_email)}
                    />
                  </div>
                  {formErrors.employee_email && (
                    <p className="text-xs font-medium text-rose-400 mt-1">• {formErrors.employee_email}</p>
                  )}
                </div>

                {/* Job Title & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="job_title" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Job Title
                    </label>
                    <div className="relative flex items-center">
                      <Briefcase className="absolute left-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
                      <input
                        id="job_title"
                        type="text"
                        value={formData.job_title}
                        onChange={(e) => handleChange("job_title", e.target.value)}
                        placeholder="e.g. Software Engineer"
                        className={inputCls()}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="department" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Department
                    </label>
                    <div className="relative flex items-center">
                      <Building className="absolute left-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
                      <input
                        id="department"
                        type="text"
                        value={formData.department}
                        onChange={(e) => handleChange("department", e.target.value)}
                        placeholder="e.g. Engineering"
                        className={inputCls()}
                      />
                    </div>
                  </div>
                </div>

                {/* Manager Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="manager_name" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Reporting Manager
                    </label>
                    <div className="relative flex items-center">
                      <UserCheck className="absolute left-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
                      <input
                        id="manager_name"
                        type="text"
                        value={formData.manager_name}
                        onChange={(e) => handleChange("manager_name", e.target.value)}
                        placeholder="e.g. Alice"
                        className={inputCls()}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="manager_email" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Manager Email
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
                      <input
                        id="manager_email"
                        type="email"
                        value={formData.manager_email}
                        onChange={(e) => handleChange("manager_email", e.target.value)}
                        placeholder="e.g. manager@flowpilot.com"
                        className={inputCls(!!formErrors.manager_email)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-white/[0.08] bg-dark-850 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-dark-800 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-brand-glow transition-all hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] border border-blue-400/20"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Run Workflow</span>
                  </button>
                </div>
              </form>
            )}

            {/* EXECUTING & SUCCESS PHASES */}
            {(phase === "executing" || phase === "success") && (
              <div className="p-6 space-y-6">
                {/* Step Pipeline Visualization */}
                <div className="rounded-2xl border border-white/[0.08] bg-dark-950 p-4 space-y-3">
                  {stepsConfig.map((sc, idx) => {
                    const status = steps[idx];
                    return (
                      <div key={sc.id}>
                        <div className="flex items-center gap-3">
                          <StepIcon status={status} FallbackIcon={sc.FallbackIcon} isAi={sc.isAi} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-white">{sc.label}</h4>
                              <span className="text-[10px] font-mono uppercase text-slate-400">
                                {status === "completed" ? "Done" : status === "running" ? "Running" : "Waiting"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {status === "completed" ? sc.completedLabel : status === "running" ? sc.runningLabel : "Pending execution"}
                            </p>
                          </div>
                        </div>
                        {idx < stepsConfig.length - 1 && <Connector from={status} />}
                      </div>
                    );
                  })}
                </div>

                {/* AI Typewriter Result Display */}
                {aiRevealText && (
                  <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 animate-fade-in shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-purple-400">
                      <Sparkles className="h-4 w-4" />
                      <span>Gemini AI Generated Content</span>
                    </div>
                    <pre className="font-sans text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {aiRevealText}
                    </pre>
                  </div>
                )}

                {/* Footer status / Action */}
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
                  {phase === "executing" ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                      <span className={`transition-opacity duration-300 ${footerVisible ? "opacity-100" : "opacity-0"}`}>
                        {FOOTER_MESSAGES[footerIdx]}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Execution finished successfully!</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {executionId && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              router.push(`/dashboard/executions/${executionId}`);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.12] bg-dark-850 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-dark-800 transition-colors"
                          >
                            <span>Inspect Log</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-brand-glow hover:from-blue-500 hover:to-indigo-500 transition-all border border-blue-400/20"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FAILED PHASE */}
            {phase === "failed" && (
              <div className="p-6 space-y-4">
                <div className="rounded-2xl border border-rose-500/30 bg-rose-950/50 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400 mb-1">
                    <XCircle className="h-4 w-4" />
                    <span>Execution Error</span>
                  </div>
                  <p className="text-xs text-rose-200 leading-relaxed font-mono">
                    {errorMessage || "An error occurred during workflow execution."}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => {
                      setPhase("form");
                      setSteps(["pending", "pending", "pending"]);
                      setAiRevealText("");
                      setEmailStatusIdx(0);
                      setErrorMessage(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-dark-850 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-dark-800 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Retry</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl bg-dark-800 px-4 py-2 text-xs font-bold text-white hover:bg-dark-750 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
