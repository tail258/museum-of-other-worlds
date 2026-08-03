import Dexie, { type Table } from "dexie";

import type { Worldview } from "./world-schema";

export class WorldDatabase extends Dexie {
  worlds!: Table<Worldview, string>;

  constructor(name = "museum-of-other-worlds") {
    super(name);
    this.version(1).stores({
      worlds: "id, name, updatedAt",
    });
  }
}

export const worldDatabase = new WorldDatabase();
