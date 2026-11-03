/**
 * Fengniao (Riskbird) company search — DSH Client half.
 *
 * Renders the API-key configuration card inside this bundle's page on the
 * Plugins page (`plugins.bundle.config`, keyed by the bundle package name),
 * exactly like the shipped "思考过程机器翻译" bundle: no separate settings
 * page, everything is configured where the plugin itself is listed.
 *
 * The card only talks to the Host half's same-origin routes; the API key is
 * written to the Harness credential store and never sent back to the page.
 */
window.__ModuleLoader__.load({
  id: 'dsh-fengniao-company-search',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    /** Locale namespace shared with the Host bundle metadata. */
    const NS = 'fengniao-company-search';
    /** Must stay in sync with ROUTE_PREFIX in index.js. */
    const ROUTE = '/plugins/fengniao-company-search';

    const DICT = {
      en: {
        'status.loading': 'Reading configuration…',
        'status.configured': 'Configured',
        'status.missing': 'No API key yet',
        'source.credential': 'Harness credentials',
        'source.credentialEnv': 'Harness credentials (env)',
        'source.config': 'plugin config',
        'source.env': 'environment variable',
        'source.none': 'none',
        keyLabel: 'API key',
        keyPlaceholder: 'Paste the personal API key generated in Fengniao',
        save: 'Save',
        saving: 'Saving…',
        test: 'Test connection',
        testing: 'Testing…',
        clear: 'Remove key',
        clearing: 'Removing…',
        confirmClear: 'Remove the stored Fengniao API key?',
        saved: 'API key saved.',
        cleared: 'API key removed.',
        testOk: 'Connection works',
        testFailed: 'Connection failed',
        loadFailed: 'The configuration route is unreachable. Reload the page and retry.',
        invalidDraft: 'Paste a complete API key first.',
        hintStorage:
          'Save the key here: it goes to the local Harness credential store (never written to the profile settings file, never echoed back) and only the last characters are shown. The legacy FN_API_KEY environment variable is still read as a fallback only.',
        hintGenerate:
          'Generate the key in the Fengniao web console under Account settings → API Key; the full key is shown only once.',
        endpoint: 'Endpoint',
        quota: 'Each dimension query consumes one Fengniao request from the account daily quota.',
        'env.hint': 'The key currently comes from the environment variable {env}. Store it in the Harness credential store instead, then delete the variable.',
        'env.import': 'Import from environment',
        'env.importing': 'Importing…',
        'env.afterImport': 'Imported into the Harness credential store. You can now delete the environment variable.',
        'tool.search': 'Fengniao search',
        'tool.dimension': 'Fengniao dimension',
        'tool.preparing': 'Preparing…',
        'tool.running': 'running',
        'tool.failed': 'failed',
        'tool.stopped': 'Stopped',
        'tool.stoppedNote': 'This call was stopped before it produced a complete result.',
        'tool.keyword': 'keyword',
        'tool.entid': 'entid',
        'tool.dimensionLabel': 'dimension',
        'tool.apiCode': 'API code',
        'tool.state': 'state',
        'tool.hits': 'matches',
        'tool.hitsUnit': 'companies',
        'tool.records': 'records',
        'tool.truncated': 'Result truncated',
        'tool.noRecords': 'No records found.',
        'tool.output': 'Output',
        'tool.errorOutput': 'Error',
        'tool.seeResult': 'Full data is in the model-facing result (or its spilled file).',
        'tool.spilled': 'The full result was spilled to disk; this card shows the durable preview.',
      },
      zh: {
        'status.loading': '正在读取配置…',
        'status.configured': '已配置',
        'status.missing': '尚未配置 API Key',
        'source.credential': 'Harness 凭据库',
        'source.credentialEnv': 'Harness 凭据库（环境变量）',
        'source.config': '插件配置',
        'source.env': '环境变量',
        'source.none': '无',
        keyLabel: 'API Key',
        keyPlaceholder: '粘贴风鸟 Web 端生成的个人 API Key',
        save: '保存',
        saving: '保存中…',
        test: '测试连接',
        testing: '测试中…',
        clear: '清除 Key',
        clearing: '清除中…',
        confirmClear: '确定要删除已保存的风鸟 API Key 吗？',
        saved: 'API Key 已保存。',
        cleared: 'API Key 已清除。',
        testOk: '连接正常',
        testFailed: '连接失败',
        loadFailed: '配置接口不可达，请刷新页面重试。',
        invalidDraft: '请先粘贴完整的 API Key。',
        hintStorage:
          '推荐在这里保存：Key 写入本机 Harness 凭据库（不写入 profile 配置文件、不回显），页面只显示尾号。环境变量 FN_API_KEY 仅作为旧方式的兜底；如果 Key 在环境变量里，点「从环境变量导入到凭据库」后可以把它删掉。',
        hintGenerate:
          'Key 获取方式：风鸟 Web 端「账户设置 → API Key」生成个人 API Key，完整 Key 仅展示一次。',
        endpoint: '接口地址',
        quota: '每次维度查询消耗一次风鸟账号当日额度。',
        'env.hint': '当前 Key 来自环境变量 {env}。建议导入到 Harness 凭据库，然后删除该环境变量。',
        'env.import': '从环境变量导入到凭据库',
        'env.importing': '导入中…',
        'env.afterImport': '已导入 Harness 凭据库，现在可以删除该环境变量了。',
        'tool.search': '风鸟检索',
        'tool.dimension': '风鸟维度',
        'tool.preparing': '准备中…',
        'tool.running': '执行中',
        'tool.failed': '失败',
        'tool.stopped': '已停止',
        'tool.stoppedNote': '本次调用已停止，没有完整结果。',
        'tool.keyword': '关键词',
        'tool.entid': 'entid',
        'tool.dimensionLabel': '维度',
        'tool.apiCode': '接口码',
        'tool.state': '状态',
        'tool.hits': '匹配',
        'tool.hitsUnit': '家',
        'tool.records': '条记录',
        'tool.truncated': '结果过长已截断',
        'tool.noRecords': '未查询到记录。',
        'tool.output': '输出',
        'tool.errorOutput': '错误',
        'tool.seeResult': '完整数据见模型输出（或其落盘文件）。',
        'tool.spilled': '结果过大已落盘（spill），卡片显示的是持久化预览。',
      },
    };

    /** Best-effort locale for the module-level fallback translator. */
    function detectLocale() {
      try {
        const lang = (document.documentElement.lang || navigator.language || 'en').toLowerCase();
        return lang.startsWith('zh') ? 'zh' : 'en';
      } catch {
        return 'en';
      }
    }

    /** Local dictionary fallback used when the page does not supply `t`. */
    function fallbackTranslate(key) {
      const dict = DICT[detectLocale()] ?? DICT.en;
      return dict[key] ?? DICT.en[key] ?? key;
    }

    /** Translate through the page's bound `t`, falling back to our own dictionary. */
    function makeTranslator(bound) {
      if (typeof bound !== 'function') return fallbackTranslate;
      return (key) => {
        let value;
        try {
          value = bound(key);
        } catch {
          return fallbackTranslate(key);
        }
        return value === undefined || value === key ? fallbackTranslate(key) : value;
      };
    }

    /** Read one JSON response, rejecting non-2xx and `ok: false` payloads. */
    async function readJson(response) {
      let payload;
      try {
        payload = await response.json();
      } catch {
        throw new Error(`HTTP ${response.status}`);
      }
      if (!response.ok) throw new Error(typeof payload?.error === 'string' ? payload.error : `HTTP ${response.status}`);
      return payload;
    }

    /** One async operation with its own busy/notice state, safe after unmount. */
    function useSettingsCard() {
      const [phase, setPhase] = React.useState('loading');
      const [status, setStatus] = React.useState(null);
      const [busy, setBusy] = React.useState('');
      const [notice, setNotice] = React.useState(null);
      const mounted = React.useRef(true);

      const applyStatus = React.useCallback((next) => {
        if (!mounted.current) return;
        setStatus(next);
        setPhase('ready');
      }, []);

      const load = React.useCallback(async () => {
        try {
          const response = await fetch(`${ROUTE}/settings`, {
            cache: 'no-store',
            headers: { accept: 'application/json', 'x-fengniao-plugin': '1' },
          });
          const payload = await readJson(response);
          applyStatus(payload);
        } catch {
          if (!mounted.current) return;
          setPhase('error');
        }
      }, [applyStatus]);

      React.useEffect(() => {
        mounted.current = true;
        void load();
        return () => {
          mounted.current = false;
        };
      }, [load]);

      /** Run one card action, keeping a single busy flag and one result notice. */
      const run = React.useCallback(
        async (kind, request, describe) => {
          if (!mounted.current) return;
          setBusy(kind);
          setNotice(null);
          try {
            const result = await request();
            if (!mounted.current) return;
            setNotice(describe(result));
            if (result?.ok !== false && typeof result?.configured === 'boolean') applyStatus(result);
          } catch (error) {
            if (!mounted.current) return;
            setNotice({ tone: 'error', text: error instanceof Error ? error.message : String(error) });
          } finally {
            if (mounted.current) setBusy('');
          }
        },
        [applyStatus],
      );

      return { phase, status, busy, notice, setNotice, load, run };
    }

    /* -------------------------------------------------------------- */
    /* Conversation cards (keyed `tool.call.toolview`)                */
    /* -------------------------------------------------------------- */

    /** Localized title of one Fengniao wire tool. */
    function toolTitle(t, toolName) {
      if (toolName === 'fengniao_search_company') return t('tool.search');
      if (toolName === 'fengniao_company_dimension') return t('tool.dimension');
      return toolName;
    }

    /**
     * Display label of one dimension key, mirroring DIMENSIONS in index.js. Used
     * for the running card only; a settled card carries the Host's own label.
     */
    const DIMENSION_LABELS = {
      basic_info: '企业基本信息',
      shareholders: '企业股东信息',
      executives: '企业高级职员',
      investments: '企业对外投资',
      changes: '企业工商变更',
      executed: '被执行人',
      dishonest: '失信被执行人',
      limit_consumption: '限制高消费',
      abnormal_operation: '经营异常',
      serious_illegal: '严重违法',
      admin_penalty: '行政处罚',
    };

    /** Shorten a display string to `max` code points. */
    function clip(value, max) {
      const text = value === null || value === undefined ? '' : String(value);
      const chars = Array.from(text);
      return chars.length <= max ? text : `${chars.slice(0, max).join('')}…`;
    }

    /** Parse the model arguments of one tool block at any call stage. */
    function blockArgs(block) {
      if (block === null || block === undefined) return null;
      const raw = typeof block.kind === 'string' ? block.call?.argsRaw : block.argsRaw;
      if (typeof raw !== 'string' || raw === '') return null;
      try {
        const parsed = JSON.parse(raw);
        return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    }

    /** Join every text block of one settled tool result. */
    function blockText(block) {
      const content = block !== null && block !== undefined && Array.isArray(block.content) ? block.content : [];
      return content
        .filter((entry) => entry !== null && typeof entry === 'object' && entry.type === 'text' && typeof entry.text === 'string')
        .map((entry) => entry.text)
        .join('\n');
    }

    /** Durable card facts persisted as `result.meta` by `output.presentationMeta`. */
    function blockMeta(block) {
      const meta = block === null || block === undefined ? undefined : block.meta;
      return meta !== null && typeof meta === 'object' && !Array.isArray(meta) && typeof meta.kind === 'string' ? meta : null;
    }

    /** Whether the settled content is a spill locator rather than the render body. */
    function contentSpilled(block) {
      return /Full formatted result stored at|结果已落盘/u.test(blockText(block));
    }

    /** One failed-call message without the `Error: ` envelope. */
    function blockError(block) {
      return blockText(block).replace(/^Error:\s*/u, '');
    }

    /** Rebuild the search card model from an old (meta-less) render. */
    function parseSearchText(text) {
      const empty = /未找到匹配“(.+?)”的企业/u.exec(text);
      if (empty !== null) return { kind: 'search', query: empty[1], count: 0, candidates: [] };
      const head = /“(.+?)”匹配到 (\d+) 家企业/u.exec(text);
      if (head === null) return null;
      const candidates = [];
      for (const line of text.split('\n')) {
        const match = /^\d+\.\s+(.+)$/u.exec(line);
        if (match === null) continue;
        const parts = match[1].split(' · ');
        const candidate = { name: parts[0] };
        for (const part of parts.slice(1)) {
          if (part.startsWith('entid: ')) candidate.entid = part.slice('entid: '.length);
          else candidate.status = part;
        }
        candidates.push(candidate);
      }
      return { kind: 'search', query: head[1], count: candidates.length, candidates };
    }

    /** Rebuild the dimension card model from an old (meta-less) render. */
    function parseDimensionText(text) {
      const head = /风鸟 · (.+?)（([^）]+)）/u.exec(text);
      if (head === null) return null;
      const model = {
        kind: 'dimension',
        label: head[1],
        dimension: head[2],
        apiCode: null,
        success: true,
        state: 'unknown',
        recordCount: null,
        data: null,
      };
      const message = /^接口提示：(.+)$/mu.exec(text);
      if (message !== null) model.message = message[1];
      if (text.includes('未查询到相关记录')) {
        model.state = 'empty';
        model.recordCount = 0;
        return model;
      }
      const fence = /```json\n([\s\S]*?)\n```/u.exec(text);
      if (fence !== null) {
        try {
          model.data = JSON.parse(fence[1]);
          model.state = 'records';
        } catch {
          // Keep the header-only model; the raw text is still the body fallback.
        }
      }
      return model;
    }

    /** Official 16x16 outline glyph; the shipped rows use a 1px regular stroke. */
    function outlineIcon(nodes, size, className, key) {
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 16 16',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
          'aria-hidden': 'true',
          strokeWidth: 1,
          className,
          key,
        },
        ...nodes,
      );
    }

    /** One stroked outline path of an official glyph. */
    function outlinePath(d, extra) {
      return h('path', { d, stroke: 'currentColor', ...(extra === undefined ? {} : extra) });
    }

    /** Disclosure chevron; `open` points it up like the shipped rows. */
    function chevronIcon(open, className, key) {
      return outlineIcon(
        [
          open
            ? outlinePath('M12 10L8.70711 6.70711C8.31658 6.31658 7.68342 6.31658 7.29289 6.70711L4 10')
            : outlinePath('M4 6L7.29289 9.29289C7.68342 9.68342 8.31658 9.68342 8.70711 9.29289L12 6'),
        ],
        14,
        className,
        key,
      );
    }

    /** Printable cell: never `undefined`/`null`/empty, which would collapse a row. */
    function cellValue(value) {
      if (value === null || value === undefined) return '—';
      const text = String(value).trim();
      return text === '' ? '—' : text;
    }

    /** One text run of the collapsed head; `masked` renders it for the shimmer sweep. */
    function headText(masked, className, value, key) {
      const shared = `fct_shimmerText ${className}`;
      return masked
        ? h('span', { key, className: shared, 'data-shimmer-text': value })
        : h('span', { key, className: shared }, value);
    }

    /**
     * Running-state sweep copied from the shipped tool row: the base content and
     * an identical masked clone animate over each other. `render(masked)` must
     * return the same node tree both times.
     */
    function shimmerLine(props) {
      const active = props.active === true;
      return h(
        'span',
        { className: 'fct_shimmer', 'data-shimmer': active ? '' : undefined },
        h('span', { className: 'fct_shimmerContent' }, props.render(false)),
        active
          ? h(
              'span',
              { className: 'fct_shimmerDecoration', 'aria-hidden': 'true', inert: '' },
              h(
                'span',
                { className: 'fct_shimmerSweep' },
                h('span', { className: 'fct_shimmerContent fct_shimmerHighlight' }, props.render(true)),
              ),
            )
          : null,
      );
    }

    /** One `dt`/`dd` block of a details card (rows without a value are skipped). */
    function fieldList(fields) {
      const rows = fields
        .filter((field) => field !== null && field !== undefined)
        .map((field, index) =>
          h(
            'div',
            { key: index, className: 'fct_detailsField' },
            h('dt', null, field.label),
            h('dd', null, field.mono === true && typeof field.value === 'string'
              ? h('span', { className: 'fct_mono' }, field.value)
              : field.value === null || field.value === undefined
                ? '—'
                : field.value),
          ),
        );
      return rows.length === 0 ? null : h('dl', { className: 'fct_detailsFields' }, ...rows);
    }

    /** Heading line of a details item: text, or an openable path, plus an optional badge. */
    function detailHeading(text, options) {
      const settings = options === undefined ? {} : options;
      const inner = settings.mono === true && typeof text === 'string' ? h('span', { className: 'fct_mono' }, text) : text;
      const title = typeof settings.action === 'function'
        ? h('button', { type: 'button', className: 'fct_detailsPath', title: settings.title, onClick: settings.action }, inner)
        : h('span', { className: 'fct_detailsText' }, inner);
      return h(
        'div',
        { className: 'fct_detailsHeading' },
        title,
        settings.badge === undefined
          ? null
          : h('span', { className: 'fct_detailsBadge', 'data-tone': settings.badge.tone }, settings.badge.label),
      );
    }

    /** Secondary line of a details item. */
    function detailSubtitle(text) {
      return h('div', { className: 'fct_detailsSubtitle' }, text);
    }

    /** Caption line of a details item (trailing hints, spilled notices). */
    function detailDescription(text) {
      return h('div', { className: 'fct_detailsDescription' }, text);
    }

    /** One bordered details card: a list of items built from heading/fields/notes. */
    function detailsCard(items) {
      const rows = items.filter((nodes) => nodes.filter((node) => node !== null && node !== undefined).length > 0);
      if (rows.length === 0) return null;
      return h(
        'div',
        { className: 'fct_detailsCard' },
        h(
          'ul',
          { className: 'fct_detailsList' },
          ...rows.map((nodes, index) =>
            h('li', { key: index, className: 'fct_detailsItem' }, ...nodes.filter((node) => node !== null && node !== undefined)),
          ),
        ),
      );
    }

    /** Shipped Input/Output panel: raw text for failures and unparsable results. */
    function ioCard(label, text, isError) {
      return h(
        'div',
        { className: 'fct_ioCard' },
        h(
          'div',
          { className: 'fct_ioSection' },
          h('span', { className: 'fct_ioLabel' }, label),
          h('span', { className: 'fct_ioText', 'data-error': isError ? 'true' : undefined }, text),
        ),
      );
    }

    /** One trailing notice under a card (partial export, spilled preview). */
    function cardNote(text, tone) {
      return h('div', { className: 'fct_note', 'data-tone': tone }, text);
    }

    /* -------------------------------------------------------------- */
    /* Tool-card toolkit ported from the shipped row/details primitives */
    /* -------------------------------------------------------------- */

    /** Glyph of one Fengniao wire tool: magnifier (search), flat list (dimension). */
    function toolIcon(toolName) {
      if (toolName === 'fengniao_search_company') {
        return outlineIcon(
          [
            outlinePath(
              'M6.58727 11.8586C9.55061 11.8586 11.9529 9.45637 11.9529 6.49304C11.9529 3.5297 9.55061 1.12744 6.58727 1.12744C3.62394 1.12744 1.22168 3.5297 1.22168 6.49304C1.22168 9.45637 3.62394 11.8586 6.58727 11.8586Z',
            ),
            outlinePath('M10.2991 10.3933L14.7783 14.8725'),
          ],
          14,
        );
      }
      return outlineIcon(
        [
          outlinePath('M6 3.5h7.5M6 8h7.5M6 12.5h7.5', { strokeLinecap: 'round' }),
          outlinePath('M2.6 3.5h.01M2.6 8h.01M2.6 12.5h.01', { strokeLinecap: 'round' }),
        ],
        14,
      );
    }

    /** JSON preview of one dimension payload, or null when it cannot be shown. */
    function safeJson(value) {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return null;
      }
    }

    /**
     * Company name carried by a single-profile dimension payload (basic_info and
     * similar), or '' when the payload only lists related records. Mirrors
     * payloadCompanyName in index.js so meta-less session logs render the same.
     */
    function payloadCompanyName(data) {
      if (data === null || typeof data !== 'object' || Array.isArray(data)) return '';
      for (const candidate of [data.apiData, data.result, data]) {
        if (candidate === null || typeof candidate !== 'object' || Array.isArray(candidate)) continue;
        for (const key of ['entName', 'entname', 'companyName', 'company_name', 'ent_name']) {
          const value = candidate[key];
          if (typeof value === 'string' && value.trim() !== '') return value.trim();
        }
      }
      return '';
    }

    /**
     * Collapsed-head text of one settled card model: `summary` is what the call
     * acted on and `suffix` is its one-line stat — the shipped row's
     * `summary` + `summarySuffix` pair, so the head stays to two facts.
     */
    function toolHead(t, toolName, model) {
      if (toolName === 'fengniao_search_company') {
        const keyword = typeof model.query === 'string' ? model.query : '';
        const count = Number.isFinite(model.count) ? model.count : 0;
        return {
          summary: keyword === '' ? '' : clip(keyword, 72),
          suffix: [t('tool.hits'), String(count), t('tool.hitsUnit')].filter((part) => part !== '').join(' '),
        };
      }
      const label =
        typeof model.label === 'string' && model.label !== ''
          ? model.label
          : typeof model.dimension === 'string'
            ? model.dimension
            : '';
      // A single-record profile (basic_info) reports totalCount 0 even though it
      // carries data, so a zero count with state "records" means "data returned",
      // not "no records".
      // Only a payload that names its own subject can title the card; a list of
      // shareholders/executives keeps the dimension label.
      const companyName =
        typeof model.companyName === 'string' && model.companyName !== ''
          ? model.companyName
          : payloadCompanyName(model.data);
      const records = Number.isInteger(model.recordCount) ? model.recordCount : null;
      const count =
        model.state === 'empty'
          ? `0 ${t('tool.records')}`
          : records !== null && records > 0
            ? `${records} ${t('tool.records')}`
            : '';
      return companyName === ''
        ? { summary: label, suffix: count }
        : {
            summary: clip(companyName, 72),
            suffix: count === '' ? clip(label, 24) : clip(`${clip(label, 24)} · ${count}`, 60),
          };
    }

    /** Body of one settled `fengniao_search_company` call: keyword plus candidates. */
    function searchBody(t, model) {
      const candidates = Array.isArray(model.candidates) ? model.candidates : [];
      const items = [[fieldList([{ label: t('tool.keyword'), value: model.query }])]];
      for (const candidate of candidates) {
        const target = candidate !== null && typeof candidate === 'object' ? candidate : {};
        const detail = [
          typeof target.status === 'string' && target.status !== '' ? target.status : '',
          typeof target.entid === 'string' && target.entid !== '' ? `${t('tool.entid')}: ${target.entid}` : '',
        ]
          .filter((part) => part !== '')
          .join(' · ');
        items.push([detailHeading(cellValue(target.name)), detail === '' ? null : detailSubtitle(detail)]);
      }
      if (candidates.length === 0) items.push([detailDescription(t('tool.noRecords'))]);
      return [detailsCard(items)];
    }

    /** Body of one settled `fengniao_company_dimension` call: request facts + payload. */
    function dimensionBody(t, model, args) {
      const request = args !== null && typeof args === 'object' ? args : {};
      const entid = typeof request.entid === 'string' ? request.entid : '';
      const label =
        typeof model.label === 'string' && model.label !== '' ? model.label : cellValue(model.dimension);
      const dimension = typeof model.dimension === 'string' ? model.dimension : '';
      const header = dimension === '' ? label : `${label}（${dimension}）`;
      const state = [
        cellValue(model.state),
        Number.isInteger(model.recordCount) && model.recordCount > 0
          ? `${model.recordCount} ${t('tool.records')}`
          : '',
      ]
        .filter((part) => part !== '')
        .join(' · ');
      const stateText = model.state === 'empty' ? t('tool.noRecords') : state;
      const items = [
        [
          fieldList([
            { label: t('tool.dimensionLabel'), value: header },
            { label: t('tool.entid'), value: entid, mono: true },
            { label: t('tool.apiCode'), value: model.apiCode, mono: true },
            { label: t('tool.state'), value: stateText },
          ]),
          typeof model.message === 'string' && model.message !== '' ? detailDescription(model.message) : null,
        ],
      ];
      const payload = model.data === undefined || model.data === null ? null : safeJson(model.data);
      if (payload === null) items.push([detailDescription(model.state === 'empty' ? t('tool.noRecords') : t('tool.seeResult'))]);
      else {
        items.push([h('pre', { key: 'payload', className: 'fct_pre' }, clip(payload, 6000))]);
        if (model.truncated === true || Array.from(payload).length > 6000) {
          items.push([detailDescription(t('tool.truncated'))]);
        }
      }
      return [detailsCard(items)];
    }

    /** Body of one running call: the request as far as it has arrived. */
    function pendingBody(t, toolName, args) {
      const request = args !== null && typeof args === 'object' ? args : {};
      if (toolName === 'fengniao_search_company') {
        return [
          detailsCard([
            [
              fieldList([
                {
                  label: t('tool.keyword'),
                  value:
                    typeof request.keyword === 'string' && request.keyword !== ''
                      ? request.keyword
                      : t('tool.preparing'),
                },
              ]),
            ],
          ]),
        ];
      }
      return [
        detailsCard([
          [
            fieldList([
              { label: t('tool.dimensionLabel'), value: DIMENSION_LABELS[request.dimension] ?? request.dimension },
              { label: t('tool.entid'), value: request.entid, mono: true },
            ]),
          ],
        ]),
      ];
    }

    /**
     * One Fengniao tool call rendered like a shipped Tool card: a disclosure head
     * (glyph, title, separator, summary, stat suffix) and an expandable details body.
     */
    function FengniaoToolRow(props) {
      const bound = props === null || props === undefined ? undefined : props.t;
      const t = React.useMemo(() => makeTranslator(bound), [bound]);
      const block = props === null || props === undefined ? undefined : props.block;
      const phase = props === null || props === undefined ? undefined : props.phase;
      const toolName = props === null || props === undefined || typeof props.toolName !== 'string' ? '' : props.toolName;
      const preparing = phase === 'preparing';
      const pending = phase !== 'result';
      // A user stop is the shipped row's neutral "stopped" state, not a failure.
      const interrupted =
        !pending && block !== null && block !== undefined && block.error?.code === 'interrupted';
      const failed = !pending && block !== null && block !== undefined && block.isError === true && !interrupted;
      const args = React.useMemo(() => blockArgs(block), [block]);
      const meta = React.useMemo(
        () => (pending || failed || interrupted ? null : blockMeta(block)),
        [block, pending, failed, interrupted],
      );
      const model = React.useMemo(() => {
        if (pending || failed || interrupted) return null;
        const text = blockText(block);
        if (meta !== null) {
          // The durable facts carry no payload by design; when the live content
          // is still inline, enrich the card with the raw dimension data.
          if (toolName === 'fengniao_company_dimension' && (meta.data === undefined || meta.data === null)) {
            const parsed = parseDimensionText(text);
            if (parsed !== null && parsed.data !== null) return { ...meta, data: parsed.data };
          }
          return meta;
        }
        return toolName === 'fengniao_search_company' ? parseSearchText(text) : parseDimensionText(text);
      }, [pending, failed, interrupted, meta, block, toolName]);
      const spilled = !pending && !failed && meta !== null && contentSpilled(block);
      const head = React.useMemo(() => {
        if (pending) {
          const hint =
            args === null
              ? ''
              : toolName === 'fengniao_search_company'
                ? args.keyword
                : (DIMENSION_LABELS[args.dimension] ?? args.dimension);
          return {
            summary:
              typeof hint === 'string' && hint !== ''
                ? clip(hint, 72)
                : t(preparing ? 'tool.preparing' : 'tool.running'),
            suffix: '',
          };
        }
        if (interrupted) {
          const hint =
            args === null
              ? ''
              : toolName === 'fengniao_search_company'
                ? args.keyword
                : (DIMENSION_LABELS[args.dimension] ?? args.dimension);
          return {
            summary: typeof hint === 'string' && hint !== '' ? clip(hint, 72) : t('tool.stopped'),
            suffix: '',
          };
        }
        if (failed) return { summary: clip(blockError(block), 120), suffix: '' };
        if (model === null) return { summary: clip(blockText(block), 140), suffix: '' };
        return toolHead(t, toolName, model);
      }, [pending, preparing, interrupted, failed, args, model, t, toolName, block]);
      // One stable disclosure Hook per mounted call: the conversation owner's
      // Hook when it supplies one, local state otherwise.
      function useLocalDisclosure() {
        const [expanded, setExpanded] = React.useState(false);
        return { expanded, toggle: () => setExpanded((current) => !current) };
      }
      const disclosureHook = React.useRef(null);
      if (disclosureHook.current === null) {
        const ownerHook = props !== null && props !== undefined && typeof props.useDisclosure === 'function' ? props.useDisclosure : null;
        disclosureHook.current = ownerHook === null ? useLocalDisclosure : ownerHook;
      }
      const disclosure = disclosureHook.current();
      const expandable = !preparing;
      const expanded = expandable && disclosure.expanded === true;
      const toggle = () => {
        if (typeof disclosure.toggle === 'function') disclosure.toggle();
      };
      const onRowKeyDown = (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        toggle();
      };
      const state = pending
        ? preparing
          ? 'preparing'
          : 'running'
        : interrupted
          ? 'stopped'
          : failed
            ? 'error'
            : 'ok';
      const statusText = pending
        ? t(preparing ? 'tool.preparing' : 'tool.running')
        : interrupted
          ? t('tool.stopped')
          : failed
            ? t('tool.failed')
            : null;
      const title = toolTitle(t, toolName);
      const summaryClass = interrupted
        ? 'fct_headSummary fct_stoppedSummary'
        : failed
          ? 'fct_headSummary fct_errorSummary'
          : 'fct_headSummary';
      const renderHead = (masked) => {
        const nodes = [headText(masked, 'fct_headTitle', title, 'title')];
        // A model without its usual summary (for example a dimension payload
        // without a label) lends the suffix slot so the row still reads
        // `title · something`.
        const summaryText = head.summary !== '' ? head.summary : head.suffix;
        if (summaryText !== '') {
          nodes.push(h('span', { key: 'sep', className: 'fct_sep', 'data-shimmer-decoration': '', 'aria-hidden': true }));
          nodes.push(headText(masked, summaryClass, summaryText, 'summary'));
        }
        if (head.summary !== '' && head.suffix !== '') nodes.push(headText(masked, 'fct_headSuffix', head.suffix, 'suffix'));
        return nodes;
      };
      let bodyNodes = [];
      if (expanded) {
        if (interrupted) bodyNodes = [cardNote(t('tool.stoppedNote'), 'warn')];
        else if (failed) bodyNodes = [ioCard(t('tool.errorOutput'), clip(blockError(block), 1600), true)];
        else if (pending) bodyNodes = pendingBody(t, toolName, args);
        else if (model !== null) {
          bodyNodes = toolName === 'fengniao_search_company' ? searchBody(t, model) : dimensionBody(t, model, args);
          if (spilled) bodyNodes.push(cardNote(t('tool.spilled'), 'warn'));
        } else bodyNodes = [ioCard(t('tool.output'), clip(blockText(block), 1600), false)];
      }
      return h(
        'div',
        { className: 'fct_root', 'data-tool': toolName, 'data-state': state },
        statusText === null ? null : h('span', { className: 'fct_visuallyHidden' }, statusText),
        h(
          'div',
          { className: 'fct_disclosure', 'data-open': expanded ? '' : undefined },
          h(
            'div',
            { className: 'fct_headRow', 'data-disclosure-header': '' },
            h(
              'div',
              {
                className: 'fct_row',
                'data-disclosure-row': '',
                'data-expandable': expandable ? '' : undefined,
                role: expandable ? 'button' : undefined,
                tabIndex: expandable ? 0 : undefined,
                'aria-expanded': expandable ? expanded : undefined,
                onClick: expandable ? toggle : undefined,
                onKeyDown: expandable ? onRowKeyDown : undefined,
              },
              h(
                'span',
                { className: 'fct_leading' },
                expandable && !expanded
                  ? [
                      h('span', { key: 'glyph', className: 'fct_iconIdle' }, toolIcon(toolName)),
                      chevronIcon(false, 'fct_chevronHover', 'chevron'),
                    ]
                  : expanded
                    ? chevronIcon(true)
                    : toolIcon(toolName),
              ),
              shimmerLine({ active: pending, render: renderHead }),
            ),
          ),
          expanded
            ? h('div', { className: 'fct_bodyWrap' }, ...bodyNodes.filter((node) => node !== null && node !== undefined))
            : null,
        ),
      );
    }
    /** One compact status chip describing where the key comes from. */
    function StatusChip({ t, status }) {
      if (status === null || status === undefined) return h('span', { className: 'fcs_chip', 'data-tone': 'muted' }, t('status.loading'));
      if (status.configured !== true) return h('span', { className: 'fcs_chip', 'data-tone': 'muted' }, t('status.missing'));
      const source = t(`source.${status.source ?? 'none'}`);
      const hint = typeof status.hint === 'string' && status.hint !== '' ? ` ${status.hint}` : '';
      return h('span', { className: 'fcs_chip', 'data-tone': 'ok' }, `${t('status.configured')} · ${source}${hint}`);
    }

    /** The configuration card rendered in the bundle's page on the Plugins page. */
    function FengniaoConfigCard(props) {
      const t = React.useMemo(() => makeTranslator(props?.t), [props?.t]);
      const { phase, status, busy, notice, setNotice, load, run } = useSettingsCard();
      const [draft, setDraft] = React.useState('');
      const ready = phase === 'ready' && status !== null;
      const configured = ready && status.configured === true;
      const envName =
        ready && typeof status.apiKeyEnv === 'string' && status.apiKeyEnv !== '' ? status.apiKeyEnv : 'FN_API_KEY';
      // The key is still only in the legacy environment variable: offer a one-click migration.
      const envImportable =
        ready && status.envAvailable === true && (status.source === 'env' || status.source === 'none');

      React.useEffect(() => {
        if (phase === 'error') setNotice({ tone: 'error', text: t('loadFailed') });
        else if (phase === 'ready') setNotice(null);
      }, [phase, setNotice, t]);

      const save = React.useCallback(() => {
        const apiKey = draft.trim();
        if (apiKey === '') {
          setNotice({ tone: 'error', text: t('invalidDraft') });
          return;
        }
        void run(
          'save',
          async () => {
            const response = await fetch(`${ROUTE}/settings`, {
              method: 'POST',
              cache: 'no-store',
              headers: { 'content-type': 'application/json', accept: 'application/json', 'x-fengniao-plugin': '1' },
              body: JSON.stringify({ apiKey }),
            });
            const payload = await readJson(response);
            if (payload.ok === false) throw new Error(payload.error ?? 'save failed');
            return payload;
          },
          (result) => {
            setDraft('');
            return { tone: 'ok', text: t('saved') };
          },
        );
      }, [draft, run, setNotice, t]);

      const test = React.useCallback(() => {
        void run(
          'test',
          async () => {
            const response = await fetch(`${ROUTE}/test`, {
              method: 'POST',
              cache: 'no-store',
              headers: { 'content-type': 'application/json', accept: 'application/json', 'x-fengniao-plugin': '1' },
              body: JSON.stringify({}),
            });
            const payload = await readJson(response);
            if (payload.ok !== true) {
              const detail = typeof payload.msg === 'string' && payload.msg !== '' ? payload.msg : t('testFailed');
              const code = payload.apiCode === null || payload.apiCode === undefined ? '' : ` · code ${payload.apiCode}`;
              throw new Error(`${detail}${code}`);
            }
            return payload;
          },
          (result) => ({
            tone: 'ok',
            text: `${t('testOk')} · HTTP ${result.httpStatus} · ${result.latencyMs}ms`,
          }),
        );
      }, [run, t]);

      const clear = React.useCallback(() => {
        if (typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.confirm(t('confirmClear'))) return;
        void run(
          'clear',
          async () => {
            const response = await fetch(`${ROUTE}/settings`, {
              method: 'POST',
              cache: 'no-store',
              headers: { 'content-type': 'application/json', accept: 'application/json', 'x-fengniao-plugin': '1' },
              body: JSON.stringify({ clear: true }),
            });
            const payload = await readJson(response);
            if (payload.ok === false) throw new Error(payload.error ?? 'clear failed');
            return payload;
          },
          () => ({ tone: 'ok', text: t('cleared') }),
        );
      }, [run, t]);

      // Move the legacy environment key into the Harness credential store without
      // ever handling the secret in the page: the Host reads it and writes it.
      const importFromEnv = React.useCallback(() => {
        void run(
          'import',
          async () => {
            const response = await fetch(`${ROUTE}/settings`, {
              method: 'POST',
              cache: 'no-store',
              headers: { 'content-type': 'application/json', accept: 'application/json', 'x-fengniao-plugin': '1' },
              body: JSON.stringify({ importFromEnv: true }),
            });
            const payload = await readJson(response);
            if (payload.ok === false) throw new Error(payload.error ?? 'import failed');
            return payload;
          },
          () => ({ tone: 'ok', text: t('env.afterImport') }),
        );
      }, [run, t]);

      const canSave = draft.trim() !== '' && busy === '';
      const canTest = configured && busy === '';
      const canClear = configured && status?.source === 'credential' && busy === '';

      return h(
        'div',
        { className: 'fcs_card' },
        h(
          'div',
          { className: 'fcs_header' },
          h('span', { className: 'fcs_title' }, '风鸟企业查询', h('span', { className: 'fcs_titleEn' }, ' · Fengniao')),
          h(StatusChip, { t, status: ready ? status : null }),
        ),
        ready && status.source === 'env'
          ? h('p', { className: 'fcs_envHint' }, t('env.hint').replace('{env}', envName))
          : null,
        h(
          'label',
          { className: 'fcs_field' },
          h('span', { className: 'fcs_fieldLabel' }, t('keyLabel')),
          h('input', {
            className: 'fcs_input',
            type: 'password',
            value: draft,
            autoComplete: 'off',
            spellCheck: false,
            placeholder: t('keyPlaceholder'),
            disabled: busy !== '' || phase !== 'ready',
            onChange: (event) => {
              setDraft(event.target.value);
              if (notice !== null && notice.tone === 'error') setNotice(null);
            },
            onKeyDown: (event) => {
              if (event.key === 'Enter' && canSave) save();
            },
          }),
        ),
        h(
          'div',
          { className: 'fcs_actions' },
          h(
            'button',
            { type: 'button', className: 'fcs_button fcs_primary', disabled: !canSave, onClick: save },
            busy === 'save' ? t('saving') : t('save'),
          ),
          h(
            'button',
            { type: 'button', className: 'fcs_button', disabled: !canTest, onClick: test },
            busy === 'test' ? t('testing') : t('test'),
          ),
          envImportable
            ? h(
                'button',
                { type: 'button', className: 'fcs_button', disabled: busy !== '', onClick: importFromEnv },
                busy === 'import' ? t('env.importing') : t('env.import'),
              )
            : null,
          canClear
            ? h(
                'button',
                { type: 'button', className: 'fcs_button fcs_danger', disabled: busy !== '', onClick: clear },
                busy === 'clear' ? t('clearing') : t('clear'),
              )
            : null,
        ),
        notice !== null
          ? h('div', { className: 'fcs_notice', 'data-tone': notice.tone }, notice.text)
          : null,
        h('p', { className: 'fcs_hint' }, t('hintStorage')),
        h('p', { className: 'fcs_hint' }, t('hintGenerate')),
        h(
          'p',
          { className: 'fcs_meta' },
          `${t('endpoint')}: ${ready ? status.baseUrl : '—'} · ${t('quota')}`,
        ),
      );
    }

    const CSS = `
.fcs_card{gap:8px;display:grid;max-width:100%}
.fcs_header{align-items:center;justify-content:space-between;gap:12px;display:flex;flex-wrap:wrap}
.fcs_title{color:var(--dsw-alias-label-primary);font-weight:500;font-size:13px;line-height:20px}
.fcs_titleEn{color:var(--dsw-alias-label-tertiary);font-weight:400}
.fcs_chip{box-sizing:border-box;border-radius:999px;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-interactive-bg-hover);white-space:nowrap;font-size:11px;line-height:18px;padding:1px 8px;border:none}
.fcs_chip[data-tone=ok]{color:var(--dsw-alias-state-success-primary)}
.fcs_field{gap:6px;display:grid}
.fcs_fieldLabel{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.fcs_input{box-sizing:border-box;width:100%;border-radius:var(--dsw-radius-sm);border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;padding:6px 10px}
.fcs_input:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
.fcs_input::placeholder{color:var(--dsw-alias-label-tertiary)}
.fcs_input:disabled{opacity:.6}
.fcs_actions{align-items:center;gap:8px;display:flex;flex-wrap:wrap;margin-top:2px}
.fcs_button{box-sizing:border-box;border-radius:var(--dsw-radius-sm);color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-interactive-bg-hover);border:none;cursor:pointer;font:inherit;font-size:12px;line-height:18px;padding:4px 12px}
.fcs_button:hover:enabled{color:var(--dsw-alias-label-primary)}
.fcs_button:disabled{cursor:default;opacity:.5}
.fcs_primary{color:var(--dsw-alias-label-primary);font-weight:500}
.fcs_danger{color:var(--dsw-alias-state-error-primary)}
.fcs_notice{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);word-break:break-word}
.fcs_notice[data-tone=ok]{color:var(--dsw-alias-state-success-primary)}
.fcs_notice[data-tone=error]{color:var(--dsw-alias-state-error-primary)}
.fcs_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:11px;line-height:1.6}
.fcs_meta{color:var(--dsw-alias-label-tertiary);margin:0;font-size:11px;line-height:1.6;word-break:break-all}
.fcs_envHint{color:var(--dsw-alias-label-secondary);margin:0;font-size:11px;line-height:1.6}
.fcs_chip[data-tone=muted]{color:var(--dsw-alias-label-tertiary)}
.fct_root{display:flex;flex-direction:column}
.fct_visuallyHidden{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}
.fct_disclosure{display:flex;flex-direction:column;width:100%;min-width:0}
.fct_headRow{display:flex;align-items:center;min-width:0}
.fct_row{flex:1 1 auto;position:relative;overflow:hidden;display:flex;align-items:center;height:calc(24px + var(--dsh-content-font-delta,0px));min-width:0;color:var(--dsw-alias-label-tertiary);transition:color .1s ease}
.fct_row[data-expandable]{cursor:pointer}
.fct_row:hover{color:var(--dsw-alias-label-secondary)}
.fct_leading{position:relative;flex:none;width:calc(16px + var(--dsh-content-font-delta,0px));height:calc(16px + var(--dsh-content-font-delta,0px));display:inline-flex;align-items:center;justify-content:center;margin-right:6px;padding:0;border:none;background:none;color:inherit}
.fct_leading svg:not([data-state]){width:calc(14px + var(--dsh-content-font-delta,0px));height:calc(14px + var(--dsh-content-font-delta,0px))}
.fct_iconIdle{display:inline-flex;opacity:1;transition:opacity .1s ease}
.fct_chevronHover{position:absolute;inset:0;margin:auto;opacity:0;transition:opacity .1s ease}
.fct_row:hover .fct_iconIdle{opacity:0}
.fct_row:hover .fct_chevronHover{opacity:1}
.fct_headTitle{flex:none;font-weight:400;font-size:var(--dsh-content-font-size-secondary,13px);line-height:calc(24px + var(--dsh-content-font-delta,0px));color:inherit}
.fct_sep{background:var(--dsw-alias-label-caption);border-radius:1px;flex:none;display:block;width:2px;height:2px;margin:0 8px}
.fct_headSummary{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:var(--dsh-content-font-size-secondary,13px);line-height:calc(24px + var(--dsh-content-font-delta,0px));flex:auto;overflow:hidden}
.fct_headSuffix{white-space:nowrap;font-size:var(--dsh-content-font-size-secondary,13px);line-height:calc(24px + var(--dsh-content-font-delta,0px));flex:none;margin-left:4px}
.fct_errorSummary{color:var(--dsw-alias-state-error-primary)}.fct_stoppedSummary{color:var(--dsw-alias-state-warn-label)}
.fct_shimmer{position:relative;display:inline-grid;width:max-content;max-width:100%;min-width:0;vertical-align:top;color:inherit}
.fct_shimmerContent{display:flex;align-items:center;min-width:0}
.fct_shimmerText{color:inherit}
.fct_shimmerText[data-shimmer-text]:after{content:attr(data-shimmer-text)}
.fct_shimmerDecoration{position:absolute;inset:0;overflow:clip;pointer-events:none;user-select:none}
.fct_shimmerSweep{position:absolute;inset:0;overflow:hidden;color:var(--dsw-alias-label-shimmer);mask-image:linear-gradient(105deg,transparent 0%,black 40% 60%,transparent 100%);transform:translate(-100%);animation:fct-sweep 1.5s steps(48,end) .3s infinite}
.fct_shimmerSweep *{color:inherit!important}
.fct_shimmerSweep [data-shimmer-decoration]{background:currentColor}
.fct_shimmerHighlight{width:100%;height:100%;transform:translate(100%);animation:fct-highlight 1.5s steps(48,end) .3s infinite}
@keyframes fct-sweep{0%{transform:translate(-100%)}66.6667%,to{transform:translate(100%)}}
@keyframes fct-highlight{0%{transform:translate(100%)}66.6667%,to{transform:translate(-100%)}}
@media(prefers-reduced-motion:reduce){.fct_row{transition:none}.fct_shimmerDecoration{display:none}.fct_shimmerSweep,.fct_shimmerHighlight{animation:none}}
.fct_bodyWrap{flex-direction:column;display:flex}
.fct_detailsCard{border:.5px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-markdown-code-block);color:var(--dsw-alias-label-secondary);font:var(--dsw-font-xs-13);margin:4px 0 4px 4px;overflow:hidden}
.fct_detailsList{max-height:320px;margin:0;padding:0;list-style:none;overflow-y:auto}
.fct_detailsItem{margin:0;padding:10px 14px}
.fct_detailsItem+.fct_detailsItem{border-top:.5px solid var(--dsw-alias-border-l2)}
.fct_detailsHeading{flex-wrap:wrap;align-items:baseline;gap:8px;display:flex}
.fct_detailsText{white-space:pre-wrap;overflow-wrap:anywhere;flex:1;min-width:0}
.fct_detailsFields{margin:0}
.fct_detailsHeading+.fct_detailsFields{margin-top:6px}
.fct_detailsField{grid-template-columns:5.5em minmax(0,1fr);gap:12px;display:grid}
.fct_detailsField+.fct_detailsField{margin-top:4px}
.fct_detailsField dt{color:var(--dsw-alias-label-caption)}
.fct_detailsField dd{white-space:pre-wrap;overflow-wrap:anywhere;margin:0}
.fct_detailsSubtitle{color:var(--dsw-alias-label-tertiary);overflow-wrap:anywhere;margin-top:3px;font-size:12px}
.fct_detailsDescription{color:var(--dsw-alias-label-caption);white-space:pre-wrap;overflow-wrap:anywhere;margin:6px 0}
.fct_detailsBadge{color:var(--dsw-alias-label-caption);flex:none;align-items:center;gap:5px;font-size:12px;display:inline-flex}
.fct_detailsBadge:before{content:"";corner-shape:round;background:currentColor;border-radius:50%;width:5px;height:5px}
.fct_detailsBadge[data-tone=info]{color:var(--dsw-alias-state-business-primary)}
.fct_detailsBadge[data-tone=success]{color:var(--dsw-alias-state-success-primary)}
.fct_detailsBadge[data-tone=warning]{color:var(--dsw-alias-state-warn-primary)}
.fct_detailsBadge[data-tone=error]{color:var(--dsw-alias-state-error-primary)}
.fct_detailsPath{min-width:0;color:inherit;font:inherit;text-align:start;overflow-wrap:anywhere;cursor:pointer;background:0 0;border:none;flex:1;padding:0}
.fct_detailsPath:hover{text-decoration:underline}
.fct_detailsPath:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:3px}
.fct_ioCard{border:.5px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-markdown-code-block);font:var(--dsw-font-markdown-code-block-small);flex-direction:column;margin:4px 0 4px 4px;display:flex}
.fct_ioSection{grid-template-columns:max-content 1fr;align-items:baseline;column-gap:14px;max-height:150px;padding:12px 16px;display:grid;overflow-y:auto}
.fct_ioSection::-webkit-scrollbar-thumb{border-radius:var(--dsw-radius-sm);background-clip:padding-box;border:2px solid transparent}
.fct_ioSection::-webkit-scrollbar-track{margin:6px 0}
.fct_ioLabel{color:var(--dsw-alias-label-caption);align-self:start;position:sticky;top:0}
.fct_ioText{white-space:pre-wrap;word-break:break-word;min-width:0;color:var(--dsw-alias-label-secondary)}
.fct_ioText[data-error]{color:var(--dsw-alias-state-error-primary)}
.fct_mono{font-family:var(--ds-font-family-code)}
.fct_note{white-space:pre-wrap;overflow-wrap:anywhere;font:var(--dsw-font-xs-13);color:var(--dsw-alias-label-tertiary);margin:4px 0 4px 4px}
.fct_note[data-tone=warn]{color:var(--dsw-alias-state-warn-primary)}
.fct_pre{white-space:pre-wrap;overflow-wrap:anywhere;font-family:var(--ds-font-family-code);font-size:12px;line-height:1.55;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-base);border:.5px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm);padding:8px 10px;margin:6px 0 0;max-height:240px;overflow:auto}
`;

    /** Register the card and own its dictionary and stylesheet. */
    function apply(ctx) {
      let translate = fallbackTranslate;
      if (typeof ctx.locale?.bind === 'function') {
        try {
          translate = ctx.locale.bind(NS);
        } catch {
          translate = fallbackTranslate;
        }
      }
      if (typeof ctx.locale?.register === 'function') {
        ctx.effect(() => ctx.locale.register(NS, { en: DICT.en, zh: DICT.zh }), 'fengniao: dictionaries');
      }
      ctx.effect(() => {
        const tag = document.createElement('style');
        tag.dataset.plugin = 'dsh-fengniao-company-search';
        tag.textContent = CSS;
        document.head.appendChild(tag);
        return () => {
          tag.remove();
        };
      }, 'fengniao: stylesheet');
      ctx.slots.inject('plugins.bundle.config', () =>
        ctx.slots.register(
          {
            name: 'plugins.bundle.config',
            key: 'dsh-fengniao-company-search',
            locale: NS,
          },
          FengniaoConfigCard,
        ),
      );
      // One keyed conversation card per wire tool name.
      for (const toolName of ['fengniao_search_company', 'fengniao_company_dimension']) {
        ctx.slots.inject('tool.call.toolview', () =>
          ctx.slots.register({ name: 'tool.call.toolview', key: toolName, locale: NS }, FengniaoToolRow),
        );
      }
    }

    return {
      inject: ['slots', 'locale'],
      apply,
    };
  },
});
