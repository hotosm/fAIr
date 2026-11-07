import { describe, expect, it } from "vitest";
import { MapIcon } from "@/components/ui/icons";
import { RoadsIcon } from "@/components/ui/icons/roads-icon";
import { SolarPanelIcon } from "@/components/ui/icons/solar-panel-icon";
import { TreesIcon } from "@/components/ui/icons/trees-icon";
import { getFeatureIcon } from "../model-picker-badges";

describe("getFeatureIcon", () => {
  it("normalizes category casing and separators", () => {
    expect(getFeatureIcon("Trees")).toBe(TreesIcon);
    expect(getFeatureIcon("ROAD")).toBe(RoadsIcon);
    expect(getFeatureIcon("solar_panels")).toBe(SolarPanelIcon);
  });

  it("uses the supplied fallback for an unknown category", () => {
    expect(getFeatureIcon("unknown-category", MapIcon)).toBe(MapIcon);
  });
});
