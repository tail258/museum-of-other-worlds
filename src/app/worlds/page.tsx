import Link from "next/link";

import { WorldManager } from "@/components/worlds/world-manager";

export default function WorldsPage() {
  return (
    <main className="app-shell">
      <header className="site-header">
        <Link href="/" className="brand-mark" aria-label="异界遗物局首页">
          <span className="brand-mark__sigil" aria-hidden="true">异</span>
          <span>
            <strong>异界遗物局</strong>
            <small>Museum of Other Worlds</small>
          </span>
        </Link>
        <nav aria-label="主要导航">
          <Link href="/create">新建档案</Link>
          <Link href="/worlds" aria-current="page">世界观库</Link>
        </nav>
      </header>
      <WorldManager />
    </main>
  );
}
