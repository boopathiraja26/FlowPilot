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

function withEnv(overrides, fn) {
  const prev = {};
  for (const [k, v] of Object.entries(overrides)) {
    prev[k] = process.env[k];
    if (v === undefined || v === null) delete process.env[k];
    else process.env[k] = String(v);
  }
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const [k, v] of Object.entries(prev)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    });
}

function mockAxios(impl) {
  const axiosPath = require.resolve('axios', { paths: [path.join(process.cwd(), 'node_modules')] });
  const original = require.cache[axiosPath];
  const fn = (...args) => impl(...args);
  fn.isAxiosError = (err) => Boolean(err && err.isAxiosError);
  require.cache[axiosPath] = {
    id: axiosPath,
    filename: axiosPath,
    loaded: true,
    exports: fn,
  };
  return () => {
    if (original) require.cache[axiosPath] = original;
    else delete require.cache[axiosPath];
  };
}

function loadWebhookService() {
  resetDistModules();
  return require(dist('services', 'webhook.service.js'));
}

test('Phase 7 outgoing webhook SSRF protection: blocks private and metadata targets', async () => {
  await withEnv({ NODE_ENV: 'production' }, async () => {
    const { executeWebhook } = loadWebhookService();
    await assert.rejects(
      () => executeWebhook({ url: 'http://169.254.169.254/latest/meta-data', method: 'GET' }),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /unsafe|private|blocked/i);
        return true;
      }
    );
    await assert.rejects(
      () => executeWebhook({ url: 'http://10.0.0.12/internal', method: 'POST' }),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /unsafe|private/i);
        return true;
      }
    );
  });
});

test('Phase 7 outgoing webhook SSRF protection: allows localhost in non-production for safe local testing', async () => {
  await withEnv({ NODE_ENV: 'development' }, async () => {
    let called = 0;
    const restoreAxios = mockAxios(async (config) => {
      called += 1;
      assert.match(String(config.url), /^http:\/\/localhost:8787\/hook$/);
      assert.equal(config.method, 'POST');
      assert.equal(config.maxRedirects, 0);
      return { status: 200, data: { ok: true } };
    });
    try {
      const { executeWebhook } = loadWebhookService();
      const result = await executeWebhook({ url: 'http://localhost:8787/hook', method: 'POST', body: { hello: 'world' } });
      assert.deepEqual(result, { ok: true });
      assert.equal(called, 1);
    } finally {
      restoreAxios();
    }
  });
});

test('Phase 7 outgoing webhook reliability: rejects redirects and reports HTTP failures clearly', async () => {
  await withEnv({ NODE_ENV: 'development' }, async () => {
    const restoreAxios = mockAxios(async () => ({ status: 302, headers: { location: 'http://127.0.0.1/admin' }, data: '' }));
    try {
      const { executeWebhook } = loadWebhookService();
      await assert.rejects(
        () => executeWebhook({ url: 'http://localhost:8787/redirect', method: 'GET' }),
        (err) => {
          assert.equal(err.statusCode, 400);
          assert.match(err.message, /redirect/i);
          return true;
        }
      );
    } finally {
      restoreAxios();
    }
  });
});

test('Phase 7 outgoing webhook reliability: maps upstream HTTP errors to actionable ApiError', async () => {
  await withEnv({ NODE_ENV: 'development' }, async () => {
    const restoreAxios = mockAxios(async () => {
      const err = new Error('Request failed with status code 500');
      err.isAxiosError = true;
      err.response = { status: 500, data: { error: 'boom' } };
      throw err;
    });
    try {
      const { executeWebhook } = loadWebhookService();
      await assert.rejects(
        () => executeWebhook({ url: 'http://localhost:8787/fail', method: 'POST' }),
        (err) => {
          assert.equal(err.statusCode, 502);
          assert.match(err.message, /HTTP 500/);
          return true;
        }
      );
    } finally {
      restoreAxios();
    }
  });
});
