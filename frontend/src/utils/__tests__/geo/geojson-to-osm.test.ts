import { describe, expect, it } from "vitest";
import { FeatureCollection } from "geojson";
import { geojsonToOsmPolygons } from "../../geo/geojson-to-osm";

describe("geojsonToOsmPolygons", () => {
  it("should convert a valid GeoJSON FeatureCollection to OSM XML", () => {
    const geojson: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [102.0, 0.0],
                [103.0, 1.0],
                [104.0, 0.0],
                [102.0, 0.0],
              ],
            ],
          },
          properties: {
            name: "Test Polygon",
          },
        },
      ],
    };

    const osmXml = geojsonToOsmPolygons(geojson);
    expect(osmXml).toContain('<osm version="0.6" generator="fAIr(v0.1)">');
    expect(osmXml).toContain("<node");
    expect(osmXml).toContain("<way");
    expect(osmXml).toContain("<relation");
  });

  it("should throw an error for invalid GeoJSON FeatureCollection", () => {
    const invalidGeojson: any = {
      type: "InvalidType",
      features: [],
    };

    expect(() => geojsonToOsmPolygons(invalidGeojson)).toThrow(
      "Invalid GeoJSON FeatureCollection",
    );
  });

  it("should skip unsupported geometry types", () => {
    const geojson: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [102.0, 0.5],
          },
          properties: {},
        },
      ],
    };

    const osmXml = geojsonToOsmPolygons(geojson);
    expect(osmXml).not.toContain("<node");
    expect(osmXml).not.toContain("<way");
    expect(osmXml).not.toContain("<relation");
  });

  it("should handle polygons with multiple rings", () => {
    const geojson: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [102.0, 0.0],
                [103.0, 1.0],
                [104.0, 0.0],
                [102.0, 0.0],
              ],
              [
                [100.0, 0.0],
                [101.0, 1.0],
                [102.0, 0.0],
                [100.0, 0.0],
              ],
            ],
          },
          properties: {
            name: "Test Polygon with Rings",
          },
        },
      ],
    };

    const osmXml = geojsonToOsmPolygons(geojson);
    expect(osmXml).toContain('<osm version="0.6" generator="fAIr(v0.1)">');
    expect(osmXml).toContain("<node");
    expect(osmXml).toContain("<way");
    expect(osmXml).toContain("<relation");
  });
});
