import { describe, expect, it } from "vitest";
import { Feature, Polygon } from "geojson";
import { TModelPredictionsConfig } from "@/types";

import {
  calculateGeoJSONArea,
  formatAreaInAppropriateUnit,
  getGeoJSONFeatureBounds,
  distance,
  approximateGeom,
  snapGeoJSONPolygonToClosestTile,
  handleConflation,
} from "../../geo/geometry-utils";

describe("geometry-utils", () => {
  it("should calculate the area of a GeoJSON Feature", () => {
    const feature: Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-10, -10],
            [10, -10],
            [10, 10],
            [-10, 10],
            [-10, -10],
          ],
        ],
      },
      properties: {},
    };
    const result = calculateGeoJSONArea(feature);
    expect(result).toBeGreaterThan(0);
  });

  it("should format area into human readable string", () => {
    const result = formatAreaInAppropriateUnit(12222000);
    expect(result).toBe("12.2km²");
  });

  it("should compute the bounding box of a GeoJSON Feature", () => {
    const feature: Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-10, -10],
            [10, -10],
            [10, 10],
            [-10, 10],
            [-10, -10],
          ],
        ],
      },
      properties: {},
    };
    const result = getGeoJSONFeatureBounds(feature);
    expect(result).toEqual([-10, -10, 10, 10]);
  });

  it("should calculate the distance between two geographic coordinates", () => {
    const result = distance(0, 0, 10, 10, "K");
    expect(result).toBeGreaterThan(0);
  });

  it("should approximate coordinates to the nearest corner tiles", () => {
    const coordinates: [number, number][] = [
      [10, 10],
      [20, 20],
    ];
    const result = approximateGeom(coordinates);
    expect(result.length).toBe(2);
  });

  it("should snap GeoJSON polygon to closest tile", () => {
    const polygon: Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [10, 10],
          [20, 20],
          [30, 30],
          [10, 10],
        ],
      ],
    };
    const result = snapGeoJSONPolygonToClosestTile(polygon);
    expect(result.coordinates[0].length).toBe(4);
  });

  it("should handle conflation of new features with existing predictions", () => {
    const existingPredictions = {
      all: [],
      accepted: [],
      rejected: [],
    };
    const newFeatures: Feature[] = [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [10, 10],
              [20, 20],
              [30, 30],
              [10, 10],
            ],
          ],
        },
        properties: {},
      },
    ];
    const predictionConfig: TModelPredictionsConfig = {
      area_threshold: 6,
      bbox: [0, 0, 0, 0],
      checkpoint: "",
      confidence: 95,
      max_angle_change: 0,
      model_id: "",
      use_josm_q: true,
      skew_tolerance: 0,
      zoom_level: 21,
      source: "",
      tolerance: 0,
    };
    const result = handleConflation(
      existingPredictions,
      newFeatures,
      predictionConfig,
    );
    expect(result.all.length).toBe(1);
  });
});
