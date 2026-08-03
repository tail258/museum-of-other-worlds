# 公网部署说明

项目要求 Node.js 运行时，因为发布接口使用 Sharp，存储实现使用 Node 文件系统或 AWS SDK。生产环境必须把 `NEXT_PUBLIC_APP_URL` 设置为最终 HTTPS 域名。

## 上线前检查

```powershell
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

至少配置：

```dotenv
AI_PROVIDER=mock
STORAGE_PROVIDER=s3
S3_ENDPOINT=...
S3_REGION=...
S3_BUCKET=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_FORCE_PATH_STYLE=false
NEXT_PUBLIC_APP_URL=https://your-domain.example
```

比赛可先用 `AI_PROVIDER=mock` 部署，确认完整公开流程后再切真实视觉模型。

## 方案 A：Vercel

1. 将仓库导入 Vercel，Framework Preset 选择 Next.js。
2. 在 Project Settings → Environment Variables 配置 `.env.example` 中所需键；密钥不要使用 `NEXT_PUBLIC_` 前缀。
3. 必须使用 `STORAGE_PROVIDER=s3`。Vercel 官方建议写入数据使用对象存储，不能把 `.data` 当作持久卷。
4. 部署后把 `NEXT_PUBLIC_APP_URL` 更新为生产域名并重新部署。
5. 依次检查 `/`、`/create`、一次发布和返回的 `/artifact/{id}`。

注意：Vercel Functions 官方当前说明普通函数请求体有 4.5 MB 限制，而应用本地校验上限为 8 MiB。若保留 Vercel，需要把前端/接口上限同步降低到安全值，或后续增加 S3 预签名直传。参考：[Vercel 文件写入建议](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions)、[Vercel 请求体限制](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions)、[环境变量文档](https://vercel.com/docs/environment-variables)。

## 方案 B：Node 容器平台

仓库包含多阶段 `Dockerfile`，使用 Next.js standalone 输出：

```powershell
docker build -t museum-of-other-worlds .
docker run --rm -p 3000:3000 --env-file .env.local museum-of-other-worlds
```

适用于支持 OCI 容器的平台，例如通用云容器服务、Kubernetes 或带持久卷的虚拟机。

- 推荐仍使用 S3-compatible 存储，便于扩容和滚动部署。
- 若使用 `STORAGE_PROVIDER=local`，必须把 `/app/.data` 挂载到持久卷，并保证只有一个共享一致的写入视图。
- 反向代理需允许所选的上传大小，并把外部 HTTPS 域名写入 `NEXT_PUBLIC_APP_URL`。

## 方案 C：Cloudflare Workers

Cloudflare 官方通过 OpenNext adapter 支持 Next.js App Router、Route Handlers 与 SSR，并要求按需启用 `nodejs_compat`。参考：[Cloudflare Next.js 指南](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) 与 [Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)。

当前仓库不能零改动部署到 Workers：发布路由依赖原生 Sharp，Cloudflare 的 Node 兼容层不等同于完整原生 Node ABI。选择此路线时需先完成一次平台适配：

1. 用浏览器端压缩、Cloudflare Images 或 Workers 支持的 WASM 图像方案替换 Sharp。
2. 新增 R2 `ObjectStorage` 适配器，或验证 R2 S3 endpoint 与 AWS SDK bundle/runtime 的兼容性。
3. 按 OpenNext 官方流程增加 Wrangler 配置和构建命令。
4. 在 Workers 限制下重新跑上传、发布和分享 E2E。

## S3-compatible 权限

运行凭据只需目标 bucket/prefix 的对象读取与写入权限。实现基于 AWS SDK for JavaScript v3 的 `S3Client`、`PutObjectCommand` 与 `GetObjectCommand`；官方示例见 [AWS S3 JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html)。

建议：

- bucket 保持私有，由本站同源 Route Handler 读取。
- endpoint 使用 HTTPS。
- 定期设置生命周期规则清理比赛测试作品。
- 对 API Key 与 S3 Secret 使用平台 Secret 管理，不写入镜像和 Git。

## 部署验收清单

- [ ] 首页 3 个 Demo 在断开模型 API 时可用
- [ ] 创建页能上传一张实际照片并完成鉴定
- [ ] 三套主题切换不产生第二次模型请求
- [ ] PNG 下载成功且包含原图和完整文字
- [ ] 点击发布后对象存储出现 `source.webp` 与 `artifact.json`
- [ ] 公开 URL 在无登录浏览器中可访问
- [ ] 错误日志不包含模型或存储密钥
- [ ] 移动端无横向滚动
- [ ] 最终域名与 `NEXT_PUBLIC_APP_URL` 一致

本仓库只完成部署准备，没有绑定或自动操作任何云账号；获得目标平台和凭据后再执行实际发布。
