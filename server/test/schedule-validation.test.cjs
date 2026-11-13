const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  createScheduleSchema,
  getNextScheduleRun,
  updateScheduleSchema,
} = require("../dist/validators/schedule.validation.js");
const {
  buildScheduleOwnerFilter,
} = require("../dist/services/schedule.service.js");

const validSchedule = {
  workflowId: "2b7399e4-87c0-4b89-9d31-ef9842a27ba0",
  firstRunAt: "2030-01-02T03:04:05.000Z",
  triggerInput: { employee_email: "person@example.test" },
};

test("schedule schema accepts one-time and bounded recurring schedules", () => {
  assert.equal(createScheduleSchema.safeParse(validSchedule).success, true);
  assert.equal(
    createScheduleSchema.safeParse({
      ...validSchedule,
      intervalMinutes: 5,
    }).success,
    true
  );
  assert.equal(
    createScheduleSchema.safeParse({
      ...validSchedule,
      intervalMinutes: 4,
    }).success,
    false
  );
  assert.equal(
    createScheduleSchema.safeParse({
      ...validSchedule,
      intervalMinutes: 525601,
    }).success,
    false
  );
  assert.equal(
    createScheduleSchema.safeParse({
      ...validSchedule,
      firstRunAt: "2020-01-02T03:04:05.000Z",
    }).success,
    false
  );
});

test("schedule trigger input must be an object without credential-like keys", () => {
  assert.equal(
    createScheduleSchema.safeParse({
      ...validSchedule,
      triggerInput: { profile: { api_key: "not-allowed" } },
    }).success,
    false
  );
  assert.equal(
    createScheduleSchema.safeParse({
      ...validSchedule,
      triggerInput: ["not", "an", "object"],
    }).success,
    false
  );
});

test("schedule status updates only accept a boolean active flag", () => {
  assert.equal(updateScheduleSchema.safeParse({ isActive: false }).success, true);
  assert.equal(updateScheduleSchema.safeParse({ isActive: "false" }).success, false);
  assert.equal(updateScheduleSchema.safeParse({ isActive: true, ownerId: "x" }).success, false);
});

test("recurring schedules advance from dispatch time and one-time schedules stop", () => {
  const now = new Date("2030-01-02T03:04:05.000Z");
  assert.equal(getNextScheduleRun(now, null), null);
  assert.equal(
    getNextScheduleRun(now, 15).toISOString(),
    "2030-01-02T03:19:05.000Z"
  );
});

test("schedule lookup and mutation filters include the workflow owner", () => {
  assert.deepEqual(buildScheduleOwnerFilter("user-a"), {
    workflow: { userId: "user-a" },
  });
  assert.deepEqual(buildScheduleOwnerFilter("user-a", "schedule-a"), {
    id: "schedule-a",
    workflow: { userId: "user-a" },
  });
});
