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

    // Mic starts only after explicit user intent.
    const tapToCreate = await waitFor(() =>
      screen.getByRole("button", { name: /tap to create a website/i })
    );
    expect(tapToCreate).toBeInTheDocument();

    fireEvent.click(tapToCreate);
    const finish = await waitFor(() =>
      screen.getByRole("button", { name: /finish command/i })
    );
    expect(finish).toBeInTheDocument();

    // Stop listening transitions to confirm phase.
    fireEvent.click(finish);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /make it/i })
      ).toBeInTheDocument();
    });
  });
});
