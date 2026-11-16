import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageNotFound } from "../not-found";

vi.mock("@/components/seo", () => ({ Head: () => null }));

const CurrentPath = () => <output>{useLocation().pathname}</output>;

const renderNotFound = (from: string) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: "/404", state: { from } }]}>
      <Routes>
        <Route path="/404" element={<PageNotFound />} />
        <Route path="*" element={<CurrentPath />} />
      </Routes>
    </MemoryRouter>,
  );

describe("PageNotFound", () => {
  afterEach(cleanup);

  it.each(["/ai-models/3", "/datasets/1"])(
    "sends the user home from %s, a hidden page",
    (from) => {
      renderNotFound(from);

      expect(screen.getByText(/page not found/i)).toBeTruthy();
      fireEvent.click(screen.getByText(/go to homepage/i));

      expect(screen.getByRole("status").textContent).toBe("/");
    },
  );
});
