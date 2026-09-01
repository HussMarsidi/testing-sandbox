import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "../../src/App";
import { ComplaintsListPage } from "../../src/pages/ComplaintsListPage";
import { COPY } from "../../src/lib/validators";
import { server, setListFailure } from "../mocks/handlers";

describe("ComplaintsListPage", () => {
  it("shows an empty state when there are no complaints", async () => {
    render(
      <MemoryRouter initialEntries={["/complaints"]}>
        <Routes>
          <Route path="/complaints" element={<ComplaintsListPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(COPY.complaintsEmpty)).toBeInTheDocument();
  });

  it("shows a load error when the API fails", async () => {
    setListFailure(true);

    render(
      <MemoryRouter initialEntries={["/complaints"]}>
        <Routes>
          <Route path="/complaints" element={<ComplaintsListPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      COPY.complaintsLoadError,
    );
  });

  it("renders complaints returned by the fake backend", async () => {
    server.use(
      http.get("/api/complaints", () =>
        HttpResponse.json([
          {
            id: 1,
            name: "Jane Doe",
            email: "jane@example.com",
            category: "bug",
            message: "The submit button does not work on mobile.",
            created_at: "2026-09-01T12:00:00.000Z",
          },
        ]),
      ),
    );

    render(
      <MemoryRouter initialEntries={["/complaints"]}>
        <Routes>
          <Route path="/complaints" element={<ComplaintsListPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(
      screen.getByText("The submit button does not work on mobile."),
    ).toBeInTheDocument();
  });

  it("shows a submitted complaint after navigating from the form", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(COPY.nameLabel), "Jane Doe");
    await user.type(screen.getByLabelText(COPY.emailLabel), "jane@example.com");
    await user.selectOptions(screen.getByLabelText(COPY.categoryLabel), "bug");
    await user.type(
      screen.getByLabelText(COPY.messageLabel),
      "The submit button does not work on mobile.",
    );
    await user.click(screen.getByRole("button", { name: COPY.submitButton }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      COPY.successMessage,
    );

    await user.click(
      within(screen.getByRole("navigation")).getByRole("link", {
        name: COPY.nav.complaints,
      }),
    );

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(
      screen.getByText("The submit button does not work on mobile."),
    ).toBeInTheDocument();
  });
});
