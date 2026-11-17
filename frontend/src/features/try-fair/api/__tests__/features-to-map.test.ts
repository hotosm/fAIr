import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAPIBaseModels,
  getAPILocalModels,
  getAllAPIBaseModels,
  getAllAPILocalModels,
} from "../features-to-map";
import { getSelectedModel } from "../../utils/models";

const get = vi.hoisted(() => vi.fn());
vi.mock("@/services", async () => ({
  apiClient: { get },
  API_ENDPOINTS: (await import("@/services/api-routes")).API_ENDPOINTS,
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

describe.each([
  ["base", getAPIBaseModels, getAllAPIBaseModels],
  ["local", getAPILocalModels, getAllAPILocalModels],
] as const)("%s model request scope", (_, getPinned, getAll) => {
  it("keeps existing requests pinned and advanced requests unfiltered", async () => {
    get.mockResolvedValue({
      data: { results: [], count: 0, next: null, previous: null },
    });
    await getPinned("buildings");
    const pinnedUrl = new URL(get.mock.calls[0][0], "https://example.com");
    expect(pinnedUrl.searchParams.get("is_pinned")).toBe("true");
    await getAll("buildings");
    const allUrl = new URL(get.mock.calls[1][0], "https://example.com");
    expect(allUrl.searchParams.has("is_pinned")).toBe(false);
    expect(allUrl.searchParams.get("category")).toBe("buildings");
  });
});
