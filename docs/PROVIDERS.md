# Provider 接入说明

## AI Provider 边界

业务层只依赖：

```ts
interface AIProvider {
  identify(input: IdentifyInput, repair?: RepairContext): Promise<unknown>;
}
```

`IdentifyInput` 包含图片字节、受支持的 MIME 类型、世界观和可选 Demo ID。Provider 返回 `unknown`，由 `runIdentification` 统一执行 `artifactAnalysisSchema` 校验。首次无效时只修复一次；第二次无效即返回可重试错误。

最终结构：

```ts
type ArtifactAnalysis = {
  objectSummary: string;
  artifactName: string;
  description: string; // 80–180 字
  appraiser: string;
  evidence: string;
  worldName: string;
};
```

### Mock Provider

```dotenv
AI_PROVIDER=mock
```

不访问网络，稳定返回 3 份预置鉴定。适用于开发、自动化测试和比赛兜底。

### OpenAI-compatible Provider

```dotenv
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://provider.example/v1
AI_API_KEY=replace-me
AI_VISION_MODEL=vision-model-id
AI_TEXT_MODEL=text-model-id
```

实现使用原生 `fetch` 请求 `${AI_BASE_URL}/chat/completions`：

- 首次请求使用视觉模型、世界观文本和 `data:{mime};base64,...` 图片。
- 请求 `json_object` 响应格式。
- 修复请求不再次发送图片，使用 `AI_TEXT_MODEL`；未设置时回退到视觉模型。
- 非 2xx、无效响应信封、围栏 JSON 和结构校验错误都转换为稳定的领域错误。
- 日志和客户端错误不包含 API Key。

若目标服务的字段与 OpenAI 风格不同，请新增适配器，不要把厂商条件分支写进页面或 Route Handler。

### 新增 AI 适配器

1. 在 `src/features/providers/` 新建实现并满足 `AIProvider`。
2. 在 `provider-factory.ts` 增加一个明确的 `AI_PROVIDER` 值与配置校验。
3. 为请求形状、错误清洗、首次请求和修复请求补单元测试。
4. 不在适配器内绕过共享 Zod Schema，也不在浏览器暴露密钥。

## 对象存储边界

```ts
interface ObjectStorage {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<{ body: Uint8Array; contentType: string } | null>;
}
```

当前实现：

- `LocalObjectStorage`：开发环境写入 `STORAGE_LOCAL_DIR`，拒绝 `..` 和目录逃逸。
- `S3ObjectStorage`：AWS SDK v3 的 `PutObjectCommand` / `GetObjectCommand`，可配置 endpoint、region 和 path style。

### 新增存储适配器

1. 实现 `ObjectStorage`，对象不存在时 `get` 返回 `null`。
2. 保留 key：`artifacts/{uuid}/source.webp` 与 `artifacts/{uuid}/artifact.json`。
3. 在 `storage-factory.ts` 注册新的 `STORAGE_PROVIDER` 值。
4. 增加字节往返、不存在对象、路径安全和配置缺失测试。

发布 Route Handler 负责校验、EXIF 自动旋转、最大宽度 1600、WebP 质量 82 与元数据清除；存储适配器不应重复图片业务逻辑。

## 安全边界

- 所有模型与存储密钥仅存在于服务端环境变量。
- 用户和模型文本通过 React 文本节点渲染，不执行 HTML。
- 图片在发布前重新编码，拒绝 SVG 与未知 MIME。
- 普通鉴定和本地世界观不会上传；只有显式“发布分享”才写对象存储。
