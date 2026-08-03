"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Worldview } from "@/features/worlds/world-schema";
import { openWorldStore, type WorldStoreStatus } from "@/features/worlds/world-store";

type WorldSelectorProps = {
  onSelect: (world: Worldview) => void;
  loadStore?: () => Promise<WorldStoreStatus>;
};

export function WorldSelector({ onSelect, loadStore = openWorldStore }: WorldSelectorProps) {
  const [worlds, setWorlds] = useState<Worldview[]>([]);
  const [persistent, setPersistent] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void loadStore().then(async (status) => {
      const storedWorlds = await status.store.list();
      if (!cancelled) {
        setWorlds(storedWorlds);
        setPersistent(status.persistent);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadStore]);

  return (
    <div className="world-selector">
      <div className="world-selector__row">
        <select
          aria-label="从本地世界观库选择"
          defaultValue=""
          disabled={isLoading}
          onChange={(event) => {
            const world = worlds.find((item) => item.id === event.target.value);
            if (world) onSelect(world);
          }}
        >
          <option value="">{isLoading ? "正在读取世界观库…" : "手动填写新世界观"}</option>
          {worlds.map((world) => (
            <option key={world.id} value={world.id}>{world.name}</option>
          ))}
        </select>
        <Link href="/worlds">管理</Link>
      </div>
      {!persistent ? (
        <p role="status">当前浏览器无法持久保存，世界观将在关闭页面后消失。</p>
      ) : null}
    </div>
  );
}
