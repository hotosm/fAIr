import { ExpressionSpecification } from "maplibre-gl";
import type { LegendItem } from "@/features/start-mapping/components/map/legend-control";
import type { BaseModelStacItem } from "@/features/try-fair/api/stac";

export const DEFAULT_PREDICTION_COLOR = "#A243DC";

// Classification extension v2.0.0 schema pattern for `color_hint`.
const COLOR_HINT_PATTERN = /^[0-9A-Fa-f]{6}$/;

export type PredictionClass = { name: string; label: string; color: string };

/** Feature property holding the class name, and the classes to colour by. */
export type PredictionClassStyle = {
  property: string;
  classes: PredictionClass[];
};

/** Colours from the first mlm:output's classification:classes, keyed on the property named after that output. */
export const getPredictionClassStyle = (
  model: BaseModelStacItem | null | undefined,
): PredictionClassStyle | null => {
  const output = model?.properties["mlm:output"]?.[0];
  const classes = output?.["classification:classes"] ?? [];
  const hinted = classes.filter((modelClass) => modelClass.color_hint);
  if (!model || !output || !hinted.length) return null;

  if (hinted.length !== classes.length) {
    throw new Error(
      `Model ${model.id}: color_hint must be set on every class of output "${output.name}" or on none.`,
    );
  }
  if (
    new Set(classes.map((modelClass) => modelClass.name)).size !==
    classes.length
  ) {
    throw new Error(
      `Model ${model.id}: class names in output "${output.name}" must be unique.`,
    );
  }
  classes.forEach((modelClass) => {
    if (!COLOR_HINT_PATTERN.test(modelClass.color_hint!)) {
      throw new Error(
        `Model ${model.id}: invalid color_hint "${modelClass.color_hint}" for class "${modelClass.name}".`,
      );
    }
  });

  return {
    property: output.name,
    classes: classes.map((modelClass) => ({
      name: modelClass.name,
      label: modelClass.title ?? modelClass.name,
      color: `#${modelClass.color_hint}`,
    })),
  };
};

export const buildClassColorExpression = (
  style: PredictionClassStyle,
): ExpressionSpecification => {
  // `match` needs at least one label/output pair; getPredictionClassStyle never returns an empty list.
  const [firstClass, ...otherClasses] = style.classes;
  return [
    "match",
    ["get", style.property],
    firstClass.name,
    firstClass.color,
    ...otherClasses.flatMap((predictionClass) => [
      predictionClass.name,
      predictionClass.color,
    ]),
    DEFAULT_PREDICTION_COLOR,
  ];
};

/** One legend row per class present in the predictions, with its count. */
export const buildClassLegendItems = (
  style: PredictionClassStyle,
  predictions: GeoJSON.FeatureCollection,
  shape: LegendItem["shape"],
  fillOpacity: number,
): LegendItem[] => {
  const knownNames = new Set(style.classes.map((item) => item.name));
  const counts = new Map<string, number>();
  let unclassifiedCount = 0;
  predictions.features.forEach((feature) => {
    const className = feature.properties?.[style.property];
    if (typeof className === "string" && knownNames.has(className)) {
      counts.set(className, (counts.get(className) ?? 0) + 1);
    } else {
      unclassifiedCount += 1;
    }
  });

  const items: LegendItem[] = style.classes
    .filter((predictionClass) => counts.has(predictionClass.name))
    .map((predictionClass) => ({
      label: `${predictionClass.label} (${counts.get(predictionClass.name)!.toLocaleString()})`,
      fillColor: predictionClass.color,
      fillOpacity,
      shape,
    }));
  if (unclassifiedCount) {
    items.push({
      label: `Unclassified (${unclassifiedCount.toLocaleString()})`,
      fillColor: DEFAULT_PREDICTION_COLOR,
      fillOpacity,
      shape,
    });
  }
  return items;
};
