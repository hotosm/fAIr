import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MapIcon } from "@/components/ui/icons";
import { RoadsIcon } from "@/components/ui/icons/roads-icon";
import { SolarPanelIcon } from "@/components/ui/icons/solar-panel-icon";
import { TreesIcon } from "@/components/ui/icons/trees-icon";
import { getFeatureIcon, PrivateModelBadge } from "../model-picker-badges";

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

afterEach(cleanup);

describe("PrivateModelBadge", () => {
  it("labels a private model", () => {
    render(<PrivateModelBadge visibility="private" />);
    expect(screen.getByText("Private")).toBeInTheDocument();
  });

  it("shows nothing for a public model", () => {
    render(<PrivateModelBadge visibility="public" />);
    expect(screen.queryByText("Private")).not.toBeInTheDocument();
  });
});
