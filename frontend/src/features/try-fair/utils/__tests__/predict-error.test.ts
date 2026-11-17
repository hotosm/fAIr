import { describe, expect, it } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { predictErrorMessage } from "@/features/try-fair/utils/common";

const withStatus = (status: number) =>
  new AxiosError("Request failed", "ERR_BAD_RESPONSE", undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: "<html>503 Service Unavailable</html>",
  });

describe("try-now error message", () => {
  it.each([502, 503, 504])(
    "says the model is not responding on %i",
    (status) => {
      expect(predictErrorMessage(withStatus(status))).toMatch(
        /isn’t responding/,
      );
    },
  );

  it("says the model is not responding when the browser gets no response", () => {
    expect(
      predictErrorMessage(new AxiosError("Network Error", "ERR_NETWORK")),
    ).toMatch(/isn’t responding/);
  });

  it("leaves other errors to the default message", () => {
    expect(predictErrorMessage(withStatus(400))).toBeUndefined();
  });
});
