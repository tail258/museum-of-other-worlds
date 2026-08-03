import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { WorldManager } from "@/components/worlds/world-manager";
import { MemoryWorldStore } from "@/features/worlds/world-store";

const prompts = [
  "诸神陨落后，雷霆被视为神血，灰冠祭司负责回收仍带电的旧时代器物。",
  "群星熄灭后，航海者靠沉睡卫星投下的冷光辨认被潮汐吞没的旧城。",
  "最后一场战争将大地烧成盐壳，拾荒档案员把旧工业零件登记为文明证物。",
  "机械圣堂相信每一次齿轮啮合都是先祖祷文，并禁止拆开仍会转动的器械。",
  "永夜森林以菌丝传递记忆，所有发光物品都被认为藏有失语者的梦境。",
];

async function loadStore(count = 0, persistent = true) {
  const store = new MemoryWorldStore();
  for (let index = 0; index < count; index += 1) {
    await store.save({
      id: `world-${index}`,
      name: `测试世界 ${index + 1}`,
      prompt: prompts[index],
    });
  }
  return async () => ({ store, persistent });
}

describe("WorldManager", () => {
  it("creates, edits, and removes local worldviews", async () => {
    const user = userEvent.setup();
    render(<WorldManager loadStore={await loadStore(1)} />);

    expect(await screen.findByText("1 / 5")).toBeInTheDocument();

    await user.type(screen.getByLabelText("世界名称"), "雾钟群岛");
    await user.type(
      screen.getByLabelText("世界观描述"),
      "漂浮群岛用雾钟校准时间，任何能够储存声音的器物都必须交由守钟人封存。",
    );
    await user.click(screen.getByRole("button", { name: "保存世界观" }));

    expect(await screen.findByText("2 / 5")).toBeInTheDocument();
    expect(screen.getByText("雾钟群岛")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "编辑 雾钟群岛" }));
    await user.clear(screen.getByLabelText("世界名称"));
    await user.type(screen.getByLabelText("世界名称"), "雾钟档案域");
    await user.click(screen.getByRole("button", { name: "更新世界观" }));

    expect(await screen.findByText("雾钟档案域")).toBeInTheDocument();
    expect(screen.getByText("2 / 5")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "删除 雾钟档案域" }));
    expect(await screen.findByText("1 / 5")).toBeInTheDocument();
    expect(screen.queryByText("雾钟档案域")).not.toBeInTheDocument();
  });

  it("prevents a sixth world while allowing an existing one to be edited", async () => {
    const user = userEvent.setup();
    render(<WorldManager loadStore={await loadStore(5)} />);

    expect(await screen.findByText("5 / 5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存世界观" })).toBeDisabled();
    expect(screen.getByText(/已达到本地保存上限/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "编辑 测试世界 1" }));
    const updateButton = screen.getByRole("button", { name: "更新世界观" });
    expect(updateButton).toBeEnabled();
    await user.clear(screen.getByLabelText("世界名称"));
    await user.type(screen.getByLabelText("世界名称"), "第一世界修订版");
    await user.click(updateButton);

    expect(await screen.findByText("第一世界修订版")).toBeInTheDocument();
    expect(screen.getByText("5 / 5")).toBeInTheDocument();
  });
});
