import { afterEach, describe, expect, it, vi } from "vitest";
import { useToastNotification } from "@/hooks/use-toast-notification";

describe("useToastNotification", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("shows a server message as text, never as markup", () => {
    const toastSpy = vi.fn();
    vi.spyOn(document, "createElement").mockImplementationOnce((tag) => {
      const element = document.createElementNS(
        "http://www.w3.org/1999/xhtml",
        tag,
      ) as HTMLElement & { toast: () => void };
      element.toast = toastSpy;
      return element;
    });
    const message =
      '<html><body><h1>503 Service Unavailable</h1><img src="x"></body></html>';

    useToastNotification()(message, "danger");

    const alert = document.body.querySelector("sl-alert");
    expect(alert?.textContent?.trim()).toBe(message);
    expect(alert?.querySelector("img, h1")).toBeNull();
    expect(toastSpy).toHaveBeenCalledOnce();
  });
});
