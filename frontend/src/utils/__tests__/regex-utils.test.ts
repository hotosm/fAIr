import { describe, expect, it } from "vitest";
import { TMS_URL_REGEX_PATTERN } from "../regex-utils";

describe("TMS_URL_REGEX_PATTERN", () => {
  it("should match a valid TMS URL", () => {
    const validUrl = "https://example.com/{z}/{x}/{y}.png";
    expect(TMS_URL_REGEX_PATTERN.test(validUrl)).toBe(true);
  });

  it("should not match a URL without https", () => {
    const invalidUrl = "http://example.com/{z}/{x}/{y}.png";
    expect(TMS_URL_REGEX_PATTERN.test(invalidUrl)).toBe(false);
  });

  it("should not match a URL without placeholders", () => {
    const invalidUrl = "https://example.com/1/2/3.png";
    expect(TMS_URL_REGEX_PATTERN.test(invalidUrl)).toBe(false);
  });

  it("should match a URL with additional query parameters", () => {
    const validUrl = "https://example.com/{z}/{x}/{y}.png?token=abc123";
    expect(TMS_URL_REGEX_PATTERN.test(validUrl)).toBe(true);
  });

  it("should not match a URL with missing placeholders", () => {
    const invalidUrl = "https://example.com/{z}/{x}/.png";
    expect(TMS_URL_REGEX_PATTERN.test(invalidUrl)).toBe(false);
  });

  it("should match a URL with different file extensions", () => {
    const validUrl = "https://example.com/{z}/{x}/{y}.jpg";
    expect(TMS_URL_REGEX_PATTERN.test(validUrl)).toBe(true);
  });

  it("should not match a URL with incorrect placeholder order", () => {
    const invalidUrl = "https://example.com/{x}/{z}/{y}.png";
    expect(TMS_URL_REGEX_PATTERN.test(invalidUrl)).toBe(false);
  });
});
