import Link from "next/link";

import type { PublishedArtifact } from "@/features/artifacts/published-artifact";

import { ArtifactCard } from "./artifact-card";

type PublicArtifactViewProps = {
  artifact: PublishedArtifact;
};

export function PublicArtifactView({ artifact }: PublicArtifactViewProps) {
  return (
    <main className="app-shell public-artifact-page">
      <header className="site-header">
        <Link href="/" className="brand-mark" aria-label="异界遗物局首页">
          <span className="brand-mark__sigil" aria-hidden="true">异</span>
          <span>
            <strong>异界遗物局</strong>
            <small>Museum of Other Worlds</small>
          </span>
        </Link>
        <nav aria-label="主要导航">
          <Link href="/create">鉴定我的物品</Link>
        </nav>
      </header>

      <section className="public-artifact">
        <aside>
          <span>PUBLIC RECORD / {artifact.id.slice(0, 8).toUpperCase()}</span>
          <h1>公开档案</h1>
          <p>这份档案由访客主动发布。原始物证已压缩保存，世界观与鉴定文本保持发布时状态。</p>
          <dl>
            <div><dt>归属世界</dt><dd>{artifact.analysis.worldName}</dd></div>
            <div><dt>发布时间</dt><dd>{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(new Date(artifact.createdAt))}</dd></div>
          </dl>
          <Link href="/create">建立新档案 ↗</Link>
        </aside>
        <div className="public-artifact__stage">
          <ArtifactCard
            analysis={artifact.analysis}
            sourceUrl={`/api/artifacts/${artifact.id}/source`}
            theme={artifact.theme}
          />
        </div>
      </section>
    </main>
  );
}
