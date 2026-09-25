import { describe, expect, it } from "vitest";
import type { BaseModelStacItem } from "@/features/try-fair/api/stac";
import {
  buildClassColorExpression,
  buildClassLegendItems,
  DEFAULT_PREDICTION_COLOR,
  getPredictionClassStyle,
} from "@/features/try-fair/utils/prediction-classes";

const modelWithClasses = (classes: unknown[], outputName = "damage") =>
  ({
    id: "test-model",
    properties: {
      "mlm:output": [{ name: outputName, "classification:classes": classes }],
    },
  }) as unknown as BaseModelStacItem;

const damageModel = modelWithClasses([
  { name: "no-damage", title: "No damage", color_hint: "43A047" },
  { name: "destroyed", title: "Destroyed", color_hint: "e53935" },
]);

const featureWith = (properties: Record<string, unknown>) => ({
  type: "Feature" as const,
  geometry: { type: "Point" as const, coordinates: [0, 0] },
  properties,
});

describe("getPredictionClassStyle", () => {
  it("keys classes on the output name and prefixes colour hints with #", () => {
    expect(getPredictionClassStyle(damageModel)).toEqual({
      property: "damage",
      classes: [
        { name: "no-damage", label: "No damage", color: "#43A047" },
        { name: "destroyed", label: "Destroyed", color: "#e53935" },
      ],
    });
  });

  it("returns null for a model whose classes carry no colour hints", () => {
    const buildingModel = modelWithClasses(
      [{ name: "building" }],
      "segmentation logits",
    );

    expect(getPredictionClassStyle(buildingModel)).toBeNull();
  });

  it("returns null when no model is selected", () => {
    expect(getPredictionClassStyle(null)).toBeNull();
  });

  it("throws on a colour hint that is not six hex digits", () => {
    const model = modelWithClasses([{ name: "destroyed", color_hint: "red" }]);

    expect(() => getPredictionClassStyle(model)).toThrow(/invalid color_hint/);
  });

  it("throws when class names repeat", () => {
    const model = modelWithClasses([
      { name: "destroyed", color_hint: "E53935" },
      { name: "destroyed", color_hint: "FB8C00" },
    ]);

    expect(() => getPredictionClassStyle(model)).toThrow(/must be unique/);
  });

  it("throws when only some classes carry a colour hint", () => {
    const model = modelWithClasses([
      { name: "destroyed", color_hint: "E53935" },
      { name: "no-damage" },
    ]);

    expect(() => getPredictionClassStyle(model)).toThrow(/every class/);
  });
});

describe("buildClassColorExpression", () => {
  it("matches the class property and falls back to the default colour", () => {
    const style = getPredictionClassStyle(damageModel)!;

    expect(buildClassColorExpression(style)).toEqual([
      "match",
      ["get", "damage"],
      "no-damage",
      "#43A047",
      "destroyed",
      "#e53935",
      DEFAULT_PREDICTION_COLOR,
    ]);
  });
});

describe("buildClassLegendItems", () => {
  const legendRows = (features: ReturnType<typeof featureWith>[]) =>
    buildClassLegendItems(
      getPredictionClassStyle(damageModel)!,
      { type: "FeatureCollection", features },
      "square",
      0.3,
    ).map((item) => [item.label, item.fillColor]);

  it("counts each class present, in class order", () => {
    expect(
      legendRows([
        featureWith({ damage: "destroyed" }),
        featureWith({ damage: "no-damage" }),
        featureWith({ damage: "destroyed" }),
      ]),
    ).toEqual([
      ["No damage (1)", "#43A047"],
      ["Destroyed (2)", "#e53935"],
    ]);
  });

  it("counts unknown, numeric and missing class values as unclassified", () => {
    expect(
      legendRows([
        featureWith({ damage: "flooded" }),
        featureWith({ damage: 3 }),
        featureWith({}),
      ]),
    ).toEqual([["Unclassified (3)", DEFAULT_PREDICTION_COLOR]]);
  });
});
