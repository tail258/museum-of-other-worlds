import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { WorldDatabase } from "@/features/worlds/db";
import {
  DexieWorldStore,
  MemoryWorldStore,
  WorldLimitError,
  type WorldStore,
} from "@/features/worlds/world-store";

function validWorld(index: number) {
  return {
    id: `world-${index}`,
    name: `世界 ${index}`,
    prompt: `这是第 ${index} 个原创世界观，用于验证浏览器本地世界观库的容量限制与更新行为。`,
  };
}

type StoreCase = {
  name: string;
  create: () => { store: WorldStore; cleanup: () => Promise<void> };
};

const storeCases: StoreCase[] = [
  {
    name: "memory",
    create: () => ({ store: new MemoryWorldStore(), cleanup: async () => {} }),
  },
  {
    name: "dexie",
    create: () => {
      const db = new WorldDatabase(`world-store-test-${crypto.randomUUID()}`);
      return { store: new DexieWorldStore(db), cleanup: () => db.delete() };
    },
  },
];

async function withStore(
  create: StoreCase["create"],
  run: (store: WorldStore) => Promise<void>,
) {
  const { store, cleanup } = create();
  try {
    await run(store);
  } finally {
    await cleanup();
  }
}

describe("WorldStore", () => {
  it.each(storeCases)("$name rejects a sixth distinct world", async ({ create }) => {
    await withStore(create, async (store) => {
      for (let index = 1; index <= 5; index += 1) {
        await store.save(validWorld(index));
      }

      await expect(store.save(validWorld(6))).rejects.toBeInstanceOf(WorldLimitError);
      await expect(store.list()).resolves.toHaveLength(5);
    });
  });

  it.each(storeCases)("$name updates one of five worlds without consuming a slot", async ({ create }) => {
    await withStore(create, async (store) => {
      for (let index = 1; index <= 5; index += 1) {
        await store.save(validWorld(index));
      }

      const updated = await store.save({
        ...validWorld(3),
        name: "更新后的世界",
        prompt: "这是被更新后的原创世界观，已有记录可以修改而不会被容量上限阻止或新建重复项目。",
      });

      expect(updated.name).toBe("更新后的世界");
      await expect(store.list()).resolves.toHaveLength(5);
    });
  });

  it.each(storeCases)("$name removes only the requested world", async ({ create }) => {
    await withStore(create, async (store) => {
      await store.save(validWorld(1));
      await store.save(validWorld(2));

      await store.remove("world-1");

      await expect(store.list()).resolves.toMatchObject([{ id: "world-2" }]);
    });
  });
});
