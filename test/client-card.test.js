/**
 * Client-half tests for the conversation cards.
 *
 * The bundle is a browser module (`window.__ModuleLoader__.load` + `require('react')`),
 * so this test fakes the loader and a stateful mini React just far enough to run
 * `apply()` and render each card variant. It never asserts pixels: it proves the
 * cards run, register in the right keyed slots, expose the shipped tool row
 * contract (disclosure row, head title/summary/stat suffix, details card,
 * running shimmer), and show localized copy from `result.meta` or the legacy text.
 */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

/**
 * Minimal stateful React shim: elements are plain objects, hooks keep state
 * across re-renders, and `begin()` resets the hook cursor before one render.
 */
function makeReact() {
  let cells = [];
  let cursor = 0;
  const createElement = (type, props, ...children) => ({
    type,
    props: {
      ...(props ?? {}),
      children: children.length === 0 ? undefined : children.length === 1 ? children[0] : children,
    },
  });
  return {
    begin() {
      cursor = 0;
    },
    reset() {
      cells = [];
      cursor = 0;
    },
    createElement,
    useState(initial) {
      const index = cursor;
      cursor += 1;
      if (cells[index] === undefined) cells[index] = initial;
      return [
        cells[index],
        (next) => {
          cells[index] = typeof next === 'function' ? next(cells[index]) : next;
        },
      ];
    },
    useMemo: (factory) => factory(),
    useCallback: (callback) => callback,
    // Persistent cell: the card freezes its disclosure Hook in a ref on the
    // first render, and that must survive re-renders like the real useRef.
    useRef: (value) => {
      const index = cursor;
      cursor += 1;
      if (cells[index] === undefined) cells[index] = { current: value };
      return cells[index];
    },
    useEffect: (callback) => {
      callback();
    },
  };
}

/** Visit every element of one rendered tree. */
function walk(node, visit) {
  if (node === null || node === undefined || typeof node === 'boolean') return;
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit);
    return;
  }
  if (typeof node !== 'object') return;
  visit(node);
  walk(node.props?.children, visit);
}

/** First element matching `predicate`. */
function find(tree, predicate) {
  let hit = null;
  walk(tree, (node) => {
    if (hit === null && predicate(node)) hit = node;
  });
  return hit;
}

/** Every element whose `className` contains `name`. */
function byClass(tree, name) {
  const hits = [];
  walk(tree, (node) => {
    const className = node.props?.className;
    if (typeof className === 'string' && className.split(' ').includes(name)) hits.push(node);
  });
  return hits;
}

/** Every string inside one rendered element tree. */
function textsOf(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return [];
  if (typeof node === 'string' || typeof node === 'number') return [String(node)];
  if (Array.isArray(node)) return node.flatMap(textsOf);
  if (typeof node === 'object') return textsOf(node.props?.children);
  return [];
}

/** The clickable disclosure head of one card. */
function rowNode(tree) {
  return find(tree, (node) => node.props !== undefined && node.props['data-disclosure-row'] !== undefined);
}

/** Owner-supplied disclosure Hook: one stable state cell per mounted card. */
function makeDisclosure() {
  let expanded = false;
  return () => ({ expanded, toggle: () => { expanded = !expanded; } });
}

/** Render one card collapsed; `expanded()` activates the head and re-renders. */
function mount(react, card, props, withOwner = true) {
  const useDisclosure = makeDisclosure();
  const view = withOwner ? { ...props, useDisclosure } : { ...props };
  react.reset();
  react.begin();
  const collapsed = card(view);
  return {
    collapsed,
    expanded() {
      const head = rowNode(collapsed);
      assert.ok(head, 'the card renders a disclosure row');
      assert.equal(typeof head.props.onClick, 'function', 'the row is expandable');
      head.props.onClick();
      react.begin();
      return card(view);
    },
  };
}

/** Load the browser bundle under a faked loader and run its `apply()`. */
async function loadClient() {
  const react = makeReact();
  const registrations = [];
  let definition;

  globalThis.window = { __ModuleLoader__: { load: (loaded) => { definition = loaded; } } };
  globalThis.document = {
    documentElement: { lang: 'zh' },
    head: { appendChild: () => {} },
    createElement: () => ({ dataset: {}, remove: () => {} }),
    querySelector: () => null,
  };

  await import(`../client.js?t=${Date.now()}`);
  assert.ok(definition, 'client.js must call window.__ModuleLoader__.load');
  assert.equal(definition.id, '@local/fengniao-company-search');

  const app = definition.factory((name) => {
    if (name === 'react') return react;
    throw new Error(`unexpected require: ${name}`);
  });
  assert.deepEqual(app.inject, ['slots', 'locale']);

  const dictionaries = [];
  const ctx = {
    effect: (body) => {
      body();
      return () => {};
    },
    locale: {
      bind: () => (key) => key,
      register: (namespace, dict) => {
        dictionaries.push({ namespace, dict });
        return () => {};
      },
    },
    slots: {
      inject: (_name, callback) => callback(),
      register: (options, component) => {
        registrations.push({ options, component });
        return () => {};
      },
    },
  };
  app.apply(ctx);
  return { registrations, dictionaries, react };
}

const SEARCH_BLOCK = {
  kind: 'result',
  isError: false,
  call: { name: 'fengniao_search_company', argsRaw: '{"keyword":"腾讯"}' },
  meta: {
    kind: 'search',
    query: '腾讯',
    count: 2,
    candidates: [
      { name: '腾讯科技（深圳）有限公司', entid: 'entid-1', status: '在营' },
      { name: '腾讯音乐娱乐（深圳）有限公司', entid: 'entid-2', status: '在营' },
    ],
  },
  content: [
    {
      type: 'text',
      text: '“腾讯”匹配到 2 家企业：\n1. 腾讯科技（深圳）有限公司 · 在营 · entid: entid-1\n2. 腾讯音乐娱乐（深圳）有限公司 · 在营 · entid: entid-2',
    },
  ],
};

const DIMENSION_BLOCK = {
  kind: 'result',
  isError: false,
  call: { name: 'fengniao_company_dimension', argsRaw: '{"entid":"entid-1","dimension":"shareholders"}' },
  meta: {
    kind: 'dimension',
    dimension: 'shareholders',
    label: '企业股东信息',
    apiCode: 0,
    success: true,
    state: 'records',
    recordCount: 2,
  },
  content: [
    {
      type: 'text',
      text: '风鸟 · 企业股东信息（shareholders）\n以下为上游返回的原始数据：\n```json\n{"apiData":[{"name":"甲"},{"name":"乙"}]}\n```',
    },
  ],
};

test('client half registers the credential card and both tool cards', async () => {
  const { registrations, dictionaries } = await loadClient();
  const bySlot = (name) => registrations.filter((entry) => entry.options.name === name);
  assert.equal(bySlot('plugins.bundle.config').length, 1);
  assert.equal(bySlot('plugins.bundle.config')[0].options.key, '@local/fengniao-company-search');

  const toolviews = bySlot('tool.call.toolview');
  assert.deepEqual(
    toolviews.map((entry) => entry.options.key),
    ['fengniao_search_company', 'fengniao_company_dimension'],
  );
  for (const entry of toolviews) {
    assert.equal(typeof entry.component, 'function');
    assert.equal(entry.options.locale, 'fengniao-company-search');
  }
  assert.equal(dictionaries[0].namespace, 'fengniao-company-search');
  assert.equal(dictionaries[0].dict.zh['env.import'], '从环境变量导入到凭据库');
  for (const key of ['tool.output', 'tool.errorOutput']) {
    assert.equal(typeof dictionaries[0].dict.zh[key], 'string', `zh dictionary carries ${key}`);
    assert.equal(typeof dictionaries[0].dict.en[key], 'string', `en dictionary carries ${key}`);
  }
});

test('tool cards use the shipped row contract: root state, glyph, disclosure row', async () => {
  const { registrations, react } = await loadClient();
  const card = registrations.find((entry) => entry.options.name === 'tool.call.toolview').component;
  const t = (key) => key;

  const view = mount(react, card, { toolName: 'fengniao_search_company', phase: 'result', t, block: SEARCH_BLOCK });
  const root = view.collapsed;
  assert.equal(root.props.className, 'fct_root');
  assert.equal(root.props['data-tool'], 'fengniao_search_company');
  assert.equal(root.props['data-state'], 'ok');

  const head = rowNode(view.collapsed);
  assert.notEqual(head.props['data-expandable'], undefined, 'the row is marked expandable');
  assert.equal(head.props.role, 'button');
  assert.equal(head.props.tabIndex, 0);
  assert.equal(head.props['aria-expanded'], false);

  const leading = byClass(view.collapsed, 'fct_leading')[0];
  assert.ok(leading, 'leading cell exists');
  assert.equal(byClass(leading, 'fct_iconIdle').length, 1, 'tool glyph is shown while closed');
  assert.equal(byClass(leading, 'fct_chevronHover').length, 1, 'chevron waits for hover');
  const glyph = find(leading, (node) => node.type === 'svg' && node.props.viewBox === '0 0 16 16');
  assert.ok(glyph, 'glyph is the shipped 16x16 outline icon');
  assert.equal(glyph.props.strokeWidth, 1);

  // Collapsed head = title, separator, summary (the keyword), and the stat suffix.
  assert.equal(byClass(view.collapsed, 'fct_sep').length, 1);
  const headSummary = byClass(view.collapsed, 'fct_headSummary')[0];
  assert.ok(headSummary, 'the keyword rides in the flexible summary slot');
  assert.match(textsOf(headSummary).join('|'), /腾讯/u);
  const headSuffix = byClass(view.collapsed, 'fct_headSuffix')[0];
  assert.ok(headSuffix, 'the hit count rides in the fixed suffix slot');
  assert.match(textsOf(headSuffix).join('|'), /匹配 2 家/u);
  const headTexts = textsOf(view.collapsed).join('|');
  assert.match(headTexts, /风鸟检索/u);
  assert.equal(find(view.collapsed, (node) => node.props?.className === 'fct_bodyWrap'), null, 'collapsed by default');

  const expanded = view.expanded();
  assert.equal(rowNode(expanded).props['aria-expanded'], true);
  assert.equal(byClass(expanded, 'fct_iconIdle').length, 0, 'the open row shows only the chevron');
  assert.equal(byClass(expanded, 'fct_chevronHover').length, 0);
  assert.ok(find(expanded, (node) => node.props?.className === 'fct_bodyWrap'));
});

test('search card expands into a details card with the keyword and candidates', async () => {
  const { registrations, react } = await loadClient();
  const card = registrations.find((entry) => entry.options.name === 'tool.call.toolview').component;
  const t = (key) => key;
  const view = mount(react, card, { toolName: 'fengniao_search_company', phase: 'result', t, block: SEARCH_BLOCK });

  const expanded = view.expanded();
  assert.equal(byClass(expanded, 'fct_detailsCard').length, 1, 'body is one details card');
  assert.equal(byClass(expanded, 'fct_detailsItem').length, 3, 'keyword item plus two candidates');
  const text = textsOf(expanded).join('|');
  assert.match(text, /关键词/u);
  assert.match(text, /腾讯科技（深圳）有限公司/u);
  assert.match(text, /腾讯音乐娱乐（深圳）有限公司/u);
  assert.match(text, /entid-1/u);
  assert.match(text, /在营/u);
  assert.ok(byClass(expanded, 'fct_detailsField').length >= 1);
  assert.equal(find(expanded, (node) => node.type === 'dt') !== null, true);
});

test('dimension card expands into request facts and the payload preview', async () => {
  const { registrations, react } = await loadClient();
  const card = registrations.find((entry) => entry.options.name === 'tool.call.toolview').component;
  const t = (key) => key;
  const view = mount(react, card, { toolName: 'fengniao_company_dimension', phase: 'result', t, block: DIMENSION_BLOCK });

  const headText = textsOf(view.collapsed).join('|');
  assert.match(headText, /风鸟维度/u);
  assert.match(headText, /企业股东信息/u);
  assert.match(headText, /2 条记录/u);

  const expanded = view.expanded();
  const text = textsOf(expanded).join('|');
  assert.match(text, /企业股东信息（shareholders）/u);
  assert.match(text, /entid-1/u);
  assert.match(text, /接口码/u);
  assert.match(text, /records/u);
  // The raw payload is recovered from the legacy fenced body when meta has no data.
  const payload = byClass(expanded, 'fct_pre')[0];
  assert.ok(payload, 'payload preview is present');
  assert.match(textsOf(payload).join(''), /"name": "甲"/u);
});

test('running card shimmers, hides its body while preparing, and expands with the request', async () => {
  const { registrations, react } = await loadClient();
  const card = registrations.find((entry) => entry.options.name === 'tool.call.toolview').component;
  const t = (key) => key;

  const preparing = mount(react, card, {
    toolName: 'fengniao_search_company',
    phase: 'preparing',
    t,
    block: { phase: 'preparing', argsRaw: '{"keyword":"腾讯"}' },
  });
  assert.equal(preparing.collapsed.props['data-state'], 'preparing');
  const preparingHead = rowNode(preparing.collapsed);
  assert.equal(preparingHead.props['data-expandable'], undefined);
  assert.equal(preparingHead.props.onClick, undefined);
  assert.equal(byClass(preparing.collapsed, 'fct_shimmerDecoration').length, 1, 'running rows shimmer');

  const running = mount(react, card, {
    toolName: 'fengniao_company_dimension',
    phase: 'start',
    t,
    block: { phase: 'start', argsRaw: '{"entid":"entid-1","dimension":"shareholders"}' },
  });
  assert.equal(running.collapsed.props['data-state'], 'running');
  assert.match(textsOf(running.collapsed).join('|'), /执行中/u, 'running state is announced');
  const expanded = running.expanded();
  const text = textsOf(expanded).join('|');
  assert.match(text, /维度/u);
  assert.match(text, /企业股东信息/u);
  assert.equal(text.includes('shareholders'), false);
  assert.match(text, /entid-1/u);
});

test('failure, empty and legacy cards keep their state and copy', async () => {
  const { registrations, react } = await loadClient();
  const card = registrations.find((entry) => entry.options.name === 'tool.call.toolview').component;
  const t = (key) => key;

  const failed = mount(react, card, {
    toolName: 'fengniao_company_dimension',
    phase: 'result',
    t,
    block: { kind: 'result', isError: true, content: [{ type: 'text', text: 'Error: 尚未配置风鸟 API Key。' }] },
  });
  assert.equal(failed.collapsed.props['data-state'], 'error');
  assert.match(textsOf(failed.collapsed).join('|'), /尚未配置风鸟 API Key/u);
  assert.match(textsOf(failed.collapsed).join('|'), /失败/u);
  const errorSummary = find(failed.collapsed, (node) => {
    const className = node.props?.className;
    return typeof className === 'string' && className.includes('fct_headSummary') && className.includes('fct_errorSummary');
  });
  assert.ok(errorSummary, 'error summaries keep the error color class');
  const failedExpanded = failed.expanded();
  assert.match(textsOf(failedExpanded).join('|'), /错误/u);
  assert.ok(find(failedExpanded, (node) => node.props !== undefined && node.props['data-error'] !== undefined));

  // Empty search: meta wins over the render text, and the body says so.
  const empty = mount(react, card, {
    toolName: 'fengniao_search_company',
    phase: 'result',
    t,
    block: {
      kind: 'result',
      isError: false,
      call: { name: 'fengniao_search_company', argsRaw: '{"keyword":"不存在的企业"}' },
      meta: { kind: 'search', query: '不存在的企业', count: 0, candidates: [] },
      content: [{ type: 'text', text: '未找到匹配“不存在的企业”的企业。' }],
    },
  });
  assert.match(textsOf(empty.collapsed).join('|'), /匹配 0 家/u);
  assert.match(textsOf(empty.expanded()).join('|'), /未查询到记录/u);

  // Old session log: no meta, only the numbered markdown render.
  const legacy = mount(react, card, {
    toolName: 'fengniao_search_company',
    phase: 'result',
    t,
    block: {
      kind: 'result',
      isError: false,
      call: { name: 'fengniao_search_company', argsRaw: '{"keyword":"腾讯"}' },
      content: [{ type: 'text', text: '“腾讯”匹配到 1 家企业：\n1. 腾讯科技（深圳）有限公司 · 在营 · entid: entid-9' }],
    },
  });
  assert.match(textsOf(legacy.collapsed).join('|'), /匹配 1 家/u);
  assert.match(textsOf(legacy.expanded()).join('|'), /entid-9/u);
});

test('a single-record profile shows no fabricated record count', async () => {
  const { registrations, react } = await loadClient();
  const card = registrations.find((entry) => entry.options.name === 'tool.call.toolview').component;
  const t = (key) => key;
  // basic_info is one company profile: the upstream totalCount is 0 even though
  // the payload carries data, so the head must not print "0 条记录".
  const view = mount(react, card, {
    toolName: 'fengniao_company_dimension',
    phase: 'result',
    t,
    block: {
      kind: 'result',
      isError: false,
      call: { name: 'fengniao_company_dimension', argsRaw: '{"entid":"entid-1","dimension":"basic_info"}' },
      meta: {
        kind: 'dimension',
        dimension: 'basic_info',
        label: '企业基本信息',
        apiCode: 0,
        success: true,
        state: 'records',
        recordCount: 0,
      },
      content: [
        {
          type: 'text',
          text: '风鸟 · 企业基本信息（basic_info）\n```json\n{"apiData":{"entName":"腾讯云计算（北京）有限责任公司"}}\n```',
        },
      ],
    },
  });
  const headText = textsOf(view.collapsed).join('|');
  // The inline payload names the subject, so the card titles itself with it.
  assert.match(headText, /腾讯云计算（北京）有限责任公司/u);
  const headSuffix = textsOf(byClass(view.collapsed, 'fct_headSuffix')).join('|');
  assert.match(headSuffix, /企业基本信息/u);
  // A single-record profile has no row count: no fabricated stat at all.
  assert.equal(headSuffix.includes('0 条记录'), false);
  assert.equal(headSuffix.includes('已返回数据'), false);
  const expanded = textsOf(view.expanded()).join('|');
  assert.match(expanded, /腾讯云计算（北京）有限责任公司/u);
  assert.equal(expanded.includes('0 条记录'), false);
});

test('an interrupted call is a neutral stopped state, not a failure', async () => {
  const { registrations, react } = await loadClient();
  const card = registrations.find((entry) => entry.options.name === 'tool.call.toolview').component;
  const t = (key) => key;
  const view = mount(react, card, {
    toolName: 'fengniao_company_dimension',
    phase: 'result',
    t,
    block: {
      kind: 'result',
      isError: true,
      error: { code: 'interrupted', message: '调用已中断' },
      call: { name: 'fengniao_company_dimension', argsRaw: '{"entid":"entid-1","dimension":"shareholders"}' },
    },
  });
  assert.equal(view.collapsed.props['data-state'], 'stopped');
  const text = textsOf(view.collapsed).join('|');
  assert.match(text, /企业股东信息/u, 'the head keeps the call subject');
  assert.equal(byClass(view.collapsed, 'fct_errorSummary').length, 0, 'stopped is not an error summary');
  assert.equal(byClass(view.collapsed, 'fct_stoppedSummary').length, 1);
  const expanded = textsOf(view.expanded()).join('|');
  assert.match(expanded, /tool\.stoppedNote|没有完整结果/u);
  assert.equal(expanded.includes('tool.errorOutput'), false, 'no error IO panel for a stop');
});

test('the config card renders the key form and reports the real credential source', async () => {
  const { registrations, react } = await loadClient();
  const card = registrations.find((entry) => entry.options.name === 'plugins.bundle.config').component;
  // Wrap keys so the card keeps its translator instead of falling back to the
  // Chinese dictionary (makeTranslator treats identity output as untranslated).
  const t = (key) => `«${key}»`;
  const payload = {
    ok: true,
    configured: true,
    source: 'credentialEnv',
    hint: '••••1234',
    baseUrl: 'https://example.test',
    credentialRef: 'FENGNIAO_API_KEY',
    apiKeyEnv: 'FN_API_KEY',
    allowEnvFallback: true,
    envAvailable: true,
  };
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return { ok: true, status: 200, json: async () => payload };
  };
  try {
    react.reset();
    react.begin();
    const first = card({ t });
    assert.equal(find(first, (node) => node.type === 'input').props.type, 'password');
    await new Promise((resolve) => setImmediate(resolve));
    react.begin();
    const ready = card({ t });
    const input = find(ready, (node) => node.type === 'input');
    assert.equal(input.props.disabled, false, 'the status fetch settles and unlocks the form');
    // StatusChip is a nested component; render it directly to read its copy.
    const chip = find(ready, (node) => typeof node.type === 'function' && node.type.name === 'StatusChip');
    assert.ok(chip, 'the card renders a status chip');
    const chipText = textsOf(chip.type({ t, status: chip.props.status })).join('|');
    assert.match(chipText, /status\.configured/u);
    assert.match(chipText, /source\.credentialEnv/u, 'an env-sourced provider value is labelled as such');
    assert.match(chipText, /••••1234/u, 'only the masked hint is shown');
    assert.equal(textsOf(ready).join('|').includes('env.import'), false, 'no import button for a credential-store value');
    assert.ok(calls.length >= 1);
    assert.equal(calls[0].init.headers['x-fengniao-plugin'], '1');
    assert.equal(String(calls[0].url).endsWith('/settings'), true);

    // M2: the legacy environment source does offer the migration button.
    payload.source = 'env';
    react.begin();
    card({ t });
    await new Promise((resolve) => setImmediate(resolve));
    react.begin();
    const envCard = card({ t });
    const envChip = find(envCard, (node) => typeof node.type === 'function' && node.type.name === 'StatusChip');
    assert.match(textsOf(envChip.type({ t, status: envChip.props.status })).join('|'), /source\.env/u);
    assert.match(textsOf(envCard).join('|'), /env\.import/u);
  } finally {
    delete globalThis.fetch;
  }
});

test('a card mounted without the owner Hook falls back to local disclosure state', async () => {
  const { registrations, react } = await loadClient();
  const card = registrations.find((entry) => entry.options.name === 'tool.call.toolview').component;
  const t = (key) => key;
  const view = mount(
    react,
    card,
    { toolName: 'fengniao_search_company', phase: 'result', t, block: SEARCH_BLOCK },
    false,
  );
  assert.equal(typeof rowNode(view.collapsed).props.onClick, 'function');
  assert.equal(byClass(view.expanded(), 'fct_detailsCard').length, 1);
});

test('the running dimension card uses the dimension label, not the wire key', async () => {
  const { registrations, react } = await loadClient();
  const card = registrations.find((entry) => entry.options.name === 'tool.call.toolview').component;
  const t = (key) => key;
  const view = mount(react, card, {
    toolName: 'fengniao_company_dimension',
    phase: 'start',
    t,
    block: { phase: 'start', argsRaw: '{"entid":"entid-1","dimension":"shareholders"}' },
  });
  const headText = textsOf(byClass(view.collapsed, 'fct_headSummary')[0]).join('|');
  assert.match(headText, /企业股东信息/u);
  assert.equal(headText.includes('shareholders'), false);
});

test('a large inline payload is clipped and says it was truncated', async () => {
  const { registrations, react } = await loadClient();
  const card = registrations.find((entry) => entry.options.name === 'tool.call.toolview').component;
  const t = (key) => key;
  const big = { items: Array.from({ length: 400 }, (_, index) => ({ name: `被投公司 ${index}` })) };
  // The Host's durable facts never carry the payload; the inline render does.
  const view = mount(react, card, {
    toolName: 'fengniao_company_dimension',
    phase: 'result',
    t,
    block: {
      kind: 'result',
      isError: false,
      call: { name: 'fengniao_company_dimension', argsRaw: '{"entid":"entid-1","dimension":"investments"}' },
      meta: {
        kind: 'dimension',
        dimension: 'investments',
        label: '企业对外投资',
        apiCode: 0,
        success: true,
        state: 'records',
        recordCount: 400,
      },
      content: [
        {
          type: 'text',
          text: `风鸟 · 企业对外投资（investments）\n以下为上游返回的原始数据：\n\`\`\`json\n${JSON.stringify(big, null, 2)}\n\`\`\``,
        },
      ],
    },
  });
  const expanded = view.expanded();
  assert.equal(byClass(expanded, 'fct_pre').length, 1, 'payload preview is rendered');
  assert.match(textsOf(expanded).join('|'), /结果过长已截断/u);
});

test('an empty dimension says so instead of showing a raw state or output hint', async () => {
  const { registrations, react } = await loadClient();
  const card = registrations.find((entry) => entry.options.name === 'tool.call.toolview').component;
  const t = (key) => key;
  const view = mount(react, card, {
    toolName: 'fengniao_company_dimension',
    phase: 'result',
    t,
    block: {
      kind: 'result',
      isError: false,
      call: { name: 'fengniao_company_dimension', argsRaw: '{"entid":"entid-1","dimension":"executed"}' },
      meta: {
        kind: 'dimension',
        dimension: 'executed',
        label: '被执行人',
        apiCode: 0,
        success: true,
        state: 'empty',
        recordCount: 0,
      },
      content: [{ type: 'text', text: '风鸟 · 被执行人（executed）\n未查询到相关记录。' }],
    },
  });
  assert.match(textsOf(view.collapsed).join('|'), /0 条记录/u);
  const expanded = textsOf(view.expanded()).join('|');
  assert.match(expanded, /未查询到记录/u);
  assert.equal(expanded.includes('完整数据见模型输出'), false);
});

test('a dimension without a record count shows no stat', async () => {
  const { registrations, react } = await loadClient();
  const card = registrations.find((entry) => entry.options.name === 'tool.call.toolview').component;
  const t = (key) => key;
  const view = mount(react, card, {
    toolName: 'fengniao_company_dimension',
    phase: 'result',
    t,
    block: {
      kind: 'result',
      isError: false,
      call: { name: 'fengniao_company_dimension', argsRaw: '{"entid":"entid-1","dimension":"basic_info"}' },
      meta: {
        kind: 'dimension',
        dimension: 'basic_info',
        label: '企业基本信息',
        apiCode: 0,
        success: true,
        state: 'records',
      },
      content: [{ type: 'text', text: '风鸟 · 企业基本信息（basic_info）\n```json\n{"apiData":{"entName":"腾讯云计算（北京）有限责任公司"}}\n```' }],
    },
  });
  const headText = textsOf(view.collapsed).join('|');
  assert.match(headText, /腾讯云计算（北京）有限责任公司/u);
  assert.equal(headText.includes('null'), false);
  assert.equal(headText.includes('已返回数据'), false);
  assert.match(textsOf(view.expanded()).join('|'), /腾讯云计算（北京）有限责任公司/u);
});

test('a spilled dimension keeps its durable facts and notes the spill', async () => {
  const { registrations, react } = await loadClient();
  const card = registrations.find((entry) => entry.options.name === 'tool.call.toolview').component;
  const t = (key) => key;
  const view = mount(react, card, {
    toolName: 'fengniao_company_dimension',
    phase: 'result',
    t,
    block: {
      kind: 'result',
      isError: false,
      call: { name: 'fengniao_company_dimension', argsRaw: '{"entid":"entid-1","dimension":"shareholders"}' },
      meta: {
        kind: 'dimension',
        dimension: 'shareholders',
        label: '企业股东信息',
        apiCode: 0,
        success: true,
        state: 'records',
        recordCount: 2,
      },
      content: [
        {
          type: 'text',
          text: '(Omitted 86719 bytes. Full formatted result stored at: C:\\Temp\\spill\\d.txt)',
        },
      ],
    },
  });
  const headText = textsOf(view.collapsed).join('|');
  assert.match(headText, /企业股东信息/u);
  assert.match(headText, /2 条记录/u);
  const expanded = textsOf(view.expanded()).join('|');
  assert.match(expanded, /落盘/u, 'the spill is called out under the card');
  assert.match(expanded, /完整数据见模型输出/u, 'no payload preview for a spilled result');
});

test('a dimension without a label falls back to the wire key', async () => {
  const { registrations, react } = await loadClient();
  const card = registrations.find((entry) => entry.options.name === 'tool.call.toolview').component;
  const t = (key) => key;
  const view = mount(react, card, {
    toolName: 'fengniao_company_dimension',
    phase: 'result',
    t,
    block: {
      kind: 'result',
      isError: false,
      call: { name: 'fengniao_company_dimension', argsRaw: '{"entid":"entid-1","dimension":"admin_penalty"}' },
      meta: { kind: 'dimension', dimension: 'admin_penalty', state: 'records', recordCount: 1 },
      content: [{ type: 'text', text: '' }],
    },
  });
  const headText = textsOf(view.collapsed).join('|');
  assert.match(headText, /admin_penalty/u);
  assert.match(headText, /1 条记录/u);
});

test('a dimension card titles itself with the company name when the payload has one', async () => {
  const { registrations, react } = await loadClient();
  const card = registrations.find((entry) => entry.options.name === 'tool.call.toolview').component;
  const t = (key) => key;
  const view = mount(react, card, {
    toolName: 'fengniao_company_dimension',
    phase: 'result',
    t,
    block: {
      kind: 'result',
      isError: false,
      call: { name: 'fengniao_company_dimension', argsRaw: '{"entid":"entid-1","dimension":"basic_info"}' },
      // Durable facts from the Host carry the name it derived from the payload.
      meta: {
        kind: 'dimension',
        dimension: 'basic_info',
        label: '企业基本信息',
        apiCode: 0,
        success: true,
        state: 'records',
        companyName: '腾讯云计算（北京）有限责任公司',
      },
      content: [{ type: 'text', text: '风鸟 · 企业基本信息（basic_info）' }],
    },
  });
  const headSummary = byClass(view.collapsed, 'fct_headSummary')[0];
  assert.match(textsOf(headSummary).join('|'), /腾讯云计算（北京）有限责任公司/u);
  const headSuffix = byClass(view.collapsed, 'fct_headSuffix')[0];
  assert.match(textsOf(headSuffix).join('|'), /企业基本信息/u);
  assert.equal(textsOf(headSuffix).join('|').includes('已返回数据'), false);
});

test('a list payload does not borrow a row name for the head title', async () => {
  const { registrations, react } = await loadClient();
  const card = registrations.find((entry) => entry.options.name === 'tool.call.toolview').component;
  const t = (key) => key;
  const view = mount(react, card, {
    toolName: 'fengniao_company_dimension',
    phase: 'result',
    t,
    block: {
      kind: 'result',
      isError: false,
      call: { name: 'fengniao_company_dimension', argsRaw: '{"entid":"entid-1","dimension":"shareholders"}' },
      content: [
        {
          type: 'text',
          text: '风鸟 · 企业股东信息（shareholders）\n```json\n{"totalCount":1,"apiData":[{"entName":"某股东有限公司"}]}\n```',
        },
      ],
    },
  });
  const headText = textsOf(view.collapsed).join('|');
  assert.match(headText, /企业股东信息/u);
  assert.equal(headText.includes('某股东有限公司'), false);
});

test('a profile payload without meta still titles the card with the company name', async () => {
  const { registrations, react } = await loadClient();
  const card = registrations.find((entry) => entry.options.name === 'tool.call.toolview').component;
  const t = (key) => key;
  const view = mount(react, card, {
    toolName: 'fengniao_company_dimension',
    phase: 'result',
    t,
    block: {
      kind: 'result',
      isError: false,
      call: { name: 'fengniao_company_dimension', argsRaw: '{"entid":"entid-1","dimension":"basic_info"}' },
      content: [
        {
          type: 'text',
          text: '风鸟 · 企业基本信息（basic_info）\n```json\n{"apiData":{"entName":"比亚迪股份有限公司"}}\n```',
        },
      ],
    },
  });
  assert.match(textsOf(view.collapsed).join('|'), /比亚迪股份有限公司/u);
});

test('the whole stylesheet uses only host theme tokens that exist', async () => {
  const bundle = await readFile(new URL('../client.js', import.meta.url), 'utf8');
  const start = bundle.indexOf('const CSS = `');
  const end = bundle.indexOf('`;', start);
  assert.ok(start !== -1 && end !== -1, 'the stylesheet is present');
  const css = bundle.slice(start, end);
  assert.equal(/:\s*#(?:[0-9a-f]{3,8})\b/iu.test(css), false, 'no literal hex colors');
  assert.equal(/(?:^|[-\w])(?:rgba?|hsla?)\(/iu.test(css), false, 'no literal rgb/hsl colors');
  // Every referenced custom property must be one the installed theme defines:
  // a typo like --dsw-alias-bg-primary silently drops the whole declaration.
  const defined = new Set([
    '--ds-font-family-code',
    '--dsh-content-font-delta',
    '--dsh-content-font-size-secondary',
    '--dsw-alias-bg-base',
    '--dsw-alias-border-l1',
    '--dsw-alias-border-l2',
    '--dsw-alias-brand-primary',
    '--dsw-alias-interactive-bg-hover',
    '--dsw-alias-label-caption',
    '--dsw-alias-label-primary',
    '--dsw-alias-label-secondary',
    '--dsw-alias-label-shimmer',
    '--dsw-alias-label-tertiary',
    '--dsw-alias-markdown-code-block',
    '--dsw-alias-state-business-primary',
    '--dsw-alias-state-error-primary',
    '--dsw-alias-state-success-primary',
    '--dsw-alias-state-warn-label',
    '--dsw-alias-state-warn-primary',
    '--dsw-focus-ring-color',
    '--dsw-focus-ring-width',
    '--dsw-font-markdown-code-block-small',
    '--dsw-font-xs-13',
    '--dsw-radius-lg',
    '--dsw-radius-sm',
  ]);
  const tokens = [...new Set([...css.matchAll(/var\((--[a-z0-9-]+)/gu)].map((match) => match[1]))];
  assert.ok(tokens.length > 15);
  for (const token of tokens) {
    assert.equal(defined.has(token), true, `theme defines ${token}`);
  }
  // The config-card input must use a real surface token.
  assert.match(css, /\.fcs_input\{[^}]*background:var\(--dsw-alias-bg-base\)/u);
  assert.equal(bundle.includes('--dsw-alias-bg-primary'), false);
  for (const own of ['fct_headRow{', 'fct_headTitle{', 'fct_headSummary{', 'fct_headSuffix{']) {
    assert.equal(css.includes(`.${own}`), true, `head styling defines .${own}`);
  }
  // The pre-restyle boxed card is gone.
  assert.equal(bundle.includes('fcs_toolHead'), false);
  assert.equal(bundle.includes('fcs_toolSummary'), false);
  assert.equal(bundle.includes('fcs_json'), false);
});
