import {
  XYZ_TILESERVER_URL_REGEX_PATTERN,
  TMS_TILESERVER_URL_REGEX_PATTERN,
  TILEJSON_TILESERVER_URL_REGEX_PATTERN,
  VALID_CHARACTER_PATTERN,
  VALID_MODEL_CHECKPOINT_PATH,
  OPENAERIALMAP_TILESERVER_URL_REGEX_PATTERN,
} from "@/utils/regex-utils";

import { describe, it, expect } from "vitest";

describe("Regex Patterns", () => {
  it("XYZ_TILESERVER_URL_REGEX_PATTERN matches valid XYZ URLs", () => {
    expect(
      XYZ_TILESERVER_URL_REGEX_PATTERN.test(
        "http://example.com/tiles/{z}/{x}/{y}?format=png",
      ),
    ).toBe(true);

    expect(
      XYZ_TILESERVER_URL_REGEX_PATTERN.test(
        "https://example.com/tiles/{z}/{x}/{y}?format=jpg",
      ),
    ).toBe(true);

    expect(
      XYZ_TILESERVER_URL_REGEX_PATTERN.test(
        "https://example.com/tiles/path/{z}/{x}/{y}",
      ),
    ).toBe(true);

    expect(
      XYZ_TILESERVER_URL_REGEX_PATTERN.test(
        "http://example.com/tiles/{z}/{x}/{-y}?format=png",
      ),
    ).toBe(false); // -y is TMS, not XYZ

    expect(
      XYZ_TILESERVER_URL_REGEX_PATTERN.test(
        "http://example.com/tiles/{z}/{x}/{y}?format=gif",
      ),
    ).toBe(true);

    expect(
      XYZ_TILESERVER_URL_REGEX_PATTERN.test(
        "https://c.tiles.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg?access_token=pk.abc123",
      ),
    ).toBe(true); // supports @2x suffix after {y}
  });
  it("TMS_TILESERVER_URL_REGEX_PATTERN matches valid TMS URLs", () => {
    expect(
      TMS_TILESERVER_URL_REGEX_PATTERN.test(
        "http://example.com/tiles/{z}/{x}/{-y}?format=png",
      ),
    ).toBe(true);
    expect(
      TMS_TILESERVER_URL_REGEX_PATTERN.test(
        "https://example.com/tiles/{z}/{x}/{-y}?format=jpg",
      ),
    ).toBe(true);
    expect(
      TMS_TILESERVER_URL_REGEX_PATTERN.test(
        "https://example.com/tiles/path/{z}/{x}/{-y}",
      ),
    ).toBe(true);
    expect(
      TMS_TILESERVER_URL_REGEX_PATTERN.test(
        "http://example.com/tiles/{z}/{x}/{y}?format=png",
      ),
    ).toBe(false); // not TMS if {y} not {-y}
  });

  it("TILEJSON_TILESERVER_URL_REGEX_PATTERN matches valid TileJSON URLs", () => {
    expect(
      TILEJSON_TILESERVER_URL_REGEX_PATTERN.test(
        "http://example.com/tiles.json",
      ),
    ).toBe(true);
    expect(
      TILEJSON_TILESERVER_URL_REGEX_PATTERN.test(
        "https://example.com/path/to/tiles.json",
      ),
    ).toBe(true);
    expect(
      TILEJSON_TILESERVER_URL_REGEX_PATTERN.test(
        "https://clarity.maptiles.arcgis.tiles.json",
      ),
    ).toBe(false);
    expect(
      TILEJSON_TILESERVER_URL_REGEX_PATTERN.test(
        "https://example.com/tiles.json?token=abc",
      ),
    ).toBe(true);
    expect(
      TILEJSON_TILESERVER_URL_REGEX_PATTERN.test(
        "http://example.com/tiles.png",
      ),
    ).toBe(false);
    expect(
      TILEJSON_TILESERVER_URL_REGEX_PATTERN.test(
        "ftp://example.com/tiles.json",
      ),
    ).toBe(false); // wrong protocol
  });

  it("VALID_CHARACTER_PATTERN matches valid strings", () => {
    expect(VALID_CHARACTER_PATTERN.test("Hello123")).toBe(true);
    expect(VALID_CHARACTER_PATTERN.test("Hello World")).toBe(true);
    expect(VALID_CHARACTER_PATTERN.test("Hello@World")).toBe(false);
  });

  it("VALID_MODEL_CHECKPOINT_PATH matches valid URLs", () => {
    expect(
      VALID_MODEL_CHECKPOINT_PATH.test("http://example.com/model.onnx"),
    ).toBe(true);
    expect(
      VALID_MODEL_CHECKPOINT_PATH.test(
        "https://example.com/path/to/model.tflite",
      ),
    ).toBe(true);
    expect(
      VALID_MODEL_CHECKPOINT_PATH.test("http://example.com/model.pb"),
    ).toBe(false);
  });

  it("OPENAERIALMAP_TILESERVER_URL_REGEX_PATTERN matches valid URLs", () => {
    expect(
      OPENAERIALMAP_TILESERVER_URL_REGEX_PATTERN.test(
        "https://tiles.openaerialmap.org/abc123/1/xyz456/{z}/{x}/{y}",
      ),
    ).toBe(true);
    expect(
      OPENAERIALMAP_TILESERVER_URL_REGEX_PATTERN.test(
        "https://tiles.openaerialmap.org/abc123/1/xyz456/{z}/{x}/{-y}",
      ),
    ).toBe(false);
    expect(
      OPENAERIALMAP_TILESERVER_URL_REGEX_PATTERN.test(
        "http://tiles.openaerialmap.org/abc123/1/xyz456/{z}/{x}/{y}",
      ),
    ).toBe(false);
  });
});
