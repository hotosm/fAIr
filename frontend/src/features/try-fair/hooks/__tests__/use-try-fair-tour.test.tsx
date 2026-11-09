import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_TOUR_IDS } from "@/constants/site-tour";
import { useTryFairTour } from "../use-try-fair-tour";

const tour = vi.hoisted(() => ({
  setIsOpen: vi.fn(),
  setCurrentStep: vi.fn(),
  setSteps: vi.fn(),
}));
const storage = vi.hoisted(() => ({ getValue: vi.fn(), setValue: vi.fn() }));
const auth = vi.hoisted(() => ({ isAuthenticated: true }));
vi.mock("@/app/providers/auth-provider", () => ({ useAuth: () => auth }));
vi.mock("@reactour/tour", () => ({ useTour: () => tour }));
vi.mock("@/hooks/use-storage", () => ({ useLocalStorage: () => storage }));
beforeEach(() => {
  vi.clearAllMocks();
  auth.isAuthenticated = true;
});
afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

function addTarget(id: string, visible: boolean) {
  const target = document.createElement("div");
  target.id = id;
  target.getClientRects = () =>
    (visible ? [new DOMRect(700, 10, 136, 32)] : []) as unknown as DOMRectList;
  document.body.append(target);
}

describe("Try fAIr tour targets", () => {
  it.each([false, true])(
    "includes the large-area step only when signed in (%s)",
    (signedIn) => {
      auth.isAuthenticated = signedIn;
      addTarget(APP_TOUR_IDS.TRY_FAIR_MAP_LARGE_AREA_BUTTON, true);
      addTarget(APP_TOUR_IDS.TRY_FAIR_MAP_BUTTON_TOOLTIP, true);
      const { result } = renderHook(() => useTryFairTour(false));
      act(() => result.current.openGuidedTour());
      const steps = tour.setSteps.mock.lastCall?.[0] as { selector: string }[];
      expect(
        steps.some(
          (step) =>
            step.selector === `#${APP_TOUR_IDS.TRY_FAIR_MAP_LARGE_AREA_BUTTON}`,
        ),
      ).toBe(signedIn);
    },
  );

  it("places the mode step below the visible switcher", () => {
    addTarget(APP_TOUR_IDS.TRY_FAIR_MAPPING_MODE, true);
    const { result } = renderHook(() => useTryFairTour(false));
    act(() => result.current.openGuidedTour());
    expect(tour.setSteps).toHaveBeenCalledWith([
      expect.objectContaining({
        selector: `#${APP_TOUR_IDS.TRY_FAIR_MAPPING_MODE}`,
        position: "bottom",
      }),
    ]);
    expect(tour.setIsOpen).toHaveBeenCalledWith(true);
  });

  it("skips hidden navbar controls while retaining visible map steps", () => {
    addTarget(APP_TOUR_IDS.TRY_FAIR_MAPPING_MODE, false);
    addTarget(APP_TOUR_IDS.TRY_FAIR_MAP_BUTTON_TOOLTIP, true);
    const { result } = renderHook(() => useTryFairTour(true));
    act(() => result.current.openGuidedTour());
    const steps = tour.setSteps.mock.lastCall?.[0] as { selector: string }[];
    expect(steps.length).toBeGreaterThan(0);
    expect(
      steps.every(
        (step) => step.selector !== `#${APP_TOUR_IDS.TRY_FAIR_MAPPING_MODE}`,
      ),
    ).toBe(true);
  });
});
