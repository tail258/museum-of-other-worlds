type RenderOptions = {
  backgroundColor: string;
  cacheBust: boolean;
  pixelRatio: number;
};

type ExportDependencies = {
  renderer?: (node: HTMLElement, options: RenderOptions) => Promise<string>;
  download?: (dataUrl: string, filename: string) => void;
};

export class ArtifactExportError extends Error {
  constructor(cause?: unknown) {
    super("PNG 导出失败，请稍后重试。", { cause });
    this.name = "ArtifactExportError";
  }
}

function safeFilename(artifactName: string) {
  const stem = artifactName
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "异界遗物";
  return `${stem}.png`;
}

async function defaultRenderer(node: HTMLElement, options: RenderOptions) {
  const { toPng } = await import("html-to-image");
  return toPng(node, options);
}

function defaultDownload(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.download = filename;
  anchor.href = dataUrl;
  anchor.click();
}

export async function exportArtifactCard(
  node: HTMLElement,
  artifactName: string,
  dependencies: ExportDependencies = {},
) {
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    const backgroundColor = getComputedStyle(node).backgroundColor || "#191817";
    const dataUrl = await (dependencies.renderer ?? defaultRenderer)(node, {
      backgroundColor,
      cacheBust: true,
      pixelRatio: 2,
    });
    const filename = safeFilename(artifactName);
    (dependencies.download ?? defaultDownload)(dataUrl, filename);
    return filename;
  } catch (cause) {
    throw new ArtifactExportError(cause);
  }
}
