# Museum of Other Worlds MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployable, provider-neutral Next.js MVP that turns a real-object image and a user-authored worldview into a themed, downloadable, publishable artifact card.

**Architecture:** A Next.js App Router monolith owns UI, route handlers, and server-rendered share pages. Browser-only data uses Dexie; model and object storage access sit behind small provider interfaces with Mock/OpenAI-compatible and local/S3-compatible implementations. Shared Zod schemas are the boundary between routes, providers, persistence, rendering, export, and tests.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Zod, Dexie, Vitest, Testing Library, Playwright, html-to-image, Sharp, AWS SDK S3 client.

## Global Constraints

- Windows 11 local development must work through documented PowerShell commands.
- No user account, payment, social graph, collaboration, vector database, agent framework, AI image generation, or independent Python backend.
- No business module may import an AI-vendor SDK; real inference uses an OpenAI-compatible HTTP endpoint configured by environment variables.
- Normal generations and saved worldviews remain in the browser. Upload occurs only after the user explicitly chooses “发布分享”.
- Three themes consume one shared artifact structure, and theme switching must not trigger inference.
- Three built-in demos must run with no token and no external model call.
- Public publishing uses `StorageProvider`; local development writes files beneath `.data`, while production supports generic S3-compatible storage.
- External asset licenses must be recorded; first-party SVG and CSS textures should be preferred.
- User-supplied text is rendered as text only, never as HTML.

---

## Planned File Map

```text
src/
  app/
    api/identify/route.ts
    api/artifacts/route.ts
    api/artifacts/[id]/route.ts
    api/artifacts/[id]/source/route.ts
    artifact/[id]/page.tsx
    create/page.tsx
    worlds/page.tsx
    globals.css
    layout.tsx
    page.tsx
  components/
    artifact/artifact-card.tsx
    artifact/artifact-frame.tsx
    artifact/theme-picker.tsx
    create/create-workbench.tsx
    create/image-dropzone.tsx
    create/world-selector.tsx
    worlds/world-form.tsx
    worlds/world-list.tsx
  features/
    artifacts/artifact-schema.ts
    artifacts/artifact-types.ts
    artifacts/client-api.ts
    artifacts/export-card.ts
    demos/demo-data.ts
    providers/ai-provider.ts
    providers/mock-ai-provider.ts
    providers/openai-compatible-provider.ts
    providers/provider-factory.ts
    providers/run-identification.ts
    storage/local-storage-provider.ts
    storage/s3-storage-provider.ts
    storage/storage-provider.ts
    storage/storage-provider-factory.ts
    worlds/db.ts
    worlds/world-schema.ts
    worlds/world-store.ts
public/
  demos/power-bank.svg
  demos/brass-key.svg
  demos/thermos.svg
tests/
  setup.ts
  unit/*.test.ts
  components/*.test.tsx
  e2e/core-flow.spec.ts
```

## Task 1: Scaffold, Shared Schema, and Mock Identification Closure

**Files:**
- Create: `package.json`, Next.js configuration, Tailwind configuration, Vitest configuration, `tests/setup.ts`
- Create: `src/features/artifacts/artifact-schema.ts`
- Create: `src/features/providers/ai-provider.ts`
- Create: `src/features/providers/mock-ai-provider.ts`
- Create: `src/features/providers/run-identification.ts`
- Create: `src/app/api/identify/route.ts`
- Test: `tests/unit/artifact-schema.test.ts`
- Test: `tests/unit/run-identification.test.ts`
- Test: `tests/unit/identify-route.test.ts`

**Interfaces:**
- Produces: `ArtifactAnalysis`, `IdentifyInput`, `AIProvider.identify(input, repair?)`, `runIdentification(provider, input)`, and `POST /api/identify`.
- Consumes: no earlier task interfaces.

- [ ] **Step 1: Scaffold only framework and test configuration**

Run:

```powershell
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
npm install zod
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Configure `npm test`, `npm run test:watch`, and `npm run typecheck` scripts. This step creates framework/configuration files only; production behavior begins after a failing test.

- [ ] **Step 2: Write the failing artifact schema test**

```ts
import { describe, expect, it } from "vitest";
import { artifactAnalysisSchema } from "@/features/artifacts/artifact-schema";

describe("artifactAnalysisSchema", () => {
  it("accepts complete artifact data and rejects short descriptions", () => {
    const valid = {
      objectSummary: "一块带有接口与指示灯的黑色长方体",
      artifactName: "衰雷余烬匣",
      description: "王都祭司从陨神荒原拾回此匣，据说其腹中仍囚禁着尚未冷却的雷霆。匣侧微光并非刻度，而是神血衰败时逐层熄灭的征兆。旅人将细索接入圣器，便可借走片刻残存神力，却也会在梦中听见旧神呼吸。",
      appraiser: "灰冠档案官·弥珥",
      evidence: "矩形外壳被解释为封印匣，接口成为汲取神血的导管，指示灯成为神力衰减刻度。",
      worldName: "失雷王朝·赫尔萨",
    };
    expect(artifactAnalysisSchema.parse(valid)).toEqual(valid);
    expect(() => artifactAnalysisSchema.parse({ ...valid, description: "太短" })).toThrow();
  });
});
```

- [ ] **Step 3: Run the schema test and verify RED**

Run: `npm test -- tests/unit/artifact-schema.test.ts`

Expected: FAIL because `artifactAnalysisSchema` does not exist.

- [ ] **Step 4: Implement the schema and provider contracts**

```ts
export const artifactAnalysisSchema = z.object({
  objectSummary: z.string().min(4).max(200),
  artifactName: z.string().min(2).max(60),
  description: z.string().min(80).max(180),
  appraiser: z.string().min(2).max(80),
  evidence: z.string().min(20).max(240),
  worldName: z.string().min(2).max(80),
});
export type ArtifactAnalysis = z.infer<typeof artifactAnalysisSchema>;
```

Define `IdentifyInput` as `{ image: Uint8Array; mediaType: "image/jpeg" | "image/png" | "image/webp"; worldview: string; demoId?: string }`. Define `AIProvider.identify(input, repair?)` to return `Promise<unknown>` so the orchestration layer, not the provider, owns validation.

- [ ] **Step 5: Write and run a failing retry test**

```ts
it("repairs an invalid response once", async () => {
  const replies = [{ artifactName: "坏数据" }, validAnalysis];
  const provider: AIProvider = { identify: vi.fn(async () => replies.shift()) };
  await expect(runIdentification(provider, identifyInput)).resolves.toEqual(validAnalysis);
  expect(provider.identify).toHaveBeenCalledTimes(2);
  expect(provider.identify).toHaveBeenLastCalledWith(
    identifyInput,
    expect.objectContaining({ issues: expect.any(Array) }),
  );
});
```

Run: `npm test -- tests/unit/run-identification.test.ts`

Expected: FAIL because the orchestration module does not exist.

- [ ] **Step 6: Implement one repair attempt and stable Mock output**

`runIdentification` calls once, uses `artifactAnalysisSchema.safeParse`, then calls once more with `{ rawResponse, issues }`; it throws `ArtifactResponseError` after the second invalid result. `MockAIProvider` returns one of three deterministic demo analyses and never performs network I/O.

- [ ] **Step 7: Write and run the route test, then implement the route**

Test valid multipart form data and assert status `200`; test an unsupported MIME type and assert status `415`; test an image over 8 MiB and assert status `413`. Implement `POST` to read `image` and `worldview`, select the provider through a factory, and serialize `{ artifact }` or `{ error: { code, message } }`.

- [ ] **Step 8: Verify and commit Task 1**

Run: `npm test && npm run typecheck && npm run lint`

Expected: all commands pass.

```powershell
git add .
git commit -m "feat: establish mock artifact identification"
```

## Task 2: OpenAI-Compatible Provider and Environment Configuration

**Files:**
- Create: `src/features/providers/openai-compatible-provider.ts`
- Create: `src/features/providers/provider-factory.ts`
- Create: `.env.example`
- Modify: `src/app/api/identify/route.ts`
- Test: `tests/unit/openai-compatible-provider.test.ts`
- Test: `tests/unit/provider-factory.test.ts`

**Interfaces:**
- Consumes: `AIProvider`, `IdentifyInput`, `ArtifactAnalysis` from Task 1.
- Produces: `OpenAICompatibleProvider`, `createAIProvider(env)`, and documented AI environment keys.

- [ ] **Step 1: Write the failing HTTP-shape test**

Stub `global.fetch`, call the provider, and assert one `POST` to `${AI_BASE_URL}/chat/completions` with a text worldview, a `data:<mediaType>;base64,...` image URL, model `AI_VISION_MODEL`, and JSON response format.

- [ ] **Step 2: Run RED**

Run: `npm test -- tests/unit/openai-compatible-provider.test.ts`

Expected: FAIL because the provider does not exist.

- [ ] **Step 3: Implement raw-fetch provider**

Use constructor options `{ baseUrl, apiKey, visionModel, textModel }`. The first call uses the vision model and image. A repair call uses `textModel || visionModel`, excludes the image, and includes the original invalid JSON plus Zod issues. Parse fenced or unfenced JSON without `eval`; throw `AIUpstreamError` for non-2xx responses and malformed response envelopes.

- [ ] **Step 4: Write the failing provider factory test**

Assert `AI_PROVIDER=mock` returns `MockAIProvider`; assert `AI_PROVIDER=openai-compatible` requires base URL, key, and vision model; assert an unknown value throws a configuration error naming the accepted values.

- [ ] **Step 5: Implement factory and `.env.example`**

Document exactly:

```dotenv
AI_PROVIDER=mock
AI_BASE_URL=
AI_API_KEY=
AI_VISION_MODEL=
AI_TEXT_MODEL=
STORAGE_PROVIDER=local
STORAGE_LOCAL_DIR=.data
S3_ENDPOINT=
S3_REGION=auto
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_FORCE_PATH_STYLE=false
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 6: Verify and commit Task 2**

Run: `npm test && npm run typecheck && npm run lint`

```powershell
git add .env.example src/features/providers src/app/api/identify/route.ts tests/unit
git commit -m "feat: add provider-neutral vision adapter"
```

## Task 3: Creation Workbench and Artifact Card

**Files:**
- Create: `src/features/artifacts/artifact-types.ts`
- Create: `src/features/artifacts/client-api.ts`
- Create: `src/components/create/image-dropzone.tsx`
- Create: `src/components/create/create-workbench.tsx`
- Create: `src/components/artifact/artifact-card.tsx`
- Create: `src/app/create/page.tsx`
- Modify: `src/app/globals.css`
- Test: `tests/components/create-workbench.test.tsx`
- Test: `tests/components/artifact-card.test.tsx`

**Interfaces:**
- Consumes: `ArtifactAnalysis` and `POST /api/identify` from Task 1.
- Produces: `ArtifactDraft`, `identifyArtifact(formData)`, `CreateWorkbench`, and `ArtifactCard`.

- [ ] **Step 1: Write failing create-flow component test**

Render `CreateWorkbench` with an injected `identify` function. Upload a small PNG `File`, enter a worldview, click `开始鉴定`, and assert the returned artifact name and appraiser appear while the original preview remains visible.

- [ ] **Step 2: Run RED**

Run: `npm test -- tests/components/create-workbench.test.tsx`

Expected: FAIL because the workbench does not exist.

- [ ] **Step 3: Implement minimum create flow**

`ArtifactDraft` contains `{ analysis, theme, worldview, sourceUrl, sourceFile, createdAt }`. Validate client-side MIME and 8 MiB size before request. Keep file/worldview after server failure. Disable only the identify button while pending. Revoke replaced object URLs and revoke the final URL on unmount.

- [ ] **Step 4: Write failing semantic-card test**

Assert the card exposes an image alt derived from `objectSummary`, one level-two heading for `artifactName`, labeled sections for `遗物记述`, `鉴定者`, `解释依据`, and visible `worldName`.

- [ ] **Step 5: Implement shared card skeleton and responsive workbench**

Use a two-column desktop grid with a sticky preview and a single-column mobile flow. Render all user/model strings through React text nodes. Use one theme-neutral card DOM so export and share reuse the same component.

- [ ] **Step 6: Verify and commit Task 3**

Run: `npm test && npm run typecheck && npm run lint`

```powershell
git add src/app src/components src/features/artifacts tests/components
git commit -m "feat: build artifact creation workbench"
```

## Task 4: IndexedDB Worldview Library

**Files:**
- Create: `src/features/worlds/world-schema.ts`
- Create: `src/features/worlds/db.ts`
- Create: `src/features/worlds/world-store.ts`
- Create: `src/components/worlds/world-form.tsx`
- Create: `src/components/worlds/world-list.tsx`
- Create: `src/components/create/world-selector.tsx`
- Create: `src/app/worlds/page.tsx`
- Modify: `src/components/create/create-workbench.tsx`
- Test: `tests/unit/world-store.test.ts`
- Test: `tests/components/world-selector.test.tsx`

**Interfaces:**
- Consumes: the worldview string accepted by `CreateWorkbench`.
- Produces: `Worldview`, `WorldStore.list/save/remove`, `DexieWorldStore`, `MemoryWorldStore`, and `WorldSelector`.

- [ ] **Step 1: Install Dexie and write the failing limit test**

Run: `npm install dexie dexie-react-hooks fake-indexeddb`

Test that saving a sixth distinct world rejects with `WorldLimitError`, while updating one of five existing IDs succeeds.

- [ ] **Step 2: Run RED**

Run: `npm test -- tests/unit/world-store.test.ts`

Expected: FAIL because the store does not exist.

- [ ] **Step 3: Implement schemas and stores**

`Worldview` is `{ id, name, prompt, createdAt, updatedAt }`; name is 2–40 characters and prompt is 20–1200 characters. `DexieWorldStore.save` performs its count check and insert in one read-write transaction. `MemoryWorldStore` provides session fallback when IndexedDB cannot open.

- [ ] **Step 4: Write failing selection and fallback tests**

Assert selecting a saved world fills the create textarea; editing the textarea does not mutate the stored record; storage failure displays “世界观将在关闭页面后消失” and creation remains usable.

- [ ] **Step 5: Implement `/worlds` and selector integration**

Provide explicit create, edit, and delete controls. At five records, disable “保存为新世界观” and link to `/worlds`; never evict silently.

- [ ] **Step 6: Verify and commit Task 4**

Run: `npm test && npm run typecheck && npm run lint`

```powershell
git add src/features/worlds src/components/worlds src/components/create src/app/worlds tests
git commit -m "feat: add local worldview library"
```

## Task 5: Three Visual Themes, Home Page, and Offline Demos

**Files:**
- Create: `src/components/artifact/artifact-frame.tsx`
- Create: `src/components/artifact/theme-picker.tsx`
- Create: `src/features/demos/demo-data.ts`
- Create: `public/demos/power-bank.svg`
- Create: `public/demos/brass-key.svg`
- Create: `public/demos/thermos.svg`
- Modify: `src/components/artifact/artifact-card.tsx`
- Modify: `src/components/create/create-workbench.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Test: `tests/components/theme-switching.test.tsx`
- Test: `tests/components/demo-gallery.test.tsx`

**Interfaces:**
- Consumes: `ArtifactDraft`, `ArtifactCard`, and the shared analysis structure.
- Produces: `ArtifactTheme = "dark-fantasy" | "retro-sci-fi" | "wasteland-archive"`, `ThemePicker`, and `DEMO_ARTIFACTS`.

- [ ] **Step 1: Write failing no-refetch theme test**

Render a generated card with an injected identify spy, switch through all three themes, assert `data-theme` changes, all artifact text remains unchanged, and the identify spy call count stays at zero after initial render.

- [ ] **Step 2: Run RED**

Run: `npm test -- tests/components/theme-switching.test.tsx`

Expected: FAIL because theme components do not exist.

- [ ] **Step 3: Implement token-driven themes**

Use CSS custom properties scoped by `[data-theme]` for surface, ink, accent, border, image filter, texture opacity, and seal treatment. Keep one DOM skeleton. Build texture layers from CSS gradients and first-party inline SVG; use no generated or externally downloaded artwork.

- [ ] **Step 4: Write failing offline Demo test**

Render the home gallery, choose each Demo, and assert its card is displayed without calling `fetch`. Assert each Demo has a unique theme, source SVG, world name, and complete valid `ArtifactAnalysis`.

- [ ] **Step 5: Implement Demo assets and result-first home page**

Create first-party SVG still lifes for a power bank, brass key, and thermos. The homepage Hero presents one live card, three Demo selectors, concise product explanation, and a `开始鉴定` link to `/create`.

- [ ] **Step 6: Add the single signature motion**

On result replacement, add a one-shot scan-line animation over the photo and staged text reveal. Under `@media (prefers-reduced-motion: reduce)`, remove transform, scan, and reveal animations while preserving content.

- [ ] **Step 7: Verify and commit Task 5**

Run: `npm test && npm run typecheck && npm run lint`

```powershell
git add public/demos src/app src/components src/features/demos tests/components
git commit -m "feat: add artifact themes and offline demos"
```

## Task 6: PNG Export

**Files:**
- Create: `src/features/artifacts/export-card.ts`
- Modify: `src/components/create/create-workbench.tsx`
- Modify: `src/components/artifact/artifact-card.tsx`
- Test: `tests/unit/export-card.test.ts`
- Test: `tests/components/export-action.test.tsx`

**Interfaces:**
- Consumes: the theme-neutral artifact card DOM from Task 3 and themed CSS from Task 5.
- Produces: `exportArtifactCard(node, filename)` and a visible `下载 PNG` action.

- [ ] **Step 1: Install and write the failing export test**

Run: `npm install html-to-image`

Mock `toPng`, call `exportArtifactCard`, and assert options include `pixelRatio: 2`, `cacheBust: true`, a solid theme-derived background, and a filename sanitized to end in `.png`.

- [ ] **Step 2: Run RED**

Run: `npm test -- tests/unit/export-card.test.ts`

Expected: FAIL because export logic does not exist.

- [ ] **Step 3: Implement lazy export**

Dynamically import `html-to-image` only after the user clicks. Await `document.fonts.ready`, render the exact card node, trigger one temporary download anchor, and remove it. Keep the artifact visible and return a typed error if canvas security or memory limits block export.

- [ ] **Step 4: Add and test export UI states**

Assert the button is disabled before generation, says `正在制作 PNG…` during export, returns to `下载 PNG` afterward, and shows a retryable inline message on rejection.

- [ ] **Step 5: Verify and commit Task 6**

Run: `npm test && npm run typecheck && npm run lint`

```powershell
git add src/features/artifacts src/components tests
git commit -m "feat: export artifact cards as PNG"
```

## Task 7: Provider-Neutral Public Sharing

**Files:**
- Create: `src/features/storage/storage-provider.ts`
- Create: `src/features/storage/local-storage-provider.ts`
- Create: `src/features/storage/s3-storage-provider.ts`
- Create: `src/features/storage/storage-provider-factory.ts`
- Create: `src/app/api/artifacts/route.ts`
- Create: `src/app/api/artifacts/[id]/route.ts`
- Create: `src/app/api/artifacts/[id]/source/route.ts`
- Create: `src/app/artifact/[id]/page.tsx`
- Modify: `src/components/create/create-workbench.tsx`
- Modify: `.gitignore`
- Test: `tests/unit/storage-provider.test.ts`
- Test: `tests/unit/publish-route.test.ts`
- Test: `tests/components/share-page.test.tsx`

**Interfaces:**
- Consumes: `ArtifactAnalysis`, `ArtifactTheme`, source image file, and configured environment.
- Produces: `StorageProvider.put/get`, `PublishedArtifact`, publish/read/source routes, and `/artifact/[id]`.

- [ ] **Step 1: Install server dependencies and write failing local-storage test**

Run: `npm install sharp @aws-sdk/client-s3`

Test `put` then `get` inside a test temporary directory, assert bytes/content type round-trip, and assert path traversal such as `../secret` is rejected.

- [ ] **Step 2: Run RED**

Run: `npm test -- tests/unit/storage-provider.test.ts`

Expected: FAIL because the storage interface and local implementation do not exist.

- [ ] **Step 3: Implement storage boundary**

```ts
interface StorageProvider {
  put(path: string, body: Uint8Array, contentType: string): Promise<void>;
  get(path: string): Promise<{ body: Uint8Array; contentType: string } | null>;
}
```

The local provider resolves and verifies every path beneath `STORAGE_LOCAL_DIR`. The S3 provider uses `PutObjectCommand` and `GetObjectCommand`, supports custom endpoint/path style, and never appears outside the storage feature directory. Add `.data/` to `.gitignore`.

- [ ] **Step 4: Write failing publish-route test**

Post multipart `image`, `analysis`, `theme`, and `worldview`; assert Sharp receives the source and produces WebP, storage receives `artifacts/{uuid}/source.webp` and `artifacts/{uuid}/artifact.json`, and the response is `{ id, url: "/artifact/{uuid}" }`. Assert invalid analysis and MIME types are rejected before storage writes.

- [ ] **Step 5: Implement publish and read routes**

Use `crypto.randomUUID()`. Resize only when width exceeds 1600 px, auto-rotate from EXIF, strip metadata, and encode WebP at quality 82. Store a `PublishedArtifact` with schema version, analysis, theme, worldview, image path, and publish timestamp. Provide JSON and image routes with cache headers; return 404 for absent objects.

- [ ] **Step 6: Write failing share-page test and implement page**

Assert a valid ID renders the same `ArtifactCard` and no editing controls; assert a missing ID calls `notFound()`. Generate metadata from artifact name and world name without trusting arbitrary HTML.

- [ ] **Step 7: Add publish UI states**

The action reads `发布分享`, requires explicit click, shows progress, copies the returned absolute URL when clipboard is available, and leaves the local draft untouched if upload fails.

- [ ] **Step 8: Verify and commit Task 7**

Run: `npm test && npm run typecheck && npm run lint && npm run build`

```powershell
git add .
git commit -m "feat: publish artifacts through pluggable storage"
```

## Task 8: End-to-End Safety Net, Accessibility, and Delivery Documentation

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/core-flow.spec.ts`
- Create: `README.md`
- Create: `docs/PROVIDERS.md`
- Create: `docs/DEPLOYMENT.md`
- Create: `THIRD_PARTY_ASSETS.md`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `package.json`

**Interfaces:**
- Consumes: all user-visible flows and provider configuration from Tasks 1–7.
- Produces: reproducible Windows setup, deployment guidance, provider extension contract, license inventory, and browser-level regression coverage.

- [ ] **Step 1: Install Playwright and write the failing core-flow test**

Run:

```powershell
npm install -D @playwright/test
npx playwright install chromium
```

The test starts in Mock mode, opens `/`, loads the power-bank Demo, goes to `/create`, uploads `public/demos/power-bank.svg` only if SVG is accepted by the fixture helper after conversion to PNG, enters a worldview, generates, switches theme, verifies the download and publish actions, publishes, and opens the returned share URL.

- [ ] **Step 2: Run RED and fix only product gaps exposed by the flow**

Run: `npm run test:e2e`

Expected first run: FAIL at the first missing wiring or selector. Add stable accessible names and minimal integration fixes until the complete flow passes.

- [ ] **Step 3: Audit keyboard and reduced-motion behavior**

Add component assertions for visible focus, label association, button disabled states, and error announcements with `role="alert"`. Use `page.emulateMedia({ reducedMotion: "reduce" })` and assert the scan overlay has no animation.

- [ ] **Step 4: Write delivery documentation**

`README.md` includes prerequisites (Node 22 LTS or compatible active LTS), PowerShell install/start/test/build commands, Mock-first quick start, routes, architecture, and troubleshooting. `docs/PROVIDERS.md` documents the exact AI and storage interfaces and how to add an adapter. `docs/DEPLOYMENT.md` gives vendor-neutral Node deployment requirements plus concrete Vercel, Cloudflare-compatible Node runtime, and generic container/S3 notes without making one mandatory. `THIRD_PARTY_ASSETS.md` states that current visual assets are first-party SVG/CSS and lists every package/resource license that requires attribution.

- [ ] **Step 5: Add scripts and run the final verification matrix**

Required scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:coverage`, `test:e2e`.

Run:

```powershell
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
npm run test:e2e
```

Expected: all commands exit with code 0; coverage output names every tested domain module; production build lists `/`, `/create`, `/worlds`, `/artifact/[id]`, and API routes.

- [ ] **Step 6: Create a Windows smoke-test record and commit**

Record tested Node/npm versions and commands in README. Do not claim a public URL until a deployment target and credentials are supplied.

```powershell
git add .
git commit -m "docs: prepare hackathon delivery"
```

## Plan Self-Review Result

- Spec coverage: all required MVP features map to Tasks 1–8; excluded features have no implementation task.
- Placeholder scan: no incomplete implementation markers remain.
- Type consistency: `ArtifactAnalysis`, `ArtifactDraft`, `ArtifactTheme`, `AIProvider`, and `StorageProvider` names are used consistently across producer and consumer tasks.
- Scope: each task ends with an independently testable user or platform capability and a dedicated commit.
