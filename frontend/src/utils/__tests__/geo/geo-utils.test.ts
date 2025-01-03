import * as geomUtils from "../../geo/geometry-utils";
import {
  createFeatureCollection,
  openInIDEditor,
  validateGeoJSONArea,
} from "../../geo/geo-utils";
import { describe, expect, it, vi } from "vitest";
import { Feature } from "geojson";

describe("geo-utils", () => {
  describe("createFeatureCollection", () => {
    it("should create an empty FeatureCollection when no features are provided", () => {
      const result = createFeatureCollection();
      expect(result).toEqual({ type: "FeatureCollection", features: [] });
    });

    it("should create a FeatureCollection with provided features", () => {
      const features: Feature[] = [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [0, 0] },
          properties: {},
        },
      ];
      const result = createFeatureCollection(features);
      expect(result).toEqual({ type: "FeatureCollection", features });
    });
  });

  describe("openInIDEditor", () => {
    it("should open a new window with the correct URL", () => {
      const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
      openInIDEditor(10, 20, 30, 40, "http://example.com", "datasetId", 1);
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining("https://www.openstreetmap.org/edit?editor=id"),
        "_blank",
        "noreferrer",
      );
      openSpy.mockRestore();
    });
  });

  describe("validateGeoJSONArea", () => {
    it("should return true if the area is smaller than MIN_TRAINING_AREA_SIZE", () => {
      const feature: Feature = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [0, 0] },
        properties: {},
      };
      vi.spyOn(geomUtils, "calculateGeoJSONArea").mockReturnValue(0);
      const result = validateGeoJSONArea(feature);
      expect(result).toBe(true);
    });

    it("should return true if the false is larger than MAX_TRAINING_AREA_SIZE", () => {
      const feature: Feature = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [0, 0] },
        properties: {},
      };
      vi.spyOn(geomUtils, "calculateGeoJSONArea").mockReturnValue(1000000);
      const result = validateGeoJSONArea(feature);
      expect(result).toBe(false);
    });

    it("should return true if the area is within the acceptable range", () => {
      const feature: Feature = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [0, 0] },
        properties: {},
      };
      vi.spyOn(geomUtils, "calculateGeoJSONArea").mockReturnValue(500);
      const result = validateGeoJSONArea(feature);
      expect(result).toBe(true);
    });
  });
});
