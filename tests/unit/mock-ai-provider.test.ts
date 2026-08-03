import { describe, expect, it } from "vitest";

import { artifactAnalysisSchema } from "@/features/artifacts/artifact-schema";
import type { IdentifyInput } from "@/features/providers/ai-provider";
import { MockAIProvider } from "@/features/providers/mock-ai-provider";

const baseInput: IdentifyInput = {
  image: new Uint8Array([137, 80, 78, 71]),
  mediaType: "image/png",
  worldview: "一个用于离线演示的原创世界观，其中所有旧物都被档案官赋予新的文明含义。",
};

describe("MockAIProvider", () => {
  it.each(["power-bank", "brass-key", "thermos"])(
    "returns a valid deterministic %s demo without network access",
    async (demoId) => {
      const provider = new MockAIProvider();
      const input = { ...baseInput, demoId };

      const first = await provider.identify(input);
      const second = await provider.identify(input);

      expect(artifactAnalysisSchema.parse(first)).toEqual(second);
    },
  );
});
