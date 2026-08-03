import Link from "next/link";

import { CreateWorkbench } from "@/components/create/create-workbench";

export default function CreatePage() {
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
          <Link href="/create" aria-current="page">新建档案</Link>
          <Link href="/worlds">世界观库</Link>
        </nav>
      </header>
      <CreateWorkbench />
    </main>
  );
}
