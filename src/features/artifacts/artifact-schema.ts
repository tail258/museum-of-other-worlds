import { z } from "zod";

export const artifactAnalysisSchema = z.object({
  objectSummary: z.string().trim().min(4).max(200),
  artifactName: z.string().trim().min(2).max(60),
  description: z.string().trim().min(80).max(180),
  appraiser: z.string().trim().min(2).max(80),
  evidence: z.string().trim().min(20).max(240),
  worldName: z.string().trim().min(2).max(80),
});

export type ArtifactAnalysis = z.infer<typeof artifactAnalysisSchema>;
