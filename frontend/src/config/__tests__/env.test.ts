import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  delete window.__RUNTIME_CONFIG__;
  vi.resetModules();
});

describe("expanded imagery selector flag", () => {
  it.each([undefined, "false", "", "1", "true"])(
    "only enables the new layout for the exact value true (value=%s)",
    async (value) => {
      vi.stubEnv("VITE_EXPANDED_IMAGERY_SELECTOR", value);
      vi.resetModules();
      const { ENVS } = await import("../env");
      expect(ENVS.EXPANDED_IMAGERY_SELECTOR).toBe(value === "true");
    },
  );

  it.each(["true", "false"])(
    "prefers the runtime flag (%s) over the build-time flag",
    async (value) => {
      vi.stubEnv(
        "VITE_EXPANDED_IMAGERY_SELECTOR",
        value === "true" ? "false" : "true",
      );
      window.__RUNTIME_CONFIG__ = { VITE_EXPANDED_IMAGERY_SELECTOR: value };
      vi.resetModules();
      const { ENVS } = await import("../env");
      expect(ENVS.EXPANDED_IMAGERY_SELECTOR).toBe(value === "true");
    },
  );
});
