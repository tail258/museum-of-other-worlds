import type { AIProvider, IdentifyInput, RepairContext } from "./ai-provider";

export type OpenAICompatibleOptions = {
  baseUrl: string;
  apiKey: string;
  visionModel: string;
  textModel?: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

const SYSTEM_PROMPT = `你是“异界遗物局”的鉴定引擎。根据现实物品照片与用户世界观，生成原创遗物档案。
不得复刻现有 IP 的角色、地点、阵营或专有名词；只能抽取抽象氛围并创造新的世界。
只返回 JSON 对象，字段必须是 objectSummary、artifactName、description、appraiser、evidence、worldName。
description 使用 80 至 180 个中文字符，其他字段简洁明确。`;

export class AIUpstreamError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "AIUpstreamError";
  }
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function parseAssistantContent(content: string): unknown {
  const fenced = content.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced?.[1] ?? content.trim();

  try {
    return JSON.parse(candidate);
  } catch {
    return content;
  }
}

export class OpenAICompatibleProvider implements AIProvider {
  private readonly options: OpenAICompatibleOptions;

  constructor(options: OpenAICompatibleOptions) {
    this.options = { ...options, baseUrl: withoutTrailingSlash(options.baseUrl) };
  }

  async identify(input: IdentifyInput, repair?: RepairContext): Promise<unknown> {
    const response = await fetch(`${this.options.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: repair ? this.options.textModel || this.options.visionModel : this.options.visionModel,
        response_format: { type: "json_object" },
        temperature: repair ? 0.2 : 0.8,
        messages: repair ? this.repairMessages(input, repair) : this.identificationMessages(input),
      }),
    });

    if (!response.ok) {
      throw new AIUpstreamError(`模型接口返回 HTTP ${response.status}。`, response.status);
    }

    const payload = (await response.json()) as ChatCompletionResponse;
    const content = payload.choices?.[0]?.message?.content;

    if (typeof content !== "string" || content.trim() === "") {
      throw new AIUpstreamError("模型接口未返回可读取的文本内容。");
    }

    return parseAssistantContent(content);
  }

  private identificationMessages(input: IdentifyInput) {
    return [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: `用户世界观：\n${input.worldview}\n\n请鉴定图片中的现实物品。` },
          {
            type: "image_url",
            image_url: {
              url: `data:${input.mediaType};base64,${Buffer.from(input.image).toString("base64")}`,
            },
          },
        ],
      },
    ];
  }

  private repairMessages(input: IdentifyInput, repair: RepairContext) {
    return [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `以下输出未通过结构校验。请只返回修复后的完整 JSON，不要解释。\n世界观：${input.worldview}\n原始输出：${JSON.stringify(repair.rawResponse)}\n校验问题：${JSON.stringify(repair.issues)}`,
      },
    ];
  }
}
