import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfilePageTitle } from "@/features/user-profile/components/profile-page-title";
import { ProfileSidebarContext } from "@/features/user-profile/components/profile-sidebar-context";

vi.mock("@/features/try-fair/components/mapping-mode", () => ({
  default: () => <div>Mode switch</div>,
}));

afterEach(cleanup);

describe("ProfilePageTitle", () => {
  it("shows the title, actions, mode switch and phone menu", () => {
    render(
      <ProfilePageTitle
        title="Dashboard"
        actions={<button type="button">Create</button>}
        phoneMenu={<button type="button">More</button>}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    expect(screen.getByText("Mode switch")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More" })).toBeInTheDocument();
  });

  it("has no menu button without a dashboard sidebar (basic mode)", () => {
    render(<ProfilePageTitle title="Dashboard" />);
    expect(
      screen.queryByRole("button", { name: "Open dashboard menu" }),
    ).not.toBeInTheDocument();
  });

  it("opens the dashboard sidebar from the menu button", () => {
    const openSidebar = vi.fn();
    render(
      <ProfileSidebarContext.Provider value={{ openSidebar }}>
        <ProfilePageTitle title="Overview" />
      </ProfileSidebarContext.Provider>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Open dashboard menu" }),
    );
    expect(openSidebar).toHaveBeenCalledOnce();
  });
});
