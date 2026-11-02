# 风鸟企业查询 · DSH 插件

[![DSH Plugin](https://img.shields.io/badge/DSH-Plugin-4c6ef5?style=flat-square)](#)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek-Harness-5b6bff?style=flat-square)](https://github.com/deepseek-ai/deepseek-harness)
[![Version](https://img.shields.io/badge/version-1.1.0-blue?style=flat-square)](package.json)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-339933?style=flat-square)](package.json)
[![DSH](https://img.shields.io/badge/DSH-0.2.1--rc.3%2B-4D6BFE?style=flat-square)](#兼容性)

> **English** — Riskbird (风鸟) China company lookup for DeepSeek Harness (DSH). Two native agent tools resolve a Chinese company name to a Riskbird `entid` and fetch one of 11 dimensions for it: business registration, shareholders, executives, outbound investments, registration changes, court enforcement, dishonest judgment debtor, consumption restriction, abnormal operation, serious illegality and administrative penalties. The API key is configured on the plugin page and stored in the Harness credential store. Zero npm dependencies.

风鸟企业查询的 DSH 插件。装好后 Agent 可以直接调用两个工具查中国企业：先按名称解析主体拿到 `entid`，再按 `entid` 取一个维度。API Key 在「插件」页的配置卡片里保存，写入本机 Harness 凭据库，不打进 profile 配置文件、不回显。

- 数据来源：风鸟（Riskbird）企业查询 API，需要在风鸟 Web 端申请 API Key
- 平台：macOS / Windows / Linux（Host 半为纯 Node 代码，无原生依赖）
- 仓库：<https://github.com/keyblues/dsh-fengniao-company-search> · 关键词：`dsh-plugin` `deepseek-harness` `fengniao` `riskbird` `company-search` `企业查询` `工商查询` `企业尽调`

## 特性

- **原生 Agent 工具**：`fengniao_search_company` 解析主体，`fengniao_company_dimension` 按 `entid` 查维度，由 Agent 直接调用，不用拼 shell 命令
- **11 个企业维度**：工商、股东、高管、对外投资、变更、被执行、失信、限高、经营异常、严重违法、行政处罚
- **插件页配置 Key（推荐）**：卡片写入本机 Harness 凭据库，不回显、不写入 profile 配置文件，保存即生效
- **一键迁移旧环境变量**：Key 还在 `FN_API_KEY` 里时，卡片提供「从环境变量导入到凭据库」，Host 侧直接写入（Key 不经过页面）
- **对话卡片**：两个工具各有默认收起的卡片，行头与详情卡沿用 DSH 内置工具卡的样式与主题 token，和内置卡片混排不突兀
- **零 npm 依赖**：只用 Node 内置模块（`fetch`、`node:test`，Windows 下用 `child_process` 读环境变量注册表），无依赖、无构建步骤
- **同源安全路由**：配置接口只注册在本机 DSH Web 服务上并要求自定义请求头，跨站页面无法静默改写 Key

## 安装

DSH Desktop 支持直接从 GitHub 仓库安装：

1. 打开侧边栏「插件」页；
2. 点右上角「添加插件」→「安装第三方插件」；
3. 在「包名或地址」里输入本仓库地址：

   ```text
   https://github.com/keyblues/dsh-fengniao-company-search
   ```

4. 安装完成后进入本插件详情页，在配置卡片里保存 API Key；
5. 工具随插件自动注册：`fengniao_search_company` / `fengniao_company_dimension`。

不同网络环境下的填法：

| 场景 | 「包名或地址」怎么填 |
| --- | --- |
| 能正常访问 GitHub（推荐） | `https://github.com/keyblues/dsh-fengniao-company-search` |
| GitHub 连不上 | 先 `git clone` 本仓库，再填本地目录的绝对路径（DSH 以 `link:` 方式安装） |
| 想让 Agent 代劳 | 在对话框里直接说「安装插件 https://github.com/keyblues/dsh-fengniao-company-search」 |

> 新安装无需重启即可生效；**更新已安装插件后需要重启 DSH**（运行中的进程不会重新加载已修改的 Host 模块）。卸载：插件页 → 本插件详情 → 卸载。

## 配置 API Key

打开「插件」页 → 本插件详情 → 在配置卡片里粘贴 Key 并保存。**推荐用这种方式**，Key 落在 Harness 凭据库。

Key 的解析优先级：

| 顺序 | 来源 | 说明 |
| --- | --- | --- |
| 1 | `config.apiKey` | profile `cordis.patch.yml` 内直接写入，优先级最高 |
| 2 | Harness 凭据库 | 插件页保存，引用名由 `credentialRef` 指定（默认 `FENGNIAO_API_KEY`）；推荐 |
| 3 | 环境变量 | 变量名由 `apiKeyEnv` 指定（默认 `FN_API_KEY`）；旧方式，可用 `allowEnvFallback: false` 关闭 |

> **Key 不要长期放在环境变量里。** 若 Key 之前通过 `FN_API_KEY` 配置，插件页状态会显示「环境变量」，卡片上出现「从环境变量导入到凭据库」按钮：Host 侧读取并写入凭据库，Key 不经过页面；导入后即可删除环境变量。Windows 下可执行 `reg delete HKCU\Environment /v FN_API_KEY /f`，插件对持久化环境变量有 30 秒缓存。

**获取 Key**：登录[风鸟 Web 端](https://www.riskbird.com)，在「账户设置 → API Key」生成（完整 Key 只展示一次）。多个 Key 共用同一账号的每日额度。

## 工具参考

### `fengniao_search_company`

按中文名称模糊搜索企业，返回候选企业的工商全称与 `entid`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `keyword` | string | 是 | 企业中文名称或简称；风鸟按中文名检索，英文名查不到 |

返回 `query`、`count` 与 `candidates[]`（`name`、`entid`、`status`、`raw`），最多 20 条。查维度前必须先用它拿到 `entid`。

### `fengniao_company_dimension`

按 `entid` 查询一个企业维度。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `entid` | string | 是 | 来自 `fengniao_search_company` 的企业标识 |
| `dimension` | string | 是 | 维度枚举，见下表 |

返回 `dimension`、`label`、`apiCode`、`success`、`state`（`records` / `empty` / `unknown`）、`message`、`data`（上游原始 JSON）与 `truncated`。

> 每次调用消耗一次账号额度，不要重复查询同一维度。结果很大时 Harness 会把模型侧内容落盘（spill）并给出路径，对话卡片仍会显示维度与记录数摘要。

## 支持的维度

| dimension | 名称 | 上游 version |
| --- | --- | --- |
| `basic_info` | 企业基本信息 | B1 |
| `shareholders` | 企业股东信息 | B2 |
| `executives` | 企业高级职员 | B3 |
| `investments` | 企业对外投资 | B4 |
| `changes` | 企业工商变更 | B5 |
| `executed` | 被执行人 | C2 |
| `dishonest` | 失信被执行人 | C3 |
| `limit_consumption` | 限制高消费 | C4 |
| `abnormal_operation` | 经营异常 | D1 |
| `serious_illegal` | 严重违法 | D2 |
| `admin_penalty` | 行政处罚 | D11 |

## 对话卡片

两个工具在 Web 端各有一张对话卡片，默认收起、点击行头展开：检索卡是「关键词 + 匹配 N 家」加候选列表；维度卡是「维度 + N 条记录」加字段与原始 JSON 预览。行头、展开体和运行态样式都照抄 DSH 内置工具卡（仅用主题 token 上色），结果被 spill 时卡片仍能回放维度、记录数与预览。

## 配置项

全部可选，代码内有默认值；可在 profile 的 `cordis.patch.yml` 里按 `id: fengniao-company-search` 覆盖：

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `apiKey` | 空 | 直接写入的 Key，优先级最高；建议改用插件页或凭据库 |
| `credentialRef` | `FENGNIAO_API_KEY` | Harness 凭据库引用名（插件页保存的位置） |
| `apiKeyEnv` | `FN_API_KEY` | 旧方式的环境变量名；仅作兜底 |
| `allowEnvFallback` | `true` | 设为 `false` 时插件不再读自己的 `apiKeyEnv` 环境变量 |
| `baseUrl` | `https://m.riskbird.com/prod-qbb-api` | 接口地址，仅内部联调需要修改 |
| `timeoutMs` | `30000` | 单次接口超时（毫秒，5000–120000） |

## 常见问题

- **插件页显示「配置接口不可达」**：设置路由要等 DSH 的 Web 服务挂载后才注册（启动顺序不保证），重开插件页即可，无需重启。
- **状态显示「环境变量」**：Key 目前来自 `FN_API_KEY`，点卡片上的导入按钮迁移到凭据库即可。
- **设置 `FN_API_KEY` 却显示未配置**：插件先读进程环境，再读 Windows 用户/系统环境变量注册表（30 秒缓存）；仍读不到时重开一次 DSH。
- **更新代码后行为没变**：运行中的 DSH 不会重新加载已修改的 Host 模块，重启后生效。
- **错误码**：`9999` 表示 Key 无效或当日额度用完；`8888` 表示 `entid` 或参数错误，重新调用 `fengniao_search_company` 获取 `entid`；`20000` 为成功，此时 `state: empty` 表示该维度没有记录。

## 兼容性、安全与隐私

- Node.js ≥ 20（DSH 内置 Node 即可）；DSH 版本范围由 `package.json` 的 `engines.dsh` 声明（`>=0.2.1-rc.3 <0.3.0-0`），装错版本时 DSH 会直接拒绝安装。
- 只从配置 / Harness 凭据库 / 环境变量读取 Key，不读取其他插件或用户目录里的配置；Key 不写日志、不回显给页面（页面只显示尾号）。
- 风鸟接口要求把 Key 放在 URL 查询参数（`apikey=...`）里，这是上游限制；因此 Key 可能出现在上游/代理的访问日志中。
- 配置路由注册在 DSH 本机 Web 服务上（同源），并要求自定义请求头 `x-fengniao-plugin: 1`，跨站页面无法在不触发 CORS 预检的情况下伪造请求。

## 开发与测试

```bash
npm test        # 等价于 node --test；只用 Node 内置 test runner，无需安装依赖
```

覆盖：两个工具 `execute()` 返回值与声明的 `output.schema` 一致性（DSH 按 `additionalProperties: false` 校验）、上游错误码映射、Windows 注册表环境变量解析、设置路由的请求头校验与「不回显 Key」断言、环境变量导入凭据库、`allowEnvFallback` 开关、`presentationMeta` 有界性，以及 Client 半的配置卡片与对话卡片渲染。

```text
index.js                  Host 半：工具注册 + 上游 HTTP + 同源配置路由 + 凭据读写/环境变量导入
client.js                 Client 半：插件页配置卡片（含环境变量导入）+ 两张对话卡片
cordis.patch.yml          bundle 清单（插入 fengniao-company-search 行）
locale/{zh,en}.json       插件管理器里的标题与描述
icon.svg                  插件图标
test/plugin.test.js       输出契约、错误码、凭据与设置路由的回归测试
test/client-card.test.js  配置卡片与对话卡片的渲染测试
```

## License

[MIT](LICENSE) © keyblues

[![](https://img.shields.io/badge/powered_by-dsh-4D6BFE?style=flat-square&logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness)
