import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DemoGallery } from "@/components/demo/demo-gallery";

describe("DemoGallery", () => {
  it("shows all three prebuilt artifacts without making a network request", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    render(<DemoGallery />);

    expect(screen.getByRole("heading", { name: "衰雷余烬匣" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /黄铜钥匙/ }));
    expect(screen.getByRole("heading", { name: "第七码头的潮门骨" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /保温杯/ }));
    expect(screen.getByRole("heading", { name: "远征者的恒温墓瓶" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: /黑暗幻想/ }));
    expect(screen.getByRole("article")).toHaveAttribute("data-theme", "dark-fantasy");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
