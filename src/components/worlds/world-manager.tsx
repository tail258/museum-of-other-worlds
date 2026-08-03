"use client";

import { useEffect, useState } from "react";

import type { Worldview } from "@/features/worlds/world-schema";
import {
  MAX_SAVED_WORLDS,
  openWorldStore,
  type WorldStore,
  type WorldStoreStatus,
} from "@/features/worlds/world-store";

import { WorldForm } from "./world-form";
import { WorldList } from "./world-list";

type WorldManagerProps = {
  loadStore?: () => Promise<WorldStoreStatus>;
};

function createWorldId() {
  return globalThis.crypto?.randomUUID?.() ?? `world-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function WorldManager({ loadStore = openWorldStore }: WorldManagerProps) {
  const [store, setStore] = useState<WorldStore | null>(null);
  const [worlds, setWorlds] = useState<Worldview[]>([]);
  const [persistent, setPersistent] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void loadStore().then(async (status) => {
      const savedWorlds = await status.store.list();
      if (active) {
        setStore(status.store);
        setPersistent(status.persistent);
        setWorlds(savedWorlds);
      }
    }).catch(() => {
      if (active) setError("世界观库暂时无法读取，请刷新后重试。");
    });
    return () => {
      active = false;
    };
  }, [loadStore]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setPrompt("");
    setError(null);
  }

  async function refresh(activeStore: WorldStore) {
    setWorlds(await activeStore.list());
  }

  async function saveWorld() {
    if (!store) return;
    setError(null);
    try {
      await store.save({ id: editingId ?? createWorldId(), name, prompt });
      await refresh(store);
      resetForm();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存失败，请稍后重试。");
    }
  }

  function editWorld(world: Worldview) {
    setEditingId(world.id);
    setName(world.name);
    setPrompt(world.prompt);
    setError(null);
  }

  async function removeWorld(world: Worldview) {
    if (!store) return;
    await store.remove(world.id);
    await refresh(store);
    if (editingId === world.id) resetForm();
  }

  const atLimit = worlds.length >= MAX_SAVED_WORLDS;
  const formDisabled = !store || (!editingId && atLimit);

  return (
    <section className="world-manager" aria-label="本地世界观库">
      <div className="world-manager__intro">
        <span>LOCAL ARCHIVE / W</span>
        <h1>世界观库</h1>
        <p>把常用的世界法则留在这台设备里。鉴定时只取用副本，原始档案不会被改写。</p>
      </div>

      <div className="world-manager__grid">
        <WorldForm
          editing={editingId !== null}
          disabled={formDisabled}
          name={name}
          prompt={prompt}
          onCancel={resetForm}
          onNameChange={setName}
          onPromptChange={setPrompt}
          onSubmit={saveWorld}
        />

        <div className="world-library">
          <header>
            <div>
              <span>已保存档案</span>
              <strong>{worlds.length} / {MAX_SAVED_WORLDS}</strong>
            </div>
            <p>按最近修订排序</p>
          </header>

          {!persistent ? (
            <p className="world-library__status" role="status">
              当前浏览器无法持久保存，世界观将在关闭页面后消失。
            </p>
          ) : null}
          {atLimit && editingId === null ? (
            <p className="world-library__limit">已达到本地保存上限，请删除一个世界观后再新增。</p>
          ) : null}
          {error ? <p className="workbench-error" role="alert">{error}</p> : null}
          <WorldList worlds={worlds} onEdit={editWorld} onRemove={removeWorld} />
        </div>
      </div>
    </section>
  );
}
