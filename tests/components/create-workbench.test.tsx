import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CreateWorkbench } from "@/components/create/create-workbench";
import { MemoryWorldStore } from "@/features/worlds/world-store";

const worldview = "诸神陨落后，雷霆被视为神血。灰冠祭司负责回收仍带电的旧时代器物并登记其危险等级。";
const analysis = {
  objectSummary: "一块带有接口与指示灯的黑色长方体",
  artifactName: "衰雷余烬匣",
  description:
    "王都祭司从陨神荒原拾回此匣，据说其腹中仍囚禁着尚未冷却的雷霆。匣侧微光并非刻度，而是神血衰败时逐层熄灭的征兆。旅人将细索接入圣器，便可借走片刻残存神力，却也会在梦中听见旧神呼吸。",
  appraiser: "灰冠档案官·弥珥",
  evidence: "矩形外壳被解释为封印匣，接口成为汲取神血的导管，指示灯成为神力衰减刻度。",
  worldName: "失雷王朝·赫尔萨",
};

beforeEach(() => {
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:item-preview"),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CreateWorkbench", () => {
  it("loads a selected local worldview into the editable prompt", async () => {
    const user = userEvent.setup();
    const store = new MemoryWorldStore();
    await store.save({
      id: "saved-world",
      name: "雾钟公国",
      prompt: "雾钟每次鸣响都会抹去一段历史，城中的档案员以失窃的日用品重建被删除的年代。",
    });
    render(
      <CreateWorkbench
        loadWorldStore={async () => ({ store, persistent: true })}
      />,
    );

    await user.selectOptions(
      await screen.findByLabelText("从本地世界观库选择"),
      "saved-world",
    );

    expect(screen.getByLabelText("世界观")).toHaveValue(
      "雾钟每次鸣响都会抹去一段历史，城中的档案员以失窃的日用品重建被删除的年代。",
    );
  });

  it("keeps the source image visible after identifying an artifact", async () => {
    const user = userEvent.setup();
    const identify = vi.fn(async () => analysis);
    render(<CreateWorkbench identify={identify} />);

    await user.type(screen.getByLabelText("世界观"), worldview);
    await user.upload(
      screen.getByLabelText("上传现实物品照片"),
      new File([new Uint8Array([137, 80, 78, 71])], "power-bank.png", { type: "image/png" }),
    );
    await user.click(screen.getByRole("button", { name: "开始鉴定" }));

    expect(await screen.findByRole("heading", { name: analysis.artifactName })).toBeVisible();
    expect(screen.getByRole("img", { name: analysis.objectSummary })).toHaveAttribute(
      "src",
      "blob:item-preview",
    );
    expect(identify).toHaveBeenCalledWith(
      expect.objectContaining({ worldview, image: expect.any(File) }),
    );
  });

  it("switches card themes without identifying the object again", async () => {
    const user = userEvent.setup();
    const identify = vi.fn(async () => analysis);
    render(<CreateWorkbench identify={identify} />);

    await user.type(screen.getByLabelText("世界观"), worldview);
    await user.upload(
      screen.getByLabelText("上传现实物品照片"),
      new File([new Uint8Array([137, 80, 78, 71])], "power-bank.png", { type: "image/png" }),
    );
    await user.click(screen.getByRole("button", { name: "开始鉴定" }));

    const card = await screen.findByRole("article", { name: `${analysis.artifactName}遗物档案` });
    expect(card).toHaveAttribute("data-theme", "dark-fantasy");

    await user.click(screen.getByRole("button", { name: /复古科幻/ }));
    expect(card).toHaveAttribute("data-theme", "retro-sci-fi");
    expect(screen.getByText(analysis.description)).toBeVisible();
    expect(identify).toHaveBeenCalledTimes(1);
  });

  it("rejects unsupported files before identification", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const identify = vi.fn(async () => analysis);
    render(<CreateWorkbench identify={identify} />);

    await user.upload(
      screen.getByLabelText("上传现实物品照片"),
      new File(["vector"], "item.svg", { type: "image/svg+xml" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent("仅支持 JPEG、PNG 或 WebP");
    expect(identify).not.toHaveBeenCalled();
  });

  it("preserves the form after a retryable server failure", async () => {
    const user = userEvent.setup();
    const identify = vi.fn(async () => {
      throw new Error("鉴定服务暂时不可用");
    });
    render(<CreateWorkbench identify={identify} />);

    await user.type(screen.getByLabelText("世界观"), worldview);
    await user.upload(
      screen.getByLabelText("上传现实物品照片"),
      new File([new Uint8Array([137, 80, 78, 71])], "power-bank.png", { type: "image/png" }),
    );
    await user.click(screen.getByRole("button", { name: "开始鉴定" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("鉴定服务暂时不可用");
    expect(screen.getByLabelText("世界观")).toHaveValue(worldview);
    expect(screen.getByRole("button", { name: "重新鉴定" })).toBeEnabled();
  });
});
