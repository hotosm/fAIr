import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  delete window.__RUNTIME_CONFIG__;
  vi.resetModules();
});

describe.each([
  ["VITE_EXPANDED_IMAGERY_SELECTOR", "EXPANDED_IMAGERY_SELECTOR"],
] as const)("%s flag", (variable, key) => {
  it.each([undefined, "false", "", "1", "true"])(
    "only enables the new layout for the exact value true (value=%s)",
    async (value) => {
      vi.stubEnv(variable, value);
      vi.resetModules();
      const { ENVS } = await import("../env");
      expect(ENVS[key]).toBe(value === "true");
    },
  );

  it.each(["true", "false"])(
    "prefers the runtime flag (%s) over the build-time flag",
    async (value) => {
      vi.stubEnv(variable, value === "true" ? "false" : "true");
      window.__RUNTIME_CONFIG__ = { [variable]: value };
      vi.resetModules();
      const { ENVS } = await import("../env");
      expect(ENVS[key]).toBe(value === "true");
    },
  );
});
