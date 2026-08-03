import { describe, expect, it } from "vitest";

import type {
  AIProvider,
  IdentifyInput,
  RepairContext,
} from "@/features/providers/ai-provider";
import {
  ArtifactResponseError,
  runIdentification,
} from "@/features/providers/run-identification";

const identifyInput: IdentifyInput = {
  image: new Uint8Array([137, 80, 78, 71]),
  mediaType: "image/png",
  worldview: "诸神陨落后，雷霆被视为神血的衰败王国。祭司负责回收仍带电的旧时代器物。",
};

const validAnalysis = {
  objectSummary: "一块带有接口与指示灯的黑色长方体",
  artifactName: "衰雷余烬匣",
  description:
    "王都祭司从陨神荒原拾回此匣，据说其腹中仍囚禁着尚未冷却的雷霆。匣侧微光并非刻度，而是神血衰败时逐层熄灭的征兆。旅人将细索接入圣器，便可借走片刻残存神力，却也会在梦中听见旧神呼吸。",
  appraiser: "灰冠档案官·弥珥",
  evidence: "矩形外壳被解释为封印匣，接口成为汲取神血的导管，指示灯成为神力衰减刻度。",
  worldName: "失雷王朝·赫尔萨",
};

class RecordingProvider implements AIProvider {
  readonly repairs: Array<RepairContext | undefined> = [];

  constructor(private readonly replies: unknown[]) {}

  async identify(_input: IdentifyInput, repair?: RepairContext): Promise<unknown> {
    this.repairs.push(repair);
    return this.replies.shift();
  }
}

describe("runIdentification", () => {
  it("repairs one invalid response and returns the valid artifact", async () => {
    const provider = new RecordingProvider([{ artifactName: "坏数据" }, validAnalysis]);

    await expect(runIdentification(provider, identifyInput)).resolves.toEqual(validAnalysis);
    expect(provider.repairs).toHaveLength(2);
    expect(provider.repairs[0]).toBeUndefined();
    expect(provider.repairs[1]).toEqual(
      expect.objectContaining({
        rawResponse: { artifactName: "坏数据" },
        issues: expect.arrayContaining([expect.objectContaining({ path: expect.any(Array) })]),
      }),
    );
  });

  it("stops after the single repair attempt", async () => {
    const provider = new RecordingProvider([{ artifactName: "坏数据" }, { worldName: "仍然坏" }]);

    await expect(runIdentification(provider, identifyInput)).rejects.toBeInstanceOf(
      ArtifactResponseError,
    );
    expect(provider.repairs).toHaveLength(2);
  });
});
