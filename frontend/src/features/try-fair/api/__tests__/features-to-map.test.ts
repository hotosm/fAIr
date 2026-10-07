import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAPIBaseModels, getAPILocalModels } from "../features-to-map";
import { getSelectedModel } from "../../utils/models";

const get = vi.hoisted(() => vi.fn());
vi.mock("@/services", () => ({
  apiClient: { get },
  API_ENDPOINTS: {
    GET_API_BASE_MODELS: () => "/base-models/",
    GET_API_LOCAL_MODELS: () => "/local-models/",
  },
}));
beforeEach(() => get.mockReset());

describe.each([
  ["base", getAPIBaseModels],
  ["local", getAPILocalModels],
] as const)("%s model selection", (_, fetchModels) => {
  it.each([undefined, "outdated-id"])(
    "uses the canonical model ID when embedded STAC has ID %s",
    async (embeddedId) => {
      const metadata = {
        ...(embeddedId ? { id: embeddedId } : {}),
        properties: { title: "Selected model" },
        assets: { model: { href: "https://example.com/model.pt" } },
      };
      get.mockResolvedValue({
        data: {
          count: 1,
          next: null,
          previous: null,
          results: [{ stac_item_id: "selected-model", stac: metadata }],
        },
      });
      const response = await fetchModels("buildings");
      const selected = response.results[0].stac;
      expect(selected.id).toBe("selected-model");
      expect(getSelectedModel([selected], "selected-model")).toBe(selected);
      expect(selected.properties).toEqual(metadata.properties);
      expect(selected.assets).toEqual(metadata.assets);
      expect(metadata.id).toBe(embeddedId);
    },
  );
});
