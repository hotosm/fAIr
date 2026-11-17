import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { SavedUserState } from "@/features/try-fair/api/user-state";
import { RecentMappingCard } from "../recent-mapping-card";

vi.mock("@/hooks/use-map-instance", () => ({
  useMapInstance: () => ({ mapContainerRef: { current: null }, map: null }),
}));

vi.mock("@/components/map/map", () => ({
  MapComponent: ({ tileServiceURL }: { tileServiceURL?: string }) => (
    <div data-testid="hero-imagery">{tileServiceURL}</div>
  ),
}));

const savedActivity: SavedUserState = {
  pid: 42,
  timestamp: new Date().toISOString(),
  state: {
    type: "mapping",
    category: "buildings",
    name: "Buildings in Freetown",
    model: { id: "buildings", title: "Buildings" },
    imagery: {
      name: "Freetown imagery",
      url: "https://example.com/freetown/tilejson.json",
    },
    zoom: 19,
    bbox: [-13.3, 8.3, -13.1, 8.5],
  },
};

describe("RecentMappingCard", () => {
  it("shows the latest activity imagery and links to its protected project", () => {
    render(
      <MemoryRouter>
        <RecentMappingCard activity={savedActivity} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Buildings in Freetown")).toBeInTheDocument();
    expect(screen.getByTestId("hero-imagery")).toHaveTextContent(
      savedActivity.state.imagery.url,
    );
    expect(
      screen.getByRole("link", { name: /Resume Mapping/i }),
    ).toHaveAttribute("href", "/try-fair/42");
    expect(
      screen.getByRole("link", { name: /Start New Mapping/i }),
    ).toHaveAttribute("href", "/try-fair");
  });
});
