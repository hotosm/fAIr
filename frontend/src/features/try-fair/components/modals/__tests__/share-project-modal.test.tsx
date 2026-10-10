import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShareProjectModal } from "../share-project-modal";

const copyToClipboard = vi.fn();

vi.mock("@/hooks/use-clipboard", () => ({
  default: () => ({ copyToClipboard, isCopied: false }),
}));

vi.mock("@/components/ui/dialog/dialog", () => ({
  default: ({
    isOpened,
    children,
  }: {
    isOpened: boolean;
    children: React.ReactNode;
  }) => (isOpened ? <div>{children}</div> : null),
}));

describe("ShareProjectModal", () => {
  beforeEach(() => copyToClipboard.mockClear());
  afterEach(cleanup);

  it("shares a protected project through the public Try fAIr route", () => {
    render(
      <MemoryRouter
        initialEntries={["/try-fair/42?model=tree-model&mode=imagery#map"]}
      >
        <ShareProjectModal isOpened closeDialog={vi.fn()} />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/\/try-fair\?model=tree-model&mode=imagery#map$/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("Copy link").closest("sl-button")!);

    expect(copyToClipboard).toHaveBeenCalledWith(
      `${window.location.origin}/try-fair?model=tree-model&mode=imagery#map`,
    );
  });

  it("keeps the public Try fAIr URL unchanged", () => {
    render(
      <MemoryRouter initialEntries={["/try-fair?model=building-model"]}>
        <ShareProjectModal isOpened closeDialog={vi.fn()} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("Copy link").closest("sl-button")!);

    expect(copyToClipboard).toHaveBeenCalledWith(
      `${window.location.origin}/try-fair?model=building-model`,
    );
  });
});
