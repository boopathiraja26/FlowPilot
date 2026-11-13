import {
  getTemplateReferences,
  TemplateContext,
} from "./template";

export type WorkflowStepKind =
  | "TRIGGER"
  | "AI"
  | "EMAIL"
  | "DELAY"
  | "WEBHOOK";

export interface RuntimeWorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepKind | string;
  config: unknown;
}

export interface WorkflowExecutionContext extends TemplateContext {
  trigger: Record<string, unknown>;
  latestAiOutput?: string;
}

export interface StepResult {
  output: unknown;
}

export interface WorkflowConfigIssue {
  step: number;
  field: string;
  message: string;
}

type StepLogStatus = "COMPLETED" | "FAILED";

const allowedWebhookMethods = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);
const placeholderWebhookHosts = new Set([
  "api.example.com",
  "example.com",
  "www.example.com",
]);
const maxDelayMilliseconds = 2_147_483_647;

export function isValidEmailAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateTemplate(
  value: string,
  field: string,
  stepNumber: number,
  issues: WorkflowConfigIssue[]
): void {
  const { paths, malformed } = getTemplateReferences(value);
  if (malformed) {
    issues.push({
      step: stepNumber,
      field,
      message: "Template syntax is malformed.",
    });
  }

  for (const path of paths) {
    const pathParts = path.split(".");
    if (
      pathParts.some(
        (part) =>
          !part ||
          part === "__proto__" ||
          part === "prototype" ||
          part === "constructor"
      )
    ) {
      issues.push({
        step: stepNumber,
        field,
        message: "Template reference contains an invalid path.",
      });
      continue;
    }

    const firstPart = pathParts[0];
    const referencedStep = /^step_(\d+)$/.exec(firstPart);
    if (referencedStep) {
      const referencedStepNumber = Number(referencedStep[1]);
      if (
        referencedStepNumber < 1 ||
        referencedStepNumber >= stepNumber
      ) {
        issues.push({
          step: stepNumber,
          field,
          message: "Template references must target an earlier workflow step.",
        });
      }
    } else if (firstPart.startsWith("step_")) {
      issues.push({
        step: stepNumber,
        field,
        message: "Template step references must use the form step_N.",
      });
    }
  }
}

function validateTemplateValues(
  value: unknown,
  field: string,
  stepNumber: number,
  issues: WorkflowConfigIssue[]
): void {
  if (typeof value === "string") {
    validateTemplate(value, field, stepNumber, issues);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) =>
      validateTemplateValues(item, `${field}[${index}]`, stepNumber, issues)
    );
  } else if (isRecord(value)) {
    Object.entries(value).forEach(([key, item]) =>
      validateTemplateValues(item, `${field}.${key}`, stepNumber, issues)
    );
  }
}

export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      !parsed.username &&
      !parsed.password &&
      !placeholderWebhookHosts.has(parsed.hostname)
    );
  } catch {
    return false;
  }
}

export function validateWorkflowSteps(
  steps: readonly RuntimeWorkflowStep[]
): WorkflowConfigIssue[] {
  const issues: WorkflowConfigIssue[] = [];

  if (steps.length === 0) {
    return [{ step: 0, field: "steps", message: "Workflow has no steps." }];
  }

  steps.forEach((step, index) => {
    const stepNumber = index + 1;
    const config =
      step.config === null || step.config === undefined
        ? {}
        : isRecord(step.config)
          ? step.config
          : null;

    if (!config) {
      issues.push({
        step: stepNumber,
        field: "config",
        message: "Step configuration must be a JSON object.",
      });
      return;
    }

    switch (step.type) {
      case "TRIGGER":
        break;
      case "AI":
        if (config.prompt !== undefined && typeof config.prompt !== "string") {
          issues.push({
            step: stepNumber,
            field: "prompt",
            message: "AI prompt must be a string.",
          });
        } else if (typeof config.prompt === "string") {
          validateTemplate(config.prompt, "prompt", stepNumber, issues);
        }
        break;
      case "EMAIL":
        for (const field of ["to", "subject", "body"] as const) {
          const value = config[field];
          if (value !== undefined && typeof value !== "string") {
            issues.push({
              step: stepNumber,
              field,
              message: `Email ${field} must be a string.`,
            });
          } else if (typeof value === "string") {
            validateTemplate(value, field, stepNumber, issues);
            if (
              field === "to" &&
              value.trim() &&
              getTemplateReferences(value).paths.length === 0 &&
              !isValidEmailAddress(value.trim())
            ) {
              issues.push({
                step: stepNumber,
                field,
                message: "Email recipient must be a valid address or template.",
              });
            }
          }
        }
        break;
      case "DELAY": {
        const milliseconds = config.milliseconds ?? 5000;
        if (
          typeof milliseconds !== "number" ||
          !Number.isSafeInteger(milliseconds) ||
          milliseconds < 0 ||
          milliseconds > maxDelayMilliseconds
        ) {
          issues.push({
            step: stepNumber,
            field: "milliseconds",
            message: `Delay must be a whole number between 0 and ${maxDelayMilliseconds}.`,
          });
        }
        break;
      }
      case "WEBHOOK": {
        const url = config.url;
        if (typeof url !== "string" || !url.trim()) {
          issues.push({
            step: stepNumber,
            field: "url",
            message: "Webhook URL is required.",
          });
        } else {
          const template = getTemplateReferences(url);
          validateTemplate(url, "url", stepNumber, issues);
          if (template.paths.length === 0 && !isValidWebhookUrl(url)) {
            issues.push({
              step: stepNumber,
              field: "url",
              message: "Webhook URL must be a valid HTTP(S) URL without embedded credentials.",
            });
          }
        }

        const method = config.method ?? "POST";
        if (
          typeof method !== "string" ||
          !allowedWebhookMethods.has(method.toUpperCase())
        ) {
          issues.push({
            step: stepNumber,
            field: "method",
            message: "Webhook method must be GET, POST, PUT, PATCH, or DELETE.",
          });
        }

        if (config.headers !== undefined) {
          if (!isRecord(config.headers)) {
            issues.push({
              step: stepNumber,
              field: "headers",
              message: "Webhook headers must be a JSON object of string values.",
            });
          } else {
            for (const [key, value] of Object.entries(config.headers)) {
              if (typeof value !== "string") {
                issues.push({
                  step: stepNumber,
                  field: `headers.${key}`,
                  message: "Webhook header values must be strings.",
                });
              } else {
                validateTemplate(value, `headers.${key}`, stepNumber, issues);
              }
            }
          }
        }
        validateTemplateValues(config.body, "body", stepNumber, issues);
        break;
      }
      default:
        issues.push({
          step: stepNumber,
          field: "type",
          message: "Workflow step type is not supported.",
        });
    }
  });

  return issues;
}

export class WorkflowStepExecutionError extends Error {
  constructor(
    stepNumber: number,
    stepType: string,
    outcomeMayBePartial: boolean,
    failureLogPersisted: boolean
  ) {
    const outcomeMessage = outcomeMayBePartial
      ? " Its action may have completed, but the success log was not recorded."
      : " Check its configuration and retry.";
    const loggingMessage = failureLogPersisted
      ? ""
      : " The failure log could not be persisted.";
    super(
      `Workflow step ${stepNumber} (${stepType}) failed.${outcomeMessage}${loggingMessage}`
    );
    this.name = "WorkflowStepExecutionError";
  }
}

export async function executeWorkflowSteps<TStep extends RuntimeWorkflowStep>(
  steps: readonly TStep[],
  triggerInput: Record<string, unknown>,
  executeStep: (
    step: TStep,
    context: WorkflowExecutionContext
  ) => Promise<StepResult>,
  writeLog: (
    step: TStep,
    status: StepLogStatus,
    message: string,
    startedAt: Date,
    completedAt: Date
  ) => Promise<unknown>
): Promise<WorkflowExecutionContext> {
  const context: WorkflowExecutionContext = { trigger: { ...triggerInput } };

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    const stepNumber = index + 1;
    const stepKey = `step_${stepNumber}`;
    const startedAt = new Date();
    let actionCompleted = false;

    try {
      const result = await executeStep(step, context);

      if (step.type === "TRIGGER") {
        const output = isRecord(result.output) ? result.output : {};
        context[stepKey] = output;
        context.trigger = output;
      } else if (step.type === "AI") {
        context[stepKey] = { output: result.output };
        if (typeof result.output === "string") {
          context.latestAiOutput = result.output;
        }
      } else if (
        (typeof result.output === "object" && result.output !== null) ||
        Array.isArray(result.output)
      ) {
        context[stepKey] = result.output;
      } else {
        context[stepKey] = { output: result.output };
      }

      actionCompleted = true;
      await writeLog(
        step,
        "COMPLETED",
        "Step completed successfully. Output values are not stored in execution logs.",
        startedAt,
        new Date()
      );
    } catch {
      let failureLogPersisted = true;
      try {
        await writeLog(
          step,
          "FAILED",
          actionCompleted
            ? "Step action completed, but its success log was not recorded. Input and output were not stored in execution logs."
            : "Step failed. Input, output, and provider error details were not stored in execution logs.",
          startedAt,
          new Date()
        );
      } catch {
        failureLogPersisted = false;
      }

      throw new WorkflowStepExecutionError(
        stepNumber,
        step.type,
        actionCompleted,
        failureLogPersisted
      );
    }
  }

  return context;
}
