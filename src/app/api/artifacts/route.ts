import { randomUUID } from "node:crypto";

import sharp from "sharp";

import { artifactAnalysisSchema } from "@/features/artifacts/artifact-schema";
import {
  artifactJsonKey,
  artifactSourceKey,
  artifactThemeSchema,
  publishedArtifactSchema,
} from "@/features/artifacts/published-artifact";
import { getObjectStorage } from "@/features/storage/storage-factory";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    const worldview = formData.get("worldview");
    const theme = formData.get("theme");
    const rawAnalysis = formData.get("analysis");

    if (!(image instanceof File) || typeof worldview !== "string" || typeof theme !== "string" || typeof rawAnalysis !== "string") {
      return errorResponse(400, "INVALID_ARTIFACT", "分享资料不完整。");
    }
    if (!IMAGE_TYPES.has(image.type)) {
      return errorResponse(415, "UNSUPPORTED_IMAGE_TYPE", "仅支持 JPEG、PNG 或 WebP 图片。");
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return errorResponse(413, "IMAGE_TOO_LARGE", "图片不能超过 8 MiB。");
    }

    let analysisJson: unknown;
    try {
      analysisJson = JSON.parse(rawAnalysis);
    } catch {
      return errorResponse(400, "INVALID_ARTIFACT", "遗物档案格式无效。");
    }
    const analysis = artifactAnalysisSchema.safeParse(analysisJson);
    const parsedTheme = artifactThemeSchema.safeParse(theme);
    if (!analysis.success || !parsedTheme.success || worldview.trim().length < 20 || worldview.trim().length > 1200) {
      return errorResponse(400, "INVALID_ARTIFACT", "遗物档案格式无效。");
    }

    const id = randomUUID();
    const artifact = publishedArtifactSchema.parse({
      version: 1,
      id,
      analysis: analysis.data,
      theme: parsedTheme.data,
      worldview: worldview.trim(),
      createdAt: new Date().toISOString(),
    });
    const source = await sharp(Buffer.from(await image.arrayBuffer()))
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const storage = getObjectStorage();
    await storage.put(artifactSourceKey(id), source, "image/webp");
    await storage.put(
      artifactJsonKey(id),
      new TextEncoder().encode(JSON.stringify(artifact)),
      "application/json",
    );

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(request.url).origin).replace(/\/$/, "");
    return Response.json({ id, url: `${baseUrl}/artifact/${id}` }, { status: 201 });
  } catch (caught) {
    console.error(
      "Artifact publish failed:",
      caught instanceof Error ? caught.message : "Unknown error",
    );
    return errorResponse(500, "PUBLISH_FAILED", "发布失败，请稍后重试。");
  }
}
