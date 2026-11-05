import { afterEach, describe, expect, it, vi } from "vitest";
import type { BaseModelStacItem } from "@/features/try-fair/api/stac";
import {
  buildClassColorExpression,
  buildClassLegendItems,
  DEFAULT_PREDICTION_COLOR,
  describePredictedFeature,
  getPredictionClassStyle,
} from "@/features/try-fair/utils/prediction-classes";

const modelWith = (properties: Record<string, unknown>) =>
  ({ id: "test-model", properties }) as unknown as BaseModelStacItem;

const damageClasses = [
  { value: 0, name: "no-damage", title: "No damage", color_hint: "43A047" },
  { value: 3, name: "destroyed", title: "Destroyed", color_hint: "E53935" },
  { value: -1, name: "no-data", title: "No data", color_hint: "9E9E9E" },
];

const damageModel = modelWith({
  "mlm:output": [
    { name: "damage logits" },
    {
      name: "buildings",
      variables: ["damage_class", "damage_confidence"],
      "classification:classes": damageClasses,
    },
  ],
  "cube:variables": {
    damage_class: { values: [0, 3, -1], nodata: -1 },
    damage_confidence: { extent: [0, 1] },
  },
});

const buildingModel = modelWith({
  "mlm:output": [
    { name: "segmentation logits" },
    {
      name: "buildings",
      variables: ["class", "score"],
      "classification:classes": [
        { value: 1, name: "building", description: "Building" },
      ],
    },
  ],
  "cube:variables": { class: { values: [1] }, score: { extent: [0, 1] } },
});

const featureWith = (properties: Record<string, unknown>) => ({
  type: "Feature" as const,
  geometry: { type: "Point" as const, coordinates: [0, 0] },
  properties,
});

describe("getPredictionClassStyle", () => {
  it("reads the class variable from the output that lists MLM variables", () => {
    const style = getPredictionClassStyle(damageModel)!;

    expect(style.property).toBe("damage_class");
    expect(style.colored).toBe(true);
    expect(
      style.classes.map((item) => [item.value, item.color, item.nodata]),
    ).toEqual([
      [0, "#43A047", false],
      [3, "#E53935", false],
      [-1, "#9E9E9E", true],
    ]);
  });

  it("keeps the default colour for classes without colour hints", () => {
    const style = getPredictionClassStyle(buildingModel)!;

    expect(style.property).toBe("class");
    expect(style.colored).toBe(false);
    expect(style.classes[0].color).toBe(DEFAULT_PREDICTION_COLOR);
  });

  it("returns null for an item whose outputs list no variables", () => {
    const itemWithoutVariables = modelWith({
      "mlm:output": [
        { name: "damage", "classification:classes": damageClasses },
      ],
    });

    expect(getPredictionClassStyle(itemWithoutVariables)).toBeNull();
  });

  it("leaves predictions unclassed when no variable's values match the class values", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const style = getPredictionClassStyle(
      modelWith({
        "mlm:output": [
          {
            name: "buildings",
            variables: ["label", "score"],
            "classification:classes": [{ value: 1, name: "building" }],
          },
        ],
        "cube:variables": { label: { values: ["building"] }, score: {} },
      }),
    )!;

    expect(style.property).toBeNull();
    expect(style.colored).toBe(false);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringMatching(/no variable's values match/),
    );
    consoleError.mockRestore();
  });

  it("returns null when no model is selected", () => {
    expect(getPredictionClassStyle(null)).toBeNull();
  });

  describe("with an invalid class definition", () => {
    afterEach(() => vi.restoreAllMocks());

    const expectDefaultColourFallback = (
      classes: unknown[],
      problem: RegExp,
    ) => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const values = (classes as { value: number }[]).map((item) => item.value);
      const style = getPredictionClassStyle(
        modelWith({
          "mlm:output": [
            {
              name: "buildings",
              variables: ["class"],
              "classification:classes": classes,
            },
          ],
          "cube:variables": { class: { values } },
        }),
      )!;

      expect(style.colored).toBe(false);
      expect(consoleError).toHaveBeenCalledWith(expect.stringMatching(problem));
    };

    it("falls back to the default colour on a colour hint that is not six hex digits", () => {
      expectDefaultColourFallback(
        [{ value: 3, name: "destroyed", color_hint: "red" }],
        /invalid color_hint "red"/,
      );
    });

    it("falls back to the default colour when class values repeat", () => {
      expectDefaultColourFallback(
        [
          { value: 3, name: "destroyed", color_hint: "E53935" },
          { value: 3, name: "major-damage", color_hint: "FB8C00" },
        ],
        /must be unique/,
      );
    });

    it("falls back to the default colour when only some classes carry a colour hint", () => {
      expectDefaultColourFallback(
        [
          { value: 3, name: "destroyed", color_hint: "E53935" },
          { value: 0, name: "no-damage" },
        ],
        /every class/,
      );
    });
  });
});

describe("buildClassColorExpression", () => {
  it("matches the class variable on class values", () => {
    expect(
      buildClassColorExpression(getPredictionClassStyle(damageModel)!),
    ).toEqual([
      "match",
      ["get", "damage_class"],
      0,
      "#43A047",
      3,
      "#E53935",
      -1,
      "#9E9E9E",
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
        featureWith({ damage_class: 3 }),
        featureWith({ damage_class: 0 }),
        featureWith({ damage_class: 3 }),
      ]),
    ).toEqual([
      ["No damage (1)", "#43A047"],
      ["Destroyed (2)", "#E53935"],
    ]);
  });

  it("leaves the datacube no-data value out of the legend and the unclassified count", () => {
    expect(
      legendRows([
        featureWith({ damage_class: -1 }),
        featureWith({ damage_class: 3 }),
      ]),
    ).toEqual([["Destroyed (1)", "#E53935"]]);
  });

  it("counts undeclared and missing class values as unclassified", () => {
    expect(
      legendRows([featureWith({ damage_class: 7 }), featureWith({})]),
    ).toEqual([["Unclassified (2)", DEFAULT_PREDICTION_COLOR]]);
  });
});

describe("describePredictedFeature", () => {
  it("shows the class title and each other declared variable, probabilities as percent", () => {
    expect(
      describePredictedFeature(getPredictionClassStyle(damageModel)!, {
        damage_class: 3,
        damage_confidence: 0.875,
        osm_id: 42,
      }),
    ).toEqual([
      { label: "class", value: "Destroyed" },
      { label: "damage confidence", value: "87.5%" },
    ]);
  });

  it("skips declared variables the feature does not carry", () => {
    expect(
      describePredictedFeature(getPredictionClassStyle(buildingModel)!, {
        class: 1,
      }),
    ).toEqual([{ label: "class", value: "building" }]);
  });
});
