// @ts-nocheck
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authService } from "@/services";
import { showErrorToast } from "@/utils";
import { useLocation } from "react-router-dom";
import { useLogin } from "../use-login";
import { useSessionStorage } from "../use-storage";
import { TOAST_NOTIFICATIONS } from "@/constants";
import { HOT_FAIR_SESSION_REDIRECT_KEY } from "@/config";

vi.mock("react-router-dom", () => ({
  useLocation: vi.fn(),
}));

vi.mock("../use-storage", () => ({
  useSessionStorage: vi.fn(),
}));

vi.mock("@/services", () => ({
  authService: {
    initializeOAuthFlow: vi.fn(),
  },
}));

vi.mock("@/utils", () => ({
  showErrorToast: vi.fn(),
}));

describe("useLogin", () => {
  const setValueMock = vi.fn();
  const pathname = "/test-path";

  beforeEach(() => {
    (useLocation as vi.Mock).mockReturnValue({ pathname, search: "" });

    (useSessionStorage as vi.Mock).mockReturnValue({
      setSessionValue: setValueMock,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with loading as false", () => {
    const { result } = renderHook(() => useLogin());
    expect(result.current.loading).toBe(false);
  });

  it("should set loading to true and call authService.initializeOAuthFlow on handleLogin", async () => {
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleLogin();
    });

    expect(result.current.loading).toBe(false);
    expect(setValueMock).toHaveBeenCalledWith(
      HOT_FAIR_SESSION_REDIRECT_KEY,
      pathname,
    );
    expect(authService.initializeOAuthFlow).toHaveBeenCalled();
  });

  it("should show error toast if authService.initializeOAuthFlow throws an error", async () => {
    (authService.initializeOAuthFlow as vi.Mock).mockRejectedValue(
      new Error("OAuth error"),
    );

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.handleLogin();
    });

    expect(result.current.loading).toBe(false);
    expect(showErrorToast).toHaveBeenCalledWith(
      undefined,
      TOAST_NOTIFICATIONS.authenticationFailed,
    );
  });
});
