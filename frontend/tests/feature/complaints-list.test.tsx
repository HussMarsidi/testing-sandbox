import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../../src/App";
import { COPY } from "../../src/lib/validators";
import {
  MOCK_ADMIN_PASSWORD,
  MOCK_ADMIN_USERNAME,
  server,
  setListFailure,
  setLoginFailure,
} from "../mocks/handlers";
import { authenticateTestUser, clearAuthenticatedUser } from "../helpers/auth";
import { fillFeedbackForm, loginThroughUi } from "../helpers/form";
import {
  renderLoginPage,
  renderProtectedComplaints,
} from "../helpers/render";

describe("ComplaintsListPage", () => {
  beforeEach(() => {
    clearAuthenticatedUser();
    setListFailure(false);
    setLoginFailure(false);
  });

  it("redirects to login when not authenticated", async () => {
    renderProtectedComplaints();

    expect(await screen.findByRole("heading", { name: COPY.loginTitle })).toBeInTheDocument();
  });

  it("shows an empty state when there are no complaints", async () => {
    authenticateTestUser();
    renderProtectedComplaints();

    expect(await screen.findByText(COPY.complaintsEmpty)).toBeInTheDocument();
  });

  it("shows a load error when the API fails", async () => {
    authenticateTestUser();
    setListFailure(true);
    renderProtectedComplaints();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      COPY.complaintsLoadError,
    );
  });

  it("renders complaints returned by the fake backend", async () => {
    authenticateTestUser();
    server.use(
      http.get("/api/complaints", () =>
        HttpResponse.json([
          {
            id: 1,
            name: "Jane Doe",
            email: "jane@example.com",
            category: "bug",
            message: "The submit button does not work on mobile.",
            status: "open",
            created_at: "2026-09-01T12:00:00.000Z",
          },
        ]),
      ),
    );

    renderProtectedComplaints();

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(
      screen.getByText("The submit button does not work on mobile."),
    ).toBeInTheDocument();
  });

  it("shows a submitted complaint after login and navigation", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    await fillFeedbackForm(user, screen, {
      name: "Jane Doe",
      email: "jane@example.com",
      categoryLabel: "Bug",
      message: "The submit button does not work on mobile.",
    });
    await user.click(screen.getByRole("button", { name: COPY.submitButton }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      COPY.successMessage,
    );

    await user.click(
      within(screen.getByRole("navigation")).getByRole("link", {
        name: COPY.nav.login,
      }),
    );
    await loginThroughUi(user, screen, MOCK_ADMIN_USERNAME, MOCK_ADMIN_PASSWORD);
    expect(
      await screen.findByRole("heading", { name: COPY.complaintsPageTitle }),
    ).toBeInTheDocument();

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(
      screen.getByText("The submit button does not work on mobile."),
    ).toBeInTheDocument();
  });
});

describe("LoginPage", () => {
  beforeEach(() => {
    clearAuthenticatedUser();
    setLoginFailure(false);
  });

  it("shows invalid credentials message", async () => {
    const user = userEvent.setup();

    renderLoginPage();

    await loginThroughUi(user, screen, MOCK_ADMIN_USERNAME, "wrong-password");

    expect(await screen.findByRole("alert")).toHaveTextContent(COPY.loginError);
  });

  it("shows a server error when login fails", async () => {
    setLoginFailure(true);
    const user = userEvent.setup();

    renderLoginPage();

    await loginThroughUi(user, screen, MOCK_ADMIN_USERNAME, MOCK_ADMIN_PASSWORD);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      COPY.loginServerError,
    );
  });
});
