import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createFeatureFeedback,
  deleteFeatureFeedback,
  getFeedbackRecords,
  updateFeatureFeedback,
} from "@/features/feedback/api/feedback";
import { FeedbackAction } from "@/features/feedback/types";

const client = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("@/services", async () => ({
  apiClient: client,
  API_ENDPOINTS: (await import("@/services/api-routes")).API_ENDPOINTS,
}));

beforeEach(() => vi.clearAllMocks());

const geometry: GeoJSON.Polygon = {
  type: "Polygon",
  coordinates: [
    [
      [85.324, 27.7172],
      [85.3243, 27.7172],
      [85.3243, 27.7175],
      [85.324, 27.7172],
    ],
  ],
};

describe("feedback api", () => {
  it("posts a GeoJSON Feature with the fields under properties", async () => {
    client.post.mockResolvedValue({ data: { properties: { id: 1 } } });
    await createFeatureFeedback({
      stacId: "buildings",
      geometry,
      action: FeedbackAction.ACCEPT,
      config: { zoom: 19 },
    });
    expect(client.post).toHaveBeenCalledWith("feedback/", {
      type: "Feature",
      geometry,
      properties: {
        stac_id: "buildings",
        action: "accept",
        comments: "",
        config: { zoom: 19 },
      },
    });
  });

  it("patches only the action and deletes by id", async () => {
    client.patch.mockResolvedValue({ data: {} });
    client.delete.mockResolvedValue({ data: undefined });
    await updateFeatureFeedback({ id: 5, action: FeedbackAction.REJECT });
    await deleteFeatureFeedback({ id: 5 });
    expect(client.patch).toHaveBeenCalledWith("feedback/5/", {
      properties: { action: "reject" },
    });
    expect(client.delete).toHaveBeenCalledWith("feedback/5/");
  });

  it("reads every page of the user's records", async () => {
    const feature = (id: number) => ({ properties: { id } });
    client.get
      .mockResolvedValueOnce({
        data: {
          count: 3,
          next: "page-2",
          results: {
            type: "FeatureCollection",
            features: [feature(1), feature(2)],
          },
        },
      })
      .mockResolvedValueOnce({
        data: { count: 3, next: null, results: [feature(3)] },
      });

    const records = await getFeedbackRecords({
      stacId: "buildings",
      bbox: [1, 2, 3, 4],
      userId: 99,
    });
    expect(records.map((r) => r.properties.id)).toEqual([1, 2, 3]);
    expect(client.get).toHaveBeenNthCalledWith(1, "feedback/", {
      params: {
        stac_id: "buildings",
        user: 99,
        in_bbox: "1,2,3,4",
        limit: 500,
        offset: 0,
      },
    });
    expect(client.get).toHaveBeenNthCalledWith(2, "feedback/", {
      params: expect.objectContaining({ offset: 2 }),
    });
  });
});
