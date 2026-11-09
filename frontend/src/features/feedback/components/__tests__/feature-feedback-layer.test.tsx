import { fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import type { Map } from "maplibre-gl";
import { describe, expect, it, vi } from "vitest";
import { FeatureFeedbackLayer } from "@/features/feedback/components/feature-feedback-layer";
import type { FeatureFeedbackState } from "@/features/feedback/hooks/use-feature-feedback";

const predictions: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

const makeMap = (hitId: number | undefined) => {
  const canvas = document.createElement("canvas");
  canvas.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 500, height: 500 }) as DOMRect;
  return {
    getCanvas: () => canvas,
    getStyle: () => ({}),
    getSource: () => undefined,
    addSource: vi.fn(),
    addLayer: vi.fn(),
    moveLayer: vi.fn(),
    getLayer: () => ({}),
    queryRenderedFeatures: vi.fn(() =>
      hitId === undefined ? [] : [{ id: hitId }],
    ),
    project: () => ({ x: 0, y: 0 }),
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as Map;
};

const makeFeedback = (): FeatureFeedbackState => ({
  verdicts: {},
  selectedId: null,
  isSaving: false,
  select: vi.fn(),
  toggleVerdict: vi.fn(),
  validFeatures: predictions,
  invalidFeatures: predictions,
});

// jsdom has no PointerEvent, so fireEvent.pointerDown drops clientX/clientY.
const pointerDown = (target: Element, clientX: number, clientY: number) =>
  target.dispatchEvent(
    new MouseEvent("pointerdown", { bubbles: true, clientX, clientY }),
  );

const setup = (hitId: number | undefined) => {
  const containerRef = createRef<HTMLDivElement>();
  const feedback = makeFeedback();
  const map = makeMap(hitId);
  const { container } = render(
    <div ref={containerRef}>
      {/* Stand-in for the draggable grid's SVG drag surface. */}
      <svg>
        <polygon data-testid="grid-surface" />
      </svg>
      <FeatureFeedbackLayer
        map={map}
        containerRef={containerRef}
        predictions={predictions}
        feedback={feedback}
        enabled
      />
    </div>,
  );
  const surface = container.querySelector("polygon")!;
  // The real grid stops pointerdown from bubbling.
  surface.addEventListener("pointerdown", (e) => e.stopPropagation());
  vi.mocked(feedback.select).mockClear();
  return { surface, feedback, map };
};

describe("FeatureFeedbackLayer", () => {
  it("selects the prediction under a click on the grid surface", () => {
    const { surface, feedback } = setup(4);
    pointerDown(surface, 10, 10);
    fireEvent.click(surface, { clientX: 11, clientY: 10 });
    expect(feedback.select).toHaveBeenCalledWith(4);
  });

  it("clears the selection when clicking empty map", () => {
    const { surface, feedback } = setup(undefined);
    pointerDown(surface, 10, 10);
    fireEvent.click(surface, { clientX: 10, clientY: 10 });
    expect(feedback.select).toHaveBeenCalledWith(null);
  });

  it("ignores the click that ends a drag", () => {
    const { surface, feedback } = setup(4);
    pointerDown(surface, 10, 10);
    fireEvent.click(surface, { clientX: 60, clientY: 10 });
    expect(feedback.select).not.toHaveBeenCalled();
  });
});
