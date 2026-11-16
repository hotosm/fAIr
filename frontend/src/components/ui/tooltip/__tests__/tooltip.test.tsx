import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ToolTip from "../tooltip";

vi.mock("@shoelace-style/shoelace/dist/react/tooltip/index.js", () => ({
  default: ({
    trigger,
    open,
    children,
  }: {
    trigger?: string;
    open?: boolean;
    children?: ReactNode;
  }) => (
    <div data-testid="tooltip" data-trigger={trigger} data-open={String(open)}>
      {children}
    </div>
  ),
}));

const renderTooltip = (pinOnClick = true) =>
  render(
    <div>
      <ToolTip
        content="Minimum probability for a feature to be kept."
        pinOnClick={pinOnClick}
      >
        <span>info</span>
      </ToolTip>
      <button type="button">elsewhere</button>
    </div>,
  );

const tooltip = () => screen.getByTestId("tooltip");

describe("ToolTip", () => {
  afterEach(cleanup);

  it("uses hover and focus triggers and starts closed", () => {
    renderTooltip();

    expect(tooltip().dataset.trigger).toBe("hover focus");
    expect(tooltip().dataset.open).toBe("false");
  });

  it("leaves a tooltip without pinOnClick unpinned after a click", () => {
    renderTooltip(false);

    fireEvent.click(screen.getByText("info"));

    expect(tooltip().dataset.trigger).toBeUndefined();
    expect(tooltip().dataset.open).toBe("undefined");
  });

  it("stays open after a click and closes on a click elsewhere", () => {
    renderTooltip();

    fireEvent.click(screen.getByText("info"));
    expect(tooltip().dataset).toMatchObject({
      trigger: "manual",
      open: "true",
    });

    fireEvent.pointerDown(screen.getByText("elsewhere"));
    expect(tooltip().dataset).toMatchObject({
      trigger: "hover focus",
      open: "false",
    });
  });

  it("keeps a pinned tooltip open when its own text is clicked", () => {
    renderTooltip();

    fireEvent.click(screen.getByText("info"));
    fireEvent.pointerDown(
      screen.getByText("Minimum probability for a feature to be kept."),
    );

    expect(tooltip().dataset.open).toBe("true");
  });

  it("keeps Escape on a pinned tooltip from reaching the panel around it", () => {
    const panelEscape = vi.fn();
    document.addEventListener("keydown", panelEscape);
    renderTooltip();

    fireEvent.click(screen.getByText("info"));
    const notCancelled = fireEvent.keyDown(document, { key: "Escape" });
    document.removeEventListener("keydown", panelEscape);

    expect(panelEscape).not.toHaveBeenCalled();
    expect(notCancelled).toBe(false);
  });

  it("closes a pinned tooltip on Escape", () => {
    renderTooltip();

    fireEvent.click(screen.getByText("info"));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(tooltip().dataset).toMatchObject({
      trigger: "hover focus",
      open: "false",
    });
  });
});
