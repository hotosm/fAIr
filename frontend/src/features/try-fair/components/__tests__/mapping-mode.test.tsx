import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import MappingMode from "@/features/try-fair/components/mapping-mode";

const setMappingMode = vi.fn();
vi.mock("@/features/try-fair/hooks/use-try-fair-params", () => ({
  useTryFairParams: () => ({ mappingMode: "advanced", setMappingMode }),
}));
vi.mock("@/app/providers/auth-provider", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));
vi.mock("@/hooks/use-dropdown-menu", () => ({
  useDropdownMenu: () => ({ onDropdownHide: vi.fn(), dropdownRef: null }),
}));
// Render the menu inline so its options can be clicked.
vi.mock("@/components/ui/dropdown", () => ({
  DropDown: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

const CurrentPath = () => <p data-testid="path">{useLocation().pathname}</p>;

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <MappingMode />
              <CurrentPath />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

afterEach(() => {
  cleanup();
  setMappingMode.mockClear();
});

describe("MappingMode switching to Basic", () => {
  it.each(["/profile/models", "/profile/datasets", "/profile/settings"])(
    "goes from %s to the Basic dashboard",
    (path) => {
      renderAt(path);
      fireEvent.click(screen.getByRole("button", { name: "Basic" }));
      expect(setMappingMode).toHaveBeenCalledWith("basic");
      expect(screen.getByTestId("path")).toHaveTextContent(/^\/profile$/);
    },
  );

  it.each([
    "/profile",
    "/profile/map-requests",
    "/profile/mapping-history",
    "/try-fair",
  ])("stays on %s, which Basic mode has too", (path) => {
    renderAt(path);
    fireEvent.click(screen.getByRole("button", { name: "Basic" }));
    expect(screen.getByTestId("path")).toHaveTextContent(path);
  });
});
