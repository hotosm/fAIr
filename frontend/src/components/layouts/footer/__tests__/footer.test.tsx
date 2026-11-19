import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { Footer } from "@/components/layouts/footer/footer";
import { APPLICATION_ROUTES } from "@/constants";

const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );

afterEach(cleanup);

describe("Footer", () => {
  it("opens the contact address in the mail client, not a new tab", () => {
    renderFooter();
    const contact = screen.getByRole("link", { name: "Contact" });
    expect(contact).toHaveAttribute("href", "mailto:fair@hotosm.org");
    expect(contact).toHaveAttribute("target", "_self");
  });

  it.each([
    ["Documentation", "https://hotosm.github.io/fAIr/"],
    ["fAIr models", "https://github.com/hotosm/fAIr-models"],
    ["Patrick J. McGovern Foundation", "https://www.mcgovern.org/"],
    ["Rauch Foundation", "https://rauchfoundation.org/"],
  ])("opens %s in a new tab", (name, href) => {
    renderFooter();
    const link = screen.getByRole("link", { name });
    expect(link).toHaveAttribute("href", href);
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("keeps in-app pages inside the app", () => {
    renderFooter();
    const learn = screen.getByRole("link", { name: "Learn" });
    expect(learn).toHaveAttribute("href", APPLICATION_ROUTES.LEARN_BASE);
    expect(learn).not.toHaveAttribute("target");
  });

  it("hides links that are not active yet", () => {
    renderFooter();
    expect(
      screen.queryByRole("link", { name: /explore models/i }),
    ).not.toBeInTheDocument();
  });
});
