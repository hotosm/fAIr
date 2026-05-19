import { TBaseModel } from "@/types";

export const mapStacItemToBaseModel = (feature: any): TBaseModel => {
  const props = feature.properties;

  const provider =
    props.providers?.find((p: any) => p.roles?.includes("producer")) ||
    props.providers?.[0];

  return {
    id: feature.id,

    name: props.title || props["mlm:name"],

    description: props.description || "",

    author: provider?.name || "Unknown",

    task: props["mlm:tasks"]?.[0] || "unknown",

    version: props.version || "1",

    lastModified: new Date(props.updated).toLocaleDateString(),

    accuracy: extractAccuracy(props),
  };
};

export const mapStacItemToBaseModelDetail = (item: any) => {
  const p = item.properties ?? {};

  const assets = item.assets ?? {};

  const getAsset = (key: string) => assets[key];

  return {
    id: item.id,

    // header
    fullTitle: p.title,

    dataId: item.id,

    // metadata
    createdBy:
      p.providers?.find((p: any) => p.roles?.includes("producer"))?.name ??
      "Unknown",

    generatedOn: p.created,
    lastModified: p.updated,
    version: p.version,

    modelWeightsLicense: p.license,
    datasetLicense: p.license,

    task: (p.mlm?.tasks ?? [])[0] ?? "unknown",
    accuracy: p["fair:metrics_spec"] ?? null,

    markdownContent: getAsset("readme")?.href,

    dataInfo: {
      sensor: p.mlm?.input?.[0]?.name ?? "Unknown",
      crs: "EPSG:4326",
      spatialExtent: "Global",
      temporalExtent: `${p.created} → ${p.updated}`,
    },

    architecture: {
      baseModel: p.mlm?.name,
      head: p.mlm?.architecture,
      input: JSON.stringify(p.mlm?.input ?? {}),
      tileSizePx: "640",
      processing: "preprocess pipeline",
      resize: "640x640",
      scaling: "0–1 normalization",
      output: JSON.stringify(p.mlm?.output ?? {}),
      outputDescription: p.description,

      variants: [],
    },

    assets: Object.entries(assets).map(([key, value]: any) => ({
      key,
      href: value.href,
      type: value.type,
      title: value.title,
      roles: value.roles,
    })),
  };
};

const extractAccuracy = (properties: any): number => {
  const metrics = properties["fair:metrics_spec"];

  if (!metrics?.length) {
    return 0;
  }

  const accuracyMetric = metrics.find(
    (metric: any) => metric.key === "fair:accuracy",
  );

  if (!accuracyMetric) {
    return 0;
  }

  return 0;
};
