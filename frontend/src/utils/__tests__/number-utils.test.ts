import { describe, expect, it } from "vitest";
import { roundNumber } from "../number-utils";

describe("roundNumber", () => {
  it("should round a number to 2 decimal places by default", () => {
    expect(roundNumber(1.2345)).toBe(1.23);
    expect(roundNumber(1.2367)).toBe(1.24);
  });

  it("should round a number to the specified number of decimal places", () => {
    expect(roundNumber(1.2345, 3)).toBe(1.235);
    expect(roundNumber(1.2367, 1)).toBe(1.2);
  });

  it("should handle rounding of whole numbers", () => {
    expect(roundNumber(123)).toBe(123.0);
    expect(roundNumber(123, 1)).toBe(123.0);
  });

  it("should handle negative numbers", () => {
    expect(roundNumber(-1.2345)).toBe(-1.23);
    expect(roundNumber(-1.2367, 3)).toBe(-1.237);
  });

  it("should handle zero", () => {
    expect(roundNumber(0)).toBe(0.0);
    expect(roundNumber(0, 3)).toBe(0.0);
  });
});
