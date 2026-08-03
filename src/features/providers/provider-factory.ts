import type { AIProvider } from "./ai-provider";
import { MockAIProvider } from "./mock-ai-provider";
import { OpenAICompatibleProvider } from "./openai-compatible-provider";

export type AIProviderEnvironment = Record<string, string | undefined>;

export class ProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigurationError";
  }
}

export function createAIProvider(env: AIProviderEnvironment = process.env): AIProvider {
  const providerName = env.AI_PROVIDER?.trim() || "mock";

  if (providerName === "mock") {
    return new MockAIProvider();
  }

  if (providerName === "openai-compatible") {
    const requiredKeys = ["AI_BASE_URL", "AI_API_KEY", "AI_VISION_MODEL"] as const;
    const missingKeys = requiredKeys.filter((key) => !env[key]?.trim());

    if (missingKeys.length > 0) {
      throw new ProviderConfigurationError(`缺少模型环境变量：${missingKeys.join(", ")}`);
    }

    return new OpenAICompatibleProvider({
      baseUrl: env.AI_BASE_URL!,
      apiKey: env.AI_API_KEY!,
      visionModel: env.AI_VISION_MODEL!,
      textModel: env.AI_TEXT_MODEL?.trim() || undefined,
    });
  }

  throw new ProviderConfigurationError(
    `不支持 AI_PROVIDER=${providerName}；可选值为 mock 或 openai-compatible。`,
  );
}
