import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "../auth-provider";

vi.mock("@/config", () => ({
  AUTH_PROVIDER: "hanko",
  BASE_API_URL: "https://example.com/api/v1/",
  DISABLE_AUTH_ON_TRY_FAIR: false,
  HOT_FAIR_LOCAL_STORAGE_ACCESS_TOKEN_KEY: "access-token",
  HOT_FAIR_LOGIN_SUCCESSFUL_SESSION_KEY: "login-success",
  HOT_FAIR_SESSION_REDIRECT_KEY: "redirect",
  IS_DEV: false,
}));
vi.mock("@/constants", () => ({
  APPLICATION_ROUTES: { TRY_FAIR: "/try-fair", HOMEPAGE: "/" },
  TOAST_NOTIFICATIONS: {},
}));
vi.mock("@/services/api-client", () => ({
  apiClient: { defaults: { headers: { common: {} } } },
}));
vi.mock("@/services", () => ({ authService: {} }));
vi.mock("@/utils", () => ({
  showErrorToast: vi.fn(),
  showSuccessToast: vi.fn(),
}));
vi.mock("@/hooks/use-storage", () => ({
  useLocalStorage: () => ({
    getValue: () => undefined,
    setValue: vi.fn(),
    removeValue: vi.fn(),
  }),
  useSessionStorage: () => ({
    getSessionValue: () => undefined,
    removeSessionValue: vi.fn(),
    setSessionValue: vi.fn(),
  }),
}));

const fetchMock = vi.fn<typeof fetch>();
const profileResponse = () =>
  new Response(
    JSON.stringify({ osm_id: 1, username: "mapper", img_url: "avatar.png" }),
  );

async function mountProvider() {
  const hook = renderHook(() => useAuth(), { wrapper: AuthProvider });
  await act(async () => {});
  return hook;
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-30T12:00:00Z"));
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => profileResponse());
  vi.stubGlobal("fetch", fetchMock);
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("AuthProvider profile polling", () => {
  it("checks the initial session once without polling signed-out users", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 403 }));
    const { result } = await mountProvider();
    expect(result.current.isAuthenticated).toBe(false);
    await advance(10 * 60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([401, 403])(
    "stops on %s and resumes after a successful login",
    async (status) => {
      const { result } = await mountProvider();
      expect(result.current.isAuthenticated).toBe(true);
      await advance(59_999);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      fetchMock.mockResolvedValueOnce(new Response(null, { status }));
      await advance(1);
      expect(result.current.isAuthenticated).toBe(false);
      await advance(10 * 60_000);
      expect(fetchMock).toHaveBeenCalledTimes(2);

      await act(async () => {
        document.dispatchEvent(new CustomEvent("hanko-login"));
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      await advance(60_000);
      expect(fetchMock).toHaveBeenCalledTimes(4);
    },
  );

  it("skips refreshes in a hidden tab", async () => {
    await mountProvider();
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    await advance(3 * 60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    await advance(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each(["seconds", "date"])(
    "honors Retry-After in %s without signing out",
    async (format) => {
      const { result } = await mountProvider();
      const retryAfter =
        format === "seconds"
          ? "600"
          : new Date(Date.now() + 11 * 60_000).toUTCString();
      fetchMock.mockResolvedValueOnce(
        new Response(null, {
          status: 429,
          headers: { "Retry-After": retryAfter },
        }),
      );
      await advance(60_000);
      expect(result.current.isAuthenticated).toBe(true);
      await advance(10 * 60_000 - 1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      await advance(1);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    },
  );

  it("backs off on network errors and resets the delay after recovery", async () => {
    const { result } = await mountProvider();
    fetchMock.mockRejectedValueOnce(new TypeError("Network error"));
    await advance(60_000);
    expect(result.current.isAuthenticated).toBe(true);
    await advance(2 * 60_000 - 1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await advance(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await advance(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("waits for slow requests to finish before scheduling another", async () => {
    await mountProvider();
    let resolveRequest!: (response: Response) => void;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      }),
    );
    await advance(5 * 60_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await act(async () => resolveRequest(profileResponse()));
    await advance(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each(["logout", "unmount"])(
    "cancels a pending refresh on %s",
    async (action) => {
      const { result, unmount } = await mountProvider();
      let resolveRequest!: (response: Response) => void;
      fetchMock.mockReturnValueOnce(
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        }),
      );
      await advance(60_000);
      const signal = fetchMock.mock.calls[1][1]?.signal;
      expect(signal?.aborted).toBe(false);

      act(() => {
        if (action === "logout") {
          document.dispatchEvent(new Event("logout"));
        } else {
          unmount();
        }
      });
      expect(signal?.aborted).toBe(true);
      await act(async () => resolveRequest(profileResponse()));
      if (action === "logout")
        expect(result.current.isAuthenticated).toBe(false);
      await advance(10 * 60_000);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    },
  );
});

describe("initial session loading", () => {
  it.each([200, 403])(
    "waits for the profile response before deciding authentication (%s)",
    async (status) => {
      let resolveProfile!: (response: Response) => void;
      fetchMock.mockReturnValue(
        new Promise<Response>((resolve) => {
          resolveProfile = resolve;
        }),
      );
      const { result } = await mountProvider();
      expect(result.current.isAuthLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      await act(async () => {
        resolveProfile(
          status === 200 ? profileResponse() : new Response(null, { status }),
        );
      });
      expect(result.current.isAuthLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(status === 200);
    },
  );

  it("finishes the loading state when the profile request fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network error"));
    const { result } = await mountProvider();
    expect(result.current.isAuthLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });
});
