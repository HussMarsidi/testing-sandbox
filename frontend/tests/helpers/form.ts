import type { UserEvent } from "@testing-library/user-event";
import type { Screen } from "@testing-library/react";
import { COPY } from "../../src/lib/validators";
import { waitForCategories } from "./auth";

interface FeedbackFormInput {
  name: string;
  email: string;
  categoryLabel: string;
  message: string;
}

export async function fillFeedbackForm(
  user: UserEvent,
  screen: Screen,
  input: FeedbackFormInput,
): Promise<void> {
  await waitForCategories(screen);

  await user.type(screen.getByLabelText(COPY.nameLabel), input.name);
  await user.type(screen.getByLabelText(COPY.emailLabel), input.email);
  await user.selectOptions(
    screen.getByLabelText(COPY.categoryLabel),
    input.categoryLabel,
  );
  await user.type(screen.getByLabelText(COPY.messageLabel), input.message);
}

export async function loginThroughUi(
  user: UserEvent,
  screen: Screen,
  username: string,
  password: string,
): Promise<void> {
  await user.type(screen.getByLabelText(COPY.usernameLabel), username);
  await user.type(screen.getByLabelText(COPY.passwordLabel), password);
  await user.click(screen.getByRole("button", { name: COPY.loginButton }));
}
