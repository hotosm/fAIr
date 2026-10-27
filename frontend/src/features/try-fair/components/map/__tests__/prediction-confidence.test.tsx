import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import { TryFairPredictionsLayer } from "@/features/try-fair/components/map/try-fair-prediction-results";
import { TryFairMapOutputType } from "@/enums";

const params = vi.hoisted(() => ({
  mappingMode: "advanced",
  isAuthenticated: true,
}));
vi.mock("@/app/providers/auth-provider", () => ({ useAuth: () => params }));
vi.mock("@/features/try-fair/hooks/use-try-fair-params", () => ({
  useTryFairParams: () => params,
}));

beforeEach(() => {
  params.mappingMode = "advanced";
  params.isAuthenticated = true;
});
afterEach(cleanup);

function setup(outputType: TryFairMapOutputType, score: number | null = 0.87) {
  const handlers = new Map<string, (event: MapMouseEvent) => void>();
  const canvas = { style: { cursor: "" } };
  const map = {
    getStyle: () => null,
    getCanvas: () => canvas,
    queryRenderedFeatures: () => [{ properties: { score, count: 12 } }],
    on: (
      event: string,
      layer: string,
      handler: (event: MapMouseEvent) => void,
    ) => {
      handlers.set(`${event}:${layer}`, handler);
    },
    off: (event: string, layer: string) => {
      handlers.delete(`${event}:${layer}`);
    },
  };
  const props = {
    map: map as unknown as MapLibreMap,
    predictions: null,
    predictionBBox: null,
    outputType,
  };
  const view = render(<TryFairPredictionsLayer {...props} />);
  return {
    ...view,
    signOut: () => {
      params.isAuthenticated = false;
      view.rerender(<TryFairPredictionsLayer {...props} />);
    },
    changeMode: (mode: string) => {
      params.mappingMode = mode;
      view.rerender(<TryFairPredictionsLayer {...props} />);
    },
    hover: () =>
      act(() => {
        for (const [key, handler] of handlers) {
          if (key.startsWith("mousemove:"))
            handler({ point: { x: 10, y: 20 } } as MapMouseEvent);
        }
      }),
    leave: () =>
      act(() => {
        for (const [key, handler] of handlers) {
          if (key.startsWith("mouseleave:")) handler({} as MapMouseEvent);
        }
      }),
  };
}

describe("prediction confidence tooltip", () => {
  it.each([TryFairMapOutputType.POLYGON, TryFairMapOutputType.POINTS])(
    "shows confidence in Advanced mode for %s and clears it on mouse leave",
    (outputType) => {
      const view = setup(outputType);
      view.hover();
      expect(screen.getByText("Confidence")).toBeInTheDocument();
      expect(screen.getByText("87.0%")).toBeInTheDocument();
      view.leave();
      expect(screen.queryByText("Confidence")).not.toBeInTheDocument();
    },
  );
  it("updates visibility when switching between Basic and Advanced", () => {
    params.mappingMode = "basic";
    const view = setup(TryFairMapOutputType.POLYGON);
    view.hover();
    expect(screen.queryByText("Confidence")).not.toBeInTheDocument();
    view.changeMode("advanced");
    view.hover();
    expect(screen.getByText("Confidence")).toBeInTheDocument();
    view.changeMode("basic");
    expect(screen.queryByText("Confidence")).not.toBeInTheDocument();
  });
  it("hides confidence for unauthenticated users even in Advanced mode", () => {
    params.isAuthenticated = false;
    setup(TryFairMapOutputType.POLYGON).hover();
    expect(screen.queryByText("Confidence")).not.toBeInTheDocument();
  });

  it("clears the confidence tooltip when the user signs out", () => {
    const view = setup(TryFairMapOutputType.POINTS);
    view.hover();
    expect(screen.getByText("Confidence")).toBeInTheDocument();
    view.signOut();
    expect(screen.queryByText("Confidence")).not.toBeInTheDocument();
    view.hover();
    expect(screen.queryByText("Confidence")).not.toBeInTheDocument();
  });

  it("shows zero confidence without inventing a score for missing values", () => {
    const view = setup(TryFairMapOutputType.POLYGON, 0);
    view.hover();
    expect(screen.getByText("0.0%")).toBeInTheDocument();
    view.unmount();
    setup(TryFairMapOutputType.POLYGON, null).hover();
    expect(screen.queryByText("Confidence")).not.toBeInTheDocument();
  });
  it("keeps cluster counts available in Basic mode", () => {
    params.mappingMode = "basic";
    setup(TryFairMapOutputType.CLUSTER).hover();
    expect(screen.getByText("Features detected")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });
});
