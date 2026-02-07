import "@testing-library/jest-dom";
import { vi } from "vitest";

// Silence jsdom "Not implemented: HTMLCanvasElement.getContext" warnings.
// Components that use canvas already handle a null 2D context.
Object.defineProperty(window.HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  writable: true,
  value: vi.fn(() => null),
});

// Mock SpeechRecognition
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = "en-US";
  start = vi.fn();
  stop = vi.fn();
  onresult = null;
  onend = null;
}
Object.defineProperty(window, "SpeechRecognition", {
  writable: true,
  value: MockSpeechRecognition,
});
Object.defineProperty(window, "webkitSpeechRecognition", {
  writable: true,
  value: MockSpeechRecognition,
});

// Mock HTMLMediaElement functions
Object.defineProperty(window.HTMLMediaElement.prototype, "play", {
  configurable: true,
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
});
Object.defineProperty(window.HTMLMediaElement.prototype, "pause", {
  configurable: true,
  writable: true,
  value: vi.fn(),
});
Object.defineProperty(window.HTMLMediaElement.prototype, "load", {
  configurable: true,
  writable: true,
  value: vi.fn(),
});
