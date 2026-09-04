import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImagerySourceToggle } from "@/features/try-fair/components/imagery/choose-imagery-source";
import { ImagerySource } from "@/enums";

describe("ImagerySourceToggle", () => {
  afterEach(() => {
    cleanup();
  });
  it("should render both OpenAerialMap and Custom Imagery radio options", () => {
    render(<ImagerySourceToggle value={ImagerySource.OPEN_AERIAL_MAP} onChange={vi.fn()} />);

    const radiogroup = screen.getByRole("radiogroup", {
      name: /imagery source/i,
    });
    expect(radiogroup).toBeInTheDocument();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);

    expect(screen.getByText("OpenAerialMap")).toBeInTheDocument();
    expect(screen.getByText("Custom Imagery")).toBeInTheDocument();
  });

  it("should mark OpenAerialMap as checked when value is OPEN_AERIAL_MAP", () => {
    render(<ImagerySourceToggle value={ImagerySource.OPEN_AERIAL_MAP} onChange={vi.fn()} />);

    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    expect(radios[1]).toHaveAttribute("aria-checked", "false");
  });

  it("should mark Custom Imagery as checked when value is CUSTOM", () => {
    render(<ImagerySourceToggle value={ImagerySource.CUSTOM} onChange={vi.fn()} />);

    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toHaveAttribute("aria-checked", "false");
    expect(radios[1]).toHaveAttribute("aria-checked", "true");
  });

  it("should call onChange with selected ImagerySource when clicked", () => {
    const handleChange = vi.fn();
    render(<ImagerySourceToggle value={ImagerySource.OPEN_AERIAL_MAP} onChange={handleChange} />);

    const customRadio = screen.getByText("Custom Imagery");
    fireEvent.click(customRadio);

    expect(handleChange).toHaveBeenCalledWith(ImagerySource.CUSTOM);
  });
});
