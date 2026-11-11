import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import UserSidebar from "@/features/user-profile/components/user-sidebar";
import { APPLICATION_ROUTES } from "@/constants";

afterEach(cleanup);

const renderSidebar = (props: Parameters<typeof UserSidebar>[0] = {}) =>
  render(
    <MemoryRouter initialEntries={[APPLICATION_ROUTES.PROFILE_BASE]}>
      <UserSidebar {...props} />
    </MemoryRouter>,
  );

describe("UserSidebar (mobile menu)", () => {
  it("lists Settings with the other pages and shows the community card", () => {
    renderSidebar({ stacked: true });
    const titles = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("title"));
    expect(titles).toEqual([
      "Overview",
      "AI Models",
      "Datasets",
      "Map Requests",
      "Settings",
      "Join the Community",
    ]);
  });

  it("calls onNavigate when a page is chosen", () => {
    const onNavigate = vi.fn();
    renderSidebar({ stacked: true, onNavigate });
    fireEvent.click(screen.getByTitle("Datasets"));
    expect(onNavigate).toHaveBeenCalledOnce();
  });
});
