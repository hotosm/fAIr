import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useImageryMappingModel } from "@/features/try-fair/hooks/use-imagery-mapping-model";
import { ModelType } from "@/enums";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { useGetAPIBaseModels, useGetAPILocalModels } from "@/features/try-fair/api/features-to-map";

vi.mock("@/features/try-fair/api/features-to-map", () => ({
  useGetAPIBaseModels: vi.fn(),
  useGetAPILocalModels: vi.fn(),
}));

describe("useImageryMappingModel", () => {
  const mockSelectedModel: any = {
    id: "stac-model-1",
    properties: {
      "mlm:name": "DINOv3 Buildings",
      "mlm:hyperparameters": {
        "inference.confidence_threshold": 0.7,
      },
      "fair:hyperparameters_spec": [
        {
          key: "confidence_threshold",
          type: "float",
          default: 0.7,
          description: "Confidence threshold",
        },
      ],
    },
    assets: {
      model: { href: "s3://models/stac-model-1.pt" },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useStartMappingStore.setState({
      currentModelType: ModelType.DEMO,
    });

    (useGetAPIBaseModels as any).mockReturnValue({
      data: { results: [] },
      isSuccess: true,
    });
    (useGetAPILocalModels as any).mockReturnValue({
      data: { results: [] },
      isSuccess: true,
    });
  });

  it("should return selectedModel in DEMO mode", () => {
    const { result } = renderHook(() =>
      useImageryMappingModel({
        feature: "buildings",
        confidence: 0.8,
        selectedModel: mockSelectedModel,
      }),
    );

    expect(result.current.modelForMapping).toBe(mockSelectedModel);
    expect(result.current.mappingModelId).toBe("stac-model-1");
    expect(result.current.modelUri).toBe("s3://models/stac-model-1.pt");
    expect(result.current.hasNoModelsForFeature).toBe(false);
    expect(result.current.paramValues).toEqual({
      confidence_threshold: 0.8,
    });
  });

  it("should resolve first API model in IMAGERY mode", () => {
    useStartMappingStore.setState({ currentModelType: ModelType.IMAGERY });

    const mockApiModel = {
      stac: {
        id: "api-imagery-model-1",
        properties: {
          "mlm:name": "API Model",
          "mlm:hyperparameters": {},
          "fair:hyperparameters_spec": [],
        },
        assets: {
          model: { href: "s3://models/api-model.pt" },
        },
      },
    };

    (useGetAPIBaseModels as any).mockReturnValue({
      data: { results: [mockApiModel] },
      isSuccess: true,
    });

    const { result } = renderHook(() =>
      useImageryMappingModel({
        feature: "buildings",
        confidence: 0.7,
        selectedModel: mockSelectedModel,
      }),
    );

    expect(result.current.modelForMapping).toBe(mockApiModel.stac);
    expect(result.current.mappingModelId).toBe("api-imagery-model-1");
    expect(result.current.modelUri).toBe("s3://models/api-model.pt");
    expect(result.current.hasNoModelsForFeature).toBe(false);
  });

  it("should set hasNoModelsForFeature to true when in IMAGERY mode and no compatible models are found", () => {
    useStartMappingStore.setState({ currentModelType: ModelType.IMAGERY });

    (useGetAPIBaseModels as any).mockReturnValue({
      data: { results: [] },
      isSuccess: true,
    });
    (useGetAPILocalModels as any).mockReturnValue({
      data: { results: [] },
      isSuccess: true,
    });

    const { result } = renderHook(() =>
      useImageryMappingModel({
        feature: "unknown-feature",
        confidence: 0.7,
        selectedModel: mockSelectedModel,
      }),
    );

    expect(result.current.modelForMapping).toBeNull();
    expect(result.current.hasNoModelsForFeature).toBe(true);
  });
});
