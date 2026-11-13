import { describe, expect, it } from "vitest";
import { isNavigationRouteEnabled } from "../general";

describe("isNavigationRouteEnabled()", () => {
  it.each(["/ai-predictions", "/ai-predictions/", "/ai-predictions/12"])(
    "disables %s, a child of a disabled menu item",
    (pathname) => {
      expect(isNavigationRouteEnabled(pathname)).toBe(false);
    },
  );

  it.each(["/datasets", "/ai-models/3", "/resources"])(
    "disables %s, a disabled top-level item",
    (pathname) => {
      expect(isNavigationRouteEnabled(pathname)).toBe(false);
    },
  );

  it.each(["/", "/learn", "/about", "/try-fair", "/profile/map-requests"])(
    "keeps %s enabled",
    (pathname) => {
      expect(isNavigationRouteEnabled(pathname)).toBe(true);
    },
  );
});
