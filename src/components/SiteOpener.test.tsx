import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SiteOpener from "./SiteOpener";

describe("SiteOpener", () => {
  it("renders skip button when shown", () => {
    const onDone = vi.fn();
    render(<SiteOpener show={true} onDone={onDone} reduceMotion={true} />);
    expect(screen.getByRole("button", { name: /skip/i })).toBeInTheDocument();
  });

  it("calls onDone when skip is clicked", async () => {
    const onDone = vi.fn();
    render(<SiteOpener show={true} onDone={onDone} reduceMotion={true} />);
    screen.getByRole("button", { name: /skip/i }).click();
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
