import { describe, expect, it } from "vitest";
import { isValidStatusTransition } from "../src/status.js";

describe("isValidStatusTransition", () => {
  it("allows staying on the same status", () => {
    expect(isValidStatusTransition("open", "open")).toBe(true);
  });

  it("allows open to in_progress and resolved", () => {
    expect(isValidStatusTransition("open", "in_progress")).toBe(true);
    expect(isValidStatusTransition("open", "resolved")).toBe(true);
  });

  it("rejects resolved to in_progress", () => {
    expect(isValidStatusTransition("resolved", "in_progress")).toBe(false);
  });

  it("allows resolved back to open", () => {
    expect(isValidStatusTransition("resolved", "open")).toBe(true);
  });
});
