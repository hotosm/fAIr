import { ExpressionSpecification } from "maplibre-gl";
import type { LegendItem } from "@/features/start-mapping/components/map/legend-control";
import type {
  BaseModelStacItem,
  ClassificationClass,
  ModelOutput,
} from "@/features/try-fair/api/stac";

export const DEFAULT_PREDICTION_COLOR = "#A243DC";

// Classification extension v2.0.0 schema pattern for `color_hint`.
const COLOR_HINT_PATTERN = /^[0-9A-Fa-f]{6}$/;

export type PredictionClass = {
  value: number;
  label: string;
  color: string;
  nodata: boolean;
};

/** A declared prediction feature property, shown on hover. */
export type PredictionVariable = {
  name: string;
  label: string;
  isProbability: boolean;
};

/** How predicted features are classed, coloured and described, read from the model's STAC item. */
export type PredictionClassStyle = {
  property: string | null;
  classes: PredictionClass[];
  colored: boolean;
  variables: PredictionVariable[];
};

const variableNames = (output: ModelOutput): string[] =>
  (output.variables ?? []).map((variable) =>
    typeof variable === "string" ? variable : variable.name,
  );

const findClassDefinitionProblem = (
  classes: ClassificationClass[],
): string | null => {
  if (classes.some((modelClass) => !modelClass.color_hint)) {
    return "color_hint must be set on every class or on none";
  }
  if (
    new Set(classes.map((modelClass) => modelClass.value)).size !==
    classes.length
  ) {
    return "class values must be unique";
  }
  const invalidHint = classes.find(
    (modelClass) => !COLOR_HINT_PATTERN.test(modelClass.color_hint!),
  );
  return invalidHint
    ? `invalid color_hint "${invalidHint.color_hint}" for class "${invalidHint.name}"`
    : null;
};

export const getPredictionClassStyle = (
  model: BaseModelStacItem | null | undefined,
): PredictionClassStyle | null => {
  const output = model?.properties["mlm:output"]?.find(
    (modelOutput) => modelOutput.variables?.length,
  );
  if (!model || !output) return null;

  const declared = model.properties["cube:variables"] ?? {};
  const classes = output["classification:classes"] ?? [];
  const classValues = classes.map((modelClass) => modelClass.value);
  const names = variableNames(output);
  const property =
    names.find((name) => {
      const values = declared[name]?.values;
      return (
        !!values?.length &&
        values.every(
          (value) => typeof value === "number" && classValues.includes(value),
        )
      );
    }) ?? null;
  if (classes.length && !property) {
    console.error(
      `Model ${model.id}, output "${output.name}": no variable's values match its class values. Predictions are not classed.`,
    );
  }

  let colored =
    property !== null && classes.some((modelClass) => modelClass.color_hint);
  const problem = colored ? findClassDefinitionProblem(classes) : null;
  if (problem) {
    console.error(
      `Model ${model.id}, output "${output.name}": ${problem}. Using the default prediction colour.`,
    );
    colored = false;
  }

  const noDataValue = property ? declared[property]?.nodata : undefined;
  return {
    property,
    colored,
    variables: names.map((name) => ({
      name,
      label: name.replace(/_/g, " "),
      isProbability:
        declared[name]?.extent?.[0] === 0 && declared[name]?.extent?.[1] === 1,
    })),
    classes: classes.map((modelClass) => ({
      value: modelClass.value,
      label: modelClass.title ?? modelClass.name,
      color: colored ? `#${modelClass.color_hint}` : DEFAULT_PREDICTION_COLOR,
      nodata: modelClass.nodata === true || modelClass.value === noDataValue,
    })),
  };
};

export const buildClassColorExpression = (
  style: PredictionClassStyle,
): ExpressionSpecification => {
  // `match` needs at least one label/output pair; a coloured style always has classes and a property.
  const [firstClass, ...otherClasses] = style.classes;
  return [
    "match",
    ["get", style.property!],
    firstClass.value,
    firstClass.color,
    ...otherClasses.flatMap((predictionClass) => [
      predictionClass.value,
      predictionClass.color,
    ]),
    DEFAULT_PREDICTION_COLOR,
  ] as ExpressionSpecification;
};

/** One legend row per class present in the predictions, with its count; no-data classes are left out. */
export const buildClassLegendItems = (
  style: PredictionClassStyle,
  predictions: GeoJSON.FeatureCollection,
  shape: LegendItem["shape"],
  fillOpacity: number,
): LegendItem[] => {
  const classesByValue = new Map(
    style.classes.map((predictionClass) => [
      predictionClass.value,
      predictionClass,
    ]),
  );
  const counts = new Map<number, number>();
  let unclassifiedCount = 0;
  predictions.features.forEach((feature) => {
    const predictionClass = classesByValue.get(
      feature.properties?.[style.property!],
    );
    if (!predictionClass) {
      unclassifiedCount += 1;
    } else if (!predictionClass.nodata) {
      counts.set(
        predictionClass.value,
        (counts.get(predictionClass.value) ?? 0) + 1,
      );
    }
  });

  const items: LegendItem[] = style.classes
    .filter((predictionClass) => counts.has(predictionClass.value))
    .map((predictionClass) => ({
      label: `${predictionClass.label} (${counts.get(predictionClass.value)!.toLocaleString()})`,
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

/** Hover rows for a predicted feature: the class title, then each other declared variable. */
export const describePredictedFeature = (
  style: PredictionClassStyle,
  properties: Record<string, unknown>,
): { label: string; value: string }[] => {
  const classValue = style.property ? properties[style.property] : undefined;
  const classLabel = style.classes.find(
    (predictionClass) => predictionClass.value === classValue,
  )?.label;
  const classRow =
    style.property && classLabel ? [{ label: "class", value: classLabel }] : [];
  const variableRows = style.variables
    .filter(
      (variable) =>
        variable.name !== style.property && properties[variable.name] != null,
    )
    .map((variable) => {
      const value = properties[variable.name];
      return {
        label: variable.label,
        value:
          variable.isProbability && typeof value === "number"
            ? `${(value * 100).toFixed(1)}%`
            : String(value),
      };
    });
  return [...classRow, ...variableRows];
};
