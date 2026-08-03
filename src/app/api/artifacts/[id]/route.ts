import { readPublishedArtifact } from "@/features/artifacts/published-artifact";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const artifact = await readPublishedArtifact(id);
    if (!artifact) {
      return Response.json({ error: { code: "NOT_FOUND", message: "未找到这份遗物档案。" } }, { status: 404 });
    }
    return Response.json(artifact, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  } catch {
    return Response.json({ error: { code: "READ_FAILED", message: "档案读取失败。" } }, { status: 500 });
  }
}
