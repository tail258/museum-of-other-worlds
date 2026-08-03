import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { WorldSelector } from "@/components/create/world-selector";
import { MemoryWorldStore } from "@/features/worlds/world-store";

async function savedStore() {
  const store = new MemoryWorldStore();
  await store.save({
    id: "storm-kingdom",
    name: "失雷王朝",
    prompt: "诸神陨落后，雷霆被视为神血。灰冠祭司负责回收仍带电的旧时代器物并登记其危险等级。",
  });
  return store;
}

describe("WorldSelector", () => {
  it("sends a saved worldview to the create form without mutating storage", async () => {
    const user = userEvent.setup();
    const store = await savedStore();
    const onSelect = vi.fn();
    render(
      <WorldSelector
        onSelect={onSelect}
        loadStore={async () => ({ store, persistent: true })}
      />,
    );

    const selector = await screen.findByLabelText("从本地世界观库选择");
    await user.selectOptions(selector, "storm-kingdom");

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "storm-kingdom", name: "失雷王朝" }),
    );
    await expect(store.list()).resolves.toMatchObject([{ name: "失雷王朝" }]);
  });

  it("explains when the library falls back to this browser session", async () => {
    const store = await savedStore();
    render(
      <WorldSelector
        onSelect={() => {}}
        loadStore={async () => ({ store, persistent: false })}
      />,
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "世界观将在关闭页面后消失",
    );
    expect(screen.getByLabelText("从本地世界观库选择")).toBeEnabled();
  });
});
