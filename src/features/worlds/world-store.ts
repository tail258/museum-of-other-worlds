import { worldDatabase, type WorldDatabase } from "./db";
import { worldviewSchema, type SaveWorldviewInput, type Worldview } from "./world-schema";

export const MAX_SAVED_WORLDS = 5;

export interface WorldStore {
  list(): Promise<Worldview[]>;
  save(input: SaveWorldviewInput): Promise<Worldview>;
  remove(id: string): Promise<void>;
}

export type WorldStoreStatus = {
  store: WorldStore;
  persistent: boolean;
};

export class WorldLimitError extends Error {
  constructor() {
    super("最多只能保存 5 个世界观，请先删除一个再继续。");
    this.name = "WorldLimitError";
  }
}

function toWorldview(input: SaveWorldviewInput, existing?: Worldview): Worldview {
  const now = new Date().toISOString();
  return worldviewSchema.parse({
    id: input.id,
    name: input.name,
    prompt: input.prompt,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
}

function newestFirst(worlds: Worldview[]): Worldview[] {
  return worlds.toSorted((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export class MemoryWorldStore implements WorldStore {
  private readonly worlds = new Map<string, Worldview>();

  async list(): Promise<Worldview[]> {
    return newestFirst([...this.worlds.values()]);
  }

  async save(input: SaveWorldviewInput): Promise<Worldview> {
    const existing = this.worlds.get(input.id);
    if (!existing && this.worlds.size >= MAX_SAVED_WORLDS) {
      throw new WorldLimitError();
    }

    const world = toWorldview(input, existing);
    this.worlds.set(world.id, world);
    return world;
  }

  async remove(id: string): Promise<void> {
    this.worlds.delete(id);
  }
}

export class DexieWorldStore implements WorldStore {
  constructor(private readonly database: WorldDatabase) {}

  async list(): Promise<Worldview[]> {
    return newestFirst(await this.database.worlds.toArray());
  }

  async save(input: SaveWorldviewInput): Promise<Worldview> {
    return this.database.transaction("rw", this.database.worlds, async () => {
      const existing = await this.database.worlds.get(input.id);
      const count = existing ? 0 : await this.database.worlds.count();
      if (!existing && count >= MAX_SAVED_WORLDS) {
        throw new WorldLimitError();
      }

      const world = toWorldview(input, existing);
      await this.database.worlds.put(world);
      return world;
    });
  }

  async remove(id: string): Promise<void> {
    await this.database.worlds.delete(id);
  }
}

export async function openWorldStore(
  database: WorldDatabase = worldDatabase,
): Promise<WorldStoreStatus> {
  try {
    await database.open();
    return { store: new DexieWorldStore(database), persistent: true };
  } catch {
    return { store: new MemoryWorldStore(), persistent: false };
  }
}
