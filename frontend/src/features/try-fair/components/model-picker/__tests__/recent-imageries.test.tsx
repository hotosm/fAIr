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
import { ModelPickerContent } from "@/features/try-fair/components/model-picker-modal";
import { useRecentImageries } from "@/features/try-fair/hooks/use-recent-imageries";
import type { RecentImageryEntry } from "@/features/try-fair/hooks/use-recent-imageries";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { ImagerySource, ModelType, TileServiceType } from "@/enums";
import type { ImagerySelection } from "@/features/try-fair/types/imagery-types";

vi.mock("@/features/try-fair/hooks/use-try-fair-params", () => ({
  useTryFairParams: () => ({ mode: "imagery", setChooseLocation: vi.fn() }),
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
    expect(onApplyStagedImagery).toHaveBeenCalledWith(browserSelection);
    expect(onApplyRecentImagery).not.toHaveBeenCalled();
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
