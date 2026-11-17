import { describe, expect, it } from "vitest";
import { featureDisplayName } from "@/features/try-fair/utils/common";

describe("featureDisplayName", () => {
  it("shows a feature slug in sentence case", () => {
    expect(featureDisplayName("solid-waste")).toBe("Solid waste");
    expect(featureDisplayName("building_damage")).toBe("Building damage");
  });

  it("leaves an empty label empty", () => {
    expect(featureDisplayName("")).toBe("");
  });
});
