import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { Dialog } from "@/components/ui/dialog";
import { AdvancedModelPickerContent } from "@/features/try-fair/components/model-picker/advanced-model-picker-dialog";
import { ModelType } from "@/enums";

const params = vi.hoisted(() => ({
  mode: "demo",
  selectedModelId: "buildings-1",
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
const model = (id: string) => ({
  id,
  name: id,
  stac_item_id: id,
  star_count: 0,
  stac: { id, properties: { title: id, "fair:category": "buildings" } },
});
const buildings = [model("buildings-1"), model("buildings-2")];
const trees = [model("trees-1")];
vi.mock("@/features/try-fair/api/features-to-map", () => ({
  useGetFeaturesToMap: () => ({
    data: {
      results: [
        { slug: "buildings", label: "Buildings" },
        { slug: "trees", label: "Trees" },
      ],
    },
  }),
  useGetAPIBaseModels: (slug: string) => ({
    data: { results: slug === "trees" ? trees : buildings },
    isLoading: false,
    isPending: false,
  }),
  useGetAPILocalModels: () => ({
    data: { results: [] },
    isLoading: false,
    isPending: false,
  }),
}));

beforeEach(() => {
  params.mode = ModelType.DEMO;
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
