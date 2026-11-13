const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const homepage = fs.readFileSync(
  path.join(__dirname, "../src/app/page.tsx"),
  "utf8"
);

test("landing page identifies simulated workflow data and configured providers", () => {
  assert.match(
    homepage,
    /Illustrative content: workflow animations, sample outputs, statuses, and logs on this page are not live executions or connected provider results/
  );
  assert.match(
    homepage,
    /This animation uses sample data, simulated statuses, and sample timings; it is not a live workflow execution or proof of configured providers/
  );
  assert.match(
    homepage,
    /Sample events and timings only; this panel is not connected to execution records or provider responses/
  );
  assert.match(homepage, /Gemini AI steps supported — configure credentials/);
  assert.match(homepage, /SMTP email steps supported — configure credentials/);
  assert.match(
    homepage,
    /Gemini and SMTP steps run after you configure provider credentials/
  );

  assert.doesNotMatch(
    homepage,
    /Production SMTP ready|Gemini 2\.5 Flash integrated|live_onboarding_stream|onboarding_pipeline_prod/
  );
});
