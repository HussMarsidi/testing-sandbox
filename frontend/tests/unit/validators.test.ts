import { describe, expect, it } from "vitest";
import { COPY, validateComplaintForm } from "../../src/lib/validators";

describe("validateComplaintForm", () => {
  it("accepts valid input", () => {
    const result = validateComplaintForm({
      name: "Jane Doe",
      email: "jane@example.com",
      category: "bug",
      message: "The submit button does not work on mobile.",
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects missing required fields", () => {
    const result = validateComplaintForm({
      name: "",
      email: "",
      category: "",
      message: "",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        { field: "name", message: COPY.validation.nameRequired },
        { field: "email", message: COPY.validation.emailRequired },
        { field: "category", message: COPY.validation.categoryRequired },
        { field: "message", message: COPY.validation.messageRequired },
      ]),
    );
  });

  it("rejects invalid email and short messages", () => {
    const result = validateComplaintForm({
      name: "Jane Doe",
      email: "not-an-email",
      category: "bug",
      message: "short",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        { field: "email", message: COPY.validation.emailInvalid },
        { field: "message", message: COPY.validation.messageTooShort },
      ]),
    );
  });
});
