import {
  SUPPORTED_IMAGE_TYPES,
  type SupportedImageType,
} from "@/features/providers/ai-provider";
import { MockAIProvider } from "@/features/providers/mock-ai-provider";
import {
  ArtifactResponseError,
  runIdentification,
} from "@/features/providers/run-identification";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function errorResponse(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status });
}

function isSupportedImageType(value: string): value is SupportedImageType {
  return SUPPORTED_IMAGE_TYPES.some((mediaType) => mediaType === value);
}

export async function POST(request: Request): Promise<Response> {
  const formData = await request.formData();
  const image = formData.get("image");
  const worldview = formData.get("worldview");
  const demoId = formData.get("demoId");

  if (!(image instanceof File)) {
    return errorResponse(400, "IMAGE_REQUIRED", "请选择一张需要鉴定的物品图片。");
  }

  if (!isSupportedImageType(image.type)) {
    return errorResponse(415, "UNSUPPORTED_IMAGE_TYPE", "仅支持 JPEG、PNG 或 WebP 图片。");
  }

  if (image.size > MAX_IMAGE_BYTES) {
    return errorResponse(413, "IMAGE_TOO_LARGE", "图片不能超过 8 MiB。");
  }

  if (typeof worldview !== "string" || worldview.trim().length < 20 || worldview.length > 1200) {
    return errorResponse(400, "INVALID_WORLDVIEW", "世界观需要填写 20 至 1200 个字符。");
  }

  try {
    const artifact = await runIdentification(new MockAIProvider(), {
      image: new Uint8Array(await image.arrayBuffer()),
      mediaType: image.type,
      worldview: worldview.trim(),
      demoId: typeof demoId === "string" ? demoId : undefined,
    });

    return Response.json({ artifact });
  } catch (error) {
    if (error instanceof ArtifactResponseError) {
      return errorResponse(502, "INVALID_AI_RESPONSE", error.message);
    }

    return errorResponse(502, "AI_UNAVAILABLE", "鉴定服务暂时不可用，请重试或载入预置档案。");
  }
}
