import { describe, expect, it } from "vitest";

import { artifactAnalysisSchema } from "@/features/artifacts/artifact-schema";

const validAnalysis = {
  objectSummary: "一块带有接口与指示灯的黑色长方体",
  artifactName: "衰雷余烬匣",
  description:
    "王都祭司从陨神荒原拾回此匣，据说其腹中仍囚禁着尚未冷却的雷霆。匣侧微光并非刻度，而是神血衰败时逐层熄灭的征兆。旅人将细索接入圣器，便可借走片刻残存神力，却也会在梦中听见旧神呼吸。",
  appraiser: "灰冠档案官·弥珥",
  evidence: "矩形外壳被解释为封印匣，接口成为汲取神血的导管，指示灯成为神力衰减刻度。",
  worldName: "失雷王朝·赫尔萨",
};

describe("artifactAnalysisSchema", () => {
  it("accepts a complete artifact analysis", () => {
    expect(artifactAnalysisSchema.parse(validAnalysis)).toEqual(validAnalysis);
  });

  it("rejects descriptions shorter than the artifact-card contract", () => {
    expect(() =>
      artifactAnalysisSchema.parse({ ...validAnalysis, description: "太短" }),
    ).toThrow();
  });
});
