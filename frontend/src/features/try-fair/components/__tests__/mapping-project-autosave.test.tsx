import { act, cleanup, render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PropsWithChildren } from "react";
import { MappingProjectAutosave } from "../mapping-project-autosave";
import type { MappingUserState } from "../../api/user-state";
import { ModelType, TryFairMapOutputType, TryFairResolution } from "@/enums";

const { post, patch } = vi.hoisted(() => ({ post: vi.fn(), patch: vi.fn() }));
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
    post.mockReset();
    patch.mockReset();
    post.mockResolvedValue({ data: { ...payload, pid: 42 } });
    patch.mockResolvedValue({ data: { ...changed, pid: 42 } });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

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
  });
});
