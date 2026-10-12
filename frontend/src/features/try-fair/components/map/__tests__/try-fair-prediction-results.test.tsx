import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Map } from "maplibre-gl";
import { TryFairMapOutputType } from "@/enums/try-fair";
import { TryFairPredictionsLayer } from "@/features/try-fair/components/map/try-fair-prediction-results";
import {
  buildClassColorExpression,
  DEFAULT_PREDICTION_COLOR,
  type PredictionClassStyle,
} from "@/features/try-fair/utils/prediction-classes";

const predictions: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
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
      properties: { damage_class: 3 },
    },
  ],
};

const damageStyle: PredictionClassStyle = {
  property: "damage_class",
  colored: true,
  variables: [],
  classes: [
    { value: 0, label: "No damage", color: "#43a047", nodata: false },
    { value: 3, label: "Destroyed", color: "#e53935", nodata: false },
  ],
};

const fakeMap = () => {
  const layers: { id: string; paint?: Record<string, unknown> }[] = [];
  const map = {
    getStyle: () => ({}),
    getLayer: () => undefined,
    getSource: () => undefined,
    removeLayer: vi.fn(),
    removeSource: vi.fn(),
    addSource: vi.fn(),
    addLayer: (layer: { id: string; paint?: Record<string, unknown> }) =>
      layers.push(layer),
    on: vi.fn(),
    off: vi.fn(),
    getCanvas: () => ({ style: {} }),
  };
  return { map: map as unknown as Map, layers };
};

const outlineColor = (classStyle: PredictionClassStyle | null) => {
  const { map, layers } = fakeMap();
  render(
    <TryFairPredictionsLayer
      map={map}
      predictions={predictions}
      predictionBBox={[0, 0, 1, 1]}
      outputType={TryFairMapOutputType.POLYGON}
      classStyle={classStyle}
    />,
  );
  return layers.find((layer) => layer.id === "try-fair-predictions-outline")
    ?.paint?.["line-color"];
};

describe("TryFairPredictionsLayer polygon outline", () => {
  afterEach(cleanup);

  it("uses the class colours when the model declares them", () => {
    expect(outlineColor(damageStyle)).toEqual(
      buildClassColorExpression(damageStyle),
    );
  });

  it("keeps the default prediction colour without class colours", () => {
    expect(outlineColor(null)).toBe(DEFAULT_PREDICTION_COLOR);
  });
});
