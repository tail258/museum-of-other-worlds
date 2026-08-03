// @vitest-environment node

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { POST } from "@/app/api/artifacts/route";
import { GET as getArtifact } from "@/app/api/artifacts/[id]/route";
import { GET as getSource } from "@/app/api/artifacts/[id]/source/route";
import { MOCK_ARTIFACTS } from "@/features/providers/mock-ai-provider";

async function createTinyPng() {
  return sharp({
    create: { width: 2, height: 2, channels: 4, background: "#16191d" },
  }).png().toBuffer();
}

describe("artifact publishing routes", () => {
  let directory: string;
  const previous = {
    provider: process.env.STORAGE_PROVIDER,
    directory: process.env.STORAGE_LOCAL_DIR,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  };

  beforeAll(async () => {
    directory = await mkdtemp(path.join(tmpdir(), "other-worlds-publish-"));
    process.env.STORAGE_PROVIDER = "local";
    process.env.STORAGE_LOCAL_DIR = directory;
    process.env.NEXT_PUBLIC_APP_URL = "https://museum.example";
  });

  afterAll(async () => {
    await rm(directory, { recursive: true, force: true });
    if (previous.provider === undefined) delete process.env.STORAGE_PROVIDER;
    else process.env.STORAGE_PROVIDER = previous.provider;
    if (previous.directory === undefined) delete process.env.STORAGE_LOCAL_DIR;
    else process.env.STORAGE_LOCAL_DIR = previous.directory;
    if (previous.appUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previous.appUrl;
  });

  it("publishes compressed source and JSON only after an explicit POST", async () => {
    const formData = new FormData();
    formData.set("image", new File([await createTinyPng()], "object.png", { type: "image/png" }));
    formData.set("analysis", JSON.stringify(MOCK_ARTIFACTS["power-bank"]));
    formData.set("worldview", "诸神陨落后，雷霆被视为神血。王国祭司负责回收仍带电的旧时代器物。 ");
    formData.set("theme", "dark-fantasy");

    const response = await POST(new Request("http://localhost/api/artifacts", { method: "POST", body: formData }));
    const published = await response.json();

    expect(response.status).toBe(201);
    expect(published.url).toBe(`https://museum.example/artifact/${published.id}`);

    const artifactResponse = await getArtifact(
      new Request(`http://localhost/api/artifacts/${published.id}`),
      { params: Promise.resolve({ id: published.id }) },
    );
    expect(artifactResponse.status).toBe(200);
    await expect(artifactResponse.json()).resolves.toMatchObject({
      id: published.id,
      analysis: { artifactName: "衰雷余烬匣" },
      theme: "dark-fantasy",
    });

    const sourceResponse = await getSource(
      new Request(`http://localhost/api/artifacts/${published.id}/source`),
      { params: Promise.resolve({ id: published.id }) },
    );
    expect(sourceResponse.status).toBe(200);
    expect(sourceResponse.headers.get("content-type")).toBe("image/webp");
    expect((await sourceResponse.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  it("rejects malformed artifact records", async () => {
    const formData = new FormData();
    formData.set("image", new File([await createTinyPng()], "object.png", { type: "image/png" }));
    formData.set("analysis", JSON.stringify({ artifactName: "缺少字段" }));
    formData.set("worldview", "这是一个超过二十个字符但内容不完整的测试世界观描述，用于验证接口。 ");
    formData.set("theme", "dark-fantasy");

    const response = await POST(new Request("http://localhost/api/artifacts", { method: "POST", body: formData }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "INVALID_ARTIFACT" } });
  });
});
