export type TryFairModel = {
  id: number;
  feature: string;
  location: string;
  modelName: string;
  author: string;
  featureType: string;
  tileServiceUrl: string;
  bbox: string;
  availableZoomLevels: number[];
  checkpoint: string;
  modelId: string;
  center: [number, number];
};

export const MODELS_LIST: TryFairModel[] = [
  {
    id: 1,
    feature: "Buildings",
    location: "Freetown",
    modelName: "Kolleh Town Freetown",
    author: "OmranNAJJAR",
    featureType: "building",
    tileServiceUrl:
      "https://tiles.openaerialmap.org/62d85d11d8499800053796c1/0/62d85d11d8499800053796c2/{z}/{x}/{y}",
    bbox: "",
    availableZoomLevels: [18, 19, 20],
    checkpoint: "",
    modelId: "478",
    center: [85.5228, 27.6337],
  },
  {
    id: 2,
    feature: "Solar Panels",
    location: "USA",
    modelName: "Panels Chicago",
    author: "Kshitij Sharma",
    featureType: "solar-panel",
    tileServiceUrl:
      "https://tiles.openaerialmap.org/6a0aa45052774984bedbcfef/0/6a0aa45052774984bedbcff0/{z}/{x}/{y}",
    bbox: "",
    availableZoomLevels: [18, 19, 20],
    checkpoint: "",
    modelId: "2",
    center: [91.871, 22.424],
  },
  {
    id: 3,
    feature: "Buildings",
    location: "Nepal",
    modelName: "Nepal Buildings Model",
    author: "Kshitij Sharma",
    featureType: "building",
    tileServiceUrl:
      "https://tiles.openaerialmap.org/66149f1cc055e600014ac54c/0/66149f1cc055e600014ac54d/{z}/{x}/{y}",
    bbox: "",
    availableZoomLevels: [18, 19, 20],
    checkpoint: "",
    modelId: "478",
    center: [83.816, 28.2975],
  },
  {
    id: 4,
    feature: "Trees",
    location: "Ghana",
    modelName: "Kolleh Town Freetown",
    author: "OmranNAJJAR",
    featureType: "trees",
    tileServiceUrl:
      "https://tiles.openaerialmap.org/6a0b8d586103984552b5f7f2/0/6a0b8d586103984552b5f7f3/{z}/{x}/{y}",
    bbox: "",
    availableZoomLevels: [19, 20, 21],
    checkpoint: "",
    modelId: "478",
    center: [-71.656, -40.767],
  },
];

export type DemoModelConfig = {
  baseModelId: string;
  localModelUri: string;
  tileServiceUrl: string;
  center: [number, number];
  displayName: string;
  location: string;
  featureType: string;
  author: string;
};

export const DEMO_MODEL_CONFIGS: DemoModelConfig[] = [
  {
    // UNet segmentation — best polygons, shown first as the default
    baseModelId: "unet-segmentation",
    localModelUri:
      "https://s3.fair.krschap.tech/zenml/local-models/08e20666-f8fa-4b8a-8fe8-72661a590fd0/model/model.onnx",
    tileServiceUrl:
      "https://tiles.openaerialmap.org/62d85d11d8499800053796c1/0/62d85d11d8499800053796c2/{z}/{x}/{y}",
    center: [85.5228, 27.6337],
    displayName: "Buildings",
    location: "Freetown",
    featureType: "building",
    author: "HOTOSM",
  },
  {
    // ResNet18 classification
    baseModelId: "resnet18-classification",
    localModelUri:
      "https://s3.fair.krschap.tech/zenml/local-models/27f6f5a6-d079-44ac-80b1-be9ff268c2cb/model/model.onnx",
    tileServiceUrl:
      "https://tiles.openaerialmap.org/62d85d11d8499800053796c1/0/62d85d11d8499800053796c2/{z}/{x}/{y}",
    center: [85.5228, 27.6337],
    displayName: "Buildings",
    location: "Kathmandu",
    featureType: "building",
    author: "HOTOSM",
  },
  {
    // YOLO11n detection
    baseModelId: "yolo11n-detection",
    localModelUri:
      "https://s3.fair.krschap.tech/zenml/local-models/1e398477-2472-46ea-9286-cd89411e1c32/model/model.onnx",
    tileServiceUrl:
      "https://tiles.openaerialmap.org/62d85d11d8499800053796c1/0/62d85d11d8499800053796c2/{z}/{x}/{y}",
    center: [85.5228, 27.6337],
    displayName: "Buildings",
    location: "Nepal",
    featureType: "building",
    author: "HOTOSM",
  }
];

export const getDemoConfig = (
  baseModelId: string,
): DemoModelConfig | undefined =>
  DEMO_MODEL_CONFIGS.find((c) => c.baseModelId === baseModelId);
