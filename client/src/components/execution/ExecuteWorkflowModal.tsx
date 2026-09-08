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
  "Processing trigger event...",
  "AI is preparing your message...",
  "Generating personalized content...",
  "Preparing welcome email...",
  "Sending email to recipient...",
  "Finalizing workflow execution...",
];

const EMAIL_PIPELINE = [
  "Preparing welcome email...",
  "Resolving employee details...",
  "Building HTML email template...",
  "Connecting to SMTP server...",
  "Sending email...",
  "\u2713 Email sent successfully",
];

// =========================================================
// Connector component — animated vertical line between steps
// =========================================================

function Connector({ from }: { from: StepStatus }) {
  return (
    <div className="flex justify-center my-0.5">
      <div className="relative w-0.5 h-8 overflow-hidden rounded-full">
        {/* Base track */}
        <div
          className={`absolute inset-0 transition-colors duration-500 ${
            from === "completed"
              ? "bg-emerald-400"
              : from === "running"
              ? "bg-brand-300"
              : "bg-slate-200"
          }`}
        />
        {/* Animated travel glow when running */}
        {from === "running" && (
          <div className="absolute inset-x-0 h-4 bg-gradient-to-b from-brand-500 to-transparent rounded-full animate-connector-flow" />
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
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300";

  if (status === "running") {
    return (
      <div className={`${base} bg-brand-600 text-white shadow-brand-glow animate-pulse-glow`}>
        {isAi ? (
          <Sparkles className="h-5 w-5 animate-glow-soft" />
        ) : (
          <Loader2 className="h-5 w-5 animate-spin" />
        )}
      </div>
    );
  }
  if (status === "completed") {
    return (
      <div className={`${base} bg-emerald-600 text-white animate-scale-in`}>
        <Check className="h-5 w-5 stroke-[3]" />
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className={`${base} bg-rose-600 text-white`}>
        <XCircle className="h-5 w-5" />
      </div>
    );
  }
  // pending
  return (
    <div className={`${base} border-2 border-slate-200 bg-slate-50 text-slate-300`}>
      <FallbackIcon className="h-5 w-5" />
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
      setAiSubStatus("Analyzing employee information...");
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
      "FlowPilot Execution Engine v1.0 initialized",
      `Trigger payload captured for ${formData.employee_name}`,
    ]);
    setAiRevealText("");
    setIsRevealingAi(false);
    setAiSubStatus("Analyzing employee information...");
    setEmailStatusIdx(0);
    setFooterIdx(0);
    setExecutionId(null);

    // Fire backend API call immediately in background
    const apiPromise = onExecute(formData);

    // ── STEP 1: TRIGGER ANIMATION (0 - 700ms) ───────────
    await new Promise<void>((r) => { const t = setTimeout(r, 700); addTimer(t); });
    setSteps(["completed", "running", "pending"]);
    setLogMessages((prev) => [
      ...prev,
      `Trigger validated for ${formData.employee_name} (${formData.employee_email})`,
      "Starting AI Assistant node (Gemini 2.5 Flash)...",
    ]);

    // ── STEP 2: AI ASSISTANT ANIMATION (700ms+) ─────────
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
      // Await real API response
      const res = (await apiPromise) as Record<string, unknown>;
      clearInterval(aiRotateId);

      // Verify API success
      if (res && res.success === false) {
        throw new Error(
          (typeof res.message === "string" && res.message) ||
          "Workflow execution failed on server."
        );
      }

      // Extract AI message & Execution ID
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

      // Minimum visual duration for AI step
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

  // ---- Step config (3 real steps) ----

  const stepsConfig = [
    {
      id: "trigger" as const,
      label: "Trigger",
      FallbackIcon: Zap,
      runningLabel: "Receiving employee information...",
      completedLabel: "Employee information received",
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
      label: "Email",
      FallbackIcon: Send,
      runningLabel: EMAIL_PIPELINE[emailStatusIdx] || "Processing...",
      completedLabel: "Welcome email sent successfully",
      isAi: false,
    },
  ];

  // ---- Input helper ----

  function inputCls(hasError?: boolean) {
    return `w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white transition-all outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 ${
      hasError ? "border-rose-300 ring-4 ring-rose-500/10" : "border-slate-200"
    }`;
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      {/* Inline keyframe for connector flow animation */}
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-all duration-300">
        {/* Click-away area */}
        <div
          className="fixed inset-0"
          onClick={() => {
            if (phase !== "executing") onClose();
          }}
        />

        {/* Modal card */}
        <div
          className="relative z-10 w-full max-w-xl rounded-2xl border border-slate-200/90 bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exec-modal-title"
        >
          {/* ── HEADER ────────────────────────────────── */}
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-brand-glow mt-0.5">
                <Zap className="h-5 w-5 fill-current" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2
                    id="exec-modal-title"
                    className="text-base font-extrabold text-slate-900"
                  >
                    {phase === "form"
                      ? "Execute Workflow"
                      : phase === "executing"
                      ? "Running Workflow"
                      : phase === "success"
                      ? "Workflow Completed!"
                      : "Execution Failed"}
                  </h2>

                  {phase === "executing" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-extrabold text-brand-700 border border-brand-200 shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-brand-500 animate-ping" />
                      ● LIVE
                    </span>
                  )}

                  {phase === "success" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">
                      <Check className="h-3 w-3 stroke-[3]" />
                      COMPLETED
                    </span>
                  )}

                  {phase === "failed" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-extrabold text-rose-700 border border-rose-200">
                      <XCircle className="h-3 w-3" />
                      FAILED
                    </span>
                  )}
                </div>

                {workflowTitle && (
                  <p className="text-[11px] font-semibold text-brand-600 mt-0.5">
                    {workflowTitle}
                  </p>
                )}

                <p className="mt-0.5 text-xs text-slate-500">
                  {phase === "form"
                    ? "Enter employee details for runtime execution context."
                    : phase === "executing"
                    ? "FlowPilot engine is executing your workflow..."
                    : phase === "success"
                    ? "All workflow steps completed successfully."
                    : "An error occurred during workflow execution."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={phase === "executing"}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-30"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* ── BODY ──────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            {/* ━━━━━━━━━━━━━━━━ FORM PHASE ━━━━━━━━━━━━━━━━ */}
            {phase === "form" && (
              <form
                onSubmit={handleSubmit}
                className="px-6 pt-5 pb-6 space-y-4 text-left"
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
                      onChange={(e) =>
                        handleChange("employee_name", e.target.value)
                      }
                      placeholder="e.g. Boopathi"
                      className={inputCls(!!formErrors.employee_name)}
                    />
                  </div>
                  {formErrors.employee_name && (
                    <p className="text-xs font-medium text-rose-500 mt-1">
                      &bull; {formErrors.employee_name}
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
                      onChange={(e) =>
                        handleChange("employee_email", e.target.value)
                      }
                      placeholder="e.g. boopathiraja26ab@gmail.com"
                      className={inputCls(!!formErrors.employee_email)}
                    />
                  </div>
                  {formErrors.employee_email && (
                    <p className="text-xs font-medium text-rose-500 mt-1">
                      &bull; {formErrors.employee_email}
                    </p>
                  )}
                </div>

                {/* Job Title & Department */}
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
                        onChange={(e) =>
                          handleChange("job_title", e.target.value)
                        }
                        placeholder="e.g. Software Engineer"
                        className={inputCls()}
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
                        onChange={(e) =>
                          handleChange("department", e.target.value)
                        }
                        placeholder="e.g. Engineering"
                        className={inputCls()}
                      />
                    </div>
                  </div>
                </div>

                {/* Manager Name & Email */}
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
                        onChange={(e) =>
                          handleChange("manager_name", e.target.value)
                        }
                        placeholder="e.g. Alice"
                        className={inputCls()}
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
                        onChange={(e) =>
                          handleChange("manager_email", e.target.value)
                        }
                        placeholder="e.g. alice@flowpilot.com"
                        className={inputCls(!!formErrors.manager_email)}
                      />
                    </div>
                    {formErrors.manager_email && (
                      <p className="text-xs font-medium text-rose-500 mt-1">
                        &bull; {formErrors.manager_email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Start Date & Company Name */}
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
                        onChange={(e) =>
                          handleChange("start_date", e.target.value)
                        }
                        placeholder="e.g. 08/08/2026"
                        className={inputCls()}
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
                        onChange={(e) =>
                          handleChange("company_name", e.target.value)
                        }
                        placeholder="e.g. FlowPilot"
                        className={inputCls()}
                      />
                    </div>
                  </div>
                </div>

                {/* Company Address & Phone */}
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
                        onChange={(e) =>
                          handleChange("company_address", e.target.value)
                        }
                        placeholder="e.g. Salem, Tamil Nadu"
                        className={inputCls()}
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
                        onChange={(e) =>
                          handleChange("company_phone", e.target.value)
                        }
                        placeholder="e.g. +91 9876543210"
                        className={inputCls()}
                      />
                    </div>
                  </div>
                </div>

                {/* Form footer */}
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
            )}

            {/* ━━━━━━━━━━━━━━━━ EXECUTING PHASE ━━━━━━━━━━━━━━━━ */}
            {phase === "executing" && (
              <div className="px-6 pt-5 pb-6 space-y-4 animate-fade-in">
                {/* ── Compact progress indicator ────────── */}
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span>Trigger</span>
                      <ChevronRight className="h-3 w-3 text-slate-400" />
                      <span>AI Assistant</span>
                      <ChevronRight className="h-3 w-3 text-slate-400" />
                      <span>Email</span>
                    </span>
                    <span className="text-brand-600 font-mono">
                      {steps.filter((s) => s === "completed").length} / {steps.length}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-600 h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${(steps.filter((s) => s === "completed").length / steps.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Target pill */}
                <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 px-4 py-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Execution Target
                    </p>
                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {formData.employee_name || "Employee"}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-lg">
                    {formData.employee_email}
                  </span>
                </div>

                {/* ── Step timeline ───────────────────── */}
                <div>
                  {stepsConfig.map((step, idx) => {
                    const status = steps[idx];
                    const isRunning = status === "running";
                    const isCompleted = status === "completed";
                    const isFailed = status === "failed";
                    const isPending = status === "pending";

                    return (
                      <div key={step.id}>
                        {/* Connector above (except first) */}
                        {idx > 0 && <Connector from={steps[idx - 1]} />}

                        {/* Step card */}
                        <div
                          className={`relative rounded-2xl border p-4 transition-all duration-300 ${
                            isRunning
                              ? "bg-brand-50/60 border-brand-300 ring-4 ring-brand-500/10 shadow-brand-glow"
                              : isCompleted
                              ? "bg-emerald-50/50 border-emerald-200 shadow-sm"
                              : isFailed
                              ? "bg-rose-50 border-rose-200 shadow-sm"
                              : "bg-slate-50/50 border-slate-200/70 opacity-55"
                          }`}
                        >
                          {/* Shimmer overlay when running */}
                          {isRunning && (
                            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                              <div className="absolute inset-y-0 -left-full w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
                            </div>
                          )}

                          <div className="flex items-start gap-3.5">
                            <StepIcon
                              status={status}
                              FallbackIcon={step.FallbackIcon}
                              isAi={step.isAi}
                            />

                            <div className="flex-1 min-w-0 pt-0.5">
                              {/* Step header */}
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`text-xs font-extrabold uppercase tracking-wider ${
                                    isRunning
                                      ? "text-brand-700"
                                      : isCompleted
                                      ? "text-emerald-700"
                                      : isFailed
                                      ? "text-rose-700"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {step.label}
                                </span>
                                {isRunning && (
                                  <span className="text-[10px] font-bold text-brand-500 animate-pulse">
                                    Processing...
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                                    <Check className="h-3 w-3 stroke-[3]" />{" "}
                                    Done
                                  </span>
                                )}
                              </div>

                              {/* Sub-text */}
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
                                  ? step.completedLabel
                                  : isPending
                                  ? "Waiting..."
                                  : isFailed
                                  ? "Step failed"
                                  : step.runningLabel}
                              </p>

                              {/* ── Trigger detail badges ── */}
                              {step.id === "trigger" && isCompleted && (
                                <div className="mt-2.5 flex flex-wrap gap-1.5 animate-fade-in">
                                  {[
                                    `\u2713 Employee name received`,
                                    `\u2713 Employee email received`,
                                    "\u2713 Employee details validated",
                                  ].map((badge) => (
                                    <span
                                      key={badge}
                                      className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800"
                                    >
                                      {badge}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* ── AI message preview card ── */}
                              {step.id === "ai" &&
                                (isRunning || isCompleted) &&
                                aiRevealText && (
                                  <div className="mt-3 rounded-xl border border-brand-200/80 bg-white shadow-inner overflow-hidden animate-fade-in">
                                    {/* Card header */}
                                    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-brand-100 bg-brand-50/60">
                                      <Bot className="h-3.5 w-3.5 text-brand-600" />
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">
                                        AI Generated Message
                                      </span>
                                    </div>
                                    {/* Typewriter text */}
                                    <div className="px-3 py-2.5">
                                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-sans">
                                        {aiRevealText}
                                        {isRevealingAi && (
                                          <span className="inline-block w-[3px] h-3.5 bg-brand-600 ml-0.5 align-middle animate-pulse" />
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                )}

                              {/* ── Email pipeline status ── */}
                              {step.id === "email" && isRunning && (
                                <div className="mt-2.5 space-y-1.5 animate-fade-in">
                                  {EMAIL_PIPELINE.slice(
                                    0,
                                    emailStatusIdx + 1
                                  ).map((msg, i) => (
                                    <div
                                      key={i}
                                      className={`flex items-center gap-2 text-[11px] font-medium ${
                                        i === emailStatusIdx
                                          ? "text-brand-700"
                                          : "text-slate-400"
                                      }`}
                                    >
                                      {i < emailStatusIdx ? (
                                        <Check className="h-3 w-3 text-emerald-500 shrink-0 stroke-[3]" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3 text-brand-500 shrink-0 animate-pulse" />
                                      )}
                                      {msg}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Live Execution Console ───────────────── */}
                <div className="rounded-xl border border-slate-900 bg-slate-950 p-3.5 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Live Execution Console
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">
                      FlowPilot Engine
                    </span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] max-h-28 overflow-y-auto pr-1">
                    {logMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-1.5 leading-relaxed ${
                          msg.startsWith("ERROR")
                            ? "text-rose-400"
                            : i === logMessages.length - 1
                            ? "text-brand-300 font-semibold"
                            : "text-slate-400"
                        }`}
                      >
                        <span className="text-slate-600 select-none">&gt;</span>
                        <span>{msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ━━━━━━━━━━━━━━━━ SUCCESS PHASE ━━━━━━━━━━━━━━━━ */}
            {phase === "success" && (
              <div className="px-6 pt-6 pb-8 text-center space-y-5 animate-fade-in">
                {/* Animated checkmark badge */}
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-500/10 ring-8 ring-emerald-50">
                  <CheckCircle2 className="h-10 w-10 stroke-[2.5] animate-scale-in" />
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

                {/* Step checklist */}
                <div className="mx-auto max-w-md rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 space-y-2 text-left">
                  <div className="flex items-center justify-between text-xs border-b border-slate-200/60 pb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                      Trigger
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                      Completed
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-b border-slate-200/60 pb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                      AI Assistant
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                      Completed
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                      Email
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                      Sent
                    </span>
                  </div>
                </div>

                {/* Summary card */}
                <div className="mx-auto max-w-md rounded-2xl border border-slate-200/80 bg-white p-4 text-left space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Recipient
                    </span>
                    <span className="text-xs font-mono font-bold text-brand-600">
                      {formData.employee_email}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Employee
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {formData.employee_name || "Employee"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Workflow
                    </span>
                    <span className="text-xs font-bold text-slate-700 truncate max-w-[180px]">
                      {workflowTitle || "Employee Onboarding"}
                    </span>
                  </div>
                </div>

                {/* Email confirmation */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 text-xs font-bold text-emerald-800 flex items-center justify-center gap-2 max-w-md mx-auto">
                  <Mail className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    Welcome email sent successfully to {formData.employee_email}.
                  </span>
                </div>

                {/* Success action buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  {executionId && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push(`/dashboard/executions/${executionId}`);
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-brand-glow active:scale-[0.98]"
                    >
                      <Activity className="h-4 w-4" />
                      <span>View Execution</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    <span>Close</span>
                  </button>
                </div>
              </div>
            )}

            {/* ━━━━━━━━━━━━━━━━ FAILURE PHASE ━━━━━━━━━━━━━━━━ */}
            {phase === "failed" && (
              <div className="px-6 pt-6 pb-8 text-center space-y-5 animate-fade-in">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 ring-8 ring-rose-50">
                  <XCircle className="h-10 w-10 stroke-[2.5] animate-scale-in" />
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
                      Error Details
                    </p>
                    <p className="text-xs font-semibold text-rose-900 leading-relaxed">
                      {errorMessage}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setPhase("form");
                      setSteps(["pending", "pending", "pending"]);
                      setAiRevealText("");
                      setEmailStatusIdx(0);
                      setErrorMessage(null);
                    }}
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
      </div>
    </>
  );
}
