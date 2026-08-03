import { z } from "zod";

import { getObjectStorage } from "@/features/storage/storage-factory";

import { artifactAnalysisSchema } from "./artifact-schema";

export const artifactThemeSchema = z.enum(["dark-fantasy", "retro-sci-fi", "wasteland-archive"]);

export const publishedArtifactSchema = z.object({
  version: z.literal(1),
  id: z.string().uuid(),
  analysis: artifactAnalysisSchema,
  theme: artifactThemeSchema,
  worldview: z.string().trim().min(20).max(1200),
  createdAt: z.string().datetime(),
});

export type PublishedArtifact = z.infer<typeof publishedArtifactSchema>;

export function artifactJsonKey(id: string) {
  return `artifacts/${id}/artifact.json`;
}

export function artifactSourceKey(id: string) {
  return `artifacts/${id}/source.webp`;
}

export async function readPublishedArtifact(id: string): Promise<PublishedArtifact | null> {
  if (!z.string().uuid().safeParse(id).success) return null;
  const object = await getObjectStorage().get(artifactJsonKey(id));
  if (!object) return null;
  const parsedJson: unknown = JSON.parse(new TextDecoder().decode(object.body));
  return publishedArtifactSchema.parse(parsedJson);
}
