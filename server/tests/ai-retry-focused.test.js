const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const dist = (...p) => path.join(__dirname, '..', 'dist', ...p);

function resetDistModules() {
  const distRoot = path.join('server', 'dist');
  for (const key of Object.keys(require.cache)) {
    if (key.includes(distRoot)) delete require.cache[key];
  }
}

function mockGenai({ generateContentImpl, getImpl } = {}) {
  const genaiPath = require.resolve('@google/genai', { paths: [path.join(process.cwd(), 'node_modules')] });
  require.cache[genaiPath] = {
    id: genaiPath,
    filename: genaiPath,
    loaded: true,
    exports: {
      GoogleGenAI: function GoogleGenAI() {
        this.models = {
          generateContent: generateContentImpl || (async () => { throw new Error('generateContent not mocked'); }),
          get: getImpl || (async () => { throw new Error('models.get not mocked'); }),
        };
      },
    },
  };
}

function loadAiService({ generateContentImpl, getImpl, env: envOverrides } = {}) {
  const prev = {};
  if (envOverrides) {
    for (const [k, v] of Object.entries(envOverrides)) {
      prev[k] = process.env[k];
      if (v === undefined || v === null) delete process.env[k];
      else process.env[k] = String(v);
    }
  }
  try {
    resetDistModules();
    mockGenai({ generateContentImpl, getImpl });
    return require(dist('services', 'ai.service.js'));
  } finally {
    if (envOverrides) {
      resetDistModules();
      // restore env for other tests; module cache will be rebuilt by next loadAiService call
      for (const [k, v] of Object.entries(prev)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  }
}

function validWorkflowResponse() {
  return {
    text: JSON.stringify({
      title: 'Test Workflow',
      description: null,
      steps: [
        { order: 1, type: 'TRIGGER', name: 'Start', config: { triggerMode: 'manual' } },
        { order: 2, type: 'DELAY', name: 'Wait', config: { seconds: 5 } },
      ],
    }),
  };
}

test('AI generation retries: success after transient 503 and respects Retry-After', async () => {
  let calls = 0;
  const delays = [];
  const svc = loadAiService({
    generateContentImpl: async () => {
      calls += 1;
      if (calls === 1) {
        const err = new Error('The model is overloaded. Please try again later.');
        err.status = 503;
        err.headers = { 'retry-after': '2' };
        throw err;
      }
      return validWorkflowResponse();
    },
  });

  const result = await svc.generateWorkflowFromPrompt(
    { prompt: 'create a simple workflow for onboarding' },
    { sleep: async (ms) => { delays.push(ms); }, random: () => 0.5, timeoutMs: 30_000 }
  );

  assert.equal(calls, 2);
  assert.deepEqual(delays, [2000]);
  assert.equal(result.title, 'Test Workflow');
  assert.equal(result.steps.length, 2);
  assert.equal(result.steps[0].type, 'TRIGGER');
});

test('AI generation retries: exhausts max attempts for transient 503 (provider_unavailable) with clear user-friendly error', async () => {
  let calls = 0;
  const delays = [];
  const svc = loadAiService({
    generateContentImpl: async () => {
      calls += 1;
      const err = new Error('The model is overloaded. Please try again later.');
      err.status = 503;
      throw err;
    },
  });

  await assert.rejects(
    () => svc.generateWorkflowFromPrompt(
      { prompt: 'create a workflow' },
      { sleep: async (ms) => { delays.push(ms); }, random: () => 0, timeoutMs: 30_000 }
    ),
    (err) => {
      assert.equal(err.statusCode, 502);
      assert.equal(err.details.httpStatus, 503);
      assert.equal(err.details.causeCategory, 'provider_unavailable');
      assert.match(err.message, /temporarily unavailable|high demand|try again/i);
      assert.equal(err.details.attemptsUsed, 3);
      return true;
    }
  );

  assert.equal(calls, 3);
  assert.deepEqual(delays, [500, 1000]);
});

test('AI generation retries: retries transient network errors then succeeds', async () => {
  let calls = 0;
  const delays = [];
  const svc = loadAiService({
    generateContentImpl: async () => {
      calls += 1;
      if (calls < 3) {
        const err = new Error('fetch failed: connect ETIMEDOUT');
        err.code = 'ETIMEDOUT';
        throw err;
      }
      return validWorkflowResponse();
    },
  });

  const result = await svc.generateWorkflowFromPrompt(
    { prompt: 'create a workflow' },
    { sleep: async (ms) => { delays.push(ms); }, random: () => 0, timeoutMs: 30_000 }
  );

  assert.equal(calls, 3);
  assert.deepEqual(delays, [500, 1000]);
  assert.equal(result.steps[0].order, 1);
});

test('AI generation retries: does not retry non-retryable provider errors', async () => {
  const cases = [
    { status: 400, message: 'Bad request' },
    { status: 401, message: 'API key not valid' },
    { status: 403, message: 'Permission denied' },
    { status: 404, message: 'Model not found' },
  ];

  for (const c of cases) {
    let calls = 0;
    const delays = [];
    const svc = loadAiService({
      generateContentImpl: async () => {
        calls += 1;
        const err = new Error(c.message);
        err.status = c.status;
        throw err;
      },
    });

    await assert.rejects(
      () => svc.generateWorkflowFromPrompt(
        { prompt: 'create a workflow' },
        { sleep: async (ms) => { delays.push(ms); }, random: () => 0, timeoutMs: 30_000 }
      ),
      (err) => {
        assert.equal(err.statusCode, 502);
        assert.equal(err.details.httpStatus, c.status);
        return true;
      }
    );

    assert.equal(calls, 1, `status ${c.status} must not be retried`);
    assert.deepEqual(delays, [], `status ${c.status} must not sleep/retry`);
  }
});

test('AI generation budget: times out (bounded total time) and cancels in-flight request when supported', async () => {
  let calls = 0;
  let observedAbort = false;
  const svc = loadAiService({
    generateContentImpl: async (params) => {
      calls += 1;
      const signal = params?.config?.httpOptions?.abortSignal;
      assert.ok(signal, 'expected abortSignal to be passed for in-flight cancellation');
      return await new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          observedAbort = true;
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        }, { once: true });
      });
    },
  });

  let now = 0;
  await assert.rejects(
    () => svc.generateWorkflowFromPrompt(
      { prompt: 'create a workflow' },
      {
        timeoutMs: 25,
        now: () => now,
        sleep: async (ms) => { now += ms; },
        random: () => 0,
      }
    ),
    (err) => {
      assert.equal(err.statusCode, 502);
      assert.equal(err.details.causeCategory, 'timeout');
      assert.match(err.message, /timed out|try again/i);
      return true;
    }
  );

  assert.equal(calls, 1);
  assert.equal(observedAbort, true);
});

test('AI generation fallback: uses verified fallback model after 503 and only after availability verification', async () => {
  const generateCalls = [];
  const getCalls = [];
  const svc = loadAiService({
    env: { GEMINI_MODEL: 'primary-model', GEMINI_FALLBACK_MODEL: 'fallback-model' },
    generateContentImpl: async (params) => {
      generateCalls.push(params.model);
      if (params.model === 'primary-model') {
        const err = new Error('The model is overloaded. Please try again later.');
        err.status = 503;
        throw err;
      }
      if (params.model === 'fallback-model') {
        return validWorkflowResponse();
      }
      throw new Error(`unexpected model ${params.model}`);
    },
    getImpl: async (params) => {
      getCalls.push(params.model);
      assert.equal(params.model, 'fallback-model');
      // verification call proves model is available for configured API key
      return { name: `models/${params.model}` };
    },
  });

  const result = await svc.generateWorkflowFromPrompt(
    { prompt: 'create a workflow' },
    { sleep: async () => {}, random: () => 0, timeoutMs: 30_000 }
  );

  // 1 failed primary generate attempt + 1 fallback generate attempt; fallback used only after models.get verification
  assert.deepEqual(generateCalls, ['primary-model', 'fallback-model']);
  assert.deepEqual(getCalls, ['fallback-model']);
  assert.equal(result.title, 'Test Workflow');
});

test('AI generation fallback: does not use unverified/unavailable fallback model (verification fails)', async () => {
  const generateCalls = [];
  const getCalls = [];
  const svc = loadAiService({
    env: { GEMINI_MODEL: 'primary-model', GEMINI_FALLBACK_MODEL: 'missing-fallback' },
    generateContentImpl: async (params) => {
      generateCalls.push(params.model);
      const err = new Error('The model is overloaded. Please try again later.');
      err.status = 503;
      throw err;
    },
    getImpl: async (params) => {
      getCalls.push(params.model);
      const err = new Error('Model not found');
      err.status = 404;
      throw err;
    },
  });

  await assert.rejects(
    () => svc.generateWorkflowFromPrompt(
      { prompt: 'create a workflow' },
      { sleep: async () => {}, random: () => 0, timeoutMs: 30_000 }
    ),
    (err) => {
      assert.equal(err.statusCode, 502);
      assert.equal(err.details.causeCategory, 'provider_unavailable');
      assert.match(err.message, /temporarily unavailable|high demand|try again/i);
      return true;
    }
  );

  // No generate call should be made with unverified/unavailable fallback model.
  assert.ok(generateCalls.every((m) => m === 'primary-model'));
  assert.deepEqual(getCalls, ['missing-fallback']);
  assert.equal(generateCalls.length, 3);
});
