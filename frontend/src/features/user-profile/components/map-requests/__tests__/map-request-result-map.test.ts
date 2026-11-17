import { describe, expect, it } from "vitest";
import { resultFitBox } from "@/features/user-profile/components/map-requests/map-request-result-map";

const scene: [number, number, number, number] = [0, 0, 10, 10];
const point = (lng: number, lat: number): GeoJSON.Feature => ({
  type: "Feature",
  properties: {},
  geometry: { type: "Point", coordinates: [lng, lat] },
});

describe("resultFitBox", () => {
  it("fits to the features, not the whole requested area", () => {
    const result: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [point(4, 4), point(5, 6)],
    };

    expect(resultFitBox(result, scene)).toEqual([4, 4, 5, 6]);
  });

  it("falls back to the requested area for an empty or unloaded result", () => {
    const empty: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: [],
    };

    expect(resultFitBox(empty, scene)).toEqual(scene);
    expect(resultFitBox(null, scene)).toEqual(scene);
  });
});
