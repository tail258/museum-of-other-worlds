import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicArtifactView } from "@/components/artifact/public-artifact-view";
import { MOCK_ARTIFACTS } from "@/features/providers/mock-ai-provider";

describe("PublicArtifactView", () => {
  it("renders a published record against its immutable source route", () => {
    const id = "f5072b90-b778-4e5a-9ff8-35af461dc27a";
    render(<PublicArtifactView artifact={{
      version: 1,
      id,
      analysis: MOCK_ARTIFACTS["power-bank"],
      theme: "dark-fantasy",
      worldview: "诸神陨落后，雷霆被视为神血。王国祭司负责回收仍带电的旧时代器物。",
      createdAt: "2026-08-04T04:00:00.000Z",
    }} />);

    expect(screen.getByRole("heading", { name: "衰雷余烬匣" })).toBeVisible();
    expect(screen.getByRole("img")).toHaveAttribute("src", `/api/artifacts/${id}/source`);
    expect(screen.getByText("公开档案")).toBeVisible();
  });
});
