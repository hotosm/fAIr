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
  const onClose = vi.fn();
  render(
    <AdvancedModelPickerContent
      feature="buildings"
      onSelect={onSelect}
      onFeatureChange={onFeatureChange}
      onClose={onClose}
    />,
  );
  return { onSelect, onFeatureChange, onClose };
}

const card = (name: string) =>
  screen.getByRole("button", { name: new RegExp(`^${name}`) });

describe("advanced model picker", () => {
  it("opens on the current model and applies nothing by itself", () => {
    const { onSelect, onClose } = setup();
    expect(card("buildings-1")).toHaveAttribute("aria-pressed", "true");
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(params.setSelectedModelId).not.toHaveBeenCalled();
  });

  it("does not pick a model when the current one is missing", () => {
    params.selectedModelId = "missing-model";
    const { onSelect } = setup();
    expect(onSelect).not.toHaveBeenCalled();
    expect(card("buildings-1")).toHaveAttribute("aria-pressed", "false");
    expect(card("buildings-2")).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps a feature change inside the picker with no model selected", () => {
    const { onSelect, onFeatureChange, onClose } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Trees" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(card("trees-1")).toHaveAttribute("aria-pressed", "false");
    expect(onSelect).not.toHaveBeenCalled();
    expect(onFeatureChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(params.setSelectedModelId).not.toHaveBeenCalled();
  });

  it("returning to the committed feature shows its model again", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Trees" }));
    fireEvent.click(screen.getByRole("button", { name: "Buildings" }));
    expect(card("buildings-1")).toHaveAttribute("aria-pressed", "true");
  });

  it("ignores a click on the model already in use", () => {
    const { onSelect, onClose } = setup();
    fireEvent.click(card("buildings-1"));
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows pinned and unpinned models with a badge only on pinned cards", () => {
    params.mode = ModelType.IMAGERY;
    setup();
    const pinnedCard = card("buildings-1");
    const unpinnedCard = card("buildings-2");
    expect(within(pinnedCard).getByText("Pinned")).toBeInTheDocument();
    expect(
      within(pinnedCard).getByText(
        "This is a recommended model for mapping buildings.",
      ),
    ).toBeInTheDocument();
    expect(within(unpinnedCard).queryByText("Pinned")).not.toBeInTheDocument();
  });

  it.each([
    ["a model", false],
    ["a feature and model", true],
  ])(
    "in Samples mode, confirms then applies %s and closes",
    (_, changeFeature) => {
      const { onSelect, onFeatureChange, onClose } = setup();
      if (changeFeature) {
        fireEvent.click(screen.getByRole("button", { name: "Trees" }));
      }
      const expected = changeFeature ? trees[0] : buildings[1];
      fireEvent.click(card(expected.id));
      expect(screen.getByRole("dialog")).toHaveTextContent(
        "imagery and map location",
      );
      expect(onSelect).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      expect(onSelect).toHaveBeenCalledExactlyOnceWith(expected.stac);
      expect(params.setSelectedModelId).toHaveBeenCalledWith(
        expected.stac_item_id,
      );
      if (changeFeature) expect(onFeatureChange).toHaveBeenCalledWith("trees");
      else expect(onFeatureChange).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalledOnce();
    },
  );

  it("keeps the previous model when the Samples warning is cancelled", () => {
    const { onSelect, onFeatureChange, onClose } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Trees" }));
    fireEvent.click(card("trees-1"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
    expect(onFeatureChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(params.setSelectedModelId).not.toHaveBeenCalled();
  });

  it("applies straight away in custom imagery mode", () => {
    params.mode = ModelType.IMAGERY;
    const { onSelect, onFeatureChange, onClose } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Trees" }));
    fireEvent.click(card("trees-1"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(trees[0].stac);
    expect(onFeatureChange).toHaveBeenCalledWith("trees");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("remembers the warning opt-out for later changes", () => {
    setup();
    fireEvent.click(card("buildings-2"));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(localStorage.getItem("fair:skip-sample-switch-warning")).toBe(
      "true",
    );
    cleanup();
    const { onSelect } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Trees" }));
    fireEvent.click(card("trees-1"));
    expect(onSelect).toHaveBeenCalledWith(trees[0].stac);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a model's details and can use the model from there", () => {
    params.mode = ModelType.IMAGERY;
    Object.assign(buildings[1].stac.properties, {
      providers: [
        { name: "Facebook Research", roles: ["licensor"] },
        {
          name: "HOTOSM",
          roles: ["producer", "host"],
          url: "https://www.hotosm.org",
        },
      ],
    });
    Object.assign(buildings[1], { user: { osm_id: 1, username: "kshitij" } });
    const { onSelect, onClose } = setup();
    fireEvent.click(
      screen.getByRole("button", { name: "View details of buildings-2" }),
    );
    // Opening details doesn't select the model.
    expect(onSelect).not.toHaveBeenCalled();
    const details = screen.getByRole("dialog");
    expect(details).toHaveTextContent("buildings-2");
    expect(details).toHaveTextContent("Base model");
    // Only the provider with the producer role, linked to its site.
    expect(screen.getByRole("link", { name: "HOTOSM" })).toHaveAttribute(
      "href",
      "https://www.hotosm.org",
    );
    expect(details).not.toHaveTextContent("Facebook Research");
    expect(details).toHaveTextContent("Published by");
    expect(details).toHaveTextContent("kshitij");

    fireEvent.click(screen.getByRole("button", { name: "Use this model" }));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(buildings[1].stac);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("marks the model already in use instead of offering it again", () => {
    params.mode = ModelType.IMAGERY;
    setup();
    fireEvent.click(
      screen.getByRole("button", { name: "View details of buildings-1" }),
    );
    expect(screen.getByRole("button", { name: "In use" })).toBeDisabled();
  });
});
