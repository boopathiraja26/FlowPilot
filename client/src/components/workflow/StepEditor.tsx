"use client";

import { useEffect, useMemo, useState } from "react";
import { WorkflowStep, WorkflowStepType } from "@/types/workflow";
import { Save, Trash2, Edit3, Code, Sparkles, Mail, Clock, Globe, Zap, Link2, KeyRound, RotateCcw, EyeOff, Copy } from "lucide-react";
import { rotateStepWebhookSecret } from "@/lib/api/workflowStep";

export interface StepEditorValues {
  name: string;
  type: WorkflowStepType;
  description: string;
  config: Record<string, unknown>;
}

interface StepEditorProps {
  step: WorkflowStep;
  onSave: (values: StepEditorValues) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  isSaving: boolean;
}

const STEP_TYPE_OPTIONS: Array<{ value: WorkflowStepType; label: string }> = [
  { value: "TRIGGER", label: "TRIGGER — Start / Incoming Trigger" },
  { value: "AI", label: "AI — Gemini Action" },
  { value: "EMAIL", label: "EMAIL — Send Email Action" },
  { value: "DELAY", label: "DELAY — Wait/Timer Action" },
  { value: "WEBHOOK", label: "WEBHOOK — Outgoing HTTP Action" },
];

function getActionTypeLabel(type: WorkflowStepType, triggerMode?: TriggerMode): string {
  switch (type) {
    case "TRIGGER":
      return triggerMode === "webhook"
        ? "TRIGGER (Incoming webhook trigger)"
        : "TRIGGER (Start trigger)";
    case "WEBHOOK":
      return "WEBHOOK (Outgoing HTTP action)";
    case "AI":
      return "AI (Gemini action)";
    case "EMAIL":
      return "EMAIL (Send email action)";
    case "DELAY":
      return "DELAY (Wait/timer action)";
    default:
      return type;
  }
}

type TriggerMode = "manual" | "webhook";

interface StepFormState {
  name: string;
  type: WorkflowStepType;
  description: string;

  prompt: string;

  emailTo: string;
  emailSubject: string;
  emailBody: string;

  delayMs: number;

  webhookUrl: string;
  webhookMethod: string;

  triggerType: string;
  triggerMode: TriggerMode;
  webhookSecret: string;
  formId: string;

  employeeName: string;
  employeeEmail: string;
  department: string;
  jobTitle: string;
  companyName: string;
  managerName: string;
  managerEmail: string;
  startDate: string;
  companyAddress: string;
  companyPhone: string;
  eventName: string;

  configText: string;
}

const WEBHOOK_SECRET_REDACTED_PLACEHOLDER = "[REDACTED_WEBHOOK_SECRET]";

function isRedactedWebhookSecret(value: string | undefined | null): boolean {
  return (value ?? "") === WEBHOOK_SECRET_REDACTED_PLACEHOLDER;
}

function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
  return raw.replace(/\/+$/, "");
}

function generateWebhookSecret(): string {
  const bytes = new Uint8Array(24);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const OUTGOING_WEBHOOK_PLACEHOLDER_HOSTS = new Set([
  "api.example.com",
  "example.com",
  "www.example.com",
]);

function getOutgoingWebhookUrlValidationError(urlValue: string): string | null {
  const trimmed = urlValue.trim();
  if (!trimmed) {
    return "Outgoing webhook URL is required. Enter a valid destination URL in this step.";
  }
  if (/\{\{[\s\S]*\}\}/.test(trimmed)) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "Outgoing webhook URL must be a valid http(s) URL (for example, https://api.your-service.com/webhook).";
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "Outgoing webhook URL must start with http:// or https://.";
  }

  if (OUTGOING_WEBHOOK_PLACEHOLDER_HOSTS.has(parsed.hostname)) {
    return `Outgoing webhook URL cannot use placeholder host "${parsed.hostname}". Configure a real destination URL.`;
  }

  return null;
}

function inferTriggerMode(config: Record<string, unknown>): TriggerMode {
  const triggerMode = typeof config.triggerMode === "string" ? config.triggerMode.toLowerCase() : "";
  const triggerType = typeof config.trigger_type === "string" ? config.trigger_type.toLowerCase() : "";
  if (triggerMode === "webhook" || triggerType === "webhook" || triggerType === "incoming_webhook") {
    return "webhook";
  }
  return "manual";
}

function createFormState(step: WorkflowStep): StepFormState {
  const config = (step.config ?? {}) as Record<string, unknown>;
  const triggerMode = inferTriggerMode(config);
  const webhookSecret =
    typeof config.webhookSecret === "string"
      ? config.webhookSecret
      : typeof config.webhook_secret === "string"
      ? config.webhook_secret
      : "";

  return {
    name: step.name,
    type: step.type,

    description:
      typeof config.description === "string"
        ? config.description
        : "",

    prompt:
      typeof config.prompt === "string"
        ? config.prompt
        : "",

    emailTo:
      typeof config.to === "string"
        ? config.to
        : "",

    emailSubject:
      typeof config.subject === "string"
        ? config.subject
        : "",

    emailBody:
      typeof config.body === "string"
        ? config.body
        : "",

    delayMs:
      typeof config.milliseconds === "number"
        ? config.milliseconds
        : 5000,

    webhookUrl:
      typeof config.url === "string"
        ? config.url
        : "",

    webhookMethod:
      typeof config.method === "string"
        ? config.method
        : "POST",

    triggerType:
      typeof config.trigger_type === "string"
        ? config.trigger_type
        : triggerMode,

    triggerMode,
    webhookSecret,

    formId:
      typeof config.form_id === "string"
        ? config.form_id
        : "",

    employeeName:
      typeof config.employee_name === "string"
        ? config.employee_name
        : "",

    employeeEmail:
      typeof config.employee_email === "string"
        ? config.employee_email
        : "",

    department:
      typeof config.department === "string"
        ? config.department
        : "",

    jobTitle:
      typeof config.job_title === "string"
        ? config.job_title
        : "",

    companyName:
      typeof config.company_name === "string"
        ? config.company_name
        : "",

    managerName:
      typeof config.manager_name === "string"
        ? config.manager_name
        : "",

    managerEmail:
      typeof config.manager_email === "string"
        ? config.manager_email
        : "",

    startDate:
      typeof config.start_date === "string"
        ? config.start_date
        : "",

    companyAddress:
      typeof config.company_address === "string"
        ? config.company_address
        : "",

    companyPhone:
      typeof config.company_phone === "string"
        ? config.company_phone
        : "",

    eventName:
      typeof config.event === "string"
        ? config.event
        : "manual.trigger",

    configText: JSON.stringify(config, null, 2),
  };
}

function buildConfig(form: StepFormState): Record<string, unknown> {
  let config: Record<string, unknown> = {};

  switch (form.type) {
    case "AI":
      config.prompt = form.prompt;
      break;

    case "EMAIL":
      config.to = form.emailTo;
      config.subject = form.emailSubject;
      config.body = form.emailBody;
      break;

    case "DELAY":
      config.milliseconds = form.delayMs;
      break;

    case "WEBHOOK":
      config.url = form.webhookUrl.trim();
      config.method = form.webhookMethod;
      break;

    case "TRIGGER":
      config.triggerMode = form.triggerMode;
      config.trigger_type = form.triggerMode;
      config.form_id = form.formId;
      config.event = form.eventName || "manual.trigger";

      config.employee_name = form.employeeName;
      config.employee_email = form.employeeEmail;
      config.department = form.department;
      config.job_title = form.jobTitle;
      config.company_name = form.companyName;
      config.manager_name = form.managerName;
      config.manager_email = form.managerEmail;
      config.start_date = form.startDate;
      config.company_address = form.companyAddress;
      config.company_phone = form.companyPhone;

      if (form.triggerMode === "webhook") {
        config.webhookSecret = form.webhookSecret.trim();
      } else {
        delete config.webhookSecret;
        delete config.webhook_secret;
      }
      break;
  }

  try {
    const raw = JSON.parse(form.configText);
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      config = {
        ...(raw as Record<string, unknown>),
        ...config,
      };
    }
  } catch {
    // Save is disabled when config JSON is invalid.
  }

  config.description = form.description;
  if (form.type === "TRIGGER") {
    config.triggerMode = form.triggerMode;
    config.trigger_type = form.triggerMode;
    if (form.triggerMode === "webhook") {
      const secret = form.webhookSecret.trim();
      if (secret) {
        config.webhookSecret = secret;
      } else {
        delete config.webhookSecret;
      }
      delete config.webhook_secret;
    } else {
      delete config.webhookSecret;
      delete config.webhook_secret;
    }
  }

  return config;
}

export function StepEditor({
  step,
  onSave,
  onDelete,
  isSaving,
}: StepEditorProps) {
  const [form, setForm] = useState<StepFormState>(() =>
    createFormState(step)
  );
  const [configError, setConfigError] = useState<string | null>(null);
  const [isRotatingSecret, setIsRotatingSecret] = useState(false);
  const [rotationMessage, setRotationMessage] = useState<string | null>(null);

  useEffect(() => {
    setForm(createFormState(step));
    setConfigError(null);
    setIsRotatingSecret(false);
    setRotationMessage(null);
  }, [step]);

  function updateField<K extends keyof StepFormState>(
    field: K,
    value: StepFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleConfigChange(value: string) {
    updateField("configText", value);
    try {
      JSON.parse(value);
      setConfigError(null);
    } catch {
      setConfigError("Config must be valid JSON.");
    }
  }

  function handleTriggerModeChange(mode: TriggerMode) {
    setForm((current) => ({
      ...current,
      triggerMode: mode,
      triggerType: mode,
      webhookSecret:
        mode === "webhook" && !current.webhookSecret
          ? generateWebhookSecret()
          : current.webhookSecret,
    }));
    setRotationMessage(null);
  }

  function handleSave() {
    if (configError) return;
    const config = buildConfig(form);
    onSave({
      name: form.name.trim(),
      type: form.type,
      description: form.description,
      config,
    });
  }

  const isSecretRedacted = isRedactedWebhookSecret(form.webhookSecret);

  const triggerValidationError = useMemo(() => {
    if (form.type !== "TRIGGER") return null;
    if (form.triggerMode === "webhook") {
      if (isSecretRedacted) return null; // existing stored secret will be preserved on save
      if (form.webhookSecret.trim().length < 16) {
        return "Webhook trigger requires a webhook secret (at least 16 characters).";
      }
    }
    return null;
  }, [form.type, form.triggerMode, form.webhookSecret, isSecretRedacted]);

  const outgoingWebhookValidationError = useMemo(() => {
    if (form.type !== "WEBHOOK") return null;
    return getOutgoingWebhookUrlValidationError(form.webhookUrl);
  }, [form.type, form.webhookUrl]);

  async function handleRotateWebhookSecret() {
    if (isSaving || isRotatingSecret) return;
    setRotationMessage(null);
    setIsRotatingSecret(true);
    try {
      const result = await rotateStepWebhookSecret(step.id);
      if (result?.webhookSecret) {
        updateField("webhookSecret", result.webhookSecret);
        setRotationMessage("New secret generated and saved. Copy it now — ordinary API responses will not show it again.");
      } else {
        setRotationMessage("Secret rotated. Reload the step to continue.");
      }
    } catch (err: any) {
      setConfigError(err?.response?.data?.message || err?.message || "Failed to rotate webhook secret.");
    } finally {
      setIsRotatingSecret(false);
    }
  }

  async function handleCopyWebhookSecret() {
    if (isSecretRedacted || !form.webhookSecret) return;
    try {
      await navigator.clipboard?.writeText(form.webhookSecret);
      setRotationMessage("Secret copied to clipboard.");
      setTimeout(() => setRotationMessage(null), 2000);
    } catch {
      setRotationMessage("Could not copy automatically. Please copy the secret manually.");
    }
  }

  const isSaveDisabled =
    isSaving ||
    Boolean(configError) ||
    Boolean(triggerValidationError) ||
    Boolean(outgoingWebhookValidationError) ||
    !form.name.trim();

  const inputClasses =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400";

  const incomingWebhookUrl = `${getApiBaseUrl()}/triggers/webhook/${step.workflowId}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Step Configuration
          </h3>
        </div>

        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
          Node #{step.stepOrder}
        </span>
      </div>

      <div className="space-y-3.5">
        {/* Step Name */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Step Name
          </label>
          <input
            value={form.name}
            disabled={isSaving}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Step Name"
            className={inputClasses}
          />
        </div>

        {/* Step Type */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Action Type
          </label>
          <select
            value={form.type}
            disabled={isSaving}
            onChange={(e) =>
              updateField(
                "type",
                e.target.value as WorkflowStepType
              )
            }
            className={inputClasses}
          >
            {STEP_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-white text-slate-800">
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-500">
            Actual action type (independent of node name): <span className="font-semibold text-slate-700">{getActionTypeLabel(form.type, form.triggerMode)}</span>
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Description
          </label>
          <textarea
            value={form.description}
            disabled={isSaving}
            rows={2}
            onChange={(e) =>
              updateField("description", e.target.value)
            }
            placeholder="Step Purpose & Notes"
            className={inputClasses}
          />
        </div>

        {/* AI */}
        {form.type === "AI" && (
          <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Gemini AI instructions</span>
            </div>

            <textarea
              rows={5}
              value={form.prompt}
              disabled={isSaving}
              onChange={(e) =>
                updateField("prompt", e.target.value)
              }
              placeholder="Describe what the AI should produce. You can use templates like {{trigger.employee_name}} and reference prior step outputs in instructions."
              className={inputClasses}
            />
            <p className="text-[11px] text-slate-600">
              The execution context (trigger and prior step outputs) is provided to the AI step. Write clear instructions for the content you want generated.
            </p>
          </div>
        )}

        {/* EMAIL */}
        {form.type === "EMAIL" && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
              <Mail className="h-3.5 w-3.5" />
              <span>Email action</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Configure recipient, subject, and body. Templates like <code>{'{{trigger.employee_email}}'}</code> or <code>{'{{step_2.output}}'}</code> are supported. Leave fields blank to use workflow defaults where available.
            </p>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Recipient Email
              </label>
              <input
                value={form.emailTo}
                disabled={isSaving}
                onChange={(e) =>
                  updateField("emailTo", e.target.value)
                }
                placeholder="recipient@domain.com or {{trigger.employee_email}}"
                className={inputClasses}
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Subject
              </label>
              <input
                value={form.emailSubject}
                disabled={isSaving}
                onChange={(e) =>
                  updateField("emailSubject", e.target.value)
                }
                placeholder="Subject (supports templates)"
                className={inputClasses}
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Email body (text or HTML)
              </label>
              <textarea
                rows={5}
                value={form.emailBody}
                disabled={isSaving}
                onChange={(e) =>
                  updateField("emailBody", e.target.value)
                }
                placeholder="Email content, HTML, or templates using trigger/prior step outputs"
                className={inputClasses}
              />
            </div>
          </div>
        )}

        {/* DELAY */}
        {form.type === "DELAY" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              <span>Execution Delay</span>
            </div>

            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Wait duration (milliseconds)
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={form.delayMs}
              disabled={isSaving}
              onChange={(e) =>
                updateField(
                  "delayMs",
                  Number(e.target.value)
                )
              }
              className={inputClasses}
            />
            <p className="text-[11px] text-slate-600">
              {Number.isFinite(form.delayMs) ? `${(form.delayMs / 1000).toFixed(form.delayMs % 1000 === 0 ? 0 : 2)} seconds` : "Enter a non-negative delay in milliseconds."}
            </p>
          </div>
        )}

        {/* WEBHOOK (outgoing action step) */}
        {form.type === "WEBHOOK" && (
          <div className="rounded-xl border border-pink-200 bg-pink-50/50 p-3 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-pink-700">
              <Globe className="h-3.5 w-3.5" />
              <span>Outgoing HTTP Webhook Action</span>
            </div>
            <p className="text-[11px] text-pink-700/90">
              Sends an HTTP request to an external destination URL. This is different from an incoming webhook <strong>TRIGGER</strong>. A valid destination URL is required. Unsafe/private destinations are blocked for security.
            </p>
            <p className="text-[11px] text-slate-600">
              Templates are supported in URL/headers/body (e.g. <code>{'{{trigger.employee_email}}'}</code>, <code>{'{{step_1.output}}'}</code>). Configure custom headers or JSON body via Raw JSON config if needed.
            </p>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Webhook URL
              </label>
              <input
                value={form.webhookUrl}
                disabled={isSaving}
                onChange={(e) =>
                  updateField("webhookUrl", e.target.value)
                }
                placeholder="https://api.domain.com/webhook"
                className={inputClasses}
              />
              {outgoingWebhookValidationError && (
                <p className="mt-1 text-xs font-medium text-rose-600">
                  {outgoingWebhookValidationError}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                HTTP Method
              </label>
              <select
                value={form.webhookMethod}
                disabled={isSaving}
                onChange={(e) =>
                  updateField(
                    "webhookMethod",
                    e.target.value
                  )
                }
                className={inputClasses}
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>
        )}

        {/* TRIGGER */}
        {form.type === "TRIGGER" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <Zap className="h-3.5 w-3.5" />
              <span>Trigger Configuration (Workflow Start)</span>
            </div>
            <p className="text-[11px] text-emerald-700/90">
              Configures how this workflow starts. &quot;Incoming webhook&quot; trigger mode receives external HTTP requests; it is not an outgoing <strong>WEBHOOK</strong> action and does not require an outgoing destination URL.
            </p>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Trigger Mode
              </label>
              <select
                value={form.triggerMode}
                disabled={isSaving}
                onChange={(e) => handleTriggerModeChange(e.target.value as TriggerMode)}
                className={inputClasses}
              >
                <option value="manual">Manual (run from dashboard/builder)</option>
                <option value="webhook">Incoming webhook (external HTTP trigger)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Event Name
              </label>
              <input
                value={form.eventName}
                disabled={isSaving}
                onChange={(e) => updateField("eventName", e.target.value)}
                placeholder="e.g. employee.onboarded"
                className={inputClasses}
              />
            </div>

            {form.triggerMode === "webhook" && (
              <div className="rounded-lg border border-emerald-200 bg-white p-2.5 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Incoming Webhook Security</span>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Webhook Secret
                  </label>
                  {isSecretRedacted ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 flex items-center gap-2">
                      <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                      <span>Configured (hidden for security). Rotate to generate a new secret.</span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={form.webhookSecret}
                        disabled={isSaving}
                        onChange={(e) => { updateField("webhookSecret", e.target.value); setRotationMessage(null); }}
                        placeholder="Generate or rotate a secret"
                        className={inputClasses}
                      />
                      <button
                        type="button"
                        onClick={handleCopyWebhookSecret}
                        disabled={isSaving || !form.webhookSecret}
                        className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        title="Copy secret"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={handleRotateWebhookSecret}
                      disabled={isSaving || isRotatingSecret}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      title="Generate and save a new webhook secret"
                    >
                      <RotateCcw className={`h-3.5 w-3.5 ${isRotatingSecret ? "animate-spin" : ""}`} />
                      <span>{isRotatingSecret ? "Rotating..." : "Rotate secret"}</span>
                    </button>
                    {!isSecretRedacted && !form.webhookSecret && (
                      <button
                        type="button"
                        onClick={() => updateField("webhookSecret", generateWebhookSecret())}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        <span>Generate</span>
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Send this secret only in header <code className="font-mono">x-webhook-secret</code>. Query/body secrets are rejected. Workflow must be <strong>ACTIVE</strong> to accept incoming triggers.
                  </p>
                  {isSecretRedacted && (
                    <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                      <EyeOff className="h-3 w-3" /> Existing secrets are never shown in ordinary workflow API responses. Saving edits preserves the stored secret.
                    </p>
                  )}
                  {!isSecretRedacted && form.webhookSecret && (
                    <p className="mt-1 text-[11px] text-amber-700">
                      Copy this secret now if needed. After reload, ordinary responses will hide it for security.
                    </p>
                  )}
                  {rotationMessage && (
                    <p className="mt-1 text-[11px] font-medium text-emerald-700">{rotationMessage}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Webhook Endpoint
                  </label>
                  <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                    <Link2 className="mt-0.5 h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <code className="text-[11px] text-slate-700 break-all">{incomingWebhookUrl}</code>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    POST JSON payload to this endpoint with the <code className="font-mono">x-webhook-secret</code> header.
                  </p>
                </div>

                {triggerValidationError && (
                  <p className="text-xs font-medium text-rose-600">{triggerValidationError}</p>
                )}
              </div>
            )}

            <div className="pt-1 border-t border-emerald-100">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Default Trigger Payload (optional, used as fallback/manual defaults)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.employeeName}
                  disabled={isSaving}
                  onChange={(e) => updateField("employeeName", e.target.value)}
                  placeholder="Employee Name"
                  className={inputClasses}
                />
                <input
                  value={form.employeeEmail}
                  disabled={isSaving}
                  onChange={(e) => updateField("employeeEmail", e.target.value)}
                  placeholder="Employee Email"
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  value={form.department}
                  disabled={isSaving}
                  onChange={(e) => updateField("department", e.target.value)}
                  placeholder="Department"
                  className={inputClasses}
                />
                <input
                  value={form.jobTitle}
                  disabled={isSaving}
                  onChange={(e) => updateField("jobTitle", e.target.value)}
                  placeholder="Job Title"
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  value={form.companyName}
                  disabled={isSaving}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  placeholder="Company Name"
                  className={inputClasses}
                />
                <input
                  value={form.managerName}
                  disabled={isSaving}
                  onChange={(e) => updateField("managerName", e.target.value)}
                  placeholder="Manager Name"
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  value={form.managerEmail}
                  disabled={isSaving}
                  onChange={(e) => updateField("managerEmail", e.target.value)}
                  placeholder="Manager Email"
                  className={inputClasses}
                />
                <input
                  value={form.startDate}
                  disabled={isSaving}
                  onChange={(e) => updateField("startDate", e.target.value)}
                  placeholder="Start Date"
                  className={inputClasses}
                />
              </div>
            </div>
          </div>
        )}

        {/* Raw JSON configuration */}
        <div className="pt-1">
          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <Code className="h-3 w-3 text-slate-400" />
            <span>Raw JSON Config</span>
          </div>

          <textarea
            rows={5}
            spellCheck={false}
            value={form.configText}
            disabled={isSaving}
            onChange={(e) =>
              handleConfigChange(e.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
          />

          {configError && (
            <p className="mt-1 text-xs text-rose-500 font-medium">
              {configError}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex gap-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaveDisabled}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{isSaving ? "Saving..." : "Save Changes"}</span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={isSaving}
          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-100 hover:border-rose-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          title="Delete this step"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
