import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { Dialog } from "@/components/ui/dialog";
import { AdvancedModelPickerContent } from "@/features/try-fair/components/model-picker/advanced-model-picker-dialog";
import { ModelType } from "@/enums";

const params = vi.hoisted(() => ({
  mode: "demo",
  selectedModelId: "buildings-1" as string | null,
  modelId: "buildings-1",
  setSelectedModelId: vi.fn(),
}));
vi.mock("@/features/try-fair/hooks/use-try-fair-params", () => ({
  useTryFairParams: () => params,
}));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, closeDialog }: ComponentProps<typeof Dialog>) => (
    <div
      role="dialog"
      onKeyDown={(event) => {
        if (event.key === "Escape") closeDialog();
      }}
    >
      {children}
    </div>
  ),
}));
const model = (id: string, isPinned = false) => ({
  is_pinned: isPinned,
  id,
  name: id,
  stac_item_id: id,
  star_count: 0,
  stac: { id, properties: { title: id, "fair:category": "buildings" } },
});
const buildings = [model("buildings-1", true), model("buildings-2")];
const trees = [model("trees-1", true)];
vi.mock("@/features/try-fair/api/features-to-map", () => ({
  useGetAPIBaseModels: () => ({ data: { results: [] }, isPending: false }),
  useGetAPILocalModels: () => ({ data: { results: [] }, isPending: false }),
  useGetFeaturesToMap: () => ({
    data: {
      results: [
        { slug: "buildings", label: "Buildings" },
        { slug: "trees", label: "Trees" },
      ],
    },
  }),
  useGetAllAPIBaseModels: (slug: string) => ({
    data: { results: slug === "trees" ? trees : buildings },
    isLoading: false,
    isPending: false,
  }),
  useGetAllAPILocalModels: () => ({
    data: { results: [] },
    isLoading: false,
    isPending: false,
  }),
}));

beforeEach(() => {
  params.mode = ModelType.DEMO;
  params.selectedModelId = "buildings-1";
  trees[0].is_pinned = true;
  params.setSelectedModelId.mockClear();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});

function setup() {
  const onSelect = vi.fn();
  const onFeatureChange = vi.fn();
  render(
    <AdvancedModelPickerContent
      feature="buildings"
      onSelect={onSelect}
      onFeatureChange={onFeatureChange}
    />,
  );
  return { onSelect, onFeatureChange };
}

describe("advanced sample switching", () => {
  it("keeps the current sample when opening advanced mode without an explicit selection", () => {
    params.selectedModelId = null;
    const { onSelect } = setup();
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /buildings-1/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("automatically selects a pinned sample even when an unpinned model comes first", () => {
    params.selectedModelId = "missing-model";
    buildings.reverse();
    try {
      const { onSelect } = setup();
      expect(onSelect).toHaveBeenCalledExactlyOnceWith(buildings[1].stac);
    } finally {
      buildings.reverse();
    }
  });

  it("does not automatically select an unpinned sample when the feature has no pinned models", () => {
    trees[0].is_pinned = false;
    const { onSelect } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Trees" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /trees-1/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(trees[0].stac);
  });

  it("preserves an explicitly selected unpinned sample", () => {
    params.selectedModelId = "buildings-2";
    const { onSelect } = setup();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows pinned and unpinned models with a badge only on pinned cards", () => {
    params.mode = ModelType.IMAGERY;
    const { onSelect } = setup();
    const pinnedCard = screen.getByRole("button", { name: /buildings-1/ });
    const unpinnedCard = screen.getByRole("button", { name: /buildings-2/ });
    expect(within(pinnedCard).getByText("Pinned")).toBeInTheDocument();
    expect(
      within(pinnedCard).getByText(
        "This is a recommended model for mapping buildings.",
      ),
    ).toBeInTheDocument();
    expect(within(unpinnedCard).queryByText("Pinned")).not.toBeInTheDocument();
    fireEvent.click(unpinnedCard);
    expect(onSelect).toHaveBeenCalledWith(buildings[1].stac);
  });

  it.each(["Trees", "buildings-2"])(
    "waits for confirmation when choosing %s",
    (choice) => {
      const { onSelect, onFeatureChange } = setup();
      fireEvent.click(screen.getByRole("button", { name: new RegExp(choice) }));
      expect(screen.getByRole("dialog")).toHaveTextContent(
        "imagery and map location",
      );
      expect(onSelect).not.toHaveBeenCalled();
      expect(onFeatureChange).not.toHaveBeenCalled();
      expect(params.setSelectedModelId).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      const expected = choice === "Trees" ? trees[0] : buildings[1];
      expect(onSelect).toHaveBeenCalledExactlyOnceWith(expected.stac);
      expect(params.setSelectedModelId).toHaveBeenCalledWith(
        expected.stac_item_id,
      );
      if (choice === "Trees")
        expect(onFeatureChange).toHaveBeenCalledWith("trees");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    },
  );

  it.each(["Trees", "buildings-2"])(
    "keeps the current selection when cancelling %s",
    (choice) => {
      const { onSelect, onFeatureChange } = setup();
      fireEvent.click(screen.getByRole("button", { name: new RegExp(choice) }));
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onSelect).not.toHaveBeenCalled();
      expect(onFeatureChange).not.toHaveBeenCalled();
      expect(params.setSelectedModelId).not.toHaveBeenCalled();
      expect(
        screen.getByRole("button", { name: /buildings-1/ }),
      ).toBeInTheDocument();
    },
  );

  it("ignores the selected feature and model", () => {
    const { onSelect } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Buildings" }));
    fireEvent.click(screen.getByRole("button", { name: /buildings-1/ }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each(["Trees", "buildings-2"])(
    "does not warn for %s in custom imagery mode",
    (choice) => {
      params.mode = ModelType.IMAGERY;
      const { onSelect } = setup();
      fireEvent.click(screen.getByRole("button", { name: new RegExp(choice) }));
      expect(onSelect).toHaveBeenCalledOnce();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    },
  );

  it("remembers the opt-out for later changes", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: /buildings-2/ }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(localStorage.getItem("fair:skip-sample-switch-warning")).toBe(
      "true",
    );
    cleanup();
    const { onSelect } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Trees" }));
    expect(onSelect).toHaveBeenCalledWith(trees[0].stac);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
