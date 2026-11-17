import { describe, expect, it } from "vitest";
import type { APIBaseModelItem } from "@/features/try-fair/types/data-types";
import { getModelLinks } from "@/features/try-fair/components/model-picker/model-links";
import {
  formatRuns,
  getModelUsage,
} from "@/features/try-fair/components/model-picker/model-usage";

describe("getModelLinks", () => {
  it("adds the item's license links, named by their title", () => {
    expect(
      getModelLinks({
        assets: {},
        links: [
          { rel: "self", href: "https://stac.example/items/dino" },
          {
            rel: "license",
            href: "https://github.com/facebookresearch/dinov3/blob/main/LICENSE.md",
            title: "DINOv3 License",
          },
          { rel: "license", href: "https://example.org/license" },
        ],
      }),
    ).toEqual([
      {
        label: "DINOv3 License",
        href: "https://github.com/facebookresearch/dinov3/blob/main/LICENSE.md",
      },
      { label: "License", href: "https://example.org/license" },
    ]);
  });

  it("lists the source code and README links", () => {
    expect(
      getModelLinks({
        assets: {
          "source-code": {
            href: "https://github.com/hotosm/fAIr-models/tree/develop/models/dino",
          },
          readme: {
            href: "https://raw.githubusercontent.com/hotosm/fAIr-models/README.md",
          },
        },
      }),
    ).toEqual([
      {
        label: "Source code",
        href: "https://github.com/hotosm/fAIr-models/tree/develop/models/dino",
      },
      {
        label: "README",
        href: "https://raw.githubusercontent.com/hotosm/fAIr-models/README.md",
      },
    ]);
  });

  it("drops links that are missing or not valid http or https URLs", () => {
    expect(
      getModelLinks({
        assets: {
          "source-code": { href: "https://" },
          readme: { href: "javascript:alert(1)" },
        },
      }),
    ).toEqual([]);
    expect(getModelLinks({ assets: {} })).toEqual([]);
  });

  it("keeps a valid link when the other one is invalid", () => {
    expect(
      getModelLinks({
        assets: {
          "source-code": { href: "https://github.com/hotosm/fAIr-models" },
          readme: { href: "javascript:alert(1)" },
        },
      }),
    ).toEqual([
      { label: "Source code", href: "https://github.com/hotosm/fAIr-models" },
    ]);
  });
});

describe("getModelUsage", () => {
  const model = (counts: Partial<APIBaseModelItem>) =>
    counts as APIBaseModelItem;

  it("combines try-now runs with map requests and counts feedback entries", () => {
    expect(
      getModelUsage(
        model({
          prediction_runs: 1,
          map_request_count: 12,
          user_count: 1,
          feedback_count: 3,
        }),
      ),
    ).toEqual([
      { label: "Runs", value: "13" },
      { label: "Users", value: "1" },
      { label: "Feedback", value: "3 entries" },
    ]);
  });

  it("adds the local model count for a base model only", () => {
    expect(getModelUsage(model({ local_model_count: 2 }))).toContainEqual({
      label: "Local models",
      value: "2 created",
    });
    expect(getModelUsage(model({}))).toEqual([
      { label: "Runs", value: "0" },
      { label: "Users", value: "0" },
      { label: "Feedback", value: "0 entries" },
    ]);
  });
});

describe("formatRuns", () => {
  it("counts try-now runs and map requests together, singular for one", () => {
    const model = (counts: Partial<APIBaseModelItem>) =>
      counts as APIBaseModelItem;
    expect(formatRuns(model({ prediction_runs: 1 }))).toBe("1 run");
    expect(formatRuns(model({}))).toBe("0 runs");
    expect(
      formatRuns(model({ prediction_runs: 2000, map_request_count: 500 })),
    ).toBe(`${(2500).toLocaleString()} runs`);
  });
});
