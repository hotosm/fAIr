import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapBottomSheet } from "@/components/ui/drawer/map-bottom-sheet";

afterEach(cleanup);

// jsdom has no PointerEvent, so send MouseEvents named like pointer events
// (React's onPointer* handlers listen to those names).
const pointer = (
  target: Element,
  type: "pointerdown" | "pointermove" | "pointerup",
  clientY: number,
) =>
  act(() => {
    target.dispatchEvent(
      new MouseEvent(type, { bubbles: true, clientY, button: 0 }),
    );
  });

const drag = (target: Element, fromY: number, toY: number) => {
  pointer(target, "pointerdown", fromY);
  const steps = 5;
  for (let i = 1; i <= steps; i++) {
    pointer(target, "pointermove", fromY + ((toY - fromY) * i) / steps);
  }
  pointer(target, "pointerup", toY);
};

const renderSheet = () => {
  const onButton = vi.fn();
  render(
    <>
      <div data-testid="map">Map</div>
      <MapBottomSheet label="Map settings">
        <button type="button" onClick={onButton}>
          Map
        </button>
        <input aria-label="Accuracy" type="range" />
      </MapBottomSheet>
    </>,
  );
  const sheet = screen.getByRole("region", { name: "Map settings" });
  return { sheet, onButton };
};

const isExpanded = (sheet: HTMLElement) =>
  sheet.getAttribute("data-state") === "expanded";

describe("MapBottomSheet", () => {
  it("starts collapsed and toggles with the handle", () => {
    const { sheet } = renderSheet();
    expect(isExpanded(sheet)).toBe(false);

    fireEvent.click(
      screen.getByRole("button", { name: "Expand Map settings" }),
    );
    expect(isExpanded(sheet)).toBe(true);

    fireEvent.click(
      screen.getByRole("button", { name: "Collapse Map settings" }),
    );
    expect(isExpanded(sheet)).toBe(false);
  });

  it("expands on a drag up and collapses on a drag down, from its content", () => {
    const { sheet } = renderSheet();
    const button = screen.getByRole("button", { name: "Map" });

    drag(button, 700, 300);
    expect(isExpanded(sheet)).toBe(true);

    drag(button, 300, 700);
    expect(isExpanded(sheet)).toBe(false);
  });

  it("does not press the button a drag started on, but a tap still does", () => {
    const { onButton } = renderSheet();
    const button = screen.getByRole("button", { name: "Map" });

    drag(button, 700, 300);
    fireEvent.click(button);
    expect(onButton).not.toHaveBeenCalled();

    fireEvent.click(button);
    expect(onButton).toHaveBeenCalledOnce();
  });

  it("ignores drags that start on inputs such as sliders", () => {
    const { sheet } = renderSheet();
    drag(screen.getByRole("slider", { name: "Accuracy" }), 700, 300);
    expect(isExpanded(sheet)).toBe(false);
  });

  it("collapses on a press outside it or Escape, not inside a dialog", () => {
    const { sheet } = renderSheet();
    const expand = () =>
      fireEvent.click(
        screen.getByRole("button", { name: "Expand Map settings" }),
      );

    expand();
    pointer(screen.getByTestId("map"), "pointerdown", 100);
    expect(isExpanded(sheet)).toBe(false);

    expand();
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    document.body.appendChild(dialog);
    pointer(dialog, "pointerdown", 100);
    expect(isExpanded(sheet)).toBe(true);
    dialog.remove();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(isExpanded(sheet)).toBe(false);
  });

  it("collapses when a dropdown outside it, such as the map Menu, is opened", () => {
    const { sheet } = renderSheet();
    fireEvent.click(
      screen.getByRole("button", { name: "Expand Map settings" }),
    );
    expect(isExpanded(sheet)).toBe(true);

    const dropdown = document.createElement("sl-dropdown");
    const trigger = document.createElement("button");
    dropdown.appendChild(trigger);
    document.body.appendChild(dropdown);
    pointer(trigger, "pointerdown", 100);
    expect(isExpanded(sheet)).toBe(false);
    dropdown.remove();
  });
});
