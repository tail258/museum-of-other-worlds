import type { ArtifactTheme } from "@/features/artifacts/artifact-types";
import { MOCK_ARTIFACTS } from "@/features/providers/mock-ai-provider";

export type ArtifactDemo = {
  id: "power-bank" | "brass-key" | "thermos";
  objectLabel: string;
  sourceUrl: string;
  worldview: string;
  theme: ArtifactTheme;
  analysis: (typeof MOCK_ARTIFACTS)[string];
};

export const ARTIFACT_DEMOS: readonly ArtifactDemo[] = [
  {
    id: "power-bank",
    objectLabel: "充电宝",
    sourceUrl: "/demos/power-bank.svg",
    worldview: "诸神陨落后，雷霆被视为神血。王国祭司负责回收仍带电的旧时代器物。",
    theme: "dark-fantasy",
    analysis: MOCK_ARTIFACTS["power-bank"],
  },
  {
    id: "brass-key",
    objectLabel: "黄铜钥匙",
    sourceUrl: "/demos/brass-key.svg",
    worldview: "旧海退去后，港城的门不再通往房间，而通往被潮汐遗忘的年份。",
    theme: "retro-sci-fi",
    analysis: MOCK_ARTIFACTS["brass-key"],
  },
  {
    id: "thermos",
    objectLabel: "保温杯",
    sourceUrl: "/demos/thermos.svg",
    worldview: "风暴把大地磨成白噪荒原，测候队以密封容器保存最后的无尘热水。",
    theme: "wasteland-archive",
    analysis: MOCK_ARTIFACTS.thermos,
  },
];
