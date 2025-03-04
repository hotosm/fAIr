// @ts-nocheck

import { renderHook } from "@testing-library/react";
import { useHistory } from "../use-history";
import { useNavigate } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

describe("useHistory", () => {
  it("should navigate back if history length is greater than 2", () => {
    const navigate = vi.fn();
    (useNavigate as vi.Mock).mockReturnValue(navigate);

    Object.defineProperty(window, "history", {
      value: {
        length: 3,
      },
      writable: true,
    });

    const { result } = renderHook(() => useHistory());

    result.current.goBack();
    expect(navigate).toHaveBeenCalledWith(-1);
  });

  it("should navigate to root if history length is not greater than 2", () => {
    const navigate = vi.fn();
    (useNavigate as vi.Mock).mockReturnValue(navigate);

    Object.defineProperty(window, "history", {
      value: {
        length: 2,
      },
      writable: true,
    });

    const { result } = renderHook(() => useHistory());

    result.current.goBack();
    expect(navigate).toHaveBeenCalledWith("/", { replace: true });
  });
});
