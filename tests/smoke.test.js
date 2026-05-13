import { describe, expect, it } from "vitest";

describe("smoke", () => {
  it("project test runner executes tests", () => {
    expect(1 + 1).toBe(2);
  });
});
