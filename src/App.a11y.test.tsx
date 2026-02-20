import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

// Mock dependencies
vi.mock("./services/audioEngine", () => ({
  audioEngine: {
    enable: vi.fn(),
    playGlassTing: vi.fn(),
    playMusic: vi.fn(),
    stopMusic: vi.fn(),
    setVolume: vi.fn(),
    playImpact: vi.fn(),
    playSwoosh: vi.fn(),
    playWarp: vi.fn(),
    playSpark: vi.fn(),
    playHum: vi.fn(),
  },
}));

vi.mock("./components/WarpTunnel", () => ({
  default: () => <div data-testid="warp-tunnel" />,
}));

describe("App Accessibility - Use Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders accessible voice flow controls", async () => {
    render(<App />);

    // Main CTA for voice capture exists
    const tapToSpeak = screen.getByRole("button", {
      name: /start voice command/i,
    });
    expect(tapToSpeak).toBeInTheDocument();

    // Clicking it enters listening phase with a clear "Finish Command" control.
    await waitFor(() => {
      expect(
        (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
      ).toBeTruthy();
    });
    fireEvent.click(tapToSpeak);

    const finish = await waitFor(() =>
      screen.getByRole("button", { name: /finish command/i })
    );
    expect(finish).toBeInTheDocument();

    // Stop listening transitions to confirm phase (button exists and is clickable).
    fireEvent.click(finish);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /make it/i })
      ).toBeInTheDocument();
    });
  });
});
