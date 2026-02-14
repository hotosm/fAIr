import { render, screen } from "@testing-library/react";
import { VideoPlayerModal } from "@/components/learn/update-video-player";
import { describe, expect, it, vi } from "vitest";

describe("VideoPlayerModal", () => {
  const mockVideo = {
    name: "Test Video",
    url: "https://www.youtube.com/watch?v=test",
    id: 1,
    slug: "test-video",
    date: "2024-01-01",
  };

  it("renders the video player modal", () => {
    render(
      <VideoPlayerModal video={mockVideo} onClose={vi.fn()} isOpen={true} />,
    );

    // Check if the iframe is rendered
    const iframe = screen.getByTitle("Test Video");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/test?rel=0&modestbranding=1",
    );
  });
});
