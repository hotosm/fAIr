import { describe, expect, it } from "vitest";
import { PredictionRequestStatus } from "@/enums";
import { getPredictionsQueryOptions } from "@/features/user-profile/api/factory";

type RefetchInterval = NonNullable<
  ReturnType<typeof getPredictionsQueryOptions>["refetchInterval"]
>;
type ListQuery = Parameters<
  Extract<RefetchInterval, (...args: never[]) => unknown>
>[0];

const pageOf = (
  ...rows: { status: PredictionRequestStatus; results_ready: boolean }[]
) => ({ state: { data: { results: rows } } }) as unknown as ListQuery;

const intervalFor = (query: ListQuery) => {
  const refetchInterval = getPredictionsQueryOptions().refetchInterval;
  return typeof refetchInterval === "function"
    ? refetchInterval(query)
    : refetchInterval;
};

describe("map request list polling", () => {
  it("stops once every request has finished", () => {
    const query = pageOf(
      { status: PredictionRequestStatus.COMPLETED, results_ready: true },
      { status: PredictionRequestStatus.FAILED, results_ready: false },
      { status: PredictionRequestStatus.CANCELLED, results_ready: false },
    );
    expect(intervalFor(query)).toBe(false);
  });

  it("keeps polling while a request is running", () => {
    const query = pageOf(
      { status: PredictionRequestStatus.COMPLETED, results_ready: true },
      { status: PredictionRequestStatus.RUNNING, results_ready: false },
    );
    expect(intervalFor(query)).toBe(10000);
  });

  it("keeps polling while a completed request is still writing its outputs", () => {
    const query = pageOf({
      status: PredictionRequestStatus.COMPLETED,
      results_ready: false,
    });
    expect(intervalFor(query)).toBe(10000);
  });

  it("keeps polling while a request is waiting to start", () => {
    const query = pageOf({
      status: PredictionRequestStatus.SUBMITTED,
      results_ready: false,
    });
    expect(intervalFor(query)).toBe(10000);
  });
});
