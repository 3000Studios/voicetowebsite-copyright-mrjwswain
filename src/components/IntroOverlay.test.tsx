import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import IntroOverlay from "./IntroOverlay";

// Mock dependencies if necessary
// IntroOverlay imports INTRO_VIDEO from constants, which is just a string.
// It uses framer-motion which usually works in JSDOM but sometimes needs mocking for layout animations.
// For simple prop checking, it should be fine.

describe("IntroOverlay Accessibility", () => {
  it("renders a button with accessible label", () => {
    const onStart = vi.fn();
    const onComplete = vi.fn();
    render(<IntroOverlay onStart={onStart} onComplete={onComplete} />);

    // Expectation: The blob should be accessible via aria-label
    // This is expected to FAIL before implementation
    const button = screen.getByLabelText("Ignite Interface");

    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("role", "button");
    expect(button).toHaveAttribute("tabIndex", "0");
  });

  it("triggers onStart when Enter or Space is pressed", () => {
    const onStart = vi.fn();
    const onComplete = vi.fn();
    render(<IntroOverlay onStart={onStart} onComplete={onComplete} />);

    // This is expected to FAIL before implementation
    const button = screen.getByLabelText("Ignite Interface");

    fireEvent.keyDown(button, { key: "Enter" });
    expect(onStart).toHaveBeenCalled();

    onStart.mockClear();
    fireEvent.keyDown(button, { key: " " });
    expect(onStart).toHaveBeenCalled();
  });
});
