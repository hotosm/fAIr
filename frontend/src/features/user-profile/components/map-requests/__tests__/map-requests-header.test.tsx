import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapRequestsHeader } from "../map-requests-header";
import { ProfileSidebarContext } from "@/features/user-profile/components/profile-sidebar-context";

const state = vi.hoisted(() => ({
  mappingMode: "advanced",
  isSmallViewport: true,
}));
vi.mock("@/features/try-fair/hooks/use-try-fair-params", () => ({
  useTryFairParams: () => ({ mappingMode: state.mappingMode }),
}));
vi.mock("@/hooks/use-screen-size", () => ({
  default: () => ({ isSmallViewport: state.isSmallViewport }),
}));
vi.mock("@/features/try-fair/components/mapping-mode", () => ({
  default: () => <div>Mode switch</div>,
}));

afterEach(cleanup);

const renderHeader = () =>
  render(
    <MemoryRouter>
      <ProfileSidebarContext.Provider value={{ openSidebar: vi.fn() }}>
        <MapRequestsHeader />
      </ProfileSidebarContext.Provider>
    </MemoryRouter>,
  );

describe("MapRequestsHeader", () => {
  it("on phones shows Back and the title, without the mode switch", () => {
    state.isSmallViewport = true;
    state.mappingMode = "advanced";
    renderHeader();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Map Request" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Mode switch")).not.toBeInTheDocument();
    // Back is the way out here, so no dashboard menu button.
    expect(
      screen.queryByRole("button", { name: "Open dashboard menu" }),
    ).not.toBeInTheDocument();
  });

  it("on wider screens in advanced mode leaves Back to the sidebar", () => {
    state.isSmallViewport = false;
    state.mappingMode = "advanced";
    renderHeader();
    expect(
      screen.queryByRole("button", { name: "Back" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Map Requests" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open dashboard menu" }),
    ).toBeInTheDocument();
  });
});
