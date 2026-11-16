import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MobileMapToolbar } from "@/features/try-fair/components/mobile/mobile-map-toolbar";

const actions = vi.hoisted(() => ({
  isAuthenticated: true,
  hasPredictions: false,
  showPredictionHistory: false,
  downloadResults: vi.fn(),
  mapLargeArea: vi.fn(),
  changeImagery: vi.fn(),
  share: vi.fn(),
  togglePredictionHistory: vi.fn(),
}));
vi.mock("@/features/try-fair/hooks/use-try-fair-actions", () => ({
  useTryFairActions: () => actions,
}));
vi.mock("@/features/try-fair/components/mapping-mode", () => ({
  default: () => <div>Mode switch</div>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  actions.hasPredictions = false;
});

afterEach(cleanup);

describe("MobileMapToolbar", () => {
  it("shows the mode switch and the Menu chip", () => {
    render(<MobileMapToolbar />);
    expect(screen.getByText("Mode switch")).toBeInTheDocument();
    expect(screen.getByText("Menu")).toBeInTheDocument();
  });

  it.each([
    ["Map Large Area", "mapLargeArea"],
    ["Change Imagery", "changeImagery"],
    ["Share", "share"],
    ["Prediction History", "togglePredictionHistory"],
  ] as const)("runs %s from the menu", (label, action) => {
    render(<MobileMapToolbar />);
    fireEvent.click(screen.getByRole("button", { name: label }));
    expect(actions[action]).toHaveBeenCalledOnce();
  });

  it("only allows downloading once there are results", () => {
    const { rerender } = render(<MobileMapToolbar />);
    expect(
      screen.getByRole("button", { name: "Download Result" }),
    ).toBeDisabled();

    actions.hasPredictions = true;
    rerender(<MobileMapToolbar />);
    fireEvent.click(screen.getByRole("button", { name: "Download Result" }));
    expect(actions.downloadResults).toHaveBeenCalledOnce();
  });
});
