# 风鸟企业查询 · DSH 插件

[![DSH Plugin](https://img.shields.io/badge/DSH-Plugin-4c6ef5?style=flat-square)](#)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek-Harness-5b6bff?style=flat-square)](https://github.com/deepseek-ai/deepseek-harness)
[![Version](https://img.shields.io/badge/version-1.1.0-blue?style=flat-square)](package.json)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-339933?style=flat-square)](package.json)
[![DSH](https://img.shields.io/badge/DSH-0.2.1--rc.3%2B-4D6BFE?style=flat-square)](#兼容性)

**标签**：`dsh-plugin` · `dsh-bundle` · `deepseek-harness` · `fengniao` · `riskbird` · `company-search` · `due-diligence` · `企业查询` · `工商查询` · `企业尽调`

风鸟（Riskbird）企业查询的 DeepSeek Harness（DSH）插件：安装后由 Agent 直接调用两个原生工具，按中文企业名称查询工商信息、股东、高管、对外投资、变更以及被执行/失信/经营异常等司法与经营风险数据；API Key 在「插件」页的配置卡片里保存。

## 特性

- **原生 Agent 工具**：`fengniao_search_company` 解析主体，`fengniao_company_dimension` 按 `entid` 查维度，由 Agent 直接调用
- **11 个企业维度**：工商、股东、高管、对外投资、变更、被执行、失信、限高、经营异常、严重违法、行政处罚
- **插件页配置 Key（推荐）**：卡片写入本机 Harness 凭据库，不回显、不写入 profile 配置文件，保存即生效
- **一键迁移旧环境变量**：Key 还在 `FN_API_KEY` 里时，卡片提示「从环境变量导入到凭据库」，Host 侧直接写入凭据库（Key 不经过页面），导入后即可删掉环境变量；环境变量仅作为旧方式兜底，`allowEnvFallback: false` 可完全关闭
- **对话卡片**：两个工具各有默认收起的对话卡片，样式与 DSH 内置工具卡一致（同一套行头 + 详情卡结构、主题 token 与运行态扫光）；检索行头是「关键词 + 匹配 N 家」，维度行头是「维度 + N 条记录」（返回数据里自带企业全称时改用「企业名 + 维度 · N 条记录」；单条档案没有条数就不加），展开看候选列表或维度字段 + 原始 JSON
- **零运行时依赖**：只用 Node 内置 `fetch` 与 `node:test`，无 npm 依赖、无构建步骤
- **同源安全路由**：配置接口只注册在本机 Web 服务上，并要求自定义请求头，跨站页面无法在不触发 CORS 预检的情况下伪造请求

## 快速开始

### 1. 安装

在 DSH 侧边栏的「插件」页可以直接从 GitHub 仓库安装，不需要手动下载或敲命令：

1. 打开「插件」页；
2. 点右上角「添加插件」（箭头菜单里是「安装第三方插件」）；
3. 在「包名或地址」输入框里粘贴本仓库地址：

   ```text
   https://github.com/keyblues/dsh-plugin-fengniao-company-search
   ```

4. 点「安装」，等待下载完成（需要本机能访问 github.com）；
5. 安装完成后插件自动启用：进入本插件详情页，在配置卡片里保存 API Key。

不同网络环境下的输入方式：

| 场景 | 「包名或地址」怎么填 |
| --- | --- |
| 能正常访问 GitHub（推荐） | `https://github.com/keyblues/dsh-plugin-fengniao-company-search` |
| GitHub 连不上 | 先 `git clone` 本仓库，再填本地目录的绝对路径；DSH 会以 `link:` 方式安装该目录 |
| 想让 Agent 代劳 | 在对话框里直接说「安装插件 https://github.com/keyblues/dsh-plugin-fengniao-company-search」 |

补充说明：

- 新安装无需重启即可生效（Host 行与 Client 模块会热加载）；**更新已安装插件后需要重启 DSH**，运行中的进程不会重新加载已修改的 Host 模块。
- 卸载：在「插件」页打开本插件详情 → 卸载。
- GitHub 安装失败通常是网络问题（`ECONNRESET`、连接超时），改用上面的本地目录方式即可。

### 2. 配置 API Key

打开「插件」页 → 本插件详情 → 在配置卡片里粘贴 Key 并保存。Key 的解析优先级：

| 顺序 | 来源 | 说明 |
| --- | --- | --- |
| 1 | `config.apiKey` | profile `cordis.patch.yml` 内直接写入，优先级最高 |
| 2 | Harness 凭据库 | 插件页保存，引用名由 `credentialRef` 指定（默认 `FENGNIAO_API_KEY`）；**推荐** |
| 3 | 环境变量 | 变量名由 `apiKeyEnv` 指定（默认 `FN_API_KEY`）；**旧方式，仅作兜底**，可设 `allowEnvFallback: false` 关闭插件自己的这一层 |

> 凭据库解析由 Harness 的 credentials 服务完成：它自身会按「`.credentials.yaml` → 进程环境变量 → 项目/用户 `.env`」顺序回退
> （变量名是 `credentialRef`，与上面的 `apiKeyEnv` 不同）。所以状态卡片可能出现「Harness 凭据库（环境变量）」——
> 表示 Key 是从同名环境变量或 `.env` 读到的，尚未真正写入凭据文件；`allowEnvFallback: false` 只关闭上表第 3 层，
> 不影响 credentials 服务自己的回退。

> **Key 不要长期放在环境变量里。** 如果你的 Key 之前是通过 `FN_API_KEY` 配置的，插件页状态会显示「环境变量」，
> 卡片上会出现「从环境变量导入到凭据库」按钮：Host 侧读取环境变量并写入 Harness 凭据库，**Key 不会经过页面**；
> 导入后状态变为「Harness 凭据库」，此时可以删除环境变量（Windows：`reg delete HKCU\Environment /v FN_API_KEY /f`，
> 或在「系统属性 → 环境变量」里删掉；插件对持久化环境变量有 30 秒缓存，刚删完可能还会显示一会儿）。

### 3. 开始使用

直接用自然语言提问即可：

- “帮我查一下比亚迪的企业尽调和风险”
- “信数科技的法人是谁、股东有哪些”
- “这家供应商有没有被执行/失信记录”

Agent 会先调用 `fengniao_search_company` 解析主体拿到 `entid`，再按需调用 `fengniao_company_dimension`；名称有歧义时会先向你确认主体。

## 工具参考

### `fengniao_search_company`

按中文名称模糊搜索企业，返回候选企业的工商全称与 `entid`。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `keyword` | string | 是 | 企业中文名称或简称；英文无效 |

返回 `query`、`count` 与 `candidates[]`（`name`、`entid`、接口返回时的 `status`，以及原始记录 `raw`），最多 20 条。查维度前必须先用本工具取得 `entid`。

### `fengniao_company_dimension`

按 `entid` 查询一个企业维度。

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `entid` | string | 是 | 来自 `fengniao_search_company` 的企业标识 |
| `dimension` | string | 是 | 维度枚举，见下表 |

返回 `dimension`、`label`、`apiCode`、`success`、`state`（`records` / `empty` / `unknown`）、`message`（接口有提示时）、`data`（上游原始 JSON）与 `truncated`（只有极端大的 payload 才会置 true，更大的结果由 Harness 的 spill 机制落盘）。

> 每次调用消耗一次账号额度，不要重复查询同一维度；结果过大时 Harness 会把模型侧内容落盘（spill）并给出路径，卡片仍会显示维度/记录数摘要。
> 上游 API 要求把 API Key 放在 URL 查询参数里（`apikey=...`），这是风鸟接口的限制，不是本插件的选择；因此它可能出现在上游/代理的访问日志中，
> 插件侧不会写日志、也不会把 Key 回显给页面。

Web 端两张卡片都是内置工具卡的样子：行头、展开体和运行态照抄 DSH 内置的 `DisclosureRow` 行头 +
`ToolDetails` 详情卡 + 运行态扫光，类名用插件自己的 `fct_` 前缀，颜色只引用主题 token，所以和内置卡片混排不突兀：

- 检索行头 = `关键词` + `匹配 N 家`（关键词可截断，「匹配 N 家」固定在右侧不参与截断）；
- 维度行头 = `维度` + `N 条记录`（无记录时 `0 条记录`；单条档案 `basic_info` 上游 totalCount 就是 0，
  没有「条数」可报，行头就不加记录数）。如果本次维度的返回数据里自带企业全称（例如 `basic_info` 的 `apiData.entName`），
  行头改用「企业名 + `维度`（+ 记录数）」；列表型维度（股东/高管/对外投资等）的数据里只有关联方名称，不会拿来当标题
  ——**有就显示、没有就不显示**，不跨调用缓存、不用额外接口；
- 尚未开始执行时不可展开，执行中行头做左→右扫光并可展开看已到达的请求参数（维度卡此时显示维度中文名，不显示上游 key），
  失败时摘要用错误色；用户停止的调用显示「已停止」（警示色）而不是失败，也不展开错误面板；
- 不再有自定义状态胶囊（内置卡片不显示「完成/失败」标签）。

展开后：检索卡片是「关键词」字段 + 候选列表（企业名为主行，`状态 · entid: xxx` 为次行），没有候选时显示「未查询到记录。」；
维度卡片是「维度（dimension）/ entid / 接口码 / 状态」字段 + 原始 JSON 预览（代码块样式，最长 240px 滚动；
JSON 超过 6000 字符会截断并提示「结果过长已截断」），接口有提示时会多一行提示；内容完全解析不出来时退回「输出 / 错误」面板。
卡片事实同时写入 `output.presentationMeta`（有界），所以即使模型侧结果被 spill，卡片也能正常回放。

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

## 配置项

全部可选，代码内有默认值：

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `apiKey` | 空 | 直接写入的 Key，优先级最高；建议改用插件页或凭据库 |
| `credentialRef` | `FENGNIAO_API_KEY` | Harness 凭据库引用名（插件页保存的位置） |
| `apiKeyEnv` | `FN_API_KEY` | 旧方式的环境变量名；仅作兜底 |
| `allowEnvFallback` | `true` | 设为 `false` 时插件不再读取自己的 `apiKeyEnv` 环境变量；Harness 凭据库服务自身对 `credentialRef` 的环境变量/`.env` 回退不受此开关影响 |
| `baseUrl` | `https://m.riskbird.com/prod-qbb-api` | 接口地址，仅内部联调需要修改 |
| `timeoutMs` | `30000` | 单次接口超时（毫秒，5000–120000） |

## 获取 API Key

登录风鸟 Web 端，在「账户设置 → API Key」生成个人 API Key（完整 Key 只展示一次）。
多个 Key 共用同一账号的每日额度，创建多个 Key 不会增加可用次数；额度以风鸟 API Key 页面展示为准。

## 错误码

| code | 含义 | 处理方式 |
| --- | --- | --- |
| `9999` + apikey 不合法/未配置 | Key 无效或尚未配置 | 到插件页重新保存 Key |
| `9999` + 访问已达上限 | 账号当日额度用完 | 隔天再试，不要重试 |
| `8888` | `entid` 或参数错误 | 重新调用 `fengniao_search_company` 获取 `entid` |
| `20000` | 请求成功；`state=empty` 表示该维度无记录 | 正常展示「未查询到相关记录」 |

## 测试

```bash
npm test        # 等价于 node --test，仅用 Node 内置 test runner，无需安装依赖
```

覆盖：两个工具 `execute()` 返回值与声明 `output.schema` 的一致性（DSH 按 `additionalProperties:false` 校验，未声明字段会让整次调用失败）、上游错误码映射、Windows 注册表环境变量解析、设置路由的自定义请求头校验与「不回显 Key」断言、**环境变量一键导入凭据库**、`allowEnvFallback` 开关、`presentationMeta` 有界性，以及 Client 半卡片（默认收起、头部摘要、展开内容、旧日志回退解析）。

## 故障排查

- **插件页显示「配置接口不可达」**：设置路由要等 DSH 的 Web 服务挂载后才注册（启动顺序不保证），重开插件页即可，无需重启。
- **状态显示「环境变量」**：说明 Key 目前来自 `FN_API_KEY`。点卡片上的「从环境变量导入到凭据库」即可迁移，之后可以删掉这个环境变量；不想让插件再读环境变量，可在 profile 里设 `allowEnvFallback: false`。
- **设置了 `FN_API_KEY` 却显示未配置**：插件先读进程环境，再直接读 Windows 用户/系统环境变量注册表（30 秒缓存），`setx` 后通常立即生效；仍读不到时重开一次 DSH。
- **更新代码后行为没变**：运行中的 DSH 不会重新加载已修改的 Host 模块，重启 DSH 后生效。
- **最稳妥的方式**：直接在插件页的配置卡片里保存 Key（写入 Harness 凭据库，优先级高于环境变量）。

## 文件结构

```text
index.js                 Host 半：工具注册 + 上游 HTTP + 同源配置路由 + 凭据读写/环境变量导入
client.js                Client 半：插件页配置卡片（含环境变量导入按钮）+ 两张对话卡片
cordis.patch.yml         bundle 清单（插入 fengniao-company-search 行）
locale/*.json            插件页展示的标题与描述
icon.svg                 插件图标
test/plugin.test.js      输出契约、错误码、凭据导入与设置路由的回归测试
test/client-card.test.js 配置卡片注册与对话卡片的渲染测试
```

## 安全边界

- 只从配置 / Harness 凭据库 / 环境变量读取 Key，不读取其他插件或用户目录里的配置
- Key 仅通过上游要求的 `apikey` URL 查询参数发送；不写入日志、不回显给页面（页面只显示尾号提示）
- 配置路由只注册在 DSH 本机 Web 服务上（同源），并要求自定义请求头 `x-fengniao-plugin: 1`：跨站页面无法在不触发 CORS 预检的情况下伪造，避免任意网页 CSRF 改写 Key

## 兼容性

- Node.js ≥ 20（DSH 内置 Node 即可）
- DSH `>=0.2.1-rc.3 <0.3.0-0`：由 `package.json` 的 `engines.dsh` 声明，装错版本时 DSH 会直接拒绝安装；已在 `0.2.1-rc.3` 上验证
- 依赖 `tools` 服务；`webServer`、`credentials` 为可选服务（缺失时对应能力不可用）；Client 半使用 `plugins.bundle.config` 插槽

## License

[MIT](LICENSE) © keyblues
