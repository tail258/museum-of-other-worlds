import { artifactAnalysisSchema, type ArtifactAnalysis } from "../artifacts/artifact-schema";
import type { AIProvider, IdentifyInput } from "./ai-provider";

export class ArtifactResponseError extends Error {
  constructor(message = "模型返回的数据无法用于生成遗物卡。") {
    super(message);
    this.name = "ArtifactResponseError";
  }
}

export async function runIdentification(
  provider: AIProvider,
  input: IdentifyInput,
): Promise<ArtifactAnalysis> {
  const firstResponse = await provider.identify(input);
  const firstResult = artifactAnalysisSchema.safeParse(firstResponse);

  if (firstResult.success) {
    return firstResult.data;
  }

  const repairedResponse = await provider.identify(input, {
    rawResponse: firstResponse,
    issues: firstResult.error.issues,
  });
  const repairedResult = artifactAnalysisSchema.safeParse(repairedResponse);

  if (repairedResult.success) {
    return repairedResult.data;
  }

  throw new ArtifactResponseError();
}
