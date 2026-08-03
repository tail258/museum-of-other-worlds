import { describe, expect, it, vi } from "vitest";

import { ArtifactExportError, exportArtifactCard } from "@/features/artifacts/export-artifact-card";

describe("exportArtifactCard", () => {
  it("renders a 2x PNG and downloads it with a safe filename", async () => {
    const node = document.createElement("article");
    node.style.backgroundColor = "rgb(25, 24, 23)";
    const renderer = vi.fn(async () => "data:image/png;base64,card");
    const download = vi.fn();

    const filename = await exportArtifactCard(node, "衰雷 / 余烬匣", { renderer, download });

    expect(renderer).toHaveBeenCalledWith(
      node,
      expect.objectContaining({ pixelRatio: 2, cacheBust: true }),
    );
    expect(download).toHaveBeenCalledWith("data:image/png;base64,card", "衰雷-余烬匣.png");
    expect(filename).toBe("衰雷-余烬匣.png");
  });

  it("returns a stable domain error when rendering fails", async () => {
    const node = document.createElement("article");
    const renderer = vi.fn(async () => {
      throw new Error("canvas tainted");
    });

    await expect(exportArtifactCard(node, "遗物", { renderer })).rejects.toBeInstanceOf(
      ArtifactExportError,
    );
  });
});
