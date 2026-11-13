const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  buildWorkflowAiPrompt,
  escapeHtmlText,
  isOnboardingTrigger,
  resolveEmailStepConfig,
} = require("../dist/utils/executionConfig.js");
const { renderWelcomeEmailHtml } = require("../dist/utils/template.js");

test("AI prompt uses configured instructions and generic trigger data", () => {
  const prompt = buildWorkflowAiPrompt(
    "Write a welcome message for {{trigger.name}}.",
    { trigger: { name: "Riley", department: "Engineering" } }
  );

  assert.match(prompt, /workflow automation platform/i);
  assert.match(prompt, /"department": "Engineering"/);
  assert.match(prompt, /Write a welcome message for Riley\./);
  assert.doesNotMatch(prompt, /You are an HR assistant/);
});

test("email configuration resolves templates against execution context", () => {
  const config = resolveEmailStepConfig(
    {
      to: "{{trigger.email}}",
      subject: "Welcome {{trigger.name}}",
      body: "<p>{{step_2.output}}</p>",
    },
    {
      trigger: { email: "riley@example.test", name: "Riley" },
      step_2: { output: "Glad you're here." },
    }
  );

  assert.deepEqual(config, {
    to: "riley@example.test",
    subject: "Welcome Riley",
    body: "<p>Glad you're here.</p>",
  });
});

test("plain text email output is escaped before HTML rendering", () => {
  assert.equal(escapeHtmlText("<script> & 'hello'"), "&lt;script&gt; &amp; &#39;hello&#39;");
});

test("onboarding email fallback is limited to onboarding trigger data", () => {
  assert.equal(isOnboardingTrigger({ name: "Riley", email: "riley@example.test" }), false);
  assert.equal(isOnboardingTrigger({ event: "employee_added" }), true);
});

test("onboarding email escapes trigger and AI content before HTML rendering", () => {
  const html = renderWelcomeEmailHtml(
    {
      employee_name: "<img src=x onerror=alert(1)>",
      company_name: "<script>alert(1)</script>",
      job_title: "<b>Engineer</b>",
      manager_name: "<svg onload=alert(1)>",
    },
    "<img src=x>"
  );

  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /<svg onload/);
  assert.match(html, /&lt;img src=x/);
});
