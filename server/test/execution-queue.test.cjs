const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  executionWorkerOptions,
  getExecutionJobOptions,
  getRedisConnectionOptions,
} = require("../dist/queue/executionQueue.js");

test("execution jobs are keyed by execution and never automatically retried", () => {
  assert.deepEqual(getExecutionJobOptions("execution-123"), {
    jobId: "execution-123",
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: false,
  });
  assert.equal(executionWorkerOptions.maxStalledCount, 0);
});

test("Redis URL parsing supports local, authenticated and TLS connections", () => {
  assert.deepEqual(getRedisConnectionOptions("redis://localhost:6381/2"), {
    host: "localhost",
    port: 6381,
    username: undefined,
    password: undefined,
    db: 2,
    maxRetriesPerRequest: null,
  });

  assert.deepEqual(
    getRedisConnectionOptions("rediss://worker:pa%3Ass@cache.example.test/0"),
    {
      host: "cache.example.test",
      port: 6379,
      username: "worker",
      password: "pa:ss",
      db: 0,
      tls: {},
      maxRetriesPerRequest: null,
    }
  );
});

test("Redis URL parsing rejects unsupported protocols and invalid databases", () => {
  assert.throws(() => getRedisConnectionOptions("http://localhost:6379"));
  assert.throws(() => getRedisConnectionOptions("redis://localhost/not-a-db"));
});
