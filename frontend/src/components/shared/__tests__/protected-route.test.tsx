import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "../protected-route";

const auth = vi.hoisted(() => ({
  isAuthenticated: false,
  isAuthLoading: true,
}));
vi.mock("@/app/providers/auth-provider", () => ({ useAuth: () => auth }));
vi.mock("@/components/seo", () => ({ Head: () => null }));
afterEach(cleanup);

describe("ProtectedRoute session resolution", () => {
  it.each([true, false])(
    "waits for authentication before rendering protected content or sign-in (authenticated=%s)",
    (signedIn) => {
      auth.isAuthenticated = false;
      auth.isAuthLoading = true;
      const content = (
        <MemoryRouter>
          <ProtectedRoute>
            <p>Private page</p>
          </ProtectedRoute>
        </MemoryRouter>
      );
      const { rerender } = render(content);
      expect(
        screen.getByRole("status", { name: "Checking your session" }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Private page")).not.toBeInTheDocument();
      expect(
        screen.queryByText("To access this page you have to login."),
      ).not.toBeInTheDocument();

      auth.isAuthLoading = false;
      auth.isAuthenticated = signedIn;
      rerender(
        <MemoryRouter>
          <ProtectedRoute>
            <p>Private page</p>
          </ProtectedRoute>
        </MemoryRouter>,
      );
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      if (signedIn)
        expect(screen.getByText("Private page")).toBeInTheDocument();
      else {
        expect(screen.queryByText("Private page")).not.toBeInTheDocument();
        expect(
          screen.getByText("To access this page you have to login."),
        ).toBeInTheDocument();
      }
    },
  );
});
