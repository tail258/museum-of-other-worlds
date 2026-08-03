import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  assertStorageKey,
  inferContentType,
  type ObjectStorage,
  type StoredObject,
} from "./object-storage";

export class LocalObjectStorage implements ObjectStorage {
  private readonly root: string;

  constructor(directory: string) {
    this.root = path.resolve(directory);
  }

  private resolveKey(key: string) {
    assertStorageKey(key);
    const target = path.resolve(this.root, ...key.split("/"));
    if (!target.startsWith(`${this.root}${path.sep}`)) throw new Error("Invalid storage key");
    return target;
  }

  async put(key: string, body: Uint8Array, contentType: string): Promise<void> {
    void contentType;
    const target = this.resolveKey(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
  }

  async get(key: string): Promise<StoredObject | null> {
    const target = this.resolveKey(key);
    try {
      const body = await readFile(target);
      return { body, contentType: inferContentType(key) };
    } catch (caught) {
      if ((caught as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw caught;
    }
  }
}
