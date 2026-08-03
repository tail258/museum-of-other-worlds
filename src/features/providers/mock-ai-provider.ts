import type { ArtifactAnalysis } from "../artifacts/artifact-schema";
import type { AIProvider, IdentifyInput } from "./ai-provider";

export const MOCK_ARTIFACTS: Record<string, ArtifactAnalysis> = {
  "power-bank": {
    objectSummary: "一块带有双接口、短线与四枚指示灯的黑色长方体",
    artifactName: "衰雷余烬匣",
    description:
      "王都祭司从陨神荒原拾回此匣，据说其腹中仍囚禁着尚未冷却的雷霆。匣侧微光并非刻度，而是神血衰败时逐层熄灭的征兆。旅人将细索接入圣器，便可借走片刻残存神力，却也会在梦中听见旧神呼吸。",
    appraiser: "灰冠档案官·弥珥",
    evidence: "矩形外壳被解释为封印匣，接口成为汲取神血的导管，四枚指示灯成为神力衰减刻度。",
    worldName: "失雷王朝·赫尔萨",
  },
  "brass-key": {
    objectSummary: "一枚磨损的黄铜钥匙，齿部不规则，柄端留有圆孔",
    artifactName: "第七码头的潮门骨",
    description:
      "旧海退去之后，港城的门不再通往房间，而通往被潮汐遗忘的年份。这枚骨钥曾由无面引航员佩在胸前，只有盐雾最浓的夜里才会发热。将它插入生锈的船舷，失踪者的脚步便会从另一侧甲板传来。",
    appraiser: "沉港测绘师·伊诺",
    evidence: "黄铜锈色被视为海盐侵蚀，齿纹被解释成潮位编码，柄端圆孔则对应引航员佩绳。",
    worldName: "退潮纪·阿刻隆港",
  },
  thermos: {
    objectSummary: "一只银灰色圆柱保温杯，带旋盖与细密磨砂表面",
    artifactName: "远征者的恒温墓瓶",
    description:
      "风暴历第九次迁徙中，测候队用这种银瓶保存最后一口没有辐尘的热水。档案记载，旋开瓶盖时若听见两声轻响，便说明瓶中封存的并非水，而是一名冻死队员尚未说完的警告。它总比周围空气温暖，仿佛仍记得人的体温。",
    appraiser: "荒原温标员·雀斑七号",
    evidence: "双层金属结构被解释为隔绝辐尘的密封墓室，旋盖成为压力阀，保温能力则被视为记忆余热。",
    worldName: "白噪荒原·第九气候带",
  },
};

export class MockAIProvider implements AIProvider {
  async identify(input: IdentifyInput): Promise<unknown> {
    const artifact = MOCK_ARTIFACTS[input.demoId ?? "power-bank"] ?? MOCK_ARTIFACTS["power-bank"];
    return { ...artifact };
  }
}
