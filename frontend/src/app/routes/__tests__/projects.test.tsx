import { cleanup, render, renderHook, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PropsWithChildren } from "react";
import { TryFairProjectPage } from "../try-fair/try-fair-projects";
import { useGetUserState } from "@/features/user-profile/api/user-state";

const get = vi.hoisted(() => vi.fn());
vi.mock("@/services", () => ({
  apiClient: { get },
  API_ENDPOINTS: { GET_SINGLE_USER_STATE: (pid: string) => `/user-state/${pid}/` },
}));
vi.mock("../try-fair", () => ({
  TryFairPage: () => {
    const { search } = useLocation();
    return <div>Mapping workspace<output data-testid="restored-search">{search}</output></div>;
  },
}));
vi.mock("@/components/seo", () => ({ Head: () => null }));
vi.mock("@/components/ui/spinner", () => ({ Spinner: () => null }));

const createWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

const renderProject = () => render(
  <MemoryRouter initialEntries={["/try-fair/42?model=stale-model&imagery=stale-imagery"]}>
    <Routes>
      <Route path="/try-fair/:pid" element={<TryFairProjectPage />} />
    </Routes>
  </MemoryRouter>,
  { wrapper: createWrapper() },
);

describe("Saved Try fAIr project", () => {
  beforeEach(() => {
    get.mockReset();
  });
  afterEach(cleanup);

  it("waits for the saved state before mounting the workspace", () => {
    get.mockReturnValue(new Promise(() => {}));
    renderProject();
    expect(screen.getByRole("status", { name: "Loading mapping project" })).toBeInTheDocument();
    expect(screen.queryByText("Mapping workspace")).not.toBeInTheDocument();
  });

  it("fetches by the route pid and opens the workspace on success", async () => {
    get.mockResolvedValue({ data: {
      pid: 42,
      state: {
        type: "mapping",
        category: "trees",
        model: { id: "tree-model", title: "Trees" },
        imagery: { name: "Survey", url: "https://example.com/tilejson.json" },
        zoom: 19,
        bbox: [85.5, 27.6, 85.52, 27.63],
        url_params: {
          model: "tree-model", selectedModelId: "tree-model", feature: "trees",
          mode: "imagery", output: "points", resolution: "mid", confidence: 0.42,
          mappingMode: "advanced", imagery: "https://example.com/tilejson.json",
          imageryType: "TileJSON", oamItem: null, chooseLocation: false,
        },
      },
    } });
    renderProject();
    expect(await screen.findByText("Mapping workspace")).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith("/user-state/42/", {
      signal: expect.any(AbortSignal),
    });
    const search = new URLSearchParams(screen.getByTestId("restored-search").textContent ?? "");
    expect(search.get("model")).toBe("tree-model");
    expect(search.get("feature")).toBe("trees");
    expect(search.get("imagery")).toBe("https://example.com/tilejson.json");
    expect(search.get("confidence")).toBe("0.42");
    expect(search.get("mappingMode")).toBe("advanced");
  });

  it("shows an error instead of the workspace when fetching fails", async () => {
    get.mockRejectedValue(new Error("Not found"));
    renderProject();
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load this mapping project");
    expect(screen.queryByText("Mapping workspace")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start a new mapping project" })).toHaveAttribute("href", "/try-fair");
  });

  it("does not fetch a saved state without a pid", () => {
    renderHook(() => useGetUserState(), { wrapper: createWrapper() });
    expect(get).not.toHaveBeenCalled();
  });
});
