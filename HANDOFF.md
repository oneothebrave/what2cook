# 项目交接：今晚吃什么

更新日期：2026-10-12（Asia/Shanghai）

仓库：<https://github.com/oneothebrave/what2cook>

## 1. 接手时先知道什么

项目是 npm workspaces monorepo，前端为 Taro 4.2.0 + React 18 + TypeScript + SCSS，后端为 Fastify + Prisma + PostgreSQL。

**当前进度是首页设计已确认、mock 首页代码已搭建。尚未完成可用 MVP。** 下一步应验证预览并完善首页交互，再考虑后端、AI 和商业化。

用户已认可最后一版首页结构。历史讨论中的 Logo、时间、长句标题、独立锁定按钮等已被淘汰，不能因为旧组件里还有代码就恢复。

本次交接整理没有修改业务代码或修复后端错误，保留真实现状。工作区没有真实 `.env`、数据库备份或部署配置；没有证据表明存在已部署环境或需要迁移的业务数据。

## 2. 产品方向与已确认首页

目标用户是负责家庭晚餐的成员，核心价值是减少“今晚吃什么”的决策负担。主流程：查看建议 -> 选择想做的菜 -> 查看食材摘要 -> 生成购物清单。菜谱库、社区、打卡与周计划是后续能力，尚未完成。

### 2.1 首屏结构

```text
家中库存                       优先使用 [开关]
番茄 2个  鸡蛋 5个  豆腐 1块  +N       更新

今晚建议
已按你家口味筛选

[已选] 番茄炒蛋     今日可做 · 30分钟      换一道
[已选] 清炒西兰花   需购买 1 种 · 15分钟   换一道
[未选] 冬瓜丸子汤   需购买 2 种 · 35分钟   换一道

2 道菜 · 还需购买 N 种                     >

生成购物清单

首页 / 周计划 / 菜谱 / 清单 / 我的
```

上方不再增加 Logo、App 名、当前时间、“为你家推荐今晚晚餐”或重复的口味与时间标签。小程序系统导航栏目前仍配置了“今晚吃什么”，这与业务页面不放品牌头区是两回事。

### 2.2 交互决策

- 库存区是推荐条件摘要，不能变成完整库存长列表。展示少量相关食材，更多数量应来自实际数据，点击进入完整库存；完整页按类别、搜索、增删改组织。
- “优先使用”控制库存对推荐的影响，关闭不能清空库存。关闭后购物清单是否仍扣除库存需进一步确认：建议将“库存推荐优先级”和“清单库存核对”区分，避免把家中已有食材重复买一遍。
- “更新”用于修正已经用掉、丢掉或失效的库存，避免推荐依赖过时数据。
- 标题只保留“今晚建议”，用“已按你家口味筛选”表达个性化来源；真实偏好设置尚未接入。
- 只保留“已选/未选”。已选菜品决定清单来源，取消选择即从清单剔除。首页不设独立“锁定”。
- 点击“换一道”只替换当前菜，当前实现保留该行的选择状态。若日后增加全局换菜，保留已选菜、只替换未选菜。
- 换菜次数上限没有最终定案。曾讨论过 3 次提醒，但并未确认或实现；先保证候选去重、无候选反馈，再决定是否做轻提示。
- 摘要左侧不加 Logo、不写“购物清单将根据……”等解释；右侧箭头进入已选菜单与全部材料详情，区分已有与缺失。
- 营养概览属于摘要详情里的次级信息，不抢购物主流程。没有份量、可靠成分数据和计算依据前，不应把固定文案作为营养分析结果。
- 主按钮文案固定为“生成购物清单”；未选菜时不可生成。

### 2.3 视觉规范与代码差异

用户最初确认温暖家庭厨房、轻量智能工具感：清晰、克制、真实菜图，避免强科技装饰与信息流。首页代码目前为暖白 `#FFFDF8` + 绿色 `#2F8F5B`，卡片圆角和轻阴影。

当前磁盘上的 `设计语言规范.md` 已是 **v2.0 温暖现代主义**：柿子红 `#D95D39`、燕麦乳 `#F6F4F0`、罗勒绿 `#3A5F43`，该文件保留不动。其具体色值、描边、字号与首页代码尚未同步。不要误认两者已一致，也不要自动覆盖这个较新的设计文档；继续视觉工作前确认最终用哪套 token。

历史示例图是聊天中的生成图片，未保存在项目目录，不属于此次 Git 交接资产。新设备可根据本节结构和现有代码继续，无须依赖旧机器的生成图路径。

## 3. 按模块列出的实际进度

| 模块 | 实际状态 | 关键文件 |
| --- | --- | --- |
| 首页 | 3 道 mock 候选，前 2 道默认选中；选择和换菜用局部 React state | `packages/miniprogram/src/pages/home/index.tsx` |
| 首页样式 | 暖白绿色版本，库存区、菜卡、摘要箭头、固定按钮 | `packages/miniprogram/src/pages/home/index.scss` |
| 食材汇总 | 按已选菜品合并 mock 食材，未连接库存数据库 | 首页 `mergeShoppingItems()` |
| 购物清单 | 从 Zustand `shoppingList` 读取，已有/待买分区，复制文本 | `src/pages/shopping/index.tsx` |
| 库存页 | API 请求与拍照流程雏形，非 mock 可用页 | `src/pages/pantry/index.tsx` |
| 周计划/菜谱/详情/我的/引导 | 占位页面 | `src/pages/weekly/`、`recipes/`、`profile/`、`onboarding/` |
| TabBar | 5 个纯文字入口，选中为绿色，无本地图标 | `src/app.config.ts` |
| API 客户端 | 开发指向 `localhost:3000/api`；生产仍是占位域名 | `src/services/api.ts` |
| 推荐 store 与旧卡片 | 仍保留旧锁定/API 逻辑；新首页未使用旧 `RecipeCard` | `src/store/menuStore.ts`、`src/components/RecipeCard/` |
| 后端 | 登录、家庭、推荐、菜谱、清单、库存路由草稿，未联调 | `packages/server/src/routes/` |
| 数据库 | 有 Prisma schema，无迁移目录、无种子实现 | `packages/server/prisma/schema.prisma` |
| AI/图片上传/买菜平台 | 未完成真实集成 | 库存 upload 路由、前端 `handleJump()` |

表中 `src/` 未注明包名的路径均指 `packages/miniprogram/src/`。

## 4. 已知问题：优先从这里继续

### 4.1 首页与清单

1. **清单跳转 API 用错。** 首页 `generateShoppingList()` 用 `Taro.navigateTo`，但购物页是 TabBar 页面，应使用 `Taro.switchTab`。构建不会发现此运行时问题。
2. **库存开关只改变 UI。** `usePantry` 仅决定是否展示库存 chips，不改变推荐、状态或缺口；mock 食材的 `isFromPantry` 写死。
3. **“更新”和“+12”不可操作。** 没有 click handler；库存只有 3 条，`+12` 也是硬编码。`.pantry-chips` 的 `overflow: hidden` 在窄屏可能截掉更多入口。
4. **换菜会重复。** 只在两个替换菜之间轮换，不排除已展示菜；多张卡可能出现相同 `id`，导致 React key 重复、选中与刷新同时改变多行。
5. **菜卡状态与食材数据矛盾。** 番茄炒蛋写“今日可做”，但小葱需买；家常烧豆腐也写“今日可做”，但青椒需买。默认已选两道时，摘要根据数据算出缺小葱和西兰花，共 2 种，并非示意图中的 1 种。
6. **库存数量不参与扣减。** 合并按名称作为 key，异单位同名食材可能互相覆盖；同单位相加后未重新判定库存是否够。应先汇总需求，再按统一单位比较库存、计算缺口。
7. **摘要只有原生 modal。** 当前只展示缺失食材文字和固定“蔬菜充足”文案，没有完整食材列表、营养计算或详情抽屉；零选择时也会显示“食材基本齐全”。
8. **已购清单无法恢复。** 购物页计算了 `checkedItems` 却未渲染，勾选项从待买列表消失后无法取消勾选。
9. **状态仅内存存储。** 页面局部选择与 Zustand 清单没有持久化，刷新或重新打开后丢失。
10. **图片尚未验收。** 首页用 Wikimedia Special:FilePath 与 Unsplash 外链，未下载、未验证可用性/菜品匹配、未记录授权。替换菜图片可能与菜名不符，小程序域名也未配置。
11. **移动端布局未验收。** 100vh 滚动区域、固定底部按钮、系统导航与 TabBar 可能冲突，窄屏菜名/元数据/换菜按钮需要截图检查。

### 4.2 后端与前后端契约

2026-10-12 执行 `npm.cmd run build:server`，失败的三类原因：

- `src/app.ts` 多处 TS1309：顶层 await，而包未声明 ESM；`tsconfig.json` 使用 NodeNext，当前被判为 CommonJS。
- `src/routes/pantry.ts:3` TS2305：`@ai-sdk/google` 未导出 `generateAIText`，此导入还是未实现 AI 流程的残留。
- `src/services/recommendation.ts:136` TS2339：`ScoredRecipe.recipe.ingredients` 的类型没有 `ingredientType`，多样性筛选却读取它。

构建修复后仍需验证运行时：Fastify 5 搭配当前 CORS 9/JWT 8/multipart 8 的兼容性；Zod 对象直接交给默认 Fastify schema 编译器是否可用；`.env` 没有显式加载。不要把修复 tsc 等同于 API 可用。

联调时还需处理：

- 前端家庭更新发送 PUT，后端注册 POST。
- 推荐接口返回 `ScoredRecipe[]`（实际菜在 `.recipe`），前端预期扁平 `Recipe[]`。
- 菜单确认 upsert 查询合成 ID，create 却使用默认 cuid；重复确认与替换菜单需验证。
- 服务端清单合并未校验单位，未扣除库存不足时的已有数量，返回结果未持久化到 `ShoppingList`。
- 库存 upload 返回空识别数组、占位 photoUrl；没有实际 Gemini/COS 调用，前端上传也未带 JWT。
- `db:seed` 指向不存在的 `src/prisma/seed.ts`，不要按旧 README 运行种子命令。
- 推荐库存计算、家庭过滤和鉴权尚无端到端验证结果。

## 5. 新设备恢复步骤

### 5.1 首页预览

本次验证版本：Node.js `24.13.0`、npm `11.6.2`、Git `2.47.1.windows.2`。新设备优先复现 Node/npm 版本，再用锁文件安装。

```powershell
git clone https://github.com/oneothebrave/what2cook.git
cd what2cook
npm.cmd ci
npm.cmd run dev:h5 --workspace=packages/miniprogram -- --port 5174
```

等待编译完成，访问 `http://localhost:5174`。macOS/Linux 使用 `npm` 替代 `npm.cmd`。首次 H5 预览不要求后端、数据库或真实密钥。

启动历史与注意事项：

- 旧机器 `Start-Process npm` 曾把 `npm.ps1` 当文本文档打开；用终端直接执行 `npm.cmd`。
- 曾缺 H5 `src/index.html`，浏览器只见目录页。该文件已补齐，必须一起迁移。
- Babel TSX preset 和微信/H5 平台插件已补齐，记录在包配置与 lockfile 中。
- `app.tsx` 仍调用 `initFamily()`，API 不存在时 store 捕获错误，可能在浏览器 Network 看到失败请求。
- 上次修复只确认了 HTML/JS 的 HTTP 200，没有浏览器视觉验收；本次也只重跑构建，不能声称已完成实际截图验收。
- 不依赖旧机器后台服务；新设备重新启动。端口占用时换端口并用终端给出的实际 URL。

### 5.2 微信构建

```powershell
npm.cmd run build:weapp --workspace=packages/miniprogram
```

或用 `npm.cmd run dev:mp` 持续编译。微信开发者工具导入 `packages/miniprogram/dist/`，配置新设备的本地 AppID/项目设置。

微信与 H5 共用 `dist/`，不能同时构建/监听；切换目标前停止旧 watch，然后重建目标。仓库没有 `project.config.json`，需在开发者工具中配置项目。

### 5.3 后端（后续任务）

先修第 4.2 节的构建与运行问题，再准备本地 PostgreSQL 与 `packages/server/.env`。不要将真实 `.env` 提交 Git。

```powershell
Copy-Item packages/server/.env.example packages/server/.env
npm.cmd run db:generate --workspace=packages/server
npm.cmd run build:server
```

迁移会改数据库，确认数据库后再执行 `npm.cmd run db:migrate`。当前无已提交迁移或种子数据，不能假设新设备会自动恢复数据。服务端没有显式加载 `.env`，运行前还需要选择并实现环境变量加载方式。

API 真实入口是 `packages/server/src/routes/`，数据库结构以 Prisma schema 为准。Redis、COS、营养报告、协同过滤、支付/CPS、部署和 CI 都没有完成。

## 6. 本次验证结果与边界

| 检查 | 2026-10-12 结果 |
| --- | --- |
| H5 build | 退出码 0，生成 `dist/index.html`，入口约 340 KiB，有体积警告 |
| 微信 build | 退出码 0 |
| server build | 退出码 1，错误见第 4.2 节 |
| 浏览器截图、交互验收 | 本次未执行 |
| 数据库迁移、微信登录、AI 识别 | 未执行 |
| 新设备 `npm ci` | 需在新设备执行；本次基于已有本地依赖验证 |

Taro 使用 Babel 转译 TSX，通过构建不代表完整 TypeScript 类型检查通过。前端没有独立 tsconfig/typecheck 或 lint/test 脚本，尚无自动化测试套件。

## 7. 下一轮建议顺序

1. 恢复 H5 预览，检查 375/390px 手机宽度、长菜名、库存溢出、底部按钮与 TabBar；验证图片显示。
2. 修复清单 TabBar 跳转，统一 mock 数据、库存缺口与状态文案；保证零选择反馈。
3. 为库存更新/+N 建立可操作的 mock 库存入口，把库存优先开关接入推荐。
4. 修复换菜去重；将 mock 数据与汇总逻辑拆到小模块，稳定后再写覆盖单位/库存缺口的测试。
5. 实现摘要详情：已选菜单、全部材料、缺失/已有分区；没有可靠营养数据时先不做分析结论。
6. 完善购物清单已购区域与状态保存；确认视觉规范 v2.0 是否要同步首页，再调整样式。
7. 修后端构建、插件兼容、schema、认证与接口契约，建立迁移/种子和联调流程。

## 8. 文档清理与迁移范围

已检查项目自有的全部文档（不包含依赖与构建目录中的第三方说明）。原有只有 README、产品设计文档、设计语言规范，以及服务端 `.env.example`。

- 删除 `产品设计文档.md`：旧锁定操作、重复 SQL/算法示例、未经验证的竞品表、上线时间表、模型费用及商业估算不再作为开发依据。有效目标和首页决策迁入本文件。
- 重写 `README.md`：作为简短启动入口，删除过时完成项和不可用种子命令。
- 保留 `设计语言规范.md` v2.0：当前设计资产；与代码的差异已说明。
- 保留 `.env.example`：占位配置，不包含真实业务密钥。
- 新增 `.gitignore` 与 `.gitattributes`：排除依赖、dist、缓存、日志、私有配置和真实环境变量，规范文本换行。

迁移只需 Git 中的源码、配置、锁文件与这三份 Markdown 文档。`node_modules/`、`dist/`、`.swc/` 与后台进程不随仓库迁移，安装和构建会重建。本次没有新增依赖或业务改动。
