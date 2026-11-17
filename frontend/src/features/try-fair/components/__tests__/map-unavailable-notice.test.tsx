import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapUnavailableNotice } from "@/features/try-fair/components/map-unavailable-notice";

afterEach(cleanup);

describe("MapUnavailableNotice", () => {
  it("explains that Map is off and points to the model picker", () => {
    const onOpenModelPicker = vi.fn();
    render(
      <MapUnavailableNotice
        featureLabel="buildings"
        onOpenModelPicker={onOpenModelPicker}
      />,
    );
    const notice = screen.getByRole("status");
    expect(notice).toHaveTextContent("No model for buildings yet");
    expect(notice).toHaveTextContent("Map is turned off");

    fireEvent.click(screen.getByRole("button", { name: "Open model picker" }));
    expect(onOpenModelPicker).toHaveBeenCalledOnce();
  });

  it("names the feature when it has no model", () => {
    render(<MapUnavailableNotice featureLabel="solar panels" />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "No model for solar panels yet",
    );
    expect(
      screen.queryByRole("button", { name: "Open model picker" }),
    ).not.toBeInTheDocument();
  });
});
