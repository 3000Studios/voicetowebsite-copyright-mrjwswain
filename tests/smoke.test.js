import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("project test runner executes tests", () => {
    expect(1 + 1).toBe(2);
  });
});
