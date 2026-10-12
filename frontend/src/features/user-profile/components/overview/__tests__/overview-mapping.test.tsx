import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SavedUserState } from "@/features/try-fair/api/user-state";
import { OverviewHero } from "../overview-hero";
import { RecentActivities } from "../recent-activities";

const useGetUserStates = vi.hoisted(() => vi.fn());

vi.mock("@/features/user-profile/api/user-state", () => ({
  useGetUserStates,
}));

vi.mock("../recent-mapping-card", () => ({
  RecentMappingCard: ({ activity }: { activity: SavedUserState }) => (
    <div>Hero: {activity.state.name}</div>
  ),
}));

vi.mock("@/components/ui/data-table", () => ({
  DataTable: ({ data }: { data: SavedUserState[] }) => (
    <div>
      {data.map((activity) => (
        <div key={activity.pid}>List: {activity.state.name}</div>
      ))}
    </div>
  ),
}));

const activity = (pid: number, name: string): SavedUserState => ({
  pid,
  timestamp: "2026-10-12T08:00:00Z",
  state: {
    type: "mapping",
    category: "buildings",
    name,
    model: { id: "buildings", title: "Buildings" },
    imagery: { name: `${name} imagery`, url: "https://example.com/tiles.json" },
    zoom: 19,
    bbox: [0, 0, 1, 1],
  },
});

describe("overview mapping activities", () => {
  beforeEach(() => {
    useGetUserStates.mockReturnValue({
      data: {
        count: 3,
        next: null,
        previous: null,
        results: [
          activity(3, "Newest mapping"),
          activity(2, "Second mapping"),
          activity(1, "Oldest mapping"),
        ],
      },
      isPending: false,
      isError: false,
    });
  });

  afterEach(cleanup);

  it("shows the first activity in the hero", () => {
    render(<OverviewHero />);

    expect(screen.getByText("Hero: Newest mapping")).toBeInTheDocument();
  });

  it("shows a structured loading state for recent mapping", () => {
    useGetUserStates.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    });

    render(<OverviewHero />);

    expect(
      screen.getByRole("status", { name: "Loading recent mapping" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Recent Mapping")).toBeInTheDocument();
  });

  it("shows only the remaining activities in the recent list", () => {
    render(
      <MemoryRouter>
        <RecentActivities />
      </MemoryRouter>,
    );

    expect(screen.queryByText("List: Newest mapping")).not.toBeInTheDocument();
    expect(screen.getByText("List: Second mapping")).toBeInTheDocument();
    expect(screen.getByText("List: Oldest mapping")).toBeInTheDocument();
  });
});
