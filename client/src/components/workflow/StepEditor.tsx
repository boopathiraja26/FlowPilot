"use client";

import { useEffect, useState } from "react";
import { WorkflowStep, WorkflowStepType } from "@/types/workflow";
import { Save, Trash2, Edit3, Code, Sparkles, Mail, Clock, Globe, Zap } from "lucide-react";

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

const STEP_TYPE_OPTIONS: WorkflowStepType[] = [
  "TRIGGER",
  "AI",
  "EMAIL",
  "DELAY",
  "WEBHOOK",
];

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

function createFormState(step: WorkflowStep): StepFormState {
  const config = (step.config ?? {}) as Record<string, unknown>;

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
        : "",

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
        : "employee_added",

    configText: JSON.stringify(config, null, 2),
  };
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

  // =========================================================
  // Sync editor when selected step changes
  // =========================================================

  useEffect(() => {
    setForm(createFormState(step));
    setConfigError(null);
  }, [step]);

  // =========================================================
  // Generic field updater
  // =========================================================

  function updateField<K extends keyof StepFormState>(
    field: K,
    value: StepFormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // =========================================================
  // Config JSON validation
  // =========================================================

  function handleConfigChange(value: string) {
    updateField("configText", value);

    try {
      JSON.parse(value);
      setConfigError(null);
    } catch {
      setConfigError("Config must be valid JSON.");
    }
  }

  // =========================================================
  // Save
  // =========================================================

  function handleSave() {
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
        config.url = form.webhookUrl;
        config.method = form.webhookMethod;
        break;

      case "TRIGGER":
        config.trigger_type = form.triggerType;
        config.form_id = form.formId;

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
        config.event = form.eventName;

        break;
    }

    // Preserve manually entered JSON configuration.
    try {
      const raw = JSON.parse(form.configText);

      config = {
        ...raw,
        ...config,
      };
    } catch {
      // The Save button is disabled when config is invalid
    }

    config.description = form.description;

    onSave({
      name: form.name,
      type: form.type,
      description: form.description,
      config,
    });
  }

  const isSaveDisabled =
    isSaving ||
    Boolean(configError) ||
    !form.name.trim();

  const inputClasses =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400";

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
            Node Type
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
            {STEP_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type} className="bg-white text-slate-800">
                {type}
              </option>
            ))}
          </select>
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
              <span>Gemini AI Prompt</span>
            </div>

            <textarea
              rows={4}
              value={form.prompt}
              disabled={isSaving}
              onChange={(e) =>
                updateField("prompt", e.target.value)
              }
              placeholder="e.g. Generate a personalized welcome email for {{employee_name}} in {{department}}..."
              className={inputClasses}
            />
          </div>
        )}

        {/* EMAIL */}
        {form.type === "EMAIL" && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
              <Mail className="h-3.5 w-3.5" />
              <span>SMTP Email Dispatch</span>
            </div>

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
                placeholder="recipient@domain.com or {{employee_email}}"
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
                placeholder="Welcome to {{company_name}}!"
                className={inputClasses}
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Email Body Template
              </label>
              <textarea
                rows={4}
                value={form.emailBody}
                disabled={isSaving}
                onChange={(e) =>
                  updateField("emailBody", e.target.value)
                }
                placeholder="Email content or HTML..."
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
              Wait Duration (milliseconds)
            </label>
            <input
              type="number"
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
          </div>
        )}

        {/* WEBHOOK */}
        {form.type === "WEBHOOK" && (
          <div className="rounded-xl border border-pink-200 bg-pink-50/50 p-3 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-pink-700">
              <Globe className="h-3.5 w-3.5" />
              <span>HTTP Webhook Dispatch</span>
            </div>

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
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <Zap className="h-3.5 w-3.5" />
              <span>Trigger Payload Schema</span>
            </div>

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

            <div className="grid grid-cols-2 gap-2">
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

            <div className="grid grid-cols-2 gap-2">
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