const assert = require("node:assert/strict");
const bcrypt = require("bcrypt");
const { test } = require("node:test");

const {
  assertCurrentPassword,
  buildProfileUpdateData,
  buildUserIdFilter,
  generateAccessToken,
  toUserProfile,
  verifyCurrentPassword,
} = require("../dist/services/auth.service.js");
const { isPasswordVersionCurrent } = require("../dist/middleware/auth.js");
const jwt = require("jsonwebtoken");
const { env } = require("../dist/config/env.js");
const {
  changePasswordSchema,
  profileUpdateSchema,
} = require("../dist/validators/auth.validation.js");
const authRoutes = require("../dist/routes/auth.routes.js").default;

test("profile updates validate trimmed names, email, and allowed fields", () => {
  assert.deepEqual(
    profileUpdateSchema.parse({ name: "  Alex Doe ", email: "alex@example.com" }),
    { name: "Alex Doe", email: "alex@example.com" }
  );
  assert.equal(
    profileUpdateSchema.safeParse({ name: "Al", email: "not-an-email" }).success,
    false
  );
  assert.equal(
    profileUpdateSchema.safeParse({
      name: "Alex Doe",
      email: "alex@example.com",
      role: "ADMIN",
    }).success,
    false
  );
});

test("password changes require a strong matching new password", () => {
  const valid = {
    currentPassword: "Current-password-1",
    newPassword: "New-password-2!",
    confirmNewPassword: "New-password-2!",
  };
  assert.equal(changePasswordSchema.safeParse(valid).success, true);
  assert.equal(
    changePasswordSchema.safeParse({
      ...valid,
      newPassword: "weak",
      confirmNewPassword: "weak",
    }).success,
    false
  );
  assert.equal(
    changePasswordSchema.safeParse({
      ...valid,
      confirmNewPassword: "Different-password-3!",
    }).success,
    false
  );
});

test("current password verification accepts only the matching hash", async () => {
  const hash = await bcrypt.hash("correct-password", 4);
  assert.equal(await verifyCurrentPassword("correct-password", hash), true);
  assert.equal(await verifyCurrentPassword("incorrect-password", hash), false);
  await assertCurrentPassword("correct-password", hash);
  await assert.rejects(
    () => assertCurrentPassword("incorrect-password", hash),
    { message: "Current password is incorrect." }
  );
});

test("profile lookup is keyed to the authenticated user and response omits password", () => {
  assert.deepEqual(buildUserIdFilter("user-a"), { id: "user-a" });

  const profile = toUserProfile({
    id: "user-a",
    name: "Alex Doe",
    email: "alex@example.com",
    avatar: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    password: "must-not-be-returned",
  });
  assert.deepEqual(Object.keys(profile).sort(), [
    "avatar",
    "createdAt",
    "email",
    "id",
    "name",
    "updatedAt",
  ]);
  assert.equal(JSON.stringify(profile).includes("must-not-be-returned"), false);
});

test("profile and password routes require authentication", () => {
  const protectedRoutes = [
    { path: "/me", method: "get" },
    { path: "/me", method: "patch" },
    { path: "/password", method: "post" },
  ];

  for (const expected of protectedRoutes) {
    const routeLayer = authRoutes.stack.find(
      (layer) => layer.route?.path === expected.path && layer.route.methods[expected.method]
    );
    assert.ok(routeLayer, `Expected ${expected.method.toUpperCase()} ${expected.path}`);
    assert.equal(
      routeLayer.route.stack.some((handler) => handler.name === "requireAuth"),
      true
    );
  }
});

test("password version invalidates prior sessions while preserving legacy version zero", () => {
  assert.equal(isPasswordVersionCurrent(undefined, 0), true);
  assert.equal(isPasswordVersionCurrent(0, 0), true);
  assert.equal(isPasswordVersionCurrent(0, 1), false);
  assert.equal(isPasswordVersionCurrent(1, 1), true);

  const token = generateAccessToken({
    id: "user-a",
    email: "alex@example.com",
    role: "USER",
    passwordVersion: 1,
  });
  const payload = jwt.verify(token, env.jwt.secret);
  assert.equal(payload.passwordVersion, 1);
});

test("profile updates do not increment the password version", () => {
  assert.deepEqual(
    buildProfileUpdateData({ name: "Alex Doe", email: "alex@example.com" }),
    { name: "Alex Doe", email: "alex@example.com" }
  );
  assert.equal(isPasswordVersionCurrent(0, 0), true);
});
