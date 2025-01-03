import { describe, expect, it } from "vitest";
import { extractTileJSONURL, truncateString } from "../string-utils";

describe("truncateString", () => {
  it("should truncate a string longer than the specified maxLength and append ellipsis", () => {
    const result = truncateString(
      "This is a very long string that needs to be truncated",
      20,
    );
    expect(result).toBe("This is a very lo...");
  });

  it("should return the original string if it is shorter than the specified maxLength", () => {
    const result = truncateString("Short string", 20);
    expect(result).toBe("Short string");
  });

  it("should return the original string if it is exactly the specified maxLength", () => {
    const result = truncateString("Exact length string", 19);
    expect(result).toBe("Exact length string");
  });

  it("should handle undefined input gracefully", () => {
    const result = truncateString(undefined, 20);
    expect(result).toBeUndefined();
  });

  it("should use the default maxLength of 30 if not specified", () => {
    const result = truncateString("This string is exactly thirty..");
    expect(result).toBe("This string is exactly thir...");
  });
});

describe("extractTileJSONURL", () => {
  it("should extract the base URL from a TMS URL", () => {
    const result = extractTileJSONURL(
      "https://example.com/tiles/{z}/{x}/{y}.png",
    );
    expect(result).toBe("https://example.com/tiles");
  });

  it("should return the original URL if it does not contain the TMS pattern", () => {
    const result = extractTileJSONURL("https://example.com/tiles");
    expect(result).toBe("https://example.com/tiles");
  });

  it("should handle URLs with query parameters", () => {
    const result = extractTileJSONURL(
      "https://example.com/tiles/{z}/{x}/{y}.png?token=abc123",
    );
    expect(result).toBe("https://example.com/tiles");
  });

  it("should handle URLs with additional path segments", () => {
    const result = extractTileJSONURL(
      "https://example.com/path/to/tiles/{z}/{x}/{y}.png",
    );
    expect(result).toBe("https://example.com/path/to/tiles");
  });
});
