import { describe, it, expect } from "vitest";
import { formatNumber, roundNumber } from "../number-utils";

describe("formatNumber", () => {
  it("should format numbers less than 1000 with en-US locale-specific thousands separator", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(123)).toBe("123");
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(123.45)).toBe("123.45");
  });

  it('should format numbers in thousands with "K" suffix', () => {
    expect(formatNumber(1000)).toBe("1.0K");
    expect(formatNumber(1234)).toBe("1.2K");
    expect(formatNumber(9999)).toBe("10.0K");
    expect(formatNumber(10500)).toBe("10.5K");
    expect(formatNumber(999999)).toBe("1000.0K");
  });

  it('should format numbers in millions with "M" suffix', () => {
    expect(formatNumber(1_000_000)).toBe("1.0M");
    expect(formatNumber(1_234_567)).toBe("1.2M");
    expect(formatNumber(9_999_999)).toBe("10.0M");
    expect(formatNumber(123_456_789)).toBe("123.5M");
    expect(formatNumber(999_999_999)).toBe("1000.0M");
  });

  it('should format numbers in billions with "B" suffix', () => {
    expect(formatNumber(1_000_000_000)).toBe("1.0B");
    expect(formatNumber(1_234_567_890)).toBe("1.2B");
    expect(formatNumber(9_999_999_999)).toBe("10.0B");
    expect(formatNumber(123_456_789_012)).toBe("123.5B");
  });

  it("should handle negative numbers (will apply formatting but keep sign)", () => {
    expect(formatNumber(-123)).toBe("-123");
    expect(formatNumber(-1234)).toBe("-1.2K");
    expect(formatNumber(-1_234_567)).toBe("-1.2M");
  });

  it("should handle zero correctly", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("should handle very small non-zero numbers correctly", () => {
    expect(formatNumber(0.123)).toBe("0.123");
    expect(formatNumber(0.999)).toBe("0.999");
  });
});

describe("roundNumber", () => {
  describe("default rounding (2 decimal places)", () => {
    it("should round a number with more than 2 decimal places correctly", () => {
      expect(roundNumber(123.456)).toBe(123.46);
      expect(roundNumber(7.89123)).toBe(7.89);
      expect(roundNumber(0.125)).toBe(0.13); // Rounds up .5 correctly
      expect(roundNumber(0.124)).toBe(0.12); // Rounds down correctly
    });

    it("should return the same number if it has 2 or fewer decimal places", () => {
      expect(roundNumber(100)).toBe(100);
      expect(roundNumber(5.5)).toBe(5.5);
      expect(roundNumber(12.34)).toBe(12.34);
      expect(roundNumber(0.0)).toBe(0);
    });

    it("should handle negative numbers correctly", () => {
      expect(roundNumber(-123.456)).toBe(-123.46);
      expect(roundNumber(-7.89123)).toBe(-7.89);
      expect(roundNumber(-0.125)).toBe(-0.13);
    });
  });

  describe("custom rounding", () => {
    it("should round to 0 decimal places (integer)", () => {
      expect(roundNumber(123.456, 0)).toBe(123);
      expect(roundNumber(7.89123, 0)).toBe(8);
      expect(roundNumber(0.5, 0)).toBe(1);
      expect(roundNumber(-0.5, 0)).toBe(-1);
    });

    it("should round to 1 decimal place", () => {
      expect(roundNumber(123.456, 1)).toBe(123.5);
      expect(roundNumber(7.89123, 1)).toBe(7.9);
      expect(roundNumber(0.12, 1)).toBe(0.1);
    });

    it("should round to 3 decimal places", () => {
      expect(roundNumber(123.4567, 3)).toBe(123.457);
      expect(roundNumber(7.891234, 3)).toBe(7.891);
      expect(roundNumber(0.1235, 3)).toBe(0.124);
    });

    it("should round to 5 decimal places", () => {
      expect(roundNumber(1.234567, 5)).toBe(1.23457);
      expect(roundNumber(0.000001, 5)).toBe(0);
    });

    it("should add trailing zeros if precision is higher than original", () => {
      expect(roundNumber(123, 2)).toBe(123);
      expect(roundNumber(5.5, 3)).toBe(5.5);
      expect(roundNumber(12.34, 5)).toBe(12.34);
    });
  });

  describe("edge cases and invalid inputs", () => {
    it("should return 0 for non-numeric input (string)", () => {
      // @ts-expect-error - Intentionally testing invalid input type
      expect(roundNumber("abc")).toBe(0);
    });

    it("should return 0 for null input", () => {
      // @ts-expect-error - Intentionally testing invalid input type
      expect(roundNumber(null)).toBe(0);
    });

    it("should return 0 for undefined input", () => {
      // @ts-expect-error - Intentionally testing invalid input type
      expect(roundNumber(undefined)).toBe(0);
    });

    it("should return 0 for NaN input", () => {
      expect(roundNumber(NaN)).toBe(0);
    });

    it("should handle Infinity correctly", () => {
      expect(roundNumber(Infinity)).toBe(0);
      expect(roundNumber(-Infinity)).toBe(0);
    });

    it("should handle very small numbers that round to zero", () => {
      expect(roundNumber(0.0001, 2)).toBe(0);
      expect(roundNumber(-0.0001, 2)).toBe(0);
    });
  });
});
