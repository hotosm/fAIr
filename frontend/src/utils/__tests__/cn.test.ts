import { cn } from "../cn";
import { describe, expect, it } from "vitest";

describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("should handle conditional class names", () => {
    expect(cn("class1", false && "class2", "class3")).toBe("class1 class3");
  });

  it("should handle arrays of class names", () => {
    expect(cn(["class1", "class2"], "class3")).toBe("class1 class2 class3");
  });

  it("should handle objects with boolean values", () => {
    expect(cn({ class1: true, class2: false }, "class3")).toBe("class1 class3");
  });

  it("should handle undefined and null values", () => {
    expect(cn("class1", undefined, null, "class2")).toBe("class1 class2");
  });

  it("should merge tailwind classes correctly", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
