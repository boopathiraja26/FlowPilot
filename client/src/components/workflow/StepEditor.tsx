"use client";

import { useEffect, useState } from "react";
import { WorkflowStep, WorkflowStepType } from "@/types/workflow";

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
      // The Save button is disabled when config is invalid,
      // so this should normally never execute.
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

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Edit Step
        </h3>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
          Step {step.stepOrder}
        </span>
      </div>

      <div className="space-y-4">
        {/* Step Name */}
        <input
          value={form.name}
          disabled={isSaving}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="Step Name"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
        />

        {/* Step Type */}
        <select
          value={form.type}
          disabled={isSaving}
          onChange={(e) =>
            updateField(
              "type",
              e.target.value as WorkflowStepType
            )
          }
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
        >
          {STEP_TYPE_OPTIONS.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        {/* Description */}
        <textarea
          value={form.description}
          disabled={isSaving}
          rows={3}
          onChange={(e) =>
            updateField("description", e.target.value)
          }
          placeholder="Description"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
        />

        {/* AI */}
        {form.type === "AI" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              AI Prompt
            </label>

            <textarea
              rows={5}
              value={form.prompt}
              disabled={isSaving}
              onChange={(e) =>
                updateField("prompt", e.target.value)
              }
              placeholder="AI Prompt"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
            />
          </div>
        )}

        {/* EMAIL */}
        {form.type === "EMAIL" && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Recipient
              </label>

              <input
                value={form.emailTo}
                disabled={isSaving}
                onChange={(e) =>
                  updateField("emailTo", e.target.value)
                }
                placeholder="Recipient"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Subject
              </label>

              <input
                value={form.emailSubject}
                disabled={isSaving}
                onChange={(e) =>
                  updateField("emailSubject", e.target.value)
                }
                placeholder="Subject"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Email Body
              </label>

              <textarea
                rows={5}
                value={form.emailBody}
                disabled={isSaving}
                onChange={(e) =>
                  updateField("emailBody", e.target.value)
                }
                placeholder="Email Body"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
              />
            </div>
          </div>
        )}

        {/* DELAY */}
        {form.type === "DELAY" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Delay (milliseconds)
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
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
            />
          </div>
        )}

        {/* WEBHOOK */}
        {form.type === "WEBHOOK" && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Webhook URL
              </label>

              <input
                value={form.webhookUrl}
                disabled={isSaving}
                onChange={(e) =>
                  updateField("webhookUrl", e.target.value)
                }
                placeholder="Webhook URL"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
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
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
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
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Trigger Type
              </label>

              <input
                value={form.triggerType}
                disabled={isSaving}
                onChange={(e) =>
                  updateField(
                    "triggerType",
                    e.target.value
                  )
                }
                placeholder="Trigger Type"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Form ID
              </label>

              <input
                value={form.formId}
                disabled={isSaving}
                onChange={(e) =>
                  updateField("formId", e.target.value)
                }
                placeholder="Form ID"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
              />
            </div>

            <input
              value={form.employeeName}
              disabled={isSaving}
              onChange={(e) =>
                updateField("employeeName", e.target.value)
              }
              placeholder="Employee Name"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
            />

            <input
              value={form.employeeEmail}
              disabled={isSaving}
              onChange={(e) =>
                updateField(
                  "employeeEmail",
                  e.target.value
                )
              }
              placeholder="Employee Email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
            />

            <input
              value={form.department}
              disabled={isSaving}
              onChange={(e) =>
                updateField("department", e.target.value)
              }
              placeholder="Department"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
            />

            <input
              value={form.jobTitle}
              disabled={isSaving}
              onChange={(e) =>
                updateField("jobTitle", e.target.value)
              }
              placeholder="Job Title"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
            />

            <input
              value={form.companyName}
              disabled={isSaving}
              onChange={(e) =>
                updateField("companyName", e.target.value)
              }
              placeholder="Company Name"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
            />

            <input
              value={form.managerName}
              disabled={isSaving}
              onChange={(e) =>
                updateField("managerName", e.target.value)
              }
              placeholder="Manager Name"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
            />

            <input
              value={form.managerEmail}
              disabled={isSaving}
              onChange={(e) =>
                updateField(
                  "managerEmail",
                  e.target.value
                )
              }
              placeholder="Manager Email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
            />

            <input
              value={form.startDate}
              disabled={isSaving}
              onChange={(e) =>
                updateField("startDate", e.target.value)
              }
              placeholder="Start Date"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
            />

            <input
              value={form.companyAddress}
              disabled={isSaving}
              onChange={(e) =>
                updateField(
                  "companyAddress",
                  e.target.value
                )
              }
              placeholder="Company Address"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
            />

            <input
              value={form.companyPhone}
              disabled={isSaving}
              onChange={(e) =>
                updateField(
                  "companyPhone",
                  e.target.value
                )
              }
              placeholder="Company Phone"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
            />
          </div>
        )}

        {/* Raw JSON configuration */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Configuration JSON
          </label>

          <textarea
            rows={8}
            spellCheck={false}
            value={form.configText}
            disabled={isSaving}
            onChange={(e) =>
              handleConfigChange(e.target.value)
            }
            className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-gray-50"
          />

          {configError && (
            <p className="mt-1 text-xs text-red-500">
              {configError}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaveDisabled}
          className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={isSaving}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}