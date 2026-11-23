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

test('workflow-trigger utils: activation and secret validation', async (t) => {
  const triggerUtils = freshRequireDist(path.join('utils', 'workflow-trigger.js'));

  await t.test('extractWebhookSecret accepts only x-webhook-secret header (rejects query/body/bearer)', () => {
    assert.equal(triggerUtils.extractWebhookSecret({ headers: { 'x-webhook-secret': 'abc123secretvalue' } }), 'abc123secretvalue');
    assert.equal(triggerUtils.extractWebhookSecret({ headers: { authorization: 'Bearer token-secret-123456' } }), null);
    assert.equal(triggerUtils.extractWebhookSecret({ query: { token: 'query-secret-123456' } }), null);
    assert.equal(triggerUtils.extractWebhookSecret({ body: { webhookSecret: 'body-secret-123456' } }), null);
    assert.equal(triggerUtils.extractWebhookSecret({ headers: { 'x-flowpilot-webhook-secret': 'legacy-secret-123456' } }), null);
    assert.equal(triggerUtils.extractWebhookSecret({ headers: { 'x-trigger-secret': 'legacy-secret-123456' } }), null);
    assert.equal(triggerUtils.extractWebhookSecret({ headers: {}, query: {}, body: {} }), null);
  });

  await t.test('isValidWebhookSecret uses exact match and rejects invalid values', () => {
    const secret = 'super-secret-token-123456';
    assert.equal(triggerUtils.isValidWebhookSecret(secret, secret), true);
    assert.equal(triggerUtils.isValidWebhookSecret('wrong-secret-token-123456', secret), false);
    assert.equal(triggerUtils.isValidWebhookSecret(secret.slice(0, -1), secret), false);
    assert.equal(triggerUtils.isValidWebhookSecret(null, secret), false);
  });

  await t.test('assertWorkflowCanActivate enforces trigger and webhook secret requirements', () => {
    assert.throws(() => triggerUtils.assertWorkflowCanActivate({ steps: [] }), /at least one step/i);

    assert.throws(() => triggerUtils.assertWorkflowCanActivate({
      steps: [{ id: 's1', type: 'AI', config: {} }],
    }), /TRIGGER step/i);

    assert.throws(() => triggerUtils.assertWorkflowCanActivate({
      steps: [{ id: 't1', type: 'TRIGGER', config: { triggerMode: 'webhook' } }],
    }), /webhook secret/i);

    assert.doesNotThrow(() => triggerUtils.assertWorkflowCanActivate({
      steps: [{ id: 't1', type: 'TRIGGER', config: { triggerMode: 'manual' } }],
    }));

    assert.doesNotThrow(() => triggerUtils.assertWorkflowCanActivate({
      steps: [{ id: 't1', type: 'TRIGGER', config: { triggerMode: 'webhook', webhookSecret: '1234567890abcdef' } }],
    }));
  });
});

test('execution service: manual ownership/authz and webhook trigger guards', async (t) => {
  await t.test('manual executeWorkflow rejects non-owned/missing workflow (ownership/auth check)', async () => {
    resetModules();
    const prismaModule = require(dist('lib', 'prisma.js'));
    prismaModule.default = {
      workflow: { findFirst: async () => null },
    };
    const executionService = freshRequireDist(path.join('services', 'execution.service.js'));
    await assert.rejects(
      () => executionService.executeWorkflow('wf-1', 'user-1', {}),
      (err) => err && err.statusCode === 404 && /Workflow not found/i.test(err.message)
    );
  });

  await t.test('manual executeWorkflow passes ownership lookup for owned workflow', async () => {
    resetModules();
    const prismaModule = require(dist('lib', 'prisma.js'));
    prismaModule.default = {
      workflow: {
        findFirst: async (args) => {
          assert.deepEqual(args.where, { id: 'wf-owned', userId: 'user-1' });
          return { id: 'wf-owned', userId: 'user-1', status: 'DRAFT', steps: [] };
        },
      },
    };
    const executionService = freshRequireDist(path.join('services', 'execution.service.js'));
    await assert.rejects(
      () => executionService.executeWorkflow('wf-owned', 'user-1', {}),
      (err) => err && err.statusCode === 400 && /no steps/i.test(err.message)
    );
  });

  await t.test('webhook trigger rejects missing workflow, inactive workflow, invalid secret, and wrong trigger mode', async () => {
    resetModules();
    const prismaModule = require(dist('lib', 'prisma.js'));
    const makeService = () => {
      delete require.cache[require.resolve(dist('services', 'execution.service.js'))];
      return require(dist('services', 'execution.service.js'));
    };

    prismaModule.default = { workflow: { findUnique: async () => null } };
    let executionService = makeService();
    await assert.rejects(
      () => executionService.executeWorkflowFromWebhook('wf-missing', 'secret-secret-1234', {}),
      (err) => err && err.statusCode === 404
    );

    prismaModule.default = { workflow: { findUnique: async () => ({ id: 'wf1', status: 'DRAFT', steps: [{ id: 't', type: 'TRIGGER', config: { triggerMode: 'webhook', webhookSecret: 'secret-secret-1234' } }] }) } };
    executionService = makeService();
    await assert.rejects(
      () => executionService.executeWorkflowFromWebhook('wf1', 'secret-secret-1234', {}),
      (err) => err && err.statusCode === 403 && /not active/i.test(err.message)
    );

    prismaModule.default = { workflow: { findUnique: async () => ({ id: 'wf2', status: 'ACTIVE', steps: [{ id: 't', type: 'TRIGGER', config: { triggerMode: 'manual' } }] }) } };
    executionService = makeService();
    await assert.rejects(
      () => executionService.executeWorkflowFromWebhook('wf2', 'secret-secret-1234', {}),
      (err) => err && err.statusCode === 403 && /incoming webhook/i.test(err.message)
    );

    prismaModule.default = { workflow: { findUnique: async () => ({ id: 'wf3', status: 'ACTIVE', steps: [{ id: 't', type: 'TRIGGER', config: { triggerMode: 'webhook', webhookSecret: 'secret-secret-1234' } }] }) } };
    executionService = makeService();
    await assert.rejects(
      () => executionService.executeWorkflowFromWebhook('wf3', 'wrong-secret-123456', {}),
      (err) => err && err.statusCode === 401 && /Invalid webhook secret/i.test(err.message)
    );
  });

  await t.test('webhook trigger executes active webhook-configured workflow when secret is valid', async () => {
    resetModules();
    const prismaModule = require(dist('lib', 'prisma.js'));
    const logs = [];
    prismaModule.default = {
      workflow: {
        findUnique: async () => ({
          id: 'wf-ok',
          status: 'ACTIVE',
          steps: [
            { id: 't1', workflowId: 'wf-ok', name: 'Trigger', type: 'TRIGGER', stepOrder: 1, config: { triggerMode: 'webhook', webhookSecret: 'secret-secret-1234' } },
          ],
        }),
      },
      workflowExecution: {
        create: async ({ data }) => ({ id: 'exec-1', ...data }),
        update: async ({ where, data }) => ({ id: where.id, workflowId: 'wf-ok', status: data.status, startedAt: new Date(), completedAt: data.completedAt, logs }),
      },
      executionLog: {
        create: async ({ data }) => { logs.push(data); return data; },
      },
    };
    const executionService = freshRequireDist(path.join('services', 'execution.service.js'));
    const result = await executionService.executeWorkflowFromWebhook('wf-ok', 'secret-secret-1234', { hello: 'world' });
    assert.equal(result.status, 'COMPLETED');
    assert.equal(logs.length, 1);
    assert.equal(logs[0].stepType, 'TRIGGER');
    assert.equal(logs[0].status, 'COMPLETED');
  });
});

test('trigger controller: accepts valid webhook trigger and returns 202', async () => {
  resetModules();
  const executionModule = require(dist('services', 'execution.service.js'));
  let receivedArgs = null;
  executionModule.executeWorkflowFromWebhook = async (id, secret, payload) => {
    receivedArgs = { id, secret, payload };
    return { id: 'exec-123', status: 'COMPLETED' };
  };
  delete require.cache[require.resolve(dist('controllers', 'trigger.controller.js'))];
  const { receiveWebhookTrigger } = require(dist('controllers', 'trigger.controller.js'));

  const req = {
    params: { id: '11111111-1111-4111-8111-111111111111' },
    headers: { 'x-webhook-secret': 'secret-secret-1234' },
    query: {},
    body: { employee_name: 'Ada' },
  };
  let statusCode = 0;
  let jsonBody = null;
  const res = {
    status(code) { statusCode = code; return this; },
    json(body) { jsonBody = body; return this; },
  };
  let nextErr = null;
  await new Promise((resolve) => {
    receiveWebhookTrigger(req, res, (err) => { nextErr = err; resolve(); });
    setImmediate(resolve);
  });
  assert.equal(nextErr, null);
  assert.equal(statusCode, 202);
  assert.equal(jsonBody.success, true);
  assert.equal(jsonBody.data.executionId, 'exec-123');
  assert.deepEqual(receivedArgs, {
    id: '11111111-1111-4111-8111-111111111111',
    secret: 'secret-secret-1234',
    payload: { employee_name: 'Ada' },
  });
});
