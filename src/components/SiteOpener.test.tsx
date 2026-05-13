import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SiteOpener from "./SiteOpener";

describe("SiteOpener", () => {
  it("renders when shown", () => {
    const onDone = vi.fn();
    const { container } = render(
      <SiteOpener show={true} onDone={onDone} reduceMotion={true} />
    );
    expect(
      container.querySelector('[data-testid="vtw-site-opener"]')
    ).toBeTruthy();
  });

  it("calls onDone automatically in reduceMotion mode", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<SiteOpener show={true} onDone={onDone} reduceMotion={true} />);
    expect(onDone).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(500);
    expect(onDone).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
