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

export function StepEditor({
  step,
  onSave,
  onDelete,
  isSaving,
}: StepEditorProps) {
  const [name, setName] = useState(step.name);
  const [type, setType] = useState<WorkflowStepType>(step.type);

  const [description, setDescription] = useState("");

  const [prompt, setPrompt] = useState("");

  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [delayMs, setDelayMs] = useState(5000);

  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookMethod, setWebhookMethod] = useState("POST");

  const [triggerType, setTriggerType] = useState("");
  const [formId, setFormId] = useState("");

  const [configText, setConfigText] = useState("");
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    const config = (step.config ?? {}) as Record<string, unknown>;

    setName(step.name);
    setType(step.type);

    setDescription(
      typeof config.description === "string"
        ? config.description
        : ""
    );

    setPrompt(
      typeof config.prompt === "string"
        ? config.prompt
        : ""
    );

    setEmailTo(
      typeof config.to === "string"
        ? config.to
        : ""
    );

    setEmailSubject(
      typeof config.subject === "string"
        ? config.subject
        : ""
    );

    setEmailBody(
      typeof config.body === "string"
        ? config.body
        : ""
    );

    setDelayMs(
      typeof config.milliseconds === "number"
        ? config.milliseconds
        : 5000
    );

    setWebhookUrl(
      typeof config.url === "string"
        ? config.url
        : ""
    );

    setWebhookMethod(
      typeof config.method === "string"
        ? config.method
        : "POST"
    );

    setTriggerType(
      typeof config.trigger_type === "string"
        ? config.trigger_type
        : ""
    );

    setFormId(
      typeof config.form_id === "string"
        ? config.form_id
        : ""
    );

    setConfigText(JSON.stringify(config, null, 2));
    setConfigError(null);
  }, [step]);

  function handleConfigChange(value: string) {
    setConfigText(value);

    try {
      JSON.parse(value);
      setConfigError(null);
    } catch {
      setConfigError("Config must be valid JSON.");
    }
  }

  function handleSave() {
    let config: Record<string, unknown> = {};

    switch (type) {
      case "AI":
        config.prompt = prompt;
        break;

      case "EMAIL":
        config.to = emailTo;
        config.subject = emailSubject;
        config.body = emailBody;
        break;

      case "DELAY":
        config.milliseconds = delayMs;
        break;

      case "WEBHOOK":
        config.url = webhookUrl;
        config.method = webhookMethod;
        break;

      case "TRIGGER":
        config.trigger_type = triggerType;
        config.form_id = formId;
        break;
    }

    try {
      const raw = JSON.parse(configText);
      config = {
        ...raw,
        ...config,
      };
    } catch {}

    config.description = description;

    onSave({
      name,
      type,
      description,
      config,
    });
  }

  const isSaveDisabled =
  isSaving ||
  Boolean(configError) ||
  !name.trim();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">

      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Edit Step
        </h3>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
          Step {step.stepOrder}
        </span>
      </div>

      <div className="space-y-4">

        <input
          value={name}
          disabled={isSaving}
          onChange={(e)=>setName(e.target.value)}
          placeholder="Step Name"
          className="w-full rounded-lg border px-3 py-2"
        />

        <select
          value={type}
          disabled={isSaving}
          onChange={(e)=>setType(e.target.value as WorkflowStepType)}
          className="w-full rounded-lg border px-3 py-2"
        >
          {STEP_TYPE_OPTIONS.map(type=>(
            <option key={type}>
              {type}
            </option>
          ))}
        </select>

        <textarea
          value={description}
          disabled={isSaving}
          rows={3}
          onChange={(e)=>setDescription(e.target.value)}
          placeholder="Description"
          className="w-full rounded-lg border px-3 py-2"
        />

        {type==="AI" && (
          <textarea
            rows={5}
            value={prompt}
            onChange={(e)=>setPrompt(e.target.value)}
            placeholder="AI Prompt"
            className="w-full rounded-lg border px-3 py-2"
          />
        )}

        {type==="EMAIL" && (
          <div className="space-y-2">
            <input
              value={emailTo}
              onChange={(e)=>setEmailTo(e.target.value)}
              placeholder="Recipient"
              className="w-full rounded-lg border px-3 py-2"
            />

            <input
              value={emailSubject}
              onChange={(e)=>setEmailSubject(e.target.value)}
              placeholder="Subject"
              className="w-full rounded-lg border px-3 py-2"
            />

            <textarea
              rows={5}
              value={emailBody}
              onChange={(e)=>setEmailBody(e.target.value)}
              placeholder="Email Body"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        )}

        {type==="DELAY" && (
          <input
            type="number"
            value={delayMs}
            onChange={(e)=>setDelayMs(Number(e.target.value))}
            className="w-full rounded-lg border px-3 py-2"
          />
        )}

        {type==="WEBHOOK" && (
          <div className="space-y-2">

            <input
              value={webhookUrl}
              onChange={(e)=>setWebhookUrl(e.target.value)}
              placeholder="Webhook URL"
              className="w-full rounded-lg border px-3 py-2"
            />

            <select
              value={webhookMethod}
              onChange={(e)=>setWebhookMethod(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option>POST</option>
              <option>GET</option>
              <option>PUT</option>
              <option>PATCH</option>
              <option>DELETE</option>
            </select>

          </div>
        )}

        {type==="TRIGGER" && (
          <div className="space-y-2">

            <input
              value={triggerType}
              onChange={(e)=>setTriggerType(e.target.value)}
              placeholder="Trigger Type"
              className="w-full rounded-lg border px-3 py-2"
            />

            <input
              value={formId}
              onChange={(e)=>setFormId(e.target.value)}
              placeholder="Form ID"
              className="w-full rounded-lg border px-3 py-2"
            />

          </div>
        )}

        <textarea
          rows={8}
          spellCheck={false}
          value={configText}
          onChange={(e)=>handleConfigChange(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 font-mono text-xs"
        />

        {configError && (
          <p className="text-xs text-red-500">
            {configError}
          </p>
        )}

      </div>

      <div className="mt-6 flex gap-2">

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaveDisabled}
          className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-white"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>

        <button
          onClick={onDelete}
          type="button"
          disabled={isSaving}
          className="rounded-lg border border-red-300 px-4 py-2 text-red-600"
        >
          Delete
        </button>

      </div>
    </div>
  );
}