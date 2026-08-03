import { z } from "zod";

import { artifactSourceKey } from "@/features/artifacts/published-artifact";
import { getObjectStorage } from "@/features/storage/storage-factory";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) return new Response(null, { status: 404 });
    const source = await getObjectStorage().get(artifactSourceKey(id));
    if (!source) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(source.body).buffer, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}
