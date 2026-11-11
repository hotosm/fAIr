import bbox from "@turf/bbox";
import type { FeedbackRecord } from "@/features/feedback/api/feedback";
import type {
  FeatureVerdict,
  FeatureVerdicts,
} from "@/features/feedback/types";

/** Overlay status of a clicked feature that has no 👍/👎 yet. */
export const SELECTED_STATUS = "selected";

/** Features marked with `verdict`, e.g. for the "valid" download. */
export const collectFeaturesByVerdict = (
  predictions: GeoJSON.FeatureCollection | null,
  verdicts: FeatureVerdicts,
  verdict: FeatureVerdict,
): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: Object.keys(verdicts)
    .map(Number)
    .filter((id) => verdicts[id] === verdict)
    .flatMap((id) => predictions?.features[id] ?? []),
});

/**
 * What the feedback layer draws: every marked feature (green/red) and the
 * selected one (cyan, unless it is already marked).
 */
export const buildFeedbackOverlay = (
  predictions: GeoJSON.FeatureCollection | null,
  verdicts: FeatureVerdicts,
  selectedId: number | null,
): GeoJSON.FeatureCollection => {
  const ids = Object.keys(verdicts).map(Number);
  if (selectedId !== null && !(selectedId in verdicts)) ids.push(selectedId);

  return {
    type: "FeatureCollection",
    features: ids.flatMap((id) => {
      const feature = predictions?.features[id];
      if (!feature) return [];
      const status = verdicts[id] ?? SELECTED_STATUS;
      return [
        { type: "Feature", geometry: feature.geometry, properties: { status } },
      ];
    }),
  };
};

/**
 * Where the 👍/👎 popup hangs from: the middle of the feature's bottom edge
 * (lng/lat).
 */
export const getFeatureAnchor = (
  geometry: GeoJSON.Geometry | null | undefined,
): [number, number] | null => {
  if (!geometry) return null;
  const [west, south, east] = bbox(geometry);
  return [(west + east) / 2, south];
};

/**
 * A text key for a geometry, so a saved record can be matched to the
 * predicted feature it was given on. Coordinates are rounded to 6 decimals
 * (about 10 cm) to ignore tiny changes from the database round trip.
 */
export const getGeometryKey = (geometry: GeoJSON.Geometry): string => {
  const shape =
    geometry.type === "GeometryCollection"
      ? geometry.geometries
      : geometry.coordinates;
  return JSON.stringify([geometry.type, shape], (_, value) =>
    typeof value === "number" ? Math.round(value * 1e6) / 1e6 : value,
  );
};

/**
 * Finds the saved record for each predicted feature, keyed by the feature's
 * index. Records come newest first, so the newest one wins if a feature has
 * several.
 */
export const matchRecordsToFeatures = (
  predictions: GeoJSON.FeatureCollection | null,
  records: FeedbackRecord[],
): Map<number, FeedbackRecord> => {
  const featureIndexByKey = new Map<string, number>();
  predictions?.features.forEach((feature, index) => {
    featureIndexByKey.set(getGeometryKey(feature.geometry), index);
  });

  const recordByFeature = new Map<number, FeedbackRecord>();
  for (const record of records) {
    const index = featureIndexByKey.get(getGeometryKey(record.geometry));
    if (index !== undefined && !recordByFeature.has(index)) {
      recordByFeature.set(index, record);
    }
  }
  return recordByFeature;
};
