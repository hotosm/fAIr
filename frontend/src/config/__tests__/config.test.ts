import { describe, expect, it } from "vitest";
import { parseFloatEnv, parseIntEnv, parseStringEnv } from "../index";

describe("parseIntEnv()", () => {
  it("should return the integer value when a valid number is provided", () => {
    expect(parseIntEnv("10", 5)).toBe(10);
  });

  it("should return the default value when input is undefined", () => {
    expect(parseIntEnv(undefined, 5)).toBe(5);
  });

  it("should return the default value when input is NaN", () => {
    expect(parseIntEnv("invalid", 5)).toBe(5);
  });

  it("should return 0 when input is '0'", () => {
    expect(parseIntEnv("0", 5)).toBe(0);
  });
});

describe("parseFloatEnv()", () => {
  it("should return the float value when a valid number is provided", () => {
    expect(parseFloatEnv("10.5", 5.5)).toBe(10.5);
  });

  it("should return the default value when input is undefined", () => {
    expect(parseFloatEnv(undefined, 5.5)).toBe(5.5);
  });

  it("should return the default value when input is NaN", () => {
    expect(parseFloatEnv("invalid", 5.5)).toBe(5.5);
  });

  it("should return 0 when input is '0'", () => {
    expect(parseFloatEnv("0", 5.5)).toBe(0);
  });
});

describe("parseStringEnv()", () => {
  it("should return the provided value when it is a valid string", () => {
    expect(parseStringEnv("example.com", "default.com")).toBe("example.com");
  });

  it("should return the default value when input is undefined", () => {
    expect(parseStringEnv(undefined, "default.com")).toBe("default.com");
  });

  it("should return the default value when input is an empty string", () => {
    expect(parseStringEnv("", "default.com")).toBe("default.com");
  });

  it("should return the default value when input is only spaces", () => {
    expect(parseStringEnv("   ", "default.com")).toBe("default.com");
  });

  it("should trim spaces from a valid input", () => {
    expect(parseStringEnv("  example.com  ", "default.com")).toBe(
      "example.com",
    );
  });
});
