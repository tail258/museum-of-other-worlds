// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  identifyArtifact,
  IdentifyRequestError,
  publishArtifact,
} from "@/features/artifacts/client-api";

const analysis = {
  objectSummary: "一块带有接口与指示灯的黑色长方体",
  artifactName: "衰雷余烬匣",
  description:
    "王都祭司从陨神荒原拾回此匣，据说其腹中仍囚禁着尚未冷却的雷霆。匣侧微光并非刻度，而是神血衰败时逐层熄灭的征兆。旅人将细索接入圣器，便可借走片刻残存神力，却也会在梦中听见旧神呼吸。",
  appraiser: "灰冠档案官·弥珥",
  evidence: "矩形外壳被解释为封印匣，接口成为汲取神血的导管，指示灯成为神力衰减刻度。",
  worldName: "失雷王朝·赫尔萨",
};

afterEach(() => vi.unstubAllGlobals());

describe("identifyArtifact", () => {
  it("posts the selected file and worldview as multipart data", async () => {
    const fetchSpy = vi.fn<typeof fetch>(async () => Response.json({ artifact: analysis }));
    vi.stubGlobal("fetch", fetchSpy);
    const image = new File([new Uint8Array([137, 80, 78, 71])], "item.png", { type: "image/png" });

    await expect(identifyArtifact({ image, worldview: "原创世界观内容不少于二十个字符，用于鉴定测试。" })).resolves.toEqual(analysis);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/identify");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBeInstanceOf(FormData);
    expect((init?.body as FormData).get("image")).toBe(image);
  });

  it("turns API error payloads into retryable client errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () =>
        Response.json(
          { error: { code: "AI_UNAVAILABLE", message: "鉴定服务暂时不可用" } },
          { status: 502 },
        ),
      ),
    );

    const request = identifyArtifact({
      image: new File(["image"], "item.webp", { type: "image/webp" }),
      worldview: "原创世界观内容不少于二十个字符，用于错误测试。",
    });

    await expect(request).rejects.toBeInstanceOf(IdentifyRequestError);
    await expect(request).rejects.toMatchObject({
      name: "IdentifyRequestError",
      code: "AI_UNAVAILABLE",
      message: "鉴定服务暂时不可用",
    });
  });
});

describe("publishArtifact", () => {
  it("uploads the source and record only when explicitly called", async () => {
    const fetchSpy = vi.fn<typeof fetch>(async () => Response.json(
      { id: "f5072b90-b778-4e5a-9ff8-35af461dc27a", url: "https://museum.example/artifact/f5072b90-b778-4e5a-9ff8-35af461dc27a" },
      { status: 201 },
    ));
    vi.stubGlobal("fetch", fetchSpy);
    const image = new File(["image"], "item.webp", { type: "image/webp" });

    await expect(publishArtifact({
      analysis,
      theme: "retro-sci-fi",
      worldview: "旧海退去之后，港城的门不再通往房间，而通往被潮汐遗忘的年份。",
      sourceFile: image,
    })).resolves.toMatchObject({ url: expect.stringContaining("/artifact/") });

    const [url, init] = fetchSpy.mock.calls[0];
    const body = init?.body as FormData;
    expect(url).toBe("/api/artifacts");
    expect(init?.method).toBe("POST");
    expect(body.get("image")).toBe(image);
    expect(body.get("theme")).toBe("retro-sci-fi");
    expect(JSON.parse(String(body.get("analysis")))).toMatchObject({ artifactName: "衰雷余烬匣" });
  });
});
