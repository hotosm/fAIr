import { describe, it, expect } from "vitest";
import { extractDatePart, buildDateFilterQueryString, formatDate, formatDuration } from "@/utils";
import type { DateFilter } from "@/types";

describe("extractDatePart", () => {
  it("should extract date from ISO string", () => {
    expect(extractDatePart("2024-01-01T12:00:00Z")).toBe("2024-01-01");
  });

  it("should return 'N/A' for empty input", () => {
    expect(extractDatePart("")).toBe("N/A");
    expect(extractDatePart(undefined as unknown as string)).toBe("N/A");
  });

  it("should return date part without T", () => {
    expect(extractDatePart("2025-12-31")).toBe("2025-12-31");
  });
});

describe("buildDateFilterQueryString", () => {
  const filter: DateFilter = {
    apiValue: "createdAt",
    label: "Created At",
    searchParams: "",
  };

  it("should build query with start and end dates", () => {
    const result = buildDateFilterQueryString(filter, "2024-01-01", "2024-12-31");
    expect(result).toEqual({
      createdAt__gte: "2024-01-01",
      createdAt__lte: "2024-12-31",
    });
  });

  it("should build query with only startDate", () => {
    const result = buildDateFilterQueryString(filter, "2024-01-01");
    expect(result).toEqual({ createdAt__gte: "2024-01-01" });
  });

  it("should build query with only endDate", () => {
    const result = buildDateFilterQueryString(filter, undefined, "2024-12-31");
    expect(result).toEqual({ createdAt__lte: "2024-12-31" });
  });

  it("should return empty object if no dates provided", () => {
    expect(buildDateFilterQueryString(filter)).toEqual({});
    expect(buildDateFilterQueryString()).toEqual({});
  });
});

describe("formatDate", () => {
  it("should format DD-MM-YYYY date", () => {
    expect(formatDate("01-02-2025")).toBe("01/02/2025");
    expect(formatDate("01-02-2025", true)).toBe("Feb 1, 2025");
  });

  it("should format YYYY-MM-DD date", () => {
    expect(formatDate("2025-02-01")).toBe("01/02/2025");
    expect(formatDate("2025-02-01", true)).toBe("Feb 1, 2025");
  });

  it("should format ISO timestamp", () => {
    expect(formatDate("2026-01-30T06:45:12")).toBe("30/01/2026, 06:45:12");
    expect(formatDate("2026-01-30T06:45:12", true)).toBe("Jan 30, 2026");
  });

  it("should throw for unsupported format", () => {
    expect(() => formatDate("01/02/2025")).toThrow("Unsupported date format");
  });
});

describe("formatDuration", () => {
  const start = new Date("2026-01-30T06:00:00");
  const end = new Date("2026-01-30T08:30:45");

  it("should format duration in hours, minutes, seconds", () => {
    expect(formatDuration(start, end)).toBe("2 hrs 30 mins 45 secs");
  });

  it("should respect maxUnits parameter", () => {
    expect(formatDuration(start, end, 2)).toBe("2 hrs 30 mins");
  });

  it("should handle same start and end", () => {
    expect(formatDuration(start, start)).toBe("0 sec");
  });

  it("should handle days", () => {
    const startDate = new Date("2026-01-28T00:00:00");
    const endDate = new Date("2026-01-30T01:02:03");
    expect(formatDuration(startDate, endDate)).toBe("2 days 1 hr 2 mins 3 secs");
  });
});
