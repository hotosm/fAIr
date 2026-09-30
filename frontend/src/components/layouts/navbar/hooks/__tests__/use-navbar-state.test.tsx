import { cleanup, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useNavbarState } from "../use-navbar-state";

const auth = vi.hoisted(() => ({ isAuthenticated: true }));
vi.mock("@/app/providers/auth-provider", () => ({ useAuth: () => auth }));
afterEach(cleanup);

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
