const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

function resetDistModules() {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(distDir)) delete require.cache[key];
  }
}

function loadErrorHandler(nodeEnv) {
  const prev = process.env.NODE_ENV;
  if (nodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = nodeEnv;
  resetDistModules();
  const mod = require(path.join(distDir, 'middleware', 'errorHandler.js'));
  return {
    mod,
    restore() {
      if (prev === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = prev;
      resetDistModules();
    },
  };
}

function mockRes() {
  return {
    statusCode: 0,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

function captureConsole() {
  const calls = { warn: [], error: [], log: [] };
  const orig = { warn: console.warn, error: console.error, log: console.log };
  console.warn = (...args) => calls.warn.push(args);
  console.error = (...args) => calls.error.push(args);
  console.log = (...args) => calls.log.push(args);
  return {
    calls,
    restore() {
      console.warn = orig.warn;
      console.error = orig.error;
      console.log = orig.log;
    },
  };
}

test('centralized error handler: development and production response/log behavior', async (t) => {
  await t.test('development 401 ApiError response omits stack and preserves status/message; 4xx logging is concise without stack noise', () => {
    const { mod, restore } = loadErrorHandler('development');
    const cap = captureConsole();
    try {
      const { ApiError, errorHandler } = mod;
      const req = { method: 'POST', originalUrl: '/api/triggers/webhook/wf-1?secret=[REDACTED]' };
      const res = mockRes();
      const err = new ApiError(401, 'Invalid webhook secret');

      errorHandler(err, req, res, () => {});

      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.body, { success: false, message: 'Invalid webhook secret' });
      assert.equal(Object.prototype.hasOwnProperty.call(res.body, 'stack'), false);

      assert.equal(cap.calls.error.length, 0);
      assert.equal(cap.calls.warn.length, 1);
      const warnText = cap.calls.warn[0].map(String).join(' ');
      assert.match(warnText, /\[http\] 401 POST \/api\/triggers\/webhook\/wf-1\?secret=\[REDACTED\] - Invalid webhook secret/);
      assert.doesNotMatch(warnText, /\n\s+at /);
      assert.equal(cap.calls.warn[0].some(arg => arg && arg.stack), false);
    } finally {
      cap.restore();
      restore();
    }
  });

  await t.test('development 403 ApiError response omits stack and preserves status/message', () => {
    const { mod, restore } = loadErrorHandler('development');
    const cap = captureConsole();
    try {
      const { ApiError, errorHandler } = mod;
      const req = { method: 'POST', originalUrl: '/api/triggers/webhook/wf-1' };
      const res = mockRes();
      const err = new ApiError(403, 'Workflow is not active');

      errorHandler(err, req, res, () => {});

      assert.equal(res.statusCode, 403);
      assert.deepEqual(res.body, { success: false, message: 'Workflow is not active' });
      assert.equal(Object.prototype.hasOwnProperty.call(res.body, 'stack'), false);
      assert.equal(cap.calls.error.length, 0);
      assert.equal(cap.calls.warn.length, 1);
    } finally {
      cap.restore();
      restore();
    }
  });

  await t.test('development preserves ApiError details and validation status/message', () => {
    const { mod, restore } = loadErrorHandler('development');
    const cap = captureConsole();
    try {
      const { ApiError, errorHandler } = mod;
      const req = { method: 'POST', originalUrl: '/api/workflows' };
      const res = mockRes();
      const details = { title: ['Required'] };
      const err = new ApiError(400, 'Validation failed', details);

      errorHandler(err, req, res, () => {});

      assert.equal(res.statusCode, 400);
      assert.deepEqual(res.body, { success: false, message: 'Validation failed', details });
      assert.equal(Object.prototype.hasOwnProperty.call(res.body, 'stack'), false);
      assert.equal(cap.calls.warn.length, 1);
    } finally {
      cap.restore();
      restore();
    }
  });

  await t.test('production 401/403 ApiError responses never expose stack traces and preserve safe messages/status codes', () => {
    const { mod, restore } = loadErrorHandler('production');
    const cap = captureConsole();
    try {
      const { ApiError, errorHandler } = mod;

      const req401 = { method: 'POST', originalUrl: '/api/triggers/webhook/wf-1' };
      const res401 = mockRes();
      errorHandler(new ApiError(401, 'Invalid webhook secret'), req401, res401, () => {});
      assert.equal(res401.statusCode, 401);
      assert.deepEqual(res401.body, { success: false, message: 'Invalid webhook secret' });
      assert.equal(Object.prototype.hasOwnProperty.call(res401.body, 'stack'), false);

      const req403 = { method: 'POST', originalUrl: '/api/triggers/webhook/wf-1' };
      const res403 = mockRes();
      errorHandler(new ApiError(403, 'Workflow is not active'), req403, res403, () => {});
      assert.equal(res403.statusCode, 403);
      assert.deepEqual(res403.body, { success: false, message: 'Workflow is not active' });
      assert.equal(Object.prototype.hasOwnProperty.call(res403.body, 'stack'), false);

      assert.equal(cap.calls.error.length, 0);
      assert.equal(cap.calls.warn.length, 2);
      const joinedWarns = cap.calls.warn.map(args => args.map(String).join(' ')).join('\n');
      assert.doesNotMatch(joinedWarns, /\n\s+at /);
    } finally {
      cap.restore();
      restore();
    }
  });

  await t.test('production unexpected 5xx response hides internal/db details and stack; logs concise error without stack', () => {
    const { mod, restore } = loadErrorHandler('production');
    const cap = captureConsole();
    try {
      const { errorHandler } = mod;
      const req = { method: 'GET', originalUrl: '/api/internal' };
      const res = mockRes();
      const internalMessage = 'connect ECONNREFUSED 10.0.0.1:5432 db=neondb password=supersecret /srv/app/server.js';
      const err = new Error(internalMessage);

      errorHandler(err, req, res, () => {});

      assert.equal(res.statusCode, 500);
      assert.deepEqual(res.body, { success: false, message: 'Internal Server Error' });
      assert.equal(Object.prototype.hasOwnProperty.call(res.body, 'stack'), false);
      assert.equal(JSON.stringify(res.body).includes('supersecret'), false);
      assert.equal(JSON.stringify(res.body).includes('/srv/app'), false);
      assert.equal(JSON.stringify(res.body).includes('ECONNREFUSED'), false);

      assert.equal(cap.calls.warn.length, 0);
      assert.equal(cap.calls.error.length, 1);
      const errText = cap.calls.error[0].map(String).join(' ');
      assert.match(errText, /\[http\] 500 GET \/api\/internal - /);
      assert.equal(cap.calls.error[0].some(arg => arg && typeof arg === 'object' && arg.stack), false);
      assert.doesNotMatch(errText, /\n\s+at /);
    } finally {
      cap.restore();
      restore();
    }
  });

  await t.test('development unexpected 5xx preserves diagnostics in logs (with stack) but response omits stack', () => {
    const { mod, restore } = loadErrorHandler('development');
    const cap = captureConsole();
    try {
      const { errorHandler } = mod;
      const req = { method: 'GET', originalUrl: '/api/internal' };
      const res = mockRes();
      const err = new Error('Unexpected failure for diagnostics');

      errorHandler(err, req, res, () => {});

      assert.equal(res.statusCode, 500);
      assert.equal(res.body.success, false);
      assert.equal(res.body.message, 'Unexpected failure for diagnostics');
      assert.equal(Object.prototype.hasOwnProperty.call(res.body, 'stack'), false);

      assert.equal(cap.calls.warn.length, 0);
      assert.equal(cap.calls.error.length, 1);
      const hasErrorObject = cap.calls.error[0].some(arg => arg === err || (arg && arg.stack));
      assert.equal(hasErrorObject, true);
    } finally {
      cap.restore();
      restore();
    }
  });
});
