import { describe, expect, it } from "vitest";
import type { TOfflinePrediction } from "@/types";
import { getModelUsed, getPredictionName } from "../map-request-fields";

const prediction = (fields: Partial<TOfflinePrediction>) =>
  ({ id: 120, ...fields }) as TOfflinePrediction;

describe("getModelUsed", () => {
  it("prefers the model title, then its name, then the STAC id", () => {
    expect(
      getModelUsed(
        prediction({
          model_title: "Freetown trees",
          model_name: "qa-trees",
          local_model_stac_id: "e822",
        }),
      ),
    ).toBe("Freetown trees");
    expect(
      getModelUsed(
        prediction({
          model_title: null,
          model_name: "qa-trees",
          local_model_stac_id: "e822",
        }),
      ),
    ).toBe("qa-trees");
    expect(
      getModelUsed(
        prediction({
          model_title: null,
          model_name: "",
          local_model_stac_id: "e822",
        }),
      ),
    ).toBe("e822");
  });
});

describe("getPredictionName", () => {
  it("uses the description, else the map request number, never the model id", () => {
    expect(
      getPredictionName(
        prediction({
          description: "Freetown coast",
          local_model_stac_id: "e822",
        }),
      ),
    ).toBe("Freetown coast");
    expect(
      getPredictionName(
        prediction({ description: "", local_model_stac_id: "e822" }),
      ),
    ).toBe("Map request #120");
  });
});
