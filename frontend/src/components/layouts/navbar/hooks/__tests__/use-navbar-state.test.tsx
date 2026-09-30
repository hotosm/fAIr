import { cleanup, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useNavbarState } from "../use-navbar-state";

const auth = vi.hoisted(() => ({ isAuthenticated: true }));
vi.mock("@/app/providers/auth-provider", () => ({ useAuth: () => auth }));
afterEach(cleanup);

describe("Dashboard button", () => {
  it.each([
    ["/try-fair", true, true],
    ["/try-fair", false, false],
    ["/profile", true, false],
    ["/", true, false],
  ])(
    "uses route %s and authentication %s to show Dashboard %s",
    (path, signedIn, expected) => {
      auth.isAuthenticated = signedIn;
      const { result } = renderHook(useNavbarState, {
        wrapper: ({ children }) => (
          <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
        ),
      });
      expect(result.current.showDashboardLink).toBe(expected);
    },
  );
});

describe("navbar mode switcher", () => {
  it.each([
    ["/profile", true, true],
    ["/profile/models", true, true],
    ["/profile/map-requests", true, true],
    ["/try-fair", true, true],
    ["/map-requests/42", true, false],
    ["/about", true, false],
    ["/profile", false, false],
    ["/try-fair?mappingMode=advanced", false, false],
  ])(
    "uses route %s and authentication %s to show mode switcher %s",
    (path, signedIn, expected) => {
      auth.isAuthenticated = signedIn;
      const { result } = renderHook(useNavbarState, {
        wrapper: ({ children }) => (
          <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
        ),
      });
      expect(result.current.showMappingMode).toBe(expected);
    },
  );
});

describe("navbar result download", () => {
  it.each([
    ["/profile/map-requests", true, false],
    ["/profile", true, false],
    ["/map-requests", true, false],
    ["/map-requests/42", true, true],
    ["/map-requests/42/extra", true, false],
    ["/map-requests/42", false, false],
  ])(
    "shows download only on an authenticated result page (%s)",
    (path, signedIn, expected) => {
      auth.isAuthenticated = signedIn;
      const { result } = renderHook(useNavbarState, {
        wrapper: ({ children }) => (
          <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
        ),
      });
      expect(result.current.showDownloadResult).toBe(expected);
    },
  );
});
