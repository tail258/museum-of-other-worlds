// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

import type { IdentifyInput } from "@/features/providers/ai-provider";
import {
  AIUpstreamError,
  OpenAICompatibleProvider,
} from "@/features/providers/openai-compatible-provider";

const input: IdentifyInput = {
  image: new Uint8Array([137, 80, 78, 71]),
  mediaType: "image/png",
  worldview: "诸神陨落后，雷霆被视为神血。灰冠祭司负责回收仍带电的旧时代器物并登记其危险等级。",
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

function provider() {
  return new OpenAICompatibleProvider({
    baseUrl: "https://model.example.test/v1/",
    apiKey: "secret-token",
    visionModel: "vision-model",
    textModel: "repair-model",
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OpenAICompatibleProvider", () => {
  it("sends image and worldview to the compatible chat endpoint", async () => {
    const fetchSpy = vi.fn<typeof fetch>(async () =>
      Response.json({
        id: "chatcmpl-test",
        object: "chat.completion",
        created: 1,
        model: "vision-model",
        choices: [
          {
            index: 0,
            finish_reason: "stop",
            message: { role: "assistant", content: `\`\`\`json\n${JSON.stringify(validAnalysis)}\n\`\`\`` },
          },
        ],
        usage: { prompt_tokens: 20, completion_tokens: 80, total_tokens: 100 },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    await expect(provider().identify(input)).resolves.toEqual(validAnalysis);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://model.example.test/v1/chat/completions");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer secret-token" });
    const body = JSON.parse(String(init?.body));
    expect(body.model).toBe("vision-model");
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages[1].content).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "text", text: expect.stringContaining(input.worldview) }),
        { type: "image_url", image_url: { url: "data:image/png;base64,iVBORw==" } },
      ]),
    );
  });

  it("uses the text model and omits image data for repair", async () => {
    const fetchSpy = vi.fn<typeof fetch>(async () =>
      Response.json({
        id: "chatcmpl-repair",
        object: "chat.completion",
        created: 1,
        model: "repair-model",
        choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: JSON.stringify(validAnalysis) } }],
        usage: { prompt_tokens: 10, completion_tokens: 80, total_tokens: 90 },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    await provider().identify(input, {
      rawResponse: { artifactName: "不完整" },
      issues: [{ code: "custom", path: ["description"], message: "缺少描述" }],
    });

    const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(body.model).toBe("repair-model");
    expect(JSON.stringify(body.messages)).not.toContain("image_url");
    expect(JSON.stringify(body.messages)).toContain("description");
  });

  it("exposes upstream HTTP failures without leaking credentials", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => new Response("gateway failed", { status: 502 })),
    );

    const request = provider().identify(input);

    await expect(request).rejects.toBeInstanceOf(AIUpstreamError);
    await expect(request).rejects.not.toThrow(/secret-token/);
  });
});
