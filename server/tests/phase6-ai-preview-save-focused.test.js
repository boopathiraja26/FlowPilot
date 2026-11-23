const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const dist = (...p) => path.join(__dirname, '..', 'dist', ...p);

function freshDistModule(rel) {
  const abs = dist(...rel.split('/'));
  delete require.cache[abs];
  return require(abs);
}

function createRes() {
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

async function runHandler(handler, req) {
  const res = createRes();
  let nextErr;
  const next = (err) => {
    nextErr = err;
  };
  await handler(req, res, next);
  if (nextErr) throw nextErr;
  return res;
}

test('Phase 6 AI generate-and-save schema accepts prompt or edited workflow payload', () => {
  const { generateAndSaveWorkflowSchema } = freshDistModule('validators/ai.validation.js');

  const promptOk = generateAndSaveWorkflowSchema.safeParse({ prompt: 'Create a workflow that sends a welcome email' });
  assert.equal(promptOk.success, true);

  const workflowOk = generateAndSaveWorkflowSchema.safeParse({
    workflow: {
      title: 'Edited AI Workflow',
      description: '  trimmed later  ',
      steps: [
        { order: 1, type: 'TRIGGER', name: 'Manual start', config: { triggerMode: 'manual' } },
        { order: 2, type: 'EMAIL', name: 'Send email', config: { to: 'user@example.com', subject: 'Hi', body: 'Hello' } },
      ],
    },
  });
  assert.equal(workflowOk.success, true);

  const neither = generateAndSaveWorkflowSchema.safeParse({});
  assert.equal(neither.success, false);

  const badWorkflow = generateAndSaveWorkflowSchema.safeParse({
    workflow: { title: 'No', description: null, steps: [] },
  });
  assert.equal(badWorkflow.success, false);
});

test('Phase 6 AI generate-and-save saves provided edited workflow without regenerating', async () => {
  // Patch service module before loading controller so controller captures mocked exports.
  const aiServicePath = dist('services', 'ai.service.js');
  delete require.cache[aiServicePath];
  const aiService = require(aiServicePath);

  const originalGenerate = aiService.generateWorkflowFromPrompt;
  const originalSave = aiService.saveGeneratedWorkflow;

  let generateCalls = 0;
  let savedInput;
  aiService.generateWorkflowFromPrompt = async () => {
    generateCalls += 1;
    throw new Error('generateWorkflowFromPrompt should not be called when workflow payload is provided');
  };
  aiService.saveGeneratedWorkflow = async (userId, workflow) => {
    savedInput = { userId, workflow };
    return { id: 'wf_saved_1', title: workflow.title, status: 'DRAFT', steps: workflow.steps };
  };

  try {
    const controllerPath = dist('controllers', 'ai.controller.js');
    delete require.cache[controllerPath];
    const { generateAndSave } = require(controllerPath);

    const res = await runHandler(generateAndSave, {
      user: { id: 'user-1' },
      body: {
        workflow: {
          title: '  Edited Workflow  ',
          description: '  edited description  ',
          steps: [
            { order: 3, type: 'EMAIL', name: '  Send welcome  ', config: { to: 'a@example.com', subject: 'Hi', body: 'Body' } },
            { order: 1, type: 'TRIGGER', name: '  Manual trigger  ', config: { triggerMode: 'manual' } },
            { order: 2, type: 'DELAY', name: 'Wait', config: { seconds: 5 } },
          ],
        },
      },
    });

    assert.equal(generateCalls, 0);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body?.success, true);
    assert.match(res.body?.message || '', /saved successfully/i);
    assert.equal(savedInput.userId, 'user-1');
    assert.equal(savedInput.workflow.title, 'Edited Workflow');
    assert.equal(savedInput.workflow.description, 'edited description');
    assert.deepEqual(savedInput.workflow.steps.map((s) => [s.order, s.type, s.name]), [
      [1, 'TRIGGER', 'Manual trigger'],
      [2, 'DELAY', 'Wait'],
      [3, 'EMAIL', 'Send welcome'],
    ]);
    assert.deepEqual(savedInput.workflow.steps[0].config, { triggerMode: 'manual' });
  } finally {
    aiService.generateWorkflowFromPrompt = originalGenerate;
    aiService.saveGeneratedWorkflow = originalSave;
    delete require.cache[dist('controllers', 'ai.controller.js')];
  }
});

test('Phase 6 AI generate-and-save falls back to prompt generation when no workflow payload provided', async () => {
  const aiServicePath = dist('services', 'ai.service.js');
  delete require.cache[aiServicePath];
  const aiService = require(aiServicePath);

  const originalGenerate = aiService.generateWorkflowFromPrompt;
  const originalSave = aiService.saveGeneratedWorkflow;

  let generateCalls = 0;
  let receivedPrompt;
  aiService.generateWorkflowFromPrompt = async (input) => {
    generateCalls += 1;
    receivedPrompt = input.prompt;
    return {
      title: 'Generated',
      description: null,
      steps: [{ order: 1, type: 'TRIGGER', name: 'Start', config: { triggerMode: 'manual' } }],
    };
  };
  aiService.saveGeneratedWorkflow = async (_userId, workflow) => ({ id: 'wf_gen_1', ...workflow });

  try {
    const controllerPath = dist('controllers', 'ai.controller.js');
    delete require.cache[controllerPath];
    const { generateAndSave } = require(controllerPath);

    const res = await runHandler(generateAndSave, {
      user: { id: 'user-1' },
      body: { prompt: 'Create a simple onboarding workflow' },
    });

    assert.equal(generateCalls, 1);
    assert.equal(receivedPrompt, 'Create a simple onboarding workflow');
    assert.equal(res.statusCode, 201);
    assert.match(res.body?.message || '', /generated and saved successfully/i);
  } finally {
    aiService.generateWorkflowFromPrompt = originalGenerate;
    aiService.saveGeneratedWorkflow = originalSave;
    delete require.cache[dist('controllers', 'ai.controller.js')];
  }
});
