import { describe, it, expect } from "vitest";
import { getSlidesPerPage } from "../use-break-point";
import type { Breakpoint } from "../use-break-point";

describe("getSlidesPerPage", () => {
  it("should return 1 slide for mobile", () => {
    expect(getSlidesPerPage("mobile")).toBe(1);
  });

  it("should return 2 slides for sm and md", () => {
    expect(getSlidesPerPage("sm")).toBe(2);
    expect(getSlidesPerPage("md")).toBe(2);
  });

  it("should return 4 slides for lg, xl and 2xl", () => {
    const breakpoints: Breakpoint[] = ["lg", "xl", "2xl"];

    breakpoints.forEach((bp) => {
      expect(getSlidesPerPage(bp)).toBe(4);
    });
  });

  it("should default to 4 slides for unknown input (type escape hatch)", () => {
    expect(getSlidesPerPage("lg")).toBe(4);
  });
});
