"use client";

import { useState } from "react";

import { ArtifactCard } from "@/components/artifact/artifact-card";
import { ThemePicker } from "@/components/artifact/theme-picker";
import type { ArtifactTheme } from "@/features/artifacts/artifact-types";
import { ARTIFACT_DEMOS } from "@/features/demos/demo-data";

export function DemoGallery() {
  const [selectedId, setSelectedId] = useState(ARTIFACT_DEMOS[0].id);
  const [theme, setTheme] = useState<ArtifactTheme>(ARTIFACT_DEMOS[0].theme);
  const demo = ARTIFACT_DEMOS.find((item) => item.id === selectedId) ?? ARTIFACT_DEMOS[0];

  function selectDemo(id: (typeof ARTIFACT_DEMOS)[number]["id"]) {
    const selected = ARTIFACT_DEMOS.find((item) => item.id === id);
    if (!selected) return;
    setSelectedId(id);
    setTheme(selected.theme);
  }

  return (
    <section className="demo-gallery" aria-labelledby="demo-heading">
      <div className="demo-gallery__rail">
        <div>
          <span>OFFLINE SPECIMENS / 03</span>
          <h2 id="demo-heading">无需模型，也能现场演示</h2>
          <p>三份预置档案写入前端，不消耗 Token。可切换样本与主题，验证完整卡片体验。</p>
        </div>

        <div className="demo-gallery__specimens" aria-label="预置演示物品">
          {ARTIFACT_DEMOS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === selectedId}
              onClick={() => selectDemo(item.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.objectLabel}</strong>
              <small>{item.analysis.worldName}</small>
            </button>
          ))}
        </div>

        <div className="demo-gallery__themes">
          <span>主题覆盖层</span>
          <ThemePicker value={theme} onChange={setTheme} compact />
        </div>
      </div>

      <div className="demo-gallery__stage">
        <div className="demo-gallery__coordinates" aria-hidden="true">
          <span>31°14′N</span><span>ARCHIVE ONLINE</span><span>121°29′E</span>
        </div>
        <ArtifactCard
          key={`${demo.id}-${theme}`}
          analysis={demo.analysis}
          sourceUrl={demo.sourceUrl}
          theme={theme}
        />
      </div>
    </section>
  );
}
