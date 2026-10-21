import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type { BaseModelStacItem } from "@/features/try-fair/api/stac";
import {
  ModelPickerContent,
  TAB_CHOOSE,
  TAB_SAMPLES,
} from "@/features/try-fair/components/model-picker-modal";
import { useRecentImageries } from "@/features/try-fair/hooks/use-recent-imageries";
import type { RecentImageryEntry } from "@/features/try-fair/hooks/use-recent-imageries";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { ImagerySource, ModelType, TileServiceType } from "@/enums";
import type { ImagerySelection } from "@/features/try-fair/types/imagery-types";

const tryFairParams = vi.hoisted(() => ({ mode: "imagery" }));

vi.mock("@/features/try-fair/hooks/use-try-fair-params", () => ({
  useTryFairParams: () => ({
    mode: tryFairParams.mode,
    setChooseLocation: vi.fn(),
  }),
}));
vi.mock("@/features/try-fair/hooks/use-imagery-country", () => ({
  useImageryCountry: () => null,
}));
vi.mock("@/features/try-fair/api/features-to-map", () => ({
  useGetFeaturesToMap: () => ({ data: { results: [] } }),
}));
vi.mock(
  "@/features/try-fair/components/model-picker/imagery-preview-card",
  () => ({
    ImageryPreviewCard: ({
      selectedImagery,
      onChangeImagery,
    }: {
      selectedImagery: ImagerySelection;
      onChangeImagery: () => void;
    }) => (
      <div>
        <p>Imagery preview</p>
        <span data-testid="preview-url">{selectedImagery.tileUrl}</span>
        <button onClick={onChangeImagery}>Change</button>
      </div>
    ),
  }),
);
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled }: ComponentProps<"button">) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    children,
    closeDialog,
  }: {
    children: React.ReactNode;
    closeDialog: () => void;
  }) => (
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

const sample: BaseModelStacItem = {
  id: "sample-one",
  type: "Feature",
  assets: {},
  properties: {
    title: "Sample one",
    description: "",
    deprecated: false,
    "mlm:name": "Sample model",
    "mlm:architecture": "",
    "mlm:tasks": [],
    "mlm:framework": "",
    "fair:pinned": false,
    "mlm:hyperparameters": {},
    "fair:hyperparameters_spec": [],
    "fair:category": "buildings",
    keywords: ["buildings"],
    providers: [],
  },
};
const otherSample = {
  ...sample,
  id: "sample-two",
  properties: { ...sample.properties, title: "Sample two" },
};

const entry: RecentImageryEntry = {
  id: "test-imagery",
  title: "Test imagery",
  sourceLabel: "Custom",
  country: "",
  countryCode: "",
  tileUrl: "https://example.com/{z}/{x}/{y}.png",
  bounds: null,
  selection: {
    source: ImagerySource.CUSTOM,
    tileUrl: "https://example.com/{z}/{x}/{y}.png",
    tileServiceType: TileServiceType.XYZ,
    bounds: null,
  },
  thumbnailUrl: null,
  addedAt: "2026-09-30T00:00:00Z",
};

function Picker() {
  const { recentImageries, clearRecentImageries } = useRecentImageries();
  return (
    <ModelPickerContent
      selectedModel={null}
      models={[]}
      onSelect={vi.fn()}
      recentImageries={recentImageries}
      onClearRecentImageries={clearRecentImageries}
    />
  );
}

beforeEach(() => {
  tryFairParams.mode = ModelType.IMAGERY;
  localStorage.clear();
  const { result, unmount } = renderHook(() => useRecentImageries());
  act(() => {
    result.current.clearRecentImageries();
    result.current.addRecentImagery(entry);
  });
  unmount();
  useStartMappingStore.setState({
    currentModelType: ModelType.IMAGERY,
    selectedImagery: entry.selection,
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  useStartMappingStore.setState({
    currentModelType: ModelType.DEMO,
    selectedImagery: null,
  });
});

describe("Recent imagery", () => {
  it("keeps Samples first and opens the tab for the active selection", () => {
    const customView = render(<Picker />);
    const customTabs = [
      screen.getByRole("button", { name: TAB_SAMPLES }),
      screen.getByRole("button", { name: TAB_CHOOSE }),
    ];
    expect(customTabs.map((tab) => tab.textContent)).toEqual([
      TAB_SAMPLES,
      TAB_CHOOSE,
    ]);
    expect(screen.getByText("Imagery preview")).toBeInTheDocument();
    customView.unmount();

    tryFairParams.mode = ModelType.DEMO;
    useStartMappingStore.setState({
      currentModelType: ModelType.DEMO,
      selectedImagery: null,
    });
    render(<Picker />);
    expect(screen.getByText("No models available")).toBeInTheDocument();
  });

  it("replaces an unapplied recent choice with the newer browser selection", () => {
    const onApplyRecentImagery = vi.fn();
    const onApplyStagedImagery = vi.fn();
    const onChooseImagery = vi.fn();
    const props = {
      selectedModel: null,
      models: [],
      onSelect: vi.fn(),
      recentImageries: [entry],
      onClearRecentImageries: vi.fn(),
      onApplyRecentImagery,
      onApplyStagedImagery,
      onChooseImagery,
    };
    const view = render(<ModelPickerContent {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Recent" }));
    fireEvent.click(screen.getByRole("button", { name: /Test imagery/ }));
    fireEvent.click(screen.getByRole("button", { name: "Change" }));
    expect(onChooseImagery).toHaveBeenCalledOnce();

    const browserSelection: ImagerySelection = {
      ...entry.selection,
      tileUrl: "https://example.com/new/{z}/{x}/{y}.png",
    };
    view.rerender(
      <ModelPickerContent {...props} stagedImagery={browserSelection} />,
    );
    expect(screen.getByTestId("preview-url")).toHaveTextContent(
      browserSelection.tileUrl,
    );
    expect(onApplyStagedImagery).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onApplyStagedImagery).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onApplyStagedImagery).toHaveBeenCalledWith(browserSelection);
    expect(onApplyRecentImagery).not.toHaveBeenCalled();
  });

  it.each(["staged", "recent"] as const)(
    "confirms %s imagery changes and preserves the staged selection on Cancel",
    (source) => {
      const selection: ImagerySelection = {
        ...entry.selection,
        tileUrl: "https://example.com/new/{z}/{x}/{y}.png",
      };
      const recent = { ...entry, tileUrl: selection.tileUrl, selection };
      const onApply = vi.fn();
      const onClose = vi.fn();
      render(
        <ModelPickerContent
          selectedModel={null}
          models={[]}
          onSelect={vi.fn()}
          onClose={onClose}
          stagedImagery={source === "staged" ? selection : null}
          recentImageries={[recent]}
          onApplyStagedImagery={onApply}
          onApplyRecentImagery={onApply}
          onClearRecentImageries={vi.fn()}
        />,
      );
      if (source === "recent") {
        fireEvent.click(screen.getByRole("button", { name: "Recent" }));
        fireEvent.click(screen.getByRole("button", { name: /Test imagery/ }));
      }
      fireEvent.click(screen.getByRole("button", { name: "Apply" }));
      expect(screen.getByRole("dialog")).toHaveTextContent("custom setup");
      expect(onApply).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onApply).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();
      fireEvent.click(screen.getByRole("button", { name: "Apply" }));
      fireEvent.click(screen.getByRole("checkbox"));
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      expect(onApply).toHaveBeenCalledExactlyOnceWith(
        source === "staged" ? selection : recent,
      );
      expect(onClose).toHaveBeenCalledOnce();
      expect(localStorage.getItem("fair:skip-sample-switch-warning")).toBe(
        "true",
      );
    },
  );

  it("honors the saved warning preference when applying custom imagery", () => {
    localStorage.setItem("fair:skip-sample-switch-warning", "true");
    const selection: ImagerySelection = {
      ...entry.selection,
      tileUrl: "https://example.com/new/{z}/{x}/{y}.png",
    };
    const onApply = vi.fn();
    render(
      <ModelPickerContent
        selectedModel={null}
        models={[]}
        onSelect={vi.fn()}
        stagedImagery={selection}
        onApplyStagedImagery={onApply}
        onClearRecentImageries={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onApply).toHaveBeenCalledWith(selection);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("labels the back button with its destination and returns to the preview", () => {
    render(<Picker />);
    fireEvent.click(screen.getByRole("button", { name: "Recent" }));
    expect(
      screen.getByRole("heading", { name: "Recent imagery" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Test imagery")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to imagery" }));
    expect(screen.getByText("Imagery preview")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recent" })).toBeInTheDocument();
  });

  it("clears persisted history without changing the selected imagery or other storage", () => {
    localStorage.setItem("unrelated-setting", "keep");
    const view = render(<Picker />);
    fireEvent.click(screen.getByRole("button", { name: "Recent" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear recent" }));

    expect(screen.getByText("No recent imageries yet.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Clear recent" }),
    ).not.toBeInTheDocument();
    expect(localStorage.getItem("fair:recent-imageries")).toBe("[]");
    expect(localStorage.getItem("unrelated-setting")).toBe("keep");
    expect(useStartMappingStore.getState().selectedImagery).toEqual(
      entry.selection,
    );

    view.unmount();
    render(<Picker />);
    fireEvent.click(screen.getByRole("button", { name: "Recent" }));
    expect(screen.getByText("No recent imageries yet.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to imagery" }));
    expect(screen.getByText("Imagery preview")).toBeInTheDocument();
  });

  it("updates all subscribers and receives cleared history from another tab", () => {
    const first = renderHook(() => useRecentImageries());
    const second = renderHook(() => useRecentImageries());
    act(() => first.result.current.clearRecentImageries());
    expect(first.result.current.recentImageries).toEqual([]);
    expect(second.result.current.recentImageries).toEqual([]);

    act(() => first.result.current.addRecentImagery(entry));
    expect(second.result.current.recentImageries).toHaveLength(1);
    act(() => {
      localStorage.setItem("fair:recent-imageries", "[]");
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "fair:recent-imageries",
          newValue: "[]",
        }),
      );
    });
    expect(first.result.current.recentImageries).toEqual([]);
    expect(second.result.current.recentImageries).toEqual([]);
  });
});

describe("Sample switching", () => {
  function renderSamples(selectedModel: BaseModelStacItem | null = sample) {
    tryFairParams.mode = ModelType.DEMO;
    useStartMappingStore.setState({
      currentModelType: ModelType.DEMO,
      selectedImagery: null,
    });
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const view = render(
      <ModelPickerContent
        selectedModel={selectedModel}
        models={[sample, otherSample]}
        onSelect={onSelect}
        onClose={onClose}
        onClearRecentImageries={vi.fn()}
      />,
    );
    return { ...view, onSelect, onClose };
  }

  it("hides Apply only on Samples and ignores the current sample", () => {
    const { onSelect } = renderSamples();
    expect(
      screen.queryByRole("button", { name: "Apply" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Sample one/ }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: TAB_CHOOSE }));
    expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();
  });

  it("leaves the selection and preference unchanged on Cancel or dismissal", () => {
    const { onSelect, onClose } = renderSamples();
    fireEvent.click(screen.getByRole("button", { name: /Sample two/ }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(localStorage.getItem("fair:skip-sample-switch-warning")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Sample two/ }));
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("switches only after Continue and keeps warning by default", () => {
    const { onSelect, onClose } = renderSamples();
    fireEvent.click(screen.getByRole("button", { name: /Sample two/ }));
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onSelect).toHaveBeenCalledWith(otherSample);
    expect(onClose).toHaveBeenCalledOnce();
    expect(localStorage.getItem("fair:skip-sample-switch-warning")).toBeNull();
  });

  it("remembers opting out across picker mounts", () => {
    const first = renderSamples();
    fireEvent.click(screen.getByRole("button", { name: /Sample two/ }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(localStorage.getItem("fair:skip-sample-switch-warning")).toBe(
      "true",
    );
    first.unmount();
    const second = renderSamples();
    fireEvent.click(screen.getByRole("button", { name: /Sample two/ }));
    expect(second.onSelect).toHaveBeenCalledWith(otherSample);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("applies an initial sample without warning", () => {
    const { onSelect } = renderSamples(null);
    fireEvent.click(screen.getByRole("button", { name: /Sample one/ }));
    expect(onSelect).toHaveBeenCalledWith(sample);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
