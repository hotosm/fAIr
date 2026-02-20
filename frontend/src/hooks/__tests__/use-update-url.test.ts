import { renderHook, act } from "@testing-library/react";
import { useUpdateUrl } from "@/hooks/use-update-url";
import { describe, expect, it } from "vitest";

describe("useUpdateUrl", () => {
  it("should update the browser history state", () => {
    const { result } = renderHook(() => useUpdateUrl());

    act(() => {
      result.current("/test-url");
    });

    expect(window.history.state).toBe(null);
    expect(window.location.pathname).toBe("/test-url");
  });
});
