import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TryFairPointsLegend } from "@/features/try-fair/components/map/points-legend";
import { TryFairPolygonLegend } from "@/features/try-fair/components/map/polygon-legend";

const collection = (count: number): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: Array.from({ length: count }, () => ({
    type: "Feature",
    properties: {},
    geometry: { type: "Point", coordinates: [0, 0] },
  })),
});

describe("TryFairPolygonLegend", () => {
  afterEach(cleanup);

  it("says an empty result detected 0 features", () => {
    render(<TryFairPolygonLegend predictions={collection(0)} />);

    expect(screen.getByText("0 features detected")).toBeTruthy();
  });

  it("counts the features of a result", () => {
    render(<TryFairPolygonLegend predictions={collection(1)} />);

    expect(screen.getByText("1 feature detected")).toBeTruthy();
  });

  it("renders nothing before a result loads", () => {
    const { container } = render(<TryFairPolygonLegend predictions={null} />);

    expect(container.innerHTML).toBe("");
  });
});

describe("TryFairPointsLegend", () => {
  afterEach(cleanup);

  it("says an empty result detected 0 features", () => {
    render(<TryFairPointsLegend predictions={collection(0)} />);

    expect(screen.getByText("0 features detected")).toBeTruthy();
  });
});
