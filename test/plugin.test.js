/**
 * Regression tests for the Host half's model-facing contract.
 *
 * The tool registry validates every `execute()` result against the definition's
 * `output.schema` (`additionalProperties: false` included), so a returned field
 * missing from that schema fails the whole call. These tests execute both tools
 * against a mocked upstream and assert the returned shape stays declarable, and
 * cover the settings route's CSRF guard without touching the network.
 *
 * Run with `node --test` (Node's built-in test runner; no dependencies).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { apply, countRecords, dimensionState, parseRegValueLine, renderDimension, renderSearch } from '../index.js';

const ROUTE = '/plugins/fengniao-company-search';

/** Capture the tools and routes a plugin activation registers. */
function activate(rawConfig, options = {}) {
  const tools = [];
  const routes = [];
  const webServer = {
    register(route) {
      routes.push(route);
      return () => {};
    },
  };
  const ctx = {
    tools: {
      register(definition) {
        tools.push(definition);
        return () => {};
      },
    },
    get(name) {
      if (name === 'webServer') return webServer;
      if (name === 'credentials') return options.credentials;
      return undefined;
    },
    effect(callback) {
      const dispose = callback();
      return typeof dispose === 'function' ? dispose : () => {};
    },
    inject() {
      return () => {};
    },
  };
  apply(ctx, rawConfig);
  return { tools: new Map(tools.map((tool) => [tool.name, tool])), routes };
}

/** Minimal `ToolRunContext` for a direct `execute()` call. */
const exec = { signal: new AbortController().signal };

/** Run one tool body with `fetch` mocked to answer the given JSON envelope. */
async function runWithPayload(tool, args, payload) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } });
  try {
    return await tool.execute(args, exec);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

/** Assert one value matches the declared DSH output-schema subset, recursively. */
function assertSchemaValue(tool, value, schema, path) {
  if (schema === null || typeof schema !== 'object') return;
  const fail = (detail) => assert.fail(`${tool.name} ${path}: ${detail}`);
  if (schema.type === 'object' || schema.properties !== undefined) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) fail('must be an object');
    const declared = schema.properties ?? {};
    const allowExtra = schema.additionalProperties === true;
    for (const key of Object.keys(value)) {
      if (!Object.hasOwn(declared, key) && !allowExtra) fail(`undeclared property "${key}"`);
      if (Object.hasOwn(declared, key)) assertSchemaValue(tool, value[key], declared[key], `${path}.${key}`);
    }
    for (const key of schema.required ?? []) {
      if (!Object.hasOwn(value, key)) fail(`required property "${key}" is missing`);
    }
    return;
  }
  if (schema.type === 'array') {
    if (!Array.isArray(value)) fail('must be an array');
    if (schema.items !== undefined) {
      value.forEach((item, index) => assertSchemaValue(tool, item, schema.items, `${path}[${index}]`));
    }
    return;
  }
  if (schema.type === 'string') {
    if (typeof value !== 'string') fail('must be a string');
    if (Array.isArray(schema.enum) && !schema.enum.includes(value)) fail(`must be one of ${schema.enum.join('/')}`);
    return;
  }
  if (schema.type === 'integer') {
    if (!Number.isInteger(value)) fail('must be an integer');
    return;
  }
  if (schema.type === 'boolean') {
    if (typeof value !== 'boolean') fail('must be a boolean');
    return;
  }
  // No `type` (e.g. `data: {}`): any JSON value is accepted by the validator.
}

/** Assert every returned key is declared, every required key present, recursively. */
function assertDeclared(tool, value) {
  assertSchemaValue(tool, value, tool.output.schema, '$');
}

/** Fake Node response recording the status, headers, and body it was given. */
function makeResponse() {
  const record = { status: 0, headers: {}, body: '' };
  return {
    record,
    writeHead(status, headers) {
      record.status = status;
      Object.assign(record.headers, headers ?? {});
    },
    end(chunk) {
      record.body = chunk === undefined ? '' : String(chunk);
    },
  };
}

/** Fake `IncomingMessage` for one settings request. */
function makeRequest({ method = 'GET', url, headers = {}, body }) {
  const listeners = new Map();
  const req = {
    method,
    url,
    headers,
    on(event, callback) {
      const list = listeners.get(event) ?? [];
      list.push(callback);
      listeners.set(event, list);
      return req;
    },
    destroy() {},
  };
  if (body !== undefined) {
    setImmediate(() => {
      for (const callback of listeners.get('data') ?? []) callback(Buffer.from(body));
      for (const callback of listeners.get('end') ?? []) callback();
    });
  }
  return req;
}

const SEARCH_ENVELOPE = {
  code: 20000,
  success: true,
  msg: '成功',
  data: { list: [{ entname: '腾讯科技（深圳）有限公司', entid: 'entid-1', status: '在营' }] },
};

const DIMENSION_ENVELOPE = {
  code: 20000,
  success: true,
  msg: '成功',
  data: { apiData: { name: '腾讯科技（深圳）有限公司', regCapital: '1000万元' } },
};

test('search output stays inside its declared schema', async () => {
  const { tools } = activate({ apiKey: 'test-key' });
  const tool = tools.get('fengniao_search_company');
  const value = await runWithPayload(tool, { keyword: '腾讯' }, SEARCH_ENVELOPE);
  assert.equal(value.count, 1);
  assert.equal(value.candidates[0].entid, 'entid-1');
  assertDeclared(tool, value);
});

test('dimension output stays inside its declared schema', async () => {
  const { tools } = activate({ apiKey: 'test-key' });
  const tool = tools.get('fengniao_company_dimension');
  const value = await runWithPayload(tool, { entid: 'entid-1', dimension: 'basic_info' }, DIMENSION_ENVELOPE);
  assert.equal(value.state, 'records');
  assertDeclared(tool, value);
  assert.match(renderDimension(value), /风鸟 · 企业基本信息/u);
});

test('the durable card facts bound every replayed string', async () => {
  const { tools } = activate({ apiKey: 'test-key' });
  const search = tools.get('fengniao_search_company');
  const dimension = tools.get('fengniao_company_dimension');
  const long = 'x'.repeat(500);
  const searchMeta = search.output.presentationMeta(
    { keyword: long },
    { query: long, count: 1, candidates: [{ name: long, entid: long, status: long }] },
  );
  assert.equal(searchMeta.query.length, 200);
  assert.equal(searchMeta.candidates[0].name.length, 200);
  assert.equal(searchMeta.candidates[0].entid.length, 200);
  assert.equal(searchMeta.candidates[0].status.length, 200);

  const dimensionMeta = dimension.output.presentationMeta(
    { entid: 'entid-1', dimension: 'basic_info' },
    {
      dimension: 'basic_info',
      label: '企业基本信息',
      apiCode: 0,
      success: true,
      state: 'records',
      truncated: true,
      data: null,
    },
  );
  assert.equal(dimensionMeta.truncated, true);
});

test('dimension errors surface the key/quota guidance', async () => {
  const { tools } = activate({ apiKey: 'test-key' });
  const tool = tools.get('fengniao_company_dimension');
  await assert.rejects(
    runWithPayload(tool, { entid: 'entid-1', dimension: 'basic_info' }, { code: 9999, success: false, msg: 'apikey 不合法' }),
    /API Key/u,
  );
});

test('isApiFailure also treats bare 8888/9999 envelopes as failures', async () => {
  const { tools } = activate({ apiKey: 'test-key' });
  const tool = tools.get('fengniao_search_company');
  await assert.rejects(
    runWithPayload(tool, { keyword: '腾讯' }, { code: 8888, msg: '参数错误' }),
    /entid 或参数错误/u,
  );
});

test('parseRegValueLine keeps empty values empty and spaced values whole', () => {
  assert.equal(parseRegValueLine('FN_API_KEY    REG_SZ    fn_sk_abc', 'FN_API_KEY'), 'fn_sk_abc');
  assert.equal(parseRegValueLine('FN_API_KEY    REG_SZ', 'FN_API_KEY'), '');
  assert.equal(parseRegValueLine('FN_API_KEY    REG_SZ    fn sk  abc', 'FN_API_KEY'), 'fn sk  abc');
});

test('dimensionState classifies record, empty, and unknown payloads', () => {
  assert.equal(dimensionState(null), 'empty');
  assert.equal(dimensionState([]), 'empty');
  assert.equal(dimensionState({ apiData: [] }), 'empty');
  assert.equal(dimensionState({ apiData: {} }), 'empty');
  assert.equal(dimensionState({ apiData: { name: 'x' } }), 'records');
  assert.equal(dimensionState('scalar'), 'unknown');
});

test('renderSearch points at how to retry an empty result', () => {
  assert.match(renderSearch({ query: '不存在', count: 0, candidates: [] }), /未找到/u);
});

test('settings route rejects requests without the plugin header', async () => {
  const { routes } = activate({ apiKey: 'test-key' });
  const route = routes.find((entry) => entry.path === ROUTE && entry.kind === 'prefix');
  assert.ok(route !== undefined);
  const response = makeResponse();
  await route.handler({ method: 'GET', url: `${ROUTE}/settings`, headers: {} }, response);
  assert.equal(response.record.status, 403);
});

test('settings route reports status without echoing the key', async () => {
  const { routes } = activate({ apiKey: 'test-key' });
  const route = routes.find((entry) => entry.path === ROUTE && entry.kind === 'prefix');
  const response = makeResponse();
  await route.handler(
    { method: 'GET', url: `${ROUTE}/settings`, headers: { 'x-fengniao-plugin': '1' } },
    response,
  );
  assert.equal(response.record.status, 200);
  const payload = JSON.parse(response.record.body);
  assert.equal(payload.ok, true);
  assert.equal(payload.configured, true);
  assert.equal(payload.source, 'config');
  assert.equal(payload.hint, '••••-key');
  assert.doesNotMatch(response.record.body, /test-key/u);
});

test('settings route fails loudly when the credential store cannot clear', async () => {
  const { routes } = activate({ apiKey: 'test-key' });
  const route = routes.find((entry) => entry.path === ROUTE && entry.kind === 'prefix');
  const response = makeResponse();
  await route.handler(
    makeRequest({
      method: 'POST',
      url: `${ROUTE}/settings`,
      headers: { 'x-fengniao-plugin': '1' },
      body: JSON.stringify({ clear: true }),
    }),
    response,
  );
  assert.equal(response.record.status, 500);
  assert.equal(JSON.parse(response.record.body).ok, false);
});

/* ---------------------------------------------------------------- */
/* Credential store migration                                        */
/* ---------------------------------------------------------------- */

/** In-memory stand-in for the Harness credential service. */
function makeCredentialStore(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    async resolve(ref) {
      return values.get(ref) ?? null;
    },
    async set(ref, value) {
      values.set(ref, value);
    },
    async unset(ref) {
      values.delete(ref);
    },
  };
}

/** Call the settings route with the CSRF guard header and parse its JSON. */
async function callSettings(routes, { method = 'GET', body } = {}) {
  const route = routes.find((entry) => entry.path === ROUTE && entry.kind === 'prefix');
  const response = makeResponse();
  await route.handler(
    makeRequest({
      method,
      url: `${ROUTE}/settings`,
      headers: { 'x-fengniao-plugin': '1' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    response,
  );
  return { status: response.record.status, payload: JSON.parse(response.record.body) };
}

test('settings route imports the legacy environment key into the credential store', async () => {
  const previous = process.env.FN_API_KEY;
  process.env.FN_API_KEY = 'env-imported-key-123456';
  try {
    const credentials = makeCredentialStore();
    const { routes } = activate({}, { credentials });
    const { status, payload } = await callSettings(routes, { method: 'POST', body: { importFromEnv: true } });

    assert.equal(status, 200);
    assert.equal(payload.imported, true);
    assert.equal(payload.source, 'credential');
    assert.equal(credentials.values.get('FENGNIAO_API_KEY'), 'env-imported-key-123456');
    // The secret never travels back to the page.
    assert.equal(payload.hint, '••••3456');
  } finally {
    if (previous === undefined) delete process.env.FN_API_KEY;
    else process.env.FN_API_KEY = previous;
  }
});

test('allowEnvFallback: false ignores the environment key', async () => {
  const previous = process.env.FN_API_KEY;
  process.env.FN_API_KEY = 'env-only-key-123456';
  try {
    const { routes } = activate({ allowEnvFallback: false });
    const { payload } = await callSettings(routes);
    assert.equal(payload.configured, false);
    assert.equal(payload.source, 'none');
    assert.equal(payload.envAvailable, true);
  } finally {
    if (previous === undefined) delete process.env.FN_API_KEY;
    else process.env.FN_API_KEY = previous;
  }
});

test('POST /settings saves a pasted key and an empty one is rejected', async () => {
  const credentials = makeCredentialStore();
  const { routes } = activate({}, { credentials });

  const empty = await callSettings(routes, { method: 'POST', body: { apiKey: '   ' } });
  assert.equal(empty.payload.ok, false);
  assert.equal(credentials.values.size, 0, 'an empty key must not clear the store');

  const saved = await callSettings(routes, { method: 'POST', body: { apiKey: '  pinned-key-123456  ' } });
  assert.equal(saved.status, 200);
  assert.equal(saved.payload.configured, true);
  assert.equal(saved.payload.source, 'credential');
  assert.equal(credentials.values.get('FENGNIAO_API_KEY'), 'pinned-key-123456');
  assert.doesNotMatch(JSON.stringify(saved.payload), /pinned-key-123456/u);
});

test('POST /settings clear removes the stored key', async () => {
  const credentials = makeCredentialStore({ FENGNIAO_API_KEY: 'stored-key-123456' });
  // This machine persists FN_API_KEY, so pin the environment fallback off to make
  // the "nothing configured" outcome deterministic.
  const { routes } = activate({ allowEnvFallback: false }, { credentials });
  const { payload } = await callSettings(routes, { method: 'POST', body: { clear: true } });
  assert.equal(payload.configured, false);
  assert.equal(payload.source, 'none');
  assert.equal(credentials.values.size, 0);
});

test('import from an absent environment variable reports guidance instead of failing', async () => {
  const { routes } = activate({ apiKeyEnv: 'FENGNIAO_TEST_MISSING_ENV_VAR' });
  const { payload } = await callSettings(routes, { method: 'POST', body: { importFromEnv: true } });
  assert.equal(payload.ok, false);
  assert.match(payload.error, /环境变量/u);
});

test('POST /test probes the upstream API and classifies failures', async () => {
  const { routes } = activate({ apiKey: 'test-key' });
  const route = routes.find((entry) => entry.path === ROUTE && entry.kind === 'prefix');
  const call = async () => {
    const response = makeResponse();
    await route.handler(
      makeRequest({
        method: 'POST',
        url: `${ROUTE}/test`,
        headers: { 'x-fengniao-plugin': '1' },
        body: JSON.stringify({}),
      }),
      response,
    );
    return JSON.parse(response.record.body);
  };
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ code: 20000, success: true, msg: '成功' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    const healthy = await call();
    assert.equal(healthy.ok, true);
    assert.equal(healthy.httpStatus, 200);
    assert.equal(healthy.apiCode, 20000);

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ code: 9999, success: false, msg: 'apikey 不合法' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    const rejected = await call();
    assert.equal(rejected.ok, false);
    assert.equal(rejected.apiCode, 9999);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

/* ---------------------------------------------------------------- */
/* Output annotation: bounded card facts                             */
/* ---------------------------------------------------------------- */

test('presentationMeta keeps bounded, spill-safe card facts', async () => {
  const { tools } = activate({ apiKey: 'test-key' });

  const search = tools.get('fengniao_search_company');
  const searchValue = {
    query: '腾讯',
    count: 2,
    candidates: [
      { name: '腾讯科技（深圳）有限公司', entid: 'entid-1', status: '在营', raw: { banner: 'x'.repeat(500) } },
      { name: '腾讯音乐娱乐（深圳）有限公司', entid: 'entid-2' },
    ],
  };
  const searchMeta = search.output.presentationMeta({}, searchValue);
  assert.equal(searchMeta.kind, 'search');
  assert.equal(searchMeta.count, 2);
  assert.equal(searchMeta.query, '腾讯');
  assert.deepEqual(Object.keys(searchMeta.candidates[0]).sort(), ['entid', 'name', 'status']);
  assert.ok(JSON.stringify(searchMeta).length < 2048, 'search card facts must stay bounded');

  const dimension = tools.get('fengniao_company_dimension');
  const dimensionValue = {
    dimension: 'shareholders',
    label: '企业股东信息',
    apiCode: 0,
    success: true,
    state: 'records',
    data: { apiData: [{ name: '甲' }, { name: '乙' }, { name: '丙' }] },
    truncated: false,
  };
  const dimensionMeta = dimension.output.presentationMeta({}, dimensionValue);
  assert.equal(dimensionMeta.kind, 'dimension');
  assert.equal(dimensionMeta.recordCount, 3);
  assert.equal(dimensionMeta.label, '企业股东信息');
});

test('the card facts carry the company name only when the payload names it', () => {
  const { tools } = activate({ apiKey: 'test-key' });
  const dimension = tools.get('fengniao_company_dimension');
  const base = { apiCode: 0, success: true, state: 'records', truncated: false };

  const profile = dimension.output.presentationMeta(
    { entid: 'entid-1', dimension: 'basic_info' },
    { ...base, dimension: 'basic_info', label: '企业基本信息', data: { apiData: { entName: ' 腾讯科技（深圳）有限公司 ' } } },
  );
  assert.equal(profile.companyName, '腾讯科技（深圳）有限公司');

  // A list payload names its rows, never the queried company: no companyName.
  const list = dimension.output.presentationMeta(
    { entid: 'entid-1', dimension: 'shareholders' },
    { ...base, dimension: 'shareholders', label: '企业股东信息', data: { apiData: [{ entName: '某股东有限公司' }] } },
  );
  assert.equal(Object.hasOwn(list, 'companyName'), false);

  const long = dimension.output.presentationMeta(
    { entid: 'entid-1', dimension: 'basic_info' },
    { ...base, dimension: 'basic_info', label: '企业基本信息', data: { apiData: { entName: 'x'.repeat(500) } } },
  );
  assert.equal(long.companyName.length, 200);
});

test('countRecords understands the upstream dimension shapes', () => {
  assert.equal(countRecords(null), 0);
  assert.equal(countRecords([]), 0);
  assert.equal(countRecords([1, 2]), 2);
  assert.equal(countRecords({ apiData: [1, 2, 3] }), 3);
  assert.equal(countRecords({ data: { list: [1] } }), 1);
  assert.equal(countRecords({ totalCount: 42 }), 42);
  assert.equal(countRecords({ someObject: { nested: true } }), null);
});
