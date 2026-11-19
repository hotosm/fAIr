import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { MadeWithLove } from "@/components/shared/made-with-love";

describe("MadeWithLove", () => {
  it("reads as one sentence with a labelled heart", () => {
    const { container } = render(
      <MemoryRouter>
        <MadeWithLove />
      </MemoryRouter>,
    );
    expect(screen.getByRole("img", { name: "love" })).toBeInTheDocument();
    expect(container.textContent).toBe("Made with  by HOT & friends");
  });
});
