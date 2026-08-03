"use client";

import { useEffect, useRef, useState } from "react";

import { ArtifactCard } from "@/components/artifact/artifact-card";
import { ThemePicker } from "@/components/artifact/theme-picker";
import { identifyArtifact } from "@/features/artifacts/client-api";
import { exportArtifactCard } from "@/features/artifacts/export-artifact-card";
import type { ArtifactAnalysis } from "@/features/artifacts/artifact-schema";
import type { ArtifactDraft, ArtifactTheme, IdentifyClientInput } from "@/features/artifacts/artifact-types";
import type { WorldStoreStatus } from "@/features/worlds/world-store";

import { ImageDropzone } from "./image-dropzone";
import { WorldSelector } from "./world-selector";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type IdentifyFunction = (input: IdentifyClientInput) => Promise<ArtifactAnalysis>;
type ExportFunction = (node: HTMLElement, artifactName: string) => Promise<string>;

type CreateWorkbenchProps = {
  identify?: IdentifyFunction;
  exportCard?: ExportFunction;
  loadWorldStore?: () => Promise<WorldStoreStatus>;
};

export function CreateWorkbench({
  identify = identifyArtifact,
  exportCard = exportArtifactCard,
  loadWorldStore,
}: CreateWorkbenchProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [worldview, setWorldview] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [draft, setDraft] = useState<ArtifactDraft | null>(null);
  const [theme, setTheme] = useState<ArtifactTheme>("dark-fantasy");
  const [error, setError] = useState<string | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  function selectImage(file: File) {
    if (!IMAGE_TYPES.has(file.type)) {
      setError("仅支持 JPEG、PNG 或 WebP 图片。");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError("图片不能超过 8 MiB。");
      return;
    }

    setError(null);
    setSourceFile(file);
    setSourceUrl(URL.createObjectURL(file));
    setDraft(null);
  }

  async function submitIdentification() {
    if (!sourceFile || worldview.trim().length < 20) {
      setError("请上传图片，并填写至少 20 个字符的世界观。");
      return;
    }

    setError(null);
    setIsIdentifying(true);
    try {
      const analysis = await identify({ image: sourceFile, worldview: worldview.trim() });
      setDraft({
        analysis,
        theme,
        worldview: worldview.trim(),
        sourceUrl: sourceUrl!,
        sourceFile,
        createdAt: new Date().toISOString(),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "鉴定失败，请稍后重试。");
    } finally {
      setIsIdentifying(false);
    }
  }

  function selectTheme(nextTheme: ArtifactTheme) {
    setTheme(nextTheme);
    setDraft((current) => current ? { ...current, theme: nextTheme } : current);
  }

  async function downloadCard() {
    if (!cardRef.current || !draft) return;
    setExportMessage(null);
    setIsExporting(true);
    try {
      await exportCard(cardRef.current, draft.analysis.artifactName);
      setExportMessage("PNG 已保存到下载目录。");
    } catch (caught) {
      setExportMessage(caught instanceof Error ? caught.message : "PNG 导出失败，请稍后重试。");
    } finally {
      setIsExporting(false);
    }
  }

  const actionLabel = isIdentifying
    ? "正在鉴定…"
    : draft || error
      ? "重新鉴定"
      : "开始鉴定";

  return (
    <section className="create-workbench" aria-label="遗物鉴定工作台">
      <div className="create-workbench__controls">
        <header className="workbench-heading">
          <span aria-hidden="true">M-01</span>
          <div>
            <h1>建立鉴定档案</h1>
            <p>描述世界的法则，再提交一件来自现实的物品。</p>
          </div>
        </header>

        <div className="field-group">
          <label htmlFor="worldview">
            <span className="field-index" aria-hidden="true">01</span>
            <strong>世界观</strong>
          </label>
          <small id="worldview-help" className="field-help">
            20–1200 字，现有 IP 将被抽象为原创设定
          </small>
          <WorldSelector
            onSelect={(world) => {
              setWorldview(world.prompt);
              setError(null);
            }}
            loadStore={loadWorldStore}
          />
          <textarea
            id="worldview"
            value={worldview}
            maxLength={1200}
            rows={7}
            aria-label="世界观"
            aria-describedby="worldview-help"
            placeholder="例如：诸神陨落后，雷霆被视为神血。王国的祭司负责回收仍带电的旧时代器物……"
            onChange={(event) => setWorldview(event.target.value)}
          />
          <span className="field-counter">{worldview.length} / 1200</span>
        </div>

        <div className="theme-preview" aria-label="当前视觉主题">
          <span className="field-index" aria-hidden="true">02</span>
          <span>
            <strong>视觉主题</strong>
            <small>生成后可自由切换，不会再次调用模型</small>
          </span>
          <ThemePicker value={theme} onChange={selectTheme} compact />
        </div>

        <ImageDropzone file={sourceFile} previewUrl={sourceUrl} onSelect={selectImage} />

        {error ? <p className="workbench-error" role="alert">{error}</p> : null}

        <button
          type="button"
          className="identify-button"
          disabled={isIdentifying}
          onClick={submitIdentification}
        >
          <span>{actionLabel}</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
            <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
        </button>
      </div>

      <div className="create-workbench__preview" aria-live="polite">
        {draft ? (
          <div className="artifact-output">
            <ArtifactCard
              analysis={draft.analysis}
              sourceUrl={draft.sourceUrl}
              theme={draft.theme}
              cardRef={cardRef}
            />
            <div className="artifact-actions">
              <button type="button" disabled={isExporting} onClick={downloadCard}>
                {isExporting ? "正在生成 PNG…" : "下载 PNG"}
              </button>
              {exportMessage ? (
                <p role="status" aria-label="导出状态">{exportMessage}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="empty-artifact">
            <span aria-hidden="true">∅</span>
            <h2>尚无鉴定记录</h2>
            <p>完成左侧三项资料后，遗物档案将在此显现。</p>
          </div>
        )}
      </div>
    </section>
  );
}
