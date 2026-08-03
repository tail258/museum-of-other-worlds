import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicArtifactView } from "@/components/artifact/public-artifact-view";
import { readPublishedArtifact } from "@/features/artifacts/published-artifact";

type ArtifactPageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ArtifactPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const artifact = await readPublishedArtifact(id);
    if (!artifact) return { title: "档案未找到 · 异界遗物局" };
    return {
      title: `${artifact.analysis.artifactName} · 异界遗物局`,
      description: artifact.analysis.description,
    };
  } catch {
    return { title: "异界遗物局" };
  }
}

export default async function ArtifactPage({ params }: ArtifactPageProps) {
  const { id } = await params;
  const artifact = await readPublishedArtifact(id).catch(() => null);
  if (!artifact) notFound();
  return <PublicArtifactView artifact={artifact} />;
}
