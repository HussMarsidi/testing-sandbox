import { describe, expect, it } from "vitest";
import {
  getAllowedNextStatuses,
  getStatusLabel,
  isValidStatusTransition,
} from "../../src/lib/status";

describe("complaint status helpers", () => {
  it("labels statuses for display", () => {
    expect(getStatusLabel("open")).toBe("Open");
    expect(getStatusLabel("in_progress")).toBe("In progress");
  });

  it("allows valid transitions", () => {
    expect(isValidStatusTransition("open", "in_progress")).toBe(true);
    expect(isValidStatusTransition("resolved", "in_progress")).toBe(false);
  });

  it("returns next statuses excluding the current one", () => {
    expect(getAllowedNextStatuses("open")).toEqual(["in_progress", "resolved"]);
    expect(getAllowedNextStatuses("resolved")).toEqual(["open"]);
  });
});
