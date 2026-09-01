import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { COPY } from "../../src/lib/validators";
import { authenticateTestUser, clearAuthenticatedUser } from "../helpers/auth";
import { renderProtectedComplaints } from "../helpers/render";
import { server, seedComplaints } from "../mocks/handlers";

describe("Complaint status and roles", () => {
  beforeEach(() => {
    clearAuthenticatedUser();
  });

  it("shows read-only status for viewers", async () => {
    authenticateTestUser("viewer");
    seedComplaints([
      {
        id: 1,
        name: "Jane Doe",
        email: "jane@example.com",
        category: "bug",
        message: "The submit button does not work on mobile.",
        status: "open",
        created_at: "2026-09-01T12:00:00.000Z",
      },
    ]);

    renderProtectedComplaints();

    expect(await screen.findByText("Open")).toBeInTheDocument();
    expect(screen.queryByLabelText(COPY.statusLabel)).not.toBeInTheDocument();
  });

  it("lets admins change status from the list", async () => {
    const user = userEvent.setup();
    authenticateTestUser("admin");
    seedComplaints([
      {
        id: 1,
        name: "Jane Doe",
        email: "jane@example.com",
        category: "bug",
        message: "The submit button does not work on mobile.",
        status: "open",
        created_at: "2026-09-01T12:00:00.000Z",
      },
    ]);

    renderProtectedComplaints();

    const statusSelect = await screen.findByLabelText(COPY.statusLabel);
    await user.selectOptions(statusSelect, "in_progress");

    expect(statusSelect).toHaveValue("in_progress");
  });

  it("filters complaints by search text", async () => {
    const user = userEvent.setup();
    authenticateTestUser("admin");
    server.use(
      http.get("/api/complaints", ({ request }) => {
        const search = new URL(request.url).searchParams.get("search");
        const rows =
          search === "Bob"
            ? [
                {
                  id: 2,
                  name: "Bob Smith",
                  email: "bob@example.com",
                  category: "other",
                  message: "Need help with exports.",
                  status: "open",
                  created_at: "2026-09-01T13:00:00.000Z",
                },
              ]
            : [
                {
                  id: 1,
                  name: "Jane Doe",
                  email: "jane@example.com",
                  category: "bug",
                  message: "The submit button does not work on mobile.",
                  status: "open",
                  created_at: "2026-09-01T12:00:00.000Z",
                },
                {
                  id: 2,
                  name: "Bob Smith",
                  email: "bob@example.com",
                  category: "other",
                  message: "Need help with exports.",
                  status: "open",
                  created_at: "2026-09-01T13:00:00.000Z",
                },
              ];

        return HttpResponse.json(rows);
      }),
    );

    renderProtectedComplaints();

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();

    await user.type(screen.getByLabelText(COPY.searchLabel), "Bob");

    expect(await screen.findByText("Bob Smith")).toBeInTheDocument();
    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
  });

  it("shows not found on the detail page", async () => {
    authenticateTestUser("viewer");
    server.use(
      http.get("/api/complaints/404", () =>
        HttpResponse.json({ error: "Complaint not found" }, { status: 404 }),
      ),
    );

    renderProtectedComplaints("/complaints/404");

    expect(await screen.findByRole("alert")).toHaveTextContent(COPY.complaintNotFound);
  });
});
