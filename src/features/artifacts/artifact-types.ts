import type { ArtifactAnalysis } from "./artifact-schema";

export type ArtifactTheme = "dark-fantasy" | "retro-sci-fi" | "wasteland-archive";

export type ArtifactDraft = {
  analysis: ArtifactAnalysis;
  theme: ArtifactTheme;
  worldview: string;
  sourceUrl: string;
  sourceFile: File;
  createdAt: string;
};

export type IdentifyClientInput = {
  image: File;
  worldview: string;
  demoId?: string;
};
