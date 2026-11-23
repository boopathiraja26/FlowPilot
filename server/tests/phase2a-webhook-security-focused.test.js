const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const dist = (...p) => path.join(__dirname, '..', 'dist', ...p);

function freshRequireDist(relPath) {
  const full = dist(relPath);
  const resolved = require.resolve(full);
  delete require.cache[resolved];
  return require(full);
}

function resetModules() {
  for (const key of Object.keys(require.cache)) {
    if (key.includes(path.join('server', 'dist'))) {
      delete require.cache[key];
    }
  }
}

function asObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}

function containsSecretValue(value, secret) {
  if (value == null) return false;
  if (typeof value === 'string') return value.includes(secret);
  if (Array.isArray(value)) return value.some((v) => containsSecretValue(v, secret));
  if (typeof value === 'object') {
    return Object.values(value).some((v) => containsSecretValue(v, secret));
  }
  return false;
}

test('webhook security: header-only authentication', async (t) => {
  await t.test('extractWebhookSecret rejects query/body-only and legacy headers', () => {
    const triggerUtils = freshRequireDist(path.join('utils', 'workflow-trigger.js'));
    assert.equal(triggerUtils.extractWebhookSecret({ headers: { 'x-webhook-secret': 'header-secret-123456' } }), 'header-secret-123456');
    assert.equal(triggerUtils.extractWebhookSecret({ query: { secret: 'query-secret-123456' }, headers: {} }), null);
    assert.equal(triggerUtils.extractWebhookSecret({ query: { token: 'query-token-123456' }, headers: {} }), null);
    assert.equal(triggerUtils.extractWebhookSecret({ body: { secret: 'body-secret-123456' }, headers: {} }), null);
    assert.equal(triggerUtils.extractWebhookSecret({ body: { webhookSecret: 'body-secret-123456' }, headers: {} }), null);
    assert.equal(triggerUtils.extractWebhookSecret({ body: { token: 'body-token-123456' }, headers: {} }), null);
    assert.equal(triggerUtils.extractWebhookSecret({ headers: { authorization: 'Bearer bearer-secret-123456' } }), null);
    assert.equal(triggerUtils.extractWebhookSecret({ headers: { 'x-flowpilot-webhook-secret': 'legacy-secret-123456' } }), null);
  });

  await t.test('incoming webhook rejects query/body-only secret but accepts x-webhook-secret header', async () => {
    resetModules();
    const prismaModule = require(dist('lib', 'prisma.js'));
    const secret = 'real-webhook-secret-123456';
    const workflow = {
      id: 'wf-sec',
      status: 'ACTIVE',
      steps: [
        { id: 't1', workflowId: 'wf-sec', name: 'Trigger', type: 'TRIGGER', stepOrder: 1, config: { triggerMode: 'webhook', webhookSecret: secret } },
      ],
    };
    const logs = [];
    prismaModule.default = {
      workflow: { findUnique: async () => workflow },
      workflowExecution: {
        create: async ({ data }) => ({ id: 'exec-sec', ...data }),
        update: async ({ where, data }) => ({ id: where.id, workflowId: 'wf-sec', status: data.status, completedAt: data.completedAt, logs }),
      },
      executionLog: { create: async ({ data }) => { logs.push(data); return data; } },
    };
    delete require.cache[require.resolve(dist('services', 'execution.service.js'))];
    delete require.cache[require.resolve(dist('controllers', 'trigger.controller.js'))];
    const { receiveWebhookTrigger } = require(dist('controllers', 'trigger.controller.js'));

    async function invoke(req) {
      let statusCode = 0;
      let jsonBody = null;
      let nextErr = null;
      const res = {
        status(code) { statusCode = code; return this; },
        json(body) { jsonBody = body; return this; },
      };
      await new Promise((resolve) => {
        receiveWebhookTrigger(req, res, (err) => { nextErr = err; resolve(); });
        setImmediate(resolve);
      });
      if (nextErr) throw nextErr;
      return { statusCode, jsonBody };
    }

    await assert.rejects(
      () => invoke({ params: { id: '11111111-1111-4111-8111-111111111111' }, headers: {}, query: { secret }, body: {} }),
      (err) => err && err.statusCode === 401 && /Invalid webhook secret/i.test(err.message)
    );
    await assert.rejects(
      () => invoke({ params: { id: '11111111-1111-4111-8111-111111111111' }, headers: {}, query: {}, body: { webhookSecret: secret } }),
      (err) => err && err.statusCode === 401 && /Invalid webhook secret/i.test(err.message)
    );

    const ok = await invoke({
      params: { id: '11111111-1111-4111-8111-111111111111' },
      headers: { 'x-webhook-secret': secret },
      query: { secret: 'wrong-in-query-ignored' },
      body: {},
    });
    assert.equal(ok.statusCode, 202);
    assert.equal(ok.jsonBody.success, true);
    assert.equal(ok.jsonBody.data.executionId, 'exec-sec');
  });
});

test('webhook security: secret redaction in ordinary workflow/step responses', async (t) => {
  await t.test('workflow and step helpers redact webhookSecret while keeping config shape', () => {
    const triggerUtils = freshRequireDist(path.join('utils', 'workflow-trigger.js'));
    const secret = 'real-webhook-secret-123456';
    const workflow = {
      id: 'wf-1',
      status: 'ACTIVE',
      steps: [
        { id: 't1', type: 'TRIGGER', name: 'Trigger', config: { triggerMode: 'webhook', webhookSecret: secret, event: 'e' } },
        { id: 'a1', type: 'AI', name: 'AI', config: { prompt: 'hi' } },
      ],
    };
    const redacted = triggerUtils.redactWorkflowSecrets(workflow);
    assert.equal(redacted.steps[0].config.webhookSecret, triggerUtils.WEBHOOK_SECRET_REDACTED_PLACEHOLDER);
    assert.equal(redacted.steps[0].config.triggerMode, 'webhook');
    assert.equal(redacted.steps[0].config.event, 'e');
    assert.equal(redacted.steps[1].config.prompt, 'hi');
    assert.equal(containsSecretValue(redacted, secret), false);

    const step = { id: 't1', type: 'TRIGGER', config: { triggerMode: 'webhook', webhookSecret: secret } };
    const redactedStep = triggerUtils.redactStepSecrets(step);
    assert.equal(redactedStep.config.webhookSecret, triggerUtils.WEBHOOK_SECRET_REDACTED_PLACEHOLDER);
    assert.equal(containsSecretValue(redactedStep, secret), false);
  });

  await t.test('workflow-step update/create controllers redact secrets from responses', async () => {
    resetModules();
    const secret = 'real-webhook-secret-123456';
    const stepService = require(dist('services', 'workflow-step.service.js'));
    const originalUpdate = stepService.updateWorkflowStep;
    const originalCreate = stepService.createWorkflowStep;
    try {
      stepService.updateWorkflowStep = async () => ({ id: 's1', workflowId: 'wf1', type: 'TRIGGER', name: 'T', stepOrder: 1, config: { triggerMode: 'webhook', webhookSecret: secret } });
      stepService.createWorkflowStep = async () => ({ id: 's2', workflowId: 'wf1', type: 'TRIGGER', name: 'T2', stepOrder: 1, config: { triggerMode: 'webhook', webhookSecret: secret } });
      delete require.cache[require.resolve(dist('controllers', 'workflow-step.controller.js'))];
      const ctrl = require(dist('controllers', 'workflow-step.controller.js'));

      const mkRes = () => {
        const out = { statusCode: 0, body: null };
        return {
          out,
          res: { status(code) { out.statusCode = code; return this; }, json(body) { out.body = body; return this; } },
        };
      };

      const u = mkRes();
      await new Promise((resolve) => { ctrl.update({ user: { id: 'u1' }, params: { stepId: '11111111-1111-4111-8111-111111111111' }, body: { name: 'T' } }, u.res, () => resolve()); setImmediate(resolve); });
      assert.equal(u.out.statusCode, 200);
      assert.equal(containsSecretValue(u.out.body, secret), false);
      assert.equal(asObject(u.out.body.data.step.config).webhookSecret, '[REDACTED_WEBHOOK_SECRET]');

      const c = mkRes();
      await new Promise((resolve) => { ctrl.create({ user: { id: 'u1' }, params: { workflowId: '11111111-1111-4111-8111-111111111111' }, body: { name: 'T2', type: 'TRIGGER', config: {} } }, c.res, () => resolve()); setImmediate(resolve); });
      assert.equal(c.out.statusCode, 201);
      assert.equal(containsSecretValue(c.out.body, secret), false);
    } finally {
      stepService.updateWorkflowStep = originalUpdate;
      stepService.createWorkflowStep = originalCreate;
      resetModules();
    }
  });
});

test('webhook security: secret preservation and rotation', async (t) => {
  await t.test('step update preserves stored secret when incoming config contains redacted placeholder', async () => {
    resetModules();
    const prismaModule = require(dist('lib', 'prisma.js'));
    const existingSecret = 'existing-secret-1234567890';
    let updatedData = null;
    prismaModule.default = {
      workflowStep: {
        findFirst: async () => ({
          id: 'step-1',
          workflowId: 'wf-1',
          type: 'TRIGGER',
          name: 'Trigger',
          stepOrder: 1,
          config: { triggerMode: 'webhook', webhookSecret: existingSecret, event: 'manual.trigger' },
          workflow: { userId: 'user-1' },
        }),
        update: async ({ where, data }) => {
          updatedData = { where, data };
          return { id: where.id, workflowId: 'wf-1', type: 'TRIGGER', name: data.name || 'Trigger', stepOrder: 1, config: data.config };
        },
      },
    };
    const stepService = freshRequireDist(path.join('services', 'workflow-step.service.js'));
    const result = await stepService.updateWorkflowStep('step-1', 'user-1', {
      name: 'Trigger Updated',
      config: { triggerMode: 'webhook', webhookSecret: '[REDACTED_WEBHOOK_SECRET]', event: 'manual.trigger' },
    });
    assert.equal(updatedData.data.config.webhookSecret, existingSecret);
    assert.equal(updatedData.data.config.event, 'manual.trigger');
    assert.equal(result.config.webhookSecret, existingSecret);
  });

  await t.test('rotation generates/stores a new secret and returns it explicitly once while redacting step payload', async () => {
    resetModules();
    const prismaModule = require(dist('lib', 'prisma.js'));
    const oldSecret = 'old-secret-1234567890';
    let updatedData = null;
    prismaModule.default = {
      workflowStep: {
        findFirst: async () => ({
          id: 'step-1',
          workflowId: 'wf-1',
          type: 'TRIGGER',
          name: 'Trigger',
          stepOrder: 1,
          config: { triggerMode: 'webhook', webhookSecret: oldSecret, event: 'manual.trigger' },
          workflow: { userId: 'user-1' },
        }),
        update: async ({ where, data }) => {
          updatedData = { where, data };
          return { id: where.id, workflowId: 'wf-1', type: 'TRIGGER', name: 'Trigger', stepOrder: 1, config: data.config };
        },
      },
    };
    delete require.cache[require.resolve(dist('services', 'workflow-step.service.js'))];
    delete require.cache[require.resolve(dist('controllers', 'workflow-step.controller.js'))];
    const ctrl = require(dist('controllers', 'workflow-step.controller.js'));
    let statusCode = 0;
    let jsonBody = null;
    const res = { status(code) { statusCode = code; return this; }, json(body) { jsonBody = body; return this; } };
    await new Promise((resolve) => {
      ctrl.rotateWebhookSecret({ user: { id: 'user-1' }, params: { stepId: '11111111-1111-4111-8111-111111111111' } }, res, () => resolve());
      setImmediate(resolve);
    });
    assert.equal(statusCode, 200);
    assert.equal(typeof jsonBody.data.webhookSecret, 'string');
    assert.ok(jsonBody.data.webhookSecret.length >= 16);
    assert.notEqual(jsonBody.data.webhookSecret, oldSecret);
    assert.equal(updatedData.data.config.webhookSecret, jsonBody.data.webhookSecret);
    assert.equal(updatedData.data.config.triggerMode, 'webhook');
    assert.equal(jsonBody.data.step.config.webhookSecret, '[REDACTED_WEBHOOK_SECRET]');
    assert.equal(containsSecretValue(jsonBody.data.step, jsonBody.data.webhookSecret), false);
  });
});
