import type { BaseModelStacItem } from "@/features/try-fair/api/stac";

export type DemoModelConfig = {
  baseModelId: string;
  localModelUri: string;
  tileServiceUrl: string;
  center: [number, number];
  displayName: string;
  location: string;
  featureType: string;
  author: string;
  modelName: string;
};

export const DEMO_MODEL_CONFIGS: DemoModelConfig[] = [
  {
    //best polygons, shown first as the default
    baseModelId: "dinov3s-buildings",
    localModelUri:
      "https://huggingface.co/kshitijrajsharma/dinov3-hot-buildings/resolve/main/dinov3s_buildings.onnx",
    tileServiceUrl:
      "https://tiles.openaerialmap.org/62d85d11d8499800053796c1/0/62d85d11d8499800053796c2/{z}/{x}/{y}",
    center: [85.5228304876195, 27.6337106889328],
    displayName: "Buildings",
    location: "Nepal",
    featureType: "building",
    modelName: "Dino3s",
    author: "HOTOSM",
  },
  {
    baseModelId: "2e5ac894-731f-416d-bb34-ad3cafb4b9a6",
    localModelUri:
      "https://s3.fair.krschap.tech/zenml/local-models/08e20666-f8fa-4b8a-8fe8-72661a590fd0/model/model.onnx",
    tileServiceUrl:
      "https://tiles.openaerialmap.org/62d85d11d8499800053796c1/0/62d85d11d8499800053796c2/{z}/{x}/{y}",
    center: [85.5228, 27.6337],
    displayName: "Buildings",
    location: "Nepal",
    featureType: "building",
    modelName: "Unet",
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
    location: "Nepal",
    modelName: "Resnet",
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
    modelName: "Yolo11n",
  },
];

export const getDemoConfig = (
  baseModelId: string,
): DemoModelConfig | undefined =>
  DEMO_MODEL_CONFIGS.find((c) => c.baseModelId === baseModelId);

export const getSelectedModel = (
  models: BaseModelStacItem[],
  modelId: string | null,
): BaseModelStacItem | null =>
  (modelId && models.find((m) => m.id === modelId)) || null;


  // https://tiles.openaerialmap.org/68b701d45288a43ff3e91007/0/68b701d45288a43ff3e91008/{z}/{x}/{y}
  // 85.5228304876195, 27.6337106889328