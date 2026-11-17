import { describe, expect, it } from "vitest";
import { listedDefaults } from "@/features/try-fair/components/model-picker/model-details-dialog";
import type { InferenceParam } from "@/features/try-fair/api/stac";

const param = (key: string, defaultValue: unknown) =>
  ({
    key,
    value: defaultValue,
    spec: { key, default: defaultValue },
  }) as InferenceParam;

describe("model details default settings", () => {
  it("lists settings with a default and leaves out those with an empty one", () => {
    const threshold = param("confidence_threshold", 0.5);
    const tiled = param("tile_overlap", 0);
    const listed = listedDefaults([
      threshold,
      param("buildings_geojson_uri", ""),
      tiled,
    ]);
    expect(listed).toEqual([threshold, tiled]);
  });
});
