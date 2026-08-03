// @vitest-environment node

import { describe, expect, it } from "vitest";

import { MockAIProvider } from "@/features/providers/mock-ai-provider";
import { OpenAICompatibleProvider } from "@/features/providers/openai-compatible-provider";
import {
  createAIProvider,
  ProviderConfigurationError,
} from "@/features/providers/provider-factory";

describe("createAIProvider", () => {
  it("uses Mock mode when no provider is configured", () => {
    expect(createAIProvider({})).toBeInstanceOf(MockAIProvider);
  });

  it("creates the OpenAI-compatible adapter from environment values", () => {
    expect(
      createAIProvider({
        AI_PROVIDER: "openai-compatible",
        AI_BASE_URL: "https://model.example.test/v1",
        AI_API_KEY: "secret",
        AI_VISION_MODEL: "vision-model",
        AI_TEXT_MODEL: "text-model",
      }),
    ).toBeInstanceOf(OpenAICompatibleProvider);
  });

  it("names missing variables instead of creating a broken real provider", () => {
    expect(() => createAIProvider({ AI_PROVIDER: "openai-compatible" })).toThrow(
      /AI_BASE_URL, AI_API_KEY, AI_VISION_MODEL/,
    );
  });

  it("rejects unknown provider names", () => {
    expect(() => createAIProvider({ AI_PROVIDER: "vendor-sdk" })).toThrow(
      ProviderConfigurationError,
    );
  });
});
