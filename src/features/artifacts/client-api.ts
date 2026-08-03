import { artifactAnalysisSchema, type ArtifactAnalysis } from "./artifact-schema";
import type { IdentifyClientInput } from "./artifact-types";

export class IdentifyRequestError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "IdentifyRequestError";
  }
}

export async function identifyArtifact(input: IdentifyClientInput): Promise<ArtifactAnalysis> {
  const formData = new FormData();
  formData.set("image", input.image);
  formData.set("worldview", input.worldview);
  if (input.demoId) {
    formData.set("demoId", input.demoId);
  }

  const response = await fetch("/api/identify", {
    method: "POST",
    body: formData,
  });
  const payload = (await response.json()) as {
    artifact?: unknown;
    error?: { code?: string; message?: string };
  };

  if (!response.ok) {
    throw new IdentifyRequestError(
      payload.error?.code ?? "IDENTIFY_FAILED",
      payload.error?.message ?? "鉴定失败，请稍后重试。",
      response.status,
    );
  }

  const result = artifactAnalysisSchema.safeParse(payload.artifact);
  if (!result.success) {
    throw new IdentifyRequestError("INVALID_SERVER_RESPONSE", "鉴定结果格式异常，请重新鉴定。");
  }

  return result.data;
}
