import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserProfileSettingsPage } from "../settings";

const updateProfile = vi.fn();

vi.mock("@/app/providers/auth-provider", () => ({
  useAuth: () => ({
    user: {
      email: "mapper@example.org",
      email_verified: true,
      newsletter_subscription: false,
    },
    setUser: vi.fn(),
  }),
}));

vi.mock("@/features/user-profile/hooks/use-user-profile", () => ({
  useUpdateUserProfile: () => ({ mutate: updateProfile }),
  useEmailVerification: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/components/seo", () => ({ Head: () => null }));
vi.mock("@/features/try-fair/components/mapping-mode", () => ({
  default: () => <div>Mode switch</div>,
}));

vi.mock("@/components/ui/form", () => ({
  Input: () => null,
  Switch: ({
    checked,
    disabled,
    handleSwitchChange,
  }: {
    checked: boolean;
    disabled?: boolean;
    handleSwitchChange: (event: { target: { checked: boolean } }) => void;
  }) => (
    <input
      type="checkbox"
      aria-label="newsletter"
      checked={checked}
      disabled={disabled}
      onChange={(event) => handleSwitchChange(event)}
    />
  ),
}));

afterEach(cleanup);

describe("UserProfileSettingsPage", () => {
  it("titles the page Settings like the other dashboard pages", () => {
    render(<UserProfileSettingsPage />);

    expect(
      screen.getByRole("heading", { name: "Settings" }),
    ).toBeInTheDocument();
  });

  it("toggles the newsletter by sending only newsletter_subscription", () => {
    render(<UserProfileSettingsPage />);

    expect(screen.getByText("Monthly Newsletter")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("newsletter"));

    expect(updateProfile).toHaveBeenCalledWith(
      { newsletter_subscription: true },
      expect.anything(),
    );
  });
});
