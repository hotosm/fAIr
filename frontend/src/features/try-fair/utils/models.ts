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
  },
  {
    baseModelId: "dinov3-buildings",
    localModelUri:
      "https://huggingface.co/kshitijrajsharma/dinov3-hot-buildings/resolve/main/dinov3_buildings.onnx",
    tileServiceUrl:
      "https://tiles.openaerialmap.org/690585b76415e43597ffd7ea/0/690585b76415e43597ffd7eb/{z}/{x}/{y}",
    center: [-13.2415, 8.4835],
    displayName: "Buildings",
    location: "Freetown",
    featureType: "building",
    author: "HOTOSM",
  },
];

export const getDemoConfig = (
  baseModelId: string,
): DemoModelConfig | undefined =>
  DEMO_MODEL_CONFIGS.find((c) => c.baseModelId === baseModelId);
