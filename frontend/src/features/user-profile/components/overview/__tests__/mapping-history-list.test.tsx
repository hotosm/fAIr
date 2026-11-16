import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import type { SavedUserState } from "@/features/try-fair/api/user-state";
import { MappingHistoryList } from "../mapping-history-list";

afterEach(cleanup);

const activity = (
  pid: number,
  name: string,
  category: string,
): SavedUserState =>
  ({
    pid,
    timestamp: "2026-11-10T08:00:00Z",
    state: { type: "mapping", category, name },
  }) as SavedUserState;

describe("MappingHistoryList", () => {
  it("shows each project's name and feature, linking to the project", () => {
    render(
      <MemoryRouter>
        <MappingHistoryList
          activities={[
            activity(4, "Banepa Nepal Imagery", "buildings"),
            activity(7, "Angra dos reis ilha", "trees"),
          ]}
        />
      </MemoryRouter>,
    );
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/try-fair/4",
      "/try-fair/7",
    ]);
    expect(links[0]).toHaveTextContent("Banepa Nepal Imagery");
    expect(links[0]).toHaveTextContent("buildings");
    expect(links[1]).toHaveTextContent("trees");
  });
});
