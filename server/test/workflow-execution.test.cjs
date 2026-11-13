const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  executeWorkflowSteps,
  validateWorkflowSteps,
  WorkflowStepExecutionError,
} = require("../dist/utils/workflowExecution.js");
const {
  resolveTemplate,
  TemplateResolutionError,
} = require("../dist/utils/template.js");

test("later steps resolve values produced by earlier steps", async () => {
  const steps = [
    { id: "trigger", name: "Trigger", type: "TRIGGER", config: {} },
    {
      id: "email",
      name: "Email",
      type: "EMAIL",
      config: { to: "{{step_1.employee_email}}" },
    },
  ];
  const logMessages = [];
  const context = await executeWorkflowSteps(
    steps,
    { employee_email: "riley@example.test" },
    async (step, executionContext) => {
      if (step.type === "TRIGGER") {
        return { output: { employee_email: executionContext.trigger.employee_email } };
      }

      const to = resolveTemplate(step.config.to, executionContext);
      return { output: { to } };
    },
    async (_step, _status, message) => {
      logMessages.push(message);
    }
  );

  assert.equal(context.step_2.to, "riley@example.test");
  assert.equal(
    resolveTemplate("{{employee_email}}", {
      trigger: { employee_email: "riley@example.test" },
    }),
    "riley@example.test"
  );
  assert.deepEqual(logMessages, [
    "Step completed successfully. Output values are not stored in execution logs.",
    "Step completed successfully. Output values are not stored in execution logs.",
  ]);
});

test("configuration validation rejects forward references and invalid step settings", () => {
  const issues = validateWorkflowSteps([
    {
      id: "ai",
      name: "AI",
      type: "AI",
      config: { prompt: "Use {{step_2.output}}" },
    },
    {
      id: "delay",
      name: "Delay",
      type: "DELAY",
      config: { milliseconds: -1 },
    },
    {
      id: "email",
      name: "Email",
      type: "EMAIL",
      config: { to: "not-an-email" },
    },
    {
      id: "webhook",
      name: "Webhook",
      type: "WEBHOOK",
      config: { url: "ftp://example.test/hook", method: "TRACE" },
    },
  ]);

  assert.equal(issues.length, 5);
  assert.ok(issues.some((issue) => /earlier workflow step/.test(issue.message)));
  assert.ok(issues.some((issue) => /whole number/.test(issue.message)));
  assert.ok(issues.some((issue) => /valid address/.test(issue.message)));
  assert.ok(issues.some((issue) => /HTTP\(S\)/.test(issue.message)));
  assert.ok(issues.some((issue) => /Webhook method/.test(issue.message)));
});

test("unresolved and malformed template references fail explicitly", () => {
  assert.throws(
    () => resolveTemplate("Send to {{trigger.email}}", { trigger: {} }),
    TemplateResolutionError
  );
  assert.ok(
    validateWorkflowSteps([
      {
        id: "email",
        name: "Email",
        type: "EMAIL",
        config: { to: "{{trigger.email" },
      },
    ]).some((issue) => /malformed/.test(issue.message))
  );
});

test("a failed step is logged safely and prevents later steps from running", async () => {
  const steps = [
    { id: "ai", name: "AI", type: "AI", config: {} },
    { id: "email", name: "Email", type: "EMAIL", config: {} },
  ];
  const logs = [];
  let laterStepRan = false;

  await assert.rejects(
    executeWorkflowSteps(
      steps,
      {},
      async (step) => {
        if (step.type === "AI") {
          throw new Error("provider token=do-not-log");
        }
        laterStepRan = true;
        return { output: {} };
      },
      async (_step, status, message) => {
        logs.push({ status, message });
      }
    ),
    WorkflowStepExecutionError
  );

  assert.equal(laterStepRan, false);
  assert.deepEqual(logs, [
    {
      status: "FAILED",
      message: "Step failed. Input, output, and provider error details were not stored in execution logs.",
    },
  ]);
  assert.doesNotMatch(JSON.stringify(logs), /do-not-log/);
});
