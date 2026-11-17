import { afterEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { waitForModel } from "@/features/try-fair/api/stac";

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>();
  return {
    ...actual,
    default: { ...actual.default, get: vi.fn(), post: vi.fn() },
  };
});

const ENDPOINT = "https://trees.predict.example.org/predict";
const withStatus = (status: number) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status },
  });
const unavailable = withStatus(503);
const timedOut = Object.assign(new Error("timeout of 30000ms exceeded"), {
  code: "ECONNABORTED",
});

describe("waitForModel", () => {
  afterEach(() => vi.mocked(axios.get).mockReset());

  it("polls the model's health endpoint until it answers", async () => {
    vi.mocked(axios.get)
      .mockRejectedValueOnce(unavailable)
      .mockRejectedValueOnce(timedOut)
      .mockResolvedValueOnce({ data: { status: "ok" } });

    await waitForModel(ENDPOINT, undefined, { intervalMs: 0, timeoutMs: 1000 });

    expect(axios.get).toHaveBeenCalledTimes(3);
    expect(vi.mocked(axios.get).mock.calls[0][0]).toBe(
      "https://trees.predict.example.org/health",
    );
  });

  it("finds the health endpoint on the same host whatever the predict path is", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { status: "ok" } });

    await waitForModel("https://models.example.org/serve/infer?v=2");

    expect(vi.mocked(axios.get).mock.calls[0][0]).toBe(
      "https://models.example.org/health",
    );
  });

  it("fails at once on an error that waiting cannot fix", async () => {
    const notFound = withStatus(404);
    vi.mocked(axios.get).mockRejectedValue(notFound);

    await expect(
      waitForModel(ENDPOINT, undefined, { intervalMs: 0, timeoutMs: 1000 }),
    ).rejects.toBe(notFound);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it("says plainly when the model does not start in time", async () => {
    vi.mocked(axios.get).mockRejectedValue(unavailable);

    await expect(
      waitForModel(ENDPOINT, undefined, { intervalMs: 0, timeoutMs: 0 }),
    ).rejects.toThrow("The model didn’t start in time. Try again later.");
  });

  it("stops at once when the run is cancelled between polls", async () => {
    vi.mocked(axios.get).mockRejectedValue(unavailable);
    const controller = new AbortController();
    const waiting = waitForModel(ENDPOINT, controller.signal, {
      intervalMs: 60_000,
      timeoutMs: 600_000,
    });

    await vi.waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
    controller.abort();

    await expect(waiting).rejects.toMatchObject({ code: "ERR_CANCELED" });
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});
