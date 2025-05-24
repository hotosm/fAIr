import { Feature } from "geojson";
import { describe, expect, it } from "vitest";

import { TModelPredictionFeature, TModelPredictionsConfig } from "@/types";

import {
  calculateGeoJSONArea,
  featureIsWithinBounds,
  formatAreaInAppropriateUnit,
  getGeoJSONFeatureBounds,
  handleConflation,
} from "@/utils";
import { LngLatBoundsLike } from "maplibre-gl";
import { PredictedFeatureStatus } from "@/enums/start-mapping";

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
  source_imagery: "",
};

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
});

describe("handleConflation", () => {
  it("should add a new untouched feature", () => {
    const existingFeatures: TModelPredictionFeature[] = [];
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

    const result = handleConflation(
      existingFeatures,
      newFeatures,
      predictionConfig,
    );
    expect(result.length).toBe(1);
    expect(result[0].properties.status).toBe("untouched");
  });

  it("should replace an intersecting untouched feature", () => {
    const existingFeatures: TModelPredictionFeature[] = [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [15, 15],
              [25, 25],
              [35, 35],
              [15, 15],
            ],
          ],
        },
        properties: {
          config: predictionConfig,
          status: PredictedFeatureStatus.UNTOUCHED,
          id: "old-id",
        },
      },
    ];

    const newFeatures: Feature[] = [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [20, 30],
              [25, 25],
              [35, 35],
              [20, 30],
            ],
          ],
        },
        properties: {},
      },
    ];

    const result = handleConflation(
      existingFeatures,
      newFeatures,
      predictionConfig,
    );
    expect(result.length).toBe(1);
    expect(result[0].properties.status).toBe("untouched");
    expect(result[0].properties.id).toBe("old-id"); // replaced by id
  });

  it("should discard a feature intersecting accepted", () => {
    const existingFeatures: TModelPredictionFeature[] = [
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
        properties: {
          config: predictionConfig,
          status: PredictedFeatureStatus.ACCEPTED,
          id: "accepted-id",
        },
      },
    ];

    const newFeatures: Feature[] = [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [15, 15],
              [25, 25],
              [35, 35],
              [15, 15],
            ],
          ],
        },
        properties: {},
      },
    ];

    const result = handleConflation(
      existingFeatures,
      newFeatures,
      predictionConfig,
    );
    expect(result.length).toBe(1); // only the accepted one remains
    expect(result[0].properties.id).toBe("accepted-id");
  });

  it("should discard a feature intersecting rejected", () => {
    const existingFeatures: TModelPredictionFeature[] = [
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
        properties: {
          config: predictionConfig,
          status: PredictedFeatureStatus.REJECTED,
          id: "rejected-id",
        },
      },
    ];

    const newFeatures: Feature[] = [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [15, 15],
              [25, 25],
              [35, 35],
              [15, 15],
            ],
          ],
        },
        properties: {},
      },
    ];

    const result = handleConflation(
      existingFeatures,
      newFeatures,
      predictionConfig,
    );
    expect(result.length).toBe(1); // only the rejected one remains
    expect(result[0].properties.id).toBe("rejected-id");
  });

  it("should allow overlapping new features", () => {
    const existingFeatures: TModelPredictionFeature[] = [];

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
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [15, 15],
              [25, 25],
              [35, 35],
              [15, 15],
            ],
          ],
        },
        properties: {},
      },
    ];

    const result = handleConflation(
      existingFeatures,
      newFeatures,
      predictionConfig,
    );
    expect(result.length).toBe(2);
    expect(result.every((f) => f.properties.status === "untouched")).toBe(true);
  });
});

describe("featureIsWithinBounds", () => {
  it("should return true if feature is within bounds", () => {
    const bounds = [-10, -10, 10, 10] as LngLatBoundsLike;
    const feature: Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-5, -5],
            [5, -5],
            [5, 5],
            [-5, 5],
            [-5, -5],
          ],
        ],
      },
      properties: {},
    };
    const result = featureIsWithinBounds(bounds, feature);
    expect(result).toBe(true);
  });

  it("should return false if feature is outside bounds", () => {
    const bounds = [-10, -10, 10, 10] as LngLatBoundsLike;
    const feature: Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [15, 15],
            [25, 15],
            [25, 25],
            [15, 25],
            [15, 15],
          ],
        ],
      },
      properties: {},
    };
    const result = featureIsWithinBounds(bounds, feature);
    expect(result).toBe(false);
  });

  it("should return false if feature intersects bounds but is not fully within", () => {
    const bounds = [-10, -10, 10, 10] as LngLatBoundsLike;
    const feature: Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [5, 5],
            [15, 5],
            [15, 15],
            [5, 15],
            [5, 5],
          ],
        ],
      },
      properties: {},
    };
    const result = featureIsWithinBounds(bounds, feature);
    expect(result).toBe(false);
  });

  it("should return true if feature is exactly on the bounds", () => {
    const bounds = [-10, -10, 10, 10] as LngLatBoundsLike;
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
    const result = featureIsWithinBounds(bounds, feature);
    expect(result).toBe(true);
  });

  it("should return false if feature is partially within bounds", () => {
    const bounds = [-10, -10, 10, 10] as LngLatBoundsLike;
    const feature: Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-15, -15],
            [5, -15],
            [5, 5],
            [-15, 5],
            [-15, -15],
          ],
        ],
      },
      properties: {},
    };
    const result = featureIsWithinBounds(bounds, feature);
    expect(result).toBe(false);
  });
});
