import { renderHook, fireEvent, render } from "@testing-library/react";
import { useClickOutside } from "../use-click-outside";
import { vi, describe, expect, it } from "vitest";
import { createElement } from "react";

describe("useClickOutside", () => {
  it("should call handler when clicking outside the element", () => {
    const handler = vi.fn();

    const TestComponent = () => {
      const ref = useClickOutside(handler);

      return createElement(
        "div",
        null,
        createElement("div", { ref, "data-testid": "inside" }, "Inside"),
        createElement("div", { "data-testid": "outside" }, "Outside"),
      );
    };

    const { getByTestId } = render(createElement(TestComponent));

    // Simulate click inside (should NOT trigger handler)
    fireEvent.mouseDown(getByTestId("inside"));
    expect(handler).not.toHaveBeenCalled();

    // Simulate click outside (should trigger handler)
    fireEvent.mouseDown(getByTestId("outside"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should not call handler when clicking inside the element", () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useClickOutside(handler));
    const element = document.createElement("div");
    result.current = { current: element };

    document.body.appendChild(element);

    // Simulate click inside
    element.click();

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(element);
  });

  it("should clean up event listeners on unmount", () => {
    const handler = vi.fn();
    const { result, unmount } = renderHook(() => useClickOutside(handler));
    const element = document.createElement("div");
    result.current = { current: element };

    document.body.appendChild(element);

    unmount();

    // Simulate click outside after unmount
    document.body.click();

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(element);
  });
});
