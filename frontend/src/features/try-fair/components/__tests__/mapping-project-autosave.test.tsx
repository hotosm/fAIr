import { CloudSaveStatus } from "@/components/layouts/navbar/cloud-save-status";
import { useStartMappingStore } from "@/features/try-fair/utils/start-mapping-store";
import { act, cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PropsWithChildren } from "react";
import { MappingProjectAutosave } from "@/features/try-fair/components/mapping-project-autosave";
import type { MappingUserState } from "@/features/try-fair/api/user-state";
import { ModelType, TryFairMapOutputType, TryFairResolution } from "@/enums";

const { post, patch, showErrorToast } = vi.hoisted(() => ({
  post: vi.fn(),
  patch: vi.fn(),
  showErrorToast: vi.fn(),
}));
vi.mock("@/utils", () => ({ showErrorToast }));
vi.mock("@/services", () => ({
  apiClient: { post, patch },
  API_ENDPOINTS: {
    SAVE_USER_STATE: "/user-state/",
    EDIT_USER_STATE: (pid: number) => `/user-state/${pid}/`,
  },
}));

const payload: MappingUserState = {
  state: {
    type: "mapping",
    category: "buildings",
    name: "Building mapping",
    model: { id: "buildings", title: "Buildings" },
    imagery: { name: "Demo Imagery", url: "https://example.com/tiles.json" },
    zoom: 19,
    bbox: [85.5, 27.6, 85.52, 27.63],
    params: { confidence_threshold: 0.7, simplify_m: 0.9626 },
    prediction_result: {
      predictions: { type: "FeatureCollection", features: [] },
      bbox: [85.5, 27.6, 85.52, 27.63],
      gridZoom: 19,
      modelId: "buildings",
      imageUri: "https://example.com/{z}/{x}/{y}.png",
      resolution: TryFairResolution.LOW,
      params: { confidence_threshold: 0.7, simplify_m: 0.9626 },
    },
    url_params: {
      model: "buildings",
      output: TryFairMapOutputType.POLYGON,
      resolution: TryFairResolution.LOW,
      confidence: 0.7,
      feature: "buildings",
      mode: ModelType.DEMO,
      mappingMode: "basic",
      imagery: null,
      imageryType: null,
      oamItem: null,
      chooseLocation: false,
      selectedModelId: null,
      params: null,
    },
  },
};
const changed: MappingUserState = {
  state: {
    ...payload.state,
    category: "trees",
    params: { confidence_threshold: 0 },
  },
};

const wrapper = () => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};
const tick = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(800);
  });
};

describe("MappingProjectAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useStartMappingStore.setState({ lastSavedAt: null });
    showErrorToast.mockReset();
    post.mockReset();
    patch.mockReset();
    post.mockResolvedValue({ data: { ...payload, pid: 42 } });
    patch.mockResolvedValue({ data: { ...changed, pid: 42 } });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows successful saves for three seconds and restarts the timer after updates", async () => {
    const content = (state: MappingUserState) => (
      <>
        <CloudSaveStatus />
        <MappingProjectAutosave enabled payload={state} />
      </>
    );
    const view = render(content(payload), { wrapper: wrapper() });
    expect(screen.queryByText("Saved to cloud")).not.toBeInTheDocument();
    await tick();
    expect(screen.getByRole("status")).toHaveTextContent("Saved to cloud");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    view.rerender(content(changed));
    await tick();
    expect(patch).toHaveBeenCalledOnce();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2200);
    });
    expect(screen.getByText("Saved to cloud")).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(screen.queryByText("Saved to cloud")).not.toBeInTheDocument();
    view.unmount();
    render(<CloudSaveStatus />);
    expect(screen.queryByText("Saved to cloud")).not.toBeInTheDocument();
  });

  it.each([undefined, 42])(
    "does not announce a failed save (pid %s)",
    async (initialPid) => {
      post.mockRejectedValue(new Error("Failed"));
      patch.mockRejectedValue(new Error("Failed"));
      render(
        <>
          <CloudSaveStatus />
          <MappingProjectAutosave
            enabled
            initialPid={initialPid}
            payload={payload}
          />
        </>,
        { wrapper: wrapper() },
      );
      await tick();
      expect(showErrorToast).toHaveBeenCalled();
      expect(screen.queryByText("Saved to cloud")).not.toBeInTheDocument();
    },
  );

  it("creates only after a successful prediction enables saving, then updates that pid", async () => {
    const view = render(
      <MappingProjectAutosave enabled={false} payload={payload} />,
      { wrapper: wrapper() },
    );
    await tick();
    expect(post).not.toHaveBeenCalled();
    view.rerender(<MappingProjectAutosave enabled payload={payload} />);
    await tick();
    expect(post).toHaveBeenCalledExactlyOnceWith("/user-state/", payload);
    view.rerender(<MappingProjectAutosave enabled payload={changed} />);
    await tick();
    expect(post).toHaveBeenCalledTimes(1);
    expect(patch).toHaveBeenCalledExactlyOnceWith("/user-state/42/", changed);
  });

  it("updates an existing project without creating a new record", async () => {
    render(
      <MappingProjectAutosave enabled initialPid={42} payload={payload} />,
      { wrapper: wrapper() },
    );
    await tick();
    expect(post).not.toHaveBeenCalled();
    expect(patch).toHaveBeenCalledExactlyOnceWith("/user-state/42/", payload);
  });

  it("does not patch during restoration but saves subsequent edits to the existing pid", async () => {
    const view = render(
      <MappingProjectAutosave
        enabled
        initialPid={42}
        payload={payload}
        skipInitialSave
      />,
      { wrapper: wrapper() },
    );
    await tick();
    expect(post).not.toHaveBeenCalled();
    expect(patch).not.toHaveBeenCalled();
    view.rerender(
      <MappingProjectAutosave
        enabled
        initialPid={42}
        payload={changed}
        skipInitialSave
      />,
    );
    await tick();
    expect(patch).toHaveBeenCalledExactlyOnceWith("/user-state/42/", changed);
    expect(post).not.toHaveBeenCalled();
  });

  it("keeps edits made during creation and saves them after receiving the pid", async () => {
    let finish: (value: unknown) => void = () => {};
    post.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const view = render(<MappingProjectAutosave enabled payload={payload} />, {
      wrapper: wrapper(),
    });
    await tick();
    view.rerender(<MappingProjectAutosave enabled payload={changed} />);
    await tick();
    expect(post).toHaveBeenCalledTimes(1);
    expect(patch).not.toHaveBeenCalled();
    await act(async () => {
      finish({ data: { ...payload, pid: 42 } });
    });
    await tick();
    await tick();
    expect(patch).toHaveBeenCalledExactlyOnceWith("/user-state/42/", changed);
  });

  it("saves multiple prediction snapshots in the same project and retains them when viewing an older run", async () => {
    const predictionResult = payload.state.prediction_result!;
    const entries = ["first", "second"].map((id) => ({
      id,
      created_at: "2026-10-20T12:00:00Z",
      snapshot: {
        ...payload.state,
        name: id,
        prediction_result: predictionResult,
      },
    }));
    const state = {
      ...payload.state,
      prediction_result: undefined,
      prediction_history: entries,
      active_prediction_id: "second",
    };
    const view = render(
      <MappingProjectAutosave enabled initialPid={42} payload={{ state }} />,
      { wrapper: wrapper() },
    );
    await tick();
    expect(patch).toHaveBeenLastCalledWith("/user-state/42/", { state });
    const restored = { ...state, active_prediction_id: "first" };
    view.rerender(
      <MappingProjectAutosave
        enabled
        initialPid={42}
        payload={{ state: restored }}
      />,
    );
    await tick();
    expect(patch).toHaveBeenLastCalledWith("/user-state/42/", {
      state: restored,
    });
    expect(post).not.toHaveBeenCalled();
  });

  it("retains the created pid while another model is loading", async () => {
    const view = render(<MappingProjectAutosave enabled payload={payload} />, {
      wrapper: wrapper(),
    });
    await tick();
    view.rerender(<MappingProjectAutosave enabled={false} payload={null} />);
    await tick();
    view.rerender(<MappingProjectAutosave enabled payload={changed} />);
    await tick();
    expect(post).toHaveBeenCalledTimes(1);
    expect(patch).toHaveBeenCalledExactlyOnceWith("/user-state/42/", changed);
  });

  it("does not repeat unchanged saves or loop on a failed save", async () => {
    post.mockRejectedValue(new Error("Offline"));
    const view = render(<MappingProjectAutosave enabled payload={payload} />, {
      wrapper: wrapper(),
    });
    await tick();
    view.rerender(<MappingProjectAutosave enabled payload={{ ...payload }} />);
    await tick();
    expect(post).toHaveBeenCalledTimes(1);
    post.mockResolvedValue({ data: { ...changed, pid: 42 } });
    view.rerender(<MappingProjectAutosave enabled payload={changed} />);
    await tick();
    expect(post).toHaveBeenCalledTimes(2);
    expect(showErrorToast).toHaveBeenCalledOnce();
  });
});
