import Link from "next/link";

import { DemoGallery } from "@/components/demo/demo-gallery";

export default function HomePage() {
  return (
    <main className="app-shell home-page">
      <header className="site-header">
        <Link href="/" className="brand-mark" aria-label="异界遗物局首页" aria-current="page">
          <span className="brand-mark__sigil" aria-hidden="true">异</span>
          <span>
            <strong>异界遗物局</strong>
            <small>Museum of Other Worlds</small>
          </span>
        </Link>
        <nav aria-label="主要导航">
          <Link href="/create">新建档案</Link>
          <Link href="/worlds">世界观库</Link>
        </nav>
      </header>

      <section className="home-hero">
        <div className="home-hero__eyebrow">
          <span>OWB / INTAKE 2026</span>
          <span>现实物证 · 异界释读</span>
        </div>
        <div className="home-hero__title">
          <h1>每件日常物品，<br />都可能是异界遗物。</h1>
          <div>
            <p>上传现实物品，写下一条世界法则。AI 将以异文明鉴定者的视角，建立一份原创遗物档案。</p>
            <Link href="/create" className="home-hero__cta">
              <span>开始鉴定</span><span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <div className="home-hero__legend" aria-label="产品流程">
          <span>01 / 定义世界</span>
          <span>02 / 上传物证</span>
          <span>03 / 生成档案</span>
        </div>
      </section>

      <DemoGallery />
    </main>
  );
}
