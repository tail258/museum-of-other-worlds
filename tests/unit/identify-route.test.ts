// @vitest-environment node

import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/identify/route";

const worldview = "诸神陨落后，雷霆被视为神血。灰冠祭司负责回收仍带电的旧时代器物并登记其危险等级。";

function createRequest(file: File): Request {
  const formData = new FormData();
  formData.set("image", file);
  formData.set("worldview", worldview);
  formData.set("demoId", "power-bank");
  return new Request("http://localhost/api/identify", { method: "POST", body: formData });
}

describe("POST /api/identify", () => {
  it("returns a structured artifact for valid multipart input", async () => {
    const response = await POST(createRequest(new File([new Uint8Array([137, 80, 78, 71])], "item.png", { type: "image/png" })));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.artifact.artifactName).toBe("衰雷余烬匣");
  });

  it("rejects unsupported image media types", async () => {
    const response = await POST(createRequest(new File(["vector"], "item.svg", { type: "image/svg+xml" })));

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "UNSUPPORTED_IMAGE_TYPE" } });
  });

  it("rejects images larger than 8 MiB", async () => {
    const response = await POST(createRequest(new File([new Uint8Array(8 * 1024 * 1024 + 1)], "huge.webp", { type: "image/webp" })));

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "IMAGE_TOO_LARGE" } });
  });
});
