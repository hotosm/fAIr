import { describe, expect, it } from "vitest";
import type { FeedbackRecord } from "@/features/feedback/api/feedback";
import { FeatureVerdict, FeedbackAction } from "@/features/feedback/types";
import {
  buildFeedbackOverlay,
  collectFeaturesByVerdict,
  getFeatureAnchor,
  getGeometryKey,
  matchRecordsToFeatures,
  SELECTED_STATUS,
} from "@/features/feedback/utils/feature-feedback";

const square = (x: number, y: number): GeoJSON.Feature => ({
  type: "Feature",
  properties: { id: `${x},${y}` },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [x, y],
        [x + 2, y],
        [x + 2, y + 1],
        [x, y + 1],
        [x, y],
      ],
    ],
  },
});

const predictions: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [square(0, 0), square(10, 10), square(20, 20)],
};

describe("buildFeedbackOverlay", () => {
  it("includes marked features and the selection, with verdict winning", () => {
    const overlay = buildFeedbackOverlay(
      predictions,
      { 0: FeatureVerdict.VALID, 2: FeatureVerdict.INVALID },
      0,
    );
    expect(overlay.features.map((f) => f.properties?.status)).toEqual([
      FeatureVerdict.VALID,
      FeatureVerdict.INVALID,
    ]);
  });

  it("marks an unrated selection as selected and skips unknown ids", () => {
    const overlay = buildFeedbackOverlay(
      predictions,
      { 9: FeatureVerdict.VALID },
      1,
    );
    expect(overlay.features).toHaveLength(1);
    expect(overlay.features[0].properties?.status).toBe(SELECTED_STATUS);
  });
});

describe("collectFeaturesByVerdict", () => {
  it("returns the original features for a verdict", () => {
    const verdicts = { 1: FeatureVerdict.INVALID, 2: FeatureVerdict.VALID };
    const invalid = collectFeaturesByVerdict(
      predictions,
      verdicts,
      FeatureVerdict.INVALID,
    );
    expect(invalid.features).toEqual([predictions.features[1]]);
  });
});

describe("getFeatureAnchor", () => {
  it("returns the bottom-centre of the feature bbox", () => {
    expect(getFeatureAnchor(square(10, 10).geometry)).toEqual([11, 10]);
  });

  it("handles multipolygons and missing geometry", () => {
    const multi: GeoJSON.MultiPolygon = {
      type: "MultiPolygon",
      coordinates: [
        (square(0, 5).geometry as GeoJSON.Polygon).coordinates,
        (square(4, 2).geometry as GeoJSON.Polygon).coordinates,
      ],
    };
    expect(getFeatureAnchor(multi)).toEqual([3, 2]);
    expect(getFeatureAnchor(null)).toBeNull();
  });
});

describe("matchRecordsToFeatures", () => {
  const square = (x: number): GeoJSON.Polygon => ({
    type: "Polygon",
    coordinates: [
      [
        [x, 0],
        [x + 1, 0],
        [x + 1, 1],
        [x, 0],
      ],
    ],
  });
  const predictions: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [0, 5].map((x) => ({
      type: "Feature",
      properties: {},
      geometry: square(x),
    })),
  };

  const record = (id: number, geometry: GeoJSON.Polygon): FeedbackRecord => ({
    type: "Feature",
    geometry,
    properties: {
      id,
      stac_id: "buildings",
      action: FeedbackAction.ACCEPT,
      comments: "",
      config: {},
      created_at: "2026-11-09T00:00:00Z",
    },
  });

  it("matches records to features by geometry, newest record first", () => {
    const newest = record(2, square(5));
    const matched = matchRecordsToFeatures(predictions, [
      newest,
      record(1, square(5)),
      record(3, square(9)),
    ]);
    expect([...matched.entries()]).toEqual([[1, newest]]);
  });

  it("matches when the saved geometry's keys come in a different order", () => {
    const reordered = {
      coordinates: square(0).coordinates,
      type: "Polygon",
    } as GeoJSON.Polygon;
    const matched = matchRecordsToFeatures(predictions, [record(4, reordered)]);
    expect(matched.get(0)?.properties.id).toBe(4);
  });

  it("builds keys that ignore sub-centimetre float noise", () => {
    expect(
      getGeometryKey({ type: "Point", coordinates: [1.00000001, 2] }),
    ).toBe(getGeometryKey({ type: "Point", coordinates: [1, 2] }));
    expect(getGeometryKey({ type: "Point", coordinates: [1, 2] })).not.toBe(
      getGeometryKey({ type: "Point", coordinates: [1.0001, 2] }),
    );
  });
});
