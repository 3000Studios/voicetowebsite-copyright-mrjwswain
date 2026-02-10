import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LazyVideo from "./LazyVideo";

describe("LazyVideo", () => {
  let observerCallback: IntersectionObserverCallback;
  let observeMock: ReturnType<typeof vi.fn>;
  let disconnectMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    observeMock = vi.fn();
    disconnectMock = vi.fn();

    // Mock IntersectionObserver implementation to capture the callback
    class IntersectionObserverMock implements IntersectionObserver {
      readonly root: Element | Document | null = null;
      readonly rootMargin: string = "";
      readonly thresholds: ReadonlyArray<number> = [];

      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }

      observe = observeMock as unknown as (target: Element) => void;
      disconnect = disconnectMock as unknown as () => void;
      takeRecords = vi.fn() as unknown as () => IntersectionObserverEntry[];
      unobserve = vi.fn() as unknown as (target: Element) => void;
    }

    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a video element without src initially", () => {
    render(<LazyVideo src="test-video.mp4" data-testid="lazy-video" />);
    const video = screen.getByTestId("lazy-video") as HTMLVideoElement;

    expect(video).toBeInTheDocument();
    expect(video.getAttribute("src")).toBeNull();
    expect(observeMock).toHaveBeenCalledWith(video);
  });

  it("sets src when element intersects", () => {
    render(<LazyVideo src="test-video.mp4" data-testid="lazy-video" />);
    const video = screen.getByTestId("lazy-video") as HTMLVideoElement;

    // Simulate intersection
    act(() => {
      const entry = { isIntersecting: true } as IntersectionObserverEntry;
      observerCallback([entry], {} as IntersectionObserver);
    });

    expect(video.getAttribute("src")).toBe("test-video.mp4");
    expect(disconnectMock).toHaveBeenCalled();
  });

  it("does not set src when element does not intersect", () => {
    render(<LazyVideo src="test-video.mp4" data-testid="lazy-video" />);
    const video = screen.getByTestId("lazy-video") as HTMLVideoElement;

    // Simulate non-intersection
    act(() => {
      const entry = { isIntersecting: false } as IntersectionObserverEntry;
      observerCallback([entry], {} as IntersectionObserver);
    });

    expect(video.getAttribute("src")).toBeNull();
  });
});
