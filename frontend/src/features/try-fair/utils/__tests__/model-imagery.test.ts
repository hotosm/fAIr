import { describe, expect, it } from "vitest";
import type { BaseModelStacItem } from "@/features/try-fair/api/stac";
import { getModelImagery } from "@/features/try-fair/utils/common";

const POST = "https://post.example/{z}/{x}/{y}";
const PRE = "https://pre.example/{z}/{x}/{y}";

const model = (inputs: string[], preImageryUrl?: string): BaseModelStacItem =>
  ({
    id: "dinov3-damage",
    properties: {
      "mlm:input": inputs.map((name) => ({ name })),
      "fair:preview": preImageryUrl
        ? { pre_imagery: { url: preImageryUrl } }
        : undefined,
    },
  }) as unknown as BaseModelStacItem;

describe("getModelImagery()", () => {
  it("keys the chosen imagery by a single-input model's input name", () => {
    expect(getModelImagery(model(["image"]), POST)).toEqual({ image: POST });
  });

  it("sends the preview's pre-event imagery as pre and the chosen imagery as post", () => {
    expect(getModelImagery(model(["post", "pre"], PRE), POST)).toEqual({
      post: POST,
      pre: PRE,
    });
  });

  it("refuses a pre input when the preview has no pre-event imagery", () => {
    expect(() => getModelImagery(model(["post", "pre"]), POST)).toThrow(
      "dinov3-damage needs pre-event imagery in its preview.",
    );
  });
});
