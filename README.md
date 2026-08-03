# 异界遗物局 / Museum of Other Worlds

把现实物品照片解释为原创异世界遗物，并生成可换主题、可导出 PNG、可公开分享的游戏式档案卡。

项目为「外滩 AI 黑客松」准备，采用厂商中立的 Next.js 全栈单体架构。默认 Mock 模式无需 Token，克隆后即可完整演示。

## 已实现

- 图片上传、格式/大小校验与本地预览
- 自定义世界观与 IndexedDB 本地世界观库，最多 5 条
- OpenAI 风格视觉模型接口、Zod 结构校验与一次自动修复
- Mock Provider 与 3 个完全离线 Demo
- 黑暗幻想、复古科幻、废土档案 3 套即时切换主题
- 2× 分辨率 PNG 导出
- 用户主动发布后生成公开分享页
- 本地文件与通用 S3-compatible 两种存储适配器
- Vitest、Testing Library 与 Playwright E2E
- Windows 11、Docker 与多平台部署准备

## 5 分钟启动（Windows 11）

前置条件：Node.js 22 LTS、npm 10、Git。项目已在 Windows 11、Node `v22.22.3`、npm `10.9.8` 下验证。

```powershell
git clone <repository-url>
Set-Location museum-of-other-worlds
Copy-Item .env.example .env.local
npm ci
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。`.env.example` 默认 `AI_PROVIDER=mock`、`STORAGE_PROVIDER=local`，无需 API Key。

首次运行 Playwright：

```powershell
npx playwright install chromium
npm run test:e2e
```

## 常用命令

```powershell
npm run dev          # 本地开发
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm test             # 单元与组件测试
npm run test:coverage
npm run test:e2e     # Chromium 核心流程
npm run build        # 生产构建
npm run start        # 启动生产构建
```

## 核心页面

| 路径 | 用途 |
| --- | --- |
| `/` | 首页与 3 个离线 Demo |
| `/create` | 上传、鉴定、换主题、下载、发布 |
| `/worlds` | 当前浏览器的世界观库 |
| `/artifact/[id]` | 公开只读分享页 |

## 架构

```text
浏览器
├─ React 创建工作台
├─ Dexie / IndexedDB 世界观库
└─ html-to-image PNG 导出
          │
          ▼
Next.js Route Handlers
├─ AIProvider ── Mock / OpenAI-compatible HTTP
└─ ObjectStorage ── Local filesystem / S3-compatible
          │
          ▼
公开分享页 /artifact/[id]
```

业务组件不导入模型厂商 SDK；三套主题共享一个 `ArtifactAnalysis` 数据结构。普通鉴定只保存在当前浏览器，只有点击“发布分享”才上传源图与 JSON。

主要目录：

```text
src/app/                 页面与 Route Handlers
src/components/          遗物卡、创建台、Demo、世界观 UI
src/features/providers/  AI Provider 与重试编排
src/features/storage/    本地/S3 对象存储适配
src/features/worlds/     IndexedDB 与内存降级
tests/unit/              单元与接口测试
tests/components/        React 组件测试
tests/e2e/               Playwright 核心流程
public/demos/             第一方 SVG Demo 素材
```

## 使用真实模型

编辑 `.env.local`：

```dotenv
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://your-provider.example/v1
AI_API_KEY=replace-me
AI_VISION_MODEL=your-vision-model
AI_TEXT_MODEL=your-text-model
```

接口需兼容 `POST /chat/completions`，并支持图片 data URL 与 JSON 输出。详细契约、提示词边界和新增适配器方式见 [docs/PROVIDERS.md](docs/PROVIDERS.md)。密钥仅放在服务端环境变量中，不使用 `NEXT_PUBLIC_` 前缀。

## 公开分享存储

本地开发默认写入被 Git 忽略的 `.data/`：

```dotenv
STORAGE_PROVIDER=local
STORAGE_LOCAL_DIR=.data
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

公网部署应切换到 S3-compatible：

```dotenv
STORAGE_PROVIDER=s3
S3_ENDPOINT=https://your-s3-compatible-endpoint
S3_REGION=auto
S3_BUCKET=museum-artifacts
S3_ACCESS_KEY_ID=replace-me
S3_SECRET_ACCESS_KEY=replace-me
S3_FORCE_PATH_STYLE=false
NEXT_PUBLIC_APP_URL=https://museum.example.com
```

发布后保存：

```text
artifacts/{uuid}/source.webp
artifacts/{uuid}/artifact.json
```

详细部署步骤与平台限制见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。

## Mock 演示策略

- 首页的 3 个 Demo 完全由静态数据和第一方 SVG 驱动，不请求 `/api/identify`。
- 创建页在 `AI_PROVIDER=mock` 时仍走完整接口、校验、渲染、导出和发布流程。
- 比赛现场可先展示首页 Demo，再用创建页走 Mock 闭环；真实模型故障不会阻断演示。

## 常见问题

### IndexedDB 不可用

页面会自动切换到内存世界观库，并提示“世界观将在关闭页面后消失”。鉴定仍可使用。

### PNG 导出失败

先确认原图仍可显示，再重试。导出使用浏览器 DOM/Canvas；跨域图片若缺少 CORS 可能失败。本项目上传图使用 Blob URL，公开图使用同源 Route Handler。

### 发布后刷新找不到档案

本地模式只适合单机开发。无状态/多实例平台必须配置 `STORAGE_PROVIDER=s3`，并确认凭据具有 bucket 的读取和写入权限。

### Vercel 上较大图片返回 413

应用本身接受最大 8 MiB，但 Vercel Functions 当前文档给出的请求体限制更低。黑客松部署可把客户端限制调整到平台阈值，或改为预签名直传；也可选择支持 8 MiB 请求体的 Node 容器平台。

## 素材与许可

视觉纹理、边框和 3 个 Demo SVG 均为本项目第一方素材，不含第三方字体文件或 AI 生成图片。依赖许可见 [THIRD_PARTY_ASSETS.md](THIRD_PARTY_ASSETS.md)。

## Git 提交建议

当前功能按可回滚阶段拆分提交。继续开发时建议沿用 Conventional Commits：

```text
feat: add <user-visible capability>
fix: correct <specific defect>
test: cover <flow or boundary>
docs: document <provider or deployment target>
chore: update <tooling or dependency>
```

提交前至少运行：

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

发布前再运行 `npm run test:e2e`。不要提交 `.env.local`、`.data/`、测试截图、trace 或模型密钥。
