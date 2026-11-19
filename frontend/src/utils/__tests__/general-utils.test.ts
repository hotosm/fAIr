import { beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders, CanceledError } from "axios";
import {
  NETWORK_ERROR_MESSAGE,
  isNetworkError,
  shouldToastBackgroundQueryError,
  showErrorToast,
} from "../general-utils";

const toast = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/use-toast-notification", () => ({
  useToastNotification: () => toast,
}));

beforeEach(() => toast.mockClear());

describe("showErrorToast", () => {
  it("shows the first field error of a validation response", () => {
    showErrorToast({
      response: {
        data: {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: {
              geometry: [
                "The area is too small for zoom 19: it must contain at least one whole map tile.",
              ],
            },
          },
        },
      },
    });
    expect(toast).toHaveBeenCalledWith(
      "The area is too small for zoom 19: it must contain at least one whole map tile.",
      "danger",
    );
  });

  it("shows the first entry of a list of details", () => {
    showErrorToast({
      response: { data: { error: { details: ["Model not found."] } } },
    });
    expect(toast).toHaveBeenCalledWith("Model not found.", "danger");
  });

  it("shows the generic message instead of an HTML error page", () => {
    showErrorToast({
      response: {
        status: 500,
        data: "<html><head><title>500 Internal Server Error</title></head></html>",
      },
    });
    expect(toast).toHaveBeenCalledWith(
      "An unexpected error occurred",
      "danger",
    );
  });

  it("shows a plain-text error body as it is", () => {
    showErrorToast({ response: { data: "Bad gateway: model offline." } });
    expect(toast).toHaveBeenCalledWith("Bad gateway: model offline.", "danger");
  });
});

describe("network failures", () => {
  const unreachable = new AxiosError("Network Error", "ERR_NETWORK");
  const serverError = new AxiosError(
    "Request failed with status code 500",
    "ERR_BAD_RESPONSE",
    undefined,
    undefined,
    {
      status: 500,
      statusText: "Internal Server Error",
      data: {},
      headers: {},
      config: { headers: new AxiosHeaders() },
    },
  );

  it("treats a request with no response as a network failure", () => {
    expect(isNetworkError(unreachable)).toBe(true);
  });

  it("does not treat a server error response as a network failure", () => {
    expect(isNetworkError(serverError)).toBe(false);
  });

  it("does not treat a cancelled request as a network failure", () => {
    expect(isNetworkError(new CanceledError())).toBe(false);
  });

  it("does not treat a plain error as a network failure", () => {
    expect(isNetworkError(new Error("boom"))).toBe(false);
  });

  it("shows a plain-language message when fAIr cannot be reached", () => {
    showErrorToast(unreachable);
    expect(toast).toHaveBeenCalledWith(NETWORK_ERROR_MESSAGE, "danger");
  });

  it("stays quiet when a background refresh cannot reach fAIr", () => {
    expect(shouldToastBackgroundQueryError(unreachable, true)).toBe(false);
  });

  it("reports a server error during a background refresh", () => {
    expect(shouldToastBackgroundQueryError(serverError, true)).toBe(true);
  });

  it("leaves first-load failures to the page itself", () => {
    expect(shouldToastBackgroundQueryError(serverError, false)).toBe(false);
  });
});
