/**
 * HUMAN-WRITTEN ACCEPTANCE TEST
 * These visible strings are the contract. Change only with human approval.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { FeedbackForm } from "../../src/components/FeedbackForm";
import { COPY } from "../../src/lib/validators";
import { setCreateFailure } from "../mocks/handlers";

function renderForm() {
  return render(
    <MemoryRouter>
      <FeedbackForm />
    </MemoryRouter>,
  );
}

describe("FeedbackForm acceptance", () => {
  beforeEach(() => {
    setCreateFailure(false);
  });

  it("shows the human-defined labels and button text", () => {
    renderForm();

    expect(screen.getByLabelText(COPY.nameLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(COPY.emailLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(COPY.categoryLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(COPY.messageLabel)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: COPY.submitButton }),
    ).toBeInTheDocument();
  });

  it("shows validation errors before submit reaches the backend", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: COPY.submitButton }));

    expect(screen.getByText(COPY.validation.nameRequired)).toBeInTheDocument();
    expect(screen.getByText(COPY.validation.emailRequired)).toBeInTheDocument();
    expect(screen.getByText(COPY.validation.categoryRequired)).toBeInTheDocument();
    expect(screen.getByText(COPY.validation.messageRequired)).toBeInTheDocument();
  });

  it("shows the success message after a valid submission", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(COPY.nameLabel), "Jane Doe");
    await user.type(screen.getByLabelText(COPY.emailLabel), "jane@example.com");
    await user.selectOptions(
      screen.getByLabelText(COPY.categoryLabel),
      "feature_request",
    );
    await user.type(
      screen.getByLabelText(COPY.messageLabel),
      "Please add dark mode support.",
    );
    await user.click(screen.getByRole("button", { name: COPY.submitButton }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      COPY.successMessage,
    );
  });

  it("shows the server error message when submission fails", async () => {
    setCreateFailure(true);
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(COPY.nameLabel), "Jane Doe");
    await user.type(screen.getByLabelText(COPY.emailLabel), "jane@example.com");
    await user.selectOptions(screen.getByLabelText(COPY.categoryLabel), "bug");
    await user.type(
      screen.getByLabelText(COPY.messageLabel),
      "The submit button does not work on mobile.",
    );
    await user.click(screen.getByRole("button", { name: COPY.submitButton }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      COPY.serverErrorMessage,
    );
  });
});
