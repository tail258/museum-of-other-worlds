// @vitest-environment node

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { LocalObjectStorage } from "@/features/storage/local-object-storage";

describe("LocalObjectStorage", () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(path.join(tmpdir(), "other-worlds-storage-"));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it("stores and reads an artifact object by key", async () => {
    const storage = new LocalObjectStorage(directory);
    const body = new TextEncoder().encode('{"artifact":"test"}');

    await storage.put("artifacts/specimen-1/artifact.json", body, "application/json");
    const stored = await storage.get("artifacts/specimen-1/artifact.json");

    expect(stored?.contentType).toBe("application/json");
    expect(new TextDecoder().decode(stored?.body)).toBe('{"artifact":"test"}');
  });

  it("rejects keys that could escape the configured directory", async () => {
    const storage = new LocalObjectStorage(directory);
    await expect(storage.put("../secret.json", new Uint8Array([1]), "application/json"))
      .rejects.toThrow("Invalid storage key");
  });
});
