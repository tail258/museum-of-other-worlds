import type { ArtifactAnalysis } from "@/features/artifacts/artifact-schema";
import type { ArtifactTheme } from "@/features/artifacts/artifact-types";

type ArtifactCardProps = {
  analysis: ArtifactAnalysis;
  sourceUrl: string;
  theme: ArtifactTheme;
  className?: string;
  cardRef?: Ref<HTMLElement>;
};

export function ArtifactCard({ analysis, sourceUrl, theme, className, cardRef }: ArtifactCardProps) {
  return (
    <article
      aria-label={`${analysis.artifactName}遗物档案`}
      className={["artifact-card", className].filter(Boolean).join(" ")}
      data-theme={theme}
      ref={cardRef}
    >
      <div className="artifact-card__register" aria-hidden="true">
        OWB / VERIFIED SPECIMEN
      </div>
      <header className="artifact-card__header">
        <p className="artifact-card__world">{analysis.worldName}</p>
        <p className="artifact-card__status">鉴定完成</p>
      </header>

      <figure className="artifact-card__image-frame">
        {/* Blob URLs and published storage routes cannot be optimized by next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sourceUrl} alt={analysis.objectSummary} className="artifact-card__image" />
        <figcaption>{analysis.objectSummary}</figcaption>
      </figure>

      <div className="artifact-card__body">
        <p className="artifact-card__type">异界遗物 / 单体档案</p>
        <h2>{analysis.artifactName}</h2>

        <section aria-labelledby="artifact-description-label">
          <h3 id="artifact-description-label">遗物记述</h3>
          <p>{analysis.description}</p>
        </section>

        <dl className="artifact-card__details">
          <div>
            <dt>鉴定者</dt>
            <dd>{analysis.appraiser}</dd>
          </div>
          <div>
            <dt>解释依据</dt>
            <dd>{analysis.evidence}</dd>
          </div>
        </dl>
      </div>

      <div className="artifact-card__seal" aria-hidden="true">
        鉴
      </div>
    </article>
  );
}
import type { Ref } from "react";
