const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  buildExecutionWhere,
  getExecutionOffset,
  parseExecutionListQuery,
} = require("../dist/utils/executionQuery.js");
const {
  sanitizeDuplicatedConfig,
} = require("../dist/utils/workflowCopy.js");

test("execution history query validates, bounds, and builds user-scoped filters", () => {
  const workflowId = "a41b4f5c-b590-4e51-9bd1-a96fa0d22288";
  const parsed = parseExecutionListQuery({
    page: "3",
    limit: "25",
    status: "FAILED",
    workflowId,
  });

  assert.equal(parsed.success, true);
  assert.deepEqual(parsed.data, {
    page: 3,
    limit: 25,
    status: "FAILED",
    workflowId,
  });
  assert.deepEqual(buildExecutionWhere("user-1", parsed.data), {
    status: "FAILED",
    workflowId,
    workflow: { userId: "user-1" },
  });
  assert.equal(getExecutionOffset(parsed.data), 50);
});

test("execution history query rejects invalid bounds, status and unknown filters", () => {
  assert.equal(parseExecutionListQuery({ page: "0" }).success, false);
  assert.equal(parseExecutionListQuery({ limit: "101" }).success, false);
  assert.equal(parseExecutionListQuery({ status: "CANCELLED" }).success, false);
  assert.equal(parseExecutionListQuery({ unexpected: "1" }).success, false);
});

test("duplicated step config clears nested credential-like values", () => {
  const copied = sanitizeDuplicatedConfig({
    url: "https://hooks.example.test?token=private-value&mode=safe",
    headers: {
      Authorization: "Bearer private-value",
      "x-api-key": "private-key",
      "x-workspace": "safe-value",
    },
    nested: [{ smtpPassword: "private-password", label: "safe" }],
  });

  assert.deepEqual(copied, {
    url: "https://hooks.example.test?token=&mode=safe",
    headers: {
      Authorization: "",
      "x-api-key": "",
      "x-workspace": "safe-value",
    },
    nested: [{ smtpPassword: "", label: "safe" }],
  });
});
