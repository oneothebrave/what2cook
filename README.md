# 今晚吃什么

帮助家庭决定晚餐菜单，并从已选菜品生成购物清单。目前处于 **mock 首页原型阶段**，未完成后端联调或生产部署。

## 文档

- [HANDOFF.md](HANDOFF.md)：换设备接力必读，包含确认的首页设计、代码状态、已知问题和后续顺序。
- [设计语言规范.md](设计语言规范.md)：保留现有 v2.0 视觉规范。其柿子红方案与当前绿色首页存在差异，继续视觉工作前先确认。

旧的 `产品设计文档.md` 已移除；有效产品方向已收进交接文档，过时的锁定交互、重复架构示例、时间表与价格估算不再作为开发依据。

## 新设备启动

本次验证环境：Node.js `24.13.0`、npm `11.6.2`。首次在新设备启动时尽量使用相同版本。

```powershell
git clone https://github.com/oneothebrave/what2cook.git
cd what2cook
npm.cmd ci
npm.cmd run dev:h5 --workspace=packages/miniprogram -- --port 5174
```

等待终端显示编译完成，然后打开 [http://localhost:5174](http://localhost:5174)。在浏览器开发者工具中使用手机尺寸查看。

Windows PowerShell 使用 `npm.cmd` 可避免 `npm.ps1` 执行策略或文件关联问题；macOS/Linux 将 `npm.cmd` 换成 `npm`。

H5 入口是 `packages/miniprogram/src/index.html`。如果看到 `listing directory /`，检查该文件是否存在、终端实际端口以及是否打开了其他静态服务。

首页 mock 数据不要求数据库或 AI 密钥。App 启动仍会尝试获取家庭信息，此请求失败目前由 store 捕获；它不代表后端已联通。

## 构建与微信预览

```powershell
npm.cmd run build:h5 --workspace=packages/miniprogram
npm.cmd run build:weapp --workspace=packages/miniprogram
```

两个目标共用 `packages/miniprogram/dist/`，**逐个运行**，后一次构建会替换前一次产物。需要微信预览时最后构建微信版本，或运行：

```powershell
npm.cmd run dev:mp
```

微信开发者工具导入 `packages/miniprogram/dist/`；在新设备配置自己的测试 AppID/本地项目设置，不要提交私有配置。

## 目录

| 路径 | 当前用途 |
| --- | --- |
| `packages/miniprogram/src/pages/home/` | mock 首页、选择/换菜、清单汇总 |
| `packages/miniprogram/src/pages/shopping/` | 购物清单原型 |
| `packages/miniprogram/src/pages/pantry/` | 依赖 API 的库存页面雏形 |
| `packages/miniprogram/src/pages/weekly/`、`recipes/`、`profile/`、`onboarding/` | 占位页面 |
| `packages/miniprogram/src/store/`、`services/` | Zustand 状态与 API 客户端 |
| `packages/server/src/` | Fastify API 草稿，当前构建失败 |
| `packages/server/prisma/schema.prisma` | 实际数据库模型 |
| `packages/server/.env.example` | 服务端环境变量示例 |

## 验证状态

2026-10-12 重新执行的结果：

| 命令 | 结果 |
| --- | --- |
| `npm.cmd run build:h5 --workspace=packages/miniprogram` | 通过；入口资源约 340 KiB，有体积警告 |
| `npm.cmd run build:weapp --workspace=packages/miniprogram` | 通过 |
| `npm.cmd run build:server` | 失败；具体错误与下一步见 `HANDOFF.md` |

编译通过不等于界面、外链图片或跨页面交互验收通过。目前没有自动化测试、截图验收或数据库联调结果。
