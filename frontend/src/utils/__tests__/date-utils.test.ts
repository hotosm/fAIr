import { buildDateFilterQueryString } from "../date-utils";
import { describe, expect, it } from "vitest";
import { extractDatePart, formatDate, formatDuration } from "../date-utils";

describe("buildDateFilterQueryString", () => {
  it("should return an empty object if no dates are provided", () => {
    const selectedFilter = { apiValue: "created_at" };
    expect(buildDateFilterQueryString(selectedFilter)).toEqual({});
  });

  it("should return a query string with only startDate", () => {
    const selectedFilter = { apiValue: "-created_at" };
    const startDate = "2024-01-01";
    expect(buildDateFilterQueryString(selectedFilter, startDate)).toEqual({
      "-created_at__gte": startDate,
    });
  });

  it("should return a query string with only endDate", () => {
    const selectedFilter = { apiValue: "updated_at" };
    const endDate = "2024-12-31";
    expect(
      buildDateFilterQueryString(selectedFilter, undefined, endDate),
    ).toEqual({
      updated_at__lte: endDate,
    });
  });

  it("should return a query string with both startDate and endDate", () => {
    const selectedFilter = { apiValue: "-updated_at" };
    const startDate = "2024-01-01";
    const endDate = "2024-12-31";
    expect(
      buildDateFilterQueryString(selectedFilter, startDate, endDate),
    ).toEqual({
      "-updated_at__gte": startDate,
      "-updated_at__lte": endDate,
    });
  });

  it("should handle undefined selectedFilter gracefully", () => {
    const startDate = "2024-01-01";
    const endDate = "2024-12-31";
    expect(buildDateFilterQueryString(undefined, startDate, endDate)).toEqual(
      {},
    );
  });
});

describe("formatDate", () => {
  it("should format date correctly", () => {
    const isoString = "2024-01-01T12:00:00Z";
    expect(formatDate(isoString)).toBe("01/01/2024, 12:00:00");
  });

  it("should handle different times correctly", () => {
    const isoString = "2024-01-01T23:59:59Z";
    expect(formatDate(isoString)).toBe("01/01/2024, 23:59:59");
  });

  it("should handle different dates correctly", () => {
    const isoString = "2024-12-31T00:00:00Z";
    expect(formatDate(isoString)).toBe("31/12/2024, 00:00:00");
  });

  it("should handle invalid ISO strings gracefully", () => {
    const isoString = "invalid-date";
    expect(formatDate(isoString)).toBe("NaN/NaN/NaN, NaN:NaN:NaN");
  });

  it("should handle empty ISO strings gracefully", () => {
    const isoString = "";
    expect(formatDate(isoString)).toBe("NaN/NaN/NaN, NaN:NaN:NaN");
  });
});

describe("formatDuration", () => {
  it("should format duration correctly for same start and end date", () => {
    const startDate = new Date("2024-01-01T00:00:00Z");
    const endDate = new Date("2024-01-01T00:00:00Z");
    expect(formatDuration(startDate, endDate)).toBe("0 sec");
  });

  it("should format duration correctly for seconds difference", () => {
    const startDate = new Date("2024-01-01T00:00:00Z");
    const endDate = new Date("2024-01-01T00:00:30Z");
    expect(formatDuration(startDate, endDate)).toBe("30 secs");
  });

  it("should format duration correctly for minutes difference", () => {
    const startDate = new Date("2024-01-01T00:00:00Z");
    const endDate = new Date("2024-01-01T00:15:00Z");
    expect(formatDuration(startDate, endDate)).toBe("15 mins");
  });

  it("should format duration correctly for hours difference", () => {
    const startDate = new Date("2024-01-01T00:00:00Z");
    const endDate = new Date("2024-01-01T02:00:00Z");
    expect(formatDuration(startDate, endDate)).toBe("2 hrs");
  });

  it("should format duration correctly for days difference", () => {
    const startDate = new Date("2024-01-01T00:00:00Z");
    const endDate = new Date("2024-01-03T00:00:00Z");
    expect(formatDuration(startDate, endDate)).toBe("2 days");
  });

  it("should format duration correctly for mixed difference", () => {
    const startDate = new Date("2024-01-01T00:00:00Z");
    const endDate = new Date("2024-01-02T03:04:05Z");
    expect(formatDuration(startDate, endDate)).toBe(
      "1 day 3 hrs 4 mins 5 secs",
    );
  });

  it("should limit the number of units in the output", () => {
    const startDate = new Date("2024-01-01T00:00:00Z");
    const endDate = new Date("2024-01-02T03:04:05Z");
    expect(formatDuration(startDate, endDate, 2)).toBe("1 day 3 hrs");
  });
});

describe("extractDatePart", () => {
  it("should extract the year correctly", () => {
    const date = new Date("2024-01-01T00:00:00Z").toISOString();
    expect(extractDatePart(date)).toBe("2024-01-01");
  });

  it("should return N/A for TZ alone", () => {
    expect(extractDatePart("T00:00:00Z")).toBe("N/A");
  });

  it("should still work for dates that are not ISO date strings", () => {
    expect(extractDatePart("2024-01-01")).toBe("2024-01-01");
  });

  it("should return N/A for invalid date or empty date strings", () => {
    expect(extractDatePart("")).toBe("N/A");
  });
});
