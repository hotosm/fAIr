import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Map as MapLibreMap } from "maplibre-gl";
import { TryFairPredictionsLayer } from "@/features/try-fair/components/map/try-fair-prediction-results";
import { TryFairMapOutputType } from "@/enums";
import type { PredictionClassStyle } from "@/features/try-fair/utils/prediction-classes";

vi.mock("@/features/try-fair/hooks/use-try-fair-params", () => ({
  useTryFairParams: () => ({ mappingMode: "basic" }),
}));
vi.mock("@/app/providers/auth-provider", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

afterEach(cleanup);

function renderPolygon(classStyle?: PredictionClassStyle) {
  const map = {
    getStyle: () => ({}),
    getLayer: vi.fn(),
    getSource: vi.fn(),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    removeSource: vi.fn(),
  };
  const predictions: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { class: 1 },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 0],
            ],
          ],
        },
      },
    ],
  };
  render(
    <TryFairPredictionsLayer
      map={map as unknown as MapLibreMap}
      predictions={predictions}
      predictionBBox={null}
      outputType={TryFairMapOutputType.POLYGON}
      classStyle={classStyle}
    />,
  );
  return map;
}

describe("TryFairPredictionsLayer polygon outline", () => {
  it("uses the class colours when the model declares them", () => {
    const map = renderPolygon({
      property: "class",
      colored: true,
      variables: [],
      classes: [
        { value: 1, label: "Building", color: "#ff0000", nodata: false },
      ],
    });
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "try-fair-predictions-outline",
        paint: {
          "line-color": ["match", ["get", "class"], 1, "#ff0000", "#A243DC"],
          "line-width": 1.5,
        },
      }),
    );
  });

  it("keeps the default prediction colour without class colours", () => {
    const map = renderPolygon();
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "try-fair-predictions-outline",
        paint: { "line-color": "#A243DC", "line-width": 1.5 },
      }),
    );
  });
});
