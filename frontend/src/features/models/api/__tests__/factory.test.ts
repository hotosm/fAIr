import { QueryClient, skipToken } from "@tanstack/react-query";
import { describe, expect, expectTypeOf, it } from "vitest";
import type { TModelDetails } from "@/types";
import type { useModelDetails } from "../../hooks/use-models";
import {
  getModelDetailsQueryOptions,
  getTrainingFeedbacksQueryOptions,
} from "../factory";

describe("model query types and loading state", () => {
  it("preserves model response types through query options and the hook", () => {
    const client = new QueryClient();
    const options = getModelDetailsQueryOptions("42", false, true);
    const cached = client.getQueryData(options.queryKey);

    expectTypeOf(cached).toEqualTypeOf<TModelDetails | undefined>();
    expectTypeOf<ReturnType<typeof useModelDetails>["data"]>().toEqualTypeOf<
      TModelDetails | undefined
    >();
    expect(cached).toBeUndefined();
  });

  it("does not fetch feedback until a training ID is available", () => {
    expect(getTrainingFeedbacksQueryOptions(undefined).queryFn).toBe(skipToken);
    expect(getTrainingFeedbacksQueryOptions(42).queryFn).toBeTypeOf("function");
  });
});
