import { beforeEach, describe, expect, it, vi } from "vitest";
import { showErrorToast } from "../general-utils";

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
