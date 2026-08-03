import { expect, test } from "@playwright/test";
import sharp from "sharp";

const worldview = "诸神陨落后，雷霆被视为神血。灰冠祭司负责回收仍带电的旧时代器物并登记其危险等级。";

async function testImage() {
  return sharp({
    create: { width: 320, height: 400, channels: 4, background: "#25282d" },
  }).png().toBuffer();
}

test("offline demo switches sample and theme without API access", async ({ page }) => {
  await page.route("**/api/identify", (route) => route.abort());
  await page.goto("/");

  await expect(page).toHaveTitle(/异界遗物局/);
  await expect(page.getByRole("heading", { name: "每件日常物品， 都可能是异界遗物。" })).toBeVisible();
  await page.getByRole("button", { name: /黄铜钥匙/ }).click();
  await expect(page.getByRole("heading", { name: "第七码头的潮门骨" })).toBeVisible();
  await page.getByRole("button", { name: "废土档案" }).click();
  await expect(page.getByRole("article")).toHaveAttribute("data-theme", "wasteland-archive");
});

test("identifies, exports, publishes, and opens a public artifact", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.goto("/create");

  await page.getByLabel("世界观", { exact: true }).fill(worldview);
  await page.getByLabel("上传现实物品照片").setInputFiles({
    name: "power-bank.png",
    mimeType: "image/png",
    buffer: await testImage(),
  });
  await page.getByRole("button", { name: "开始鉴定" }).click();

  const card = page.getByRole("article", { name: "衰雷余烬匣遗物档案" });
  await expect(card).toBeVisible();
  await page.getByRole("button", { name: "复古科幻" }).click();
  await expect(card).toHaveAttribute("data-theme", "retro-sci-fi");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载 PNG" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("衰雷余烬匣.png");

  await page.getByRole("button", { name: "发布分享" }).click();
  const publicLink = page.getByRole("link", { name: "打开公开链接" });
  await expect(publicLink).toBeVisible();
  const publicUrl = await publicLink.getAttribute("href");
  expect(publicUrl).toMatch(/^http:\/\/127\.0\.0\.1:3200\/artifact\/[0-9a-f-]+$/);

  await page.goto(publicUrl!);
  await expect(page.getByRole("heading", { name: "公开档案" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "衰雷余烬匣" })).toBeVisible();
  await expect(page.getByRole("img", { name: /一块带有双接口/ })).toHaveAttribute(
    "src",
    /\/api\/artifacts\/.+\/source$/,
  );
  expect(runtimeErrors).toEqual([]);
});

test("home and artifact card fit a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);

  await page.getByRole("article").scrollIntoViewIfNeeded();
  await expect(page.getByRole("article")).toBeVisible();
  const scanDuration = await page.getByRole("article").evaluate((card) =>
    Number.parseFloat(getComputedStyle(card, "::after").animationDuration),
  );
  expect(scanDuration).toBeLessThanOrEqual(0.001);
});
