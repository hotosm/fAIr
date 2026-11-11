import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileAccountMenu } from "@/components/layouts/navbar/mobile-account-menu";

const auth = vi.hoisted(() => ({
  user: {
    username: "kshitij",
    email: "kshitij@example.com",
    img_url: "",
  },
  logout: vi.fn(),
}));
vi.mock("@/app/providers/auth-provider", () => ({ useAuth: () => auth }));
vi.mock("@/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/config")>()),
  AUTH_PROVIDER: "osm",
  HANKO_URL: "https://login.example.org",
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MobileAccountMenu", () => {
  it("shows the user's email with Log Out, and collapses", () => {
    render(<MobileAccountMenu returnTo="/" />);
    const toggle = screen.getByRole("button", { name: /kshitij@example.com/ });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Log Out" })).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("button", { name: "Log Out" }),
    ).not.toBeInTheDocument();
  });

  it("logs out and closes the menu", async () => {
    const onNavigate = vi.fn();
    render(<MobileAccountMenu returnTo="/" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: "Log Out" }));
    await vi.waitFor(() => expect(auth.logout).toHaveBeenCalledOnce());
    expect(onNavigate).toHaveBeenCalledOnce();
  });
});
