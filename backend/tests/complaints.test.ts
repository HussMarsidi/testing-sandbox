import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sign } from "hono/jwt";
import { app } from "../src/app.js";
import { getJwtSecret } from "../src/auth.js";
import { getDb, resetDbForTests, type UserRole } from "../src/db.js";

const testDbPath = "data/test-complaints.db";

async function authHeader(role: UserRole = "admin"): Promise<Record<string, string>> {
  const token = await sign(
    { sub: role === "admin" ? "admin" : "viewer", role, exp: Math.floor(Date.now() / 1000) + 3600 },
    getJwtSecret(),
  );

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function createSampleComplaint(name = "Jane Doe"): Promise<number> {
  const createResponse = await app.request("http://localhost/api/complaints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      email: "jane@example.com",
      category: "bug",
      message: "The submit button does not work on mobile.",
    }),
  });

  expect(createResponse.status).toBe(201);
  const body = (await createResponse.json()) as { id: number };
  return body.id;
}

describe("categories API", () => {
  beforeEach(() => {
    resetDbForTests(testDbPath);
  });

  afterEach(() => {
    getDb().close();
  });

  it("returns complaint categories", async () => {
    const response = await app.request("http://localhost/api/categories");
    expect(response.status).toBe(200);

    const categories = await response.json();
    expect(categories).toEqual(
      expect.arrayContaining([
        { value: "bug", label: "Bug" },
        { value: "feature_request", label: "Feature Request" },
        { value: "other", label: "Other" },
      ]),
    );
  });
});

describe("auth API", () => {
  beforeEach(() => {
    resetDbForTests(testDbPath);
  });

  afterEach(() => {
    getDb().close();
  });

  it("returns a token and role for valid admin credentials", async () => {
    const response = await app.request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "password" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.token).toEqual(expect.any(String));
    expect(body.role).toBe("admin");
  });

  it("returns a viewer role for viewer credentials", async () => {
    const response = await app.request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "viewer", password: "password" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.role).toBe("viewer");
  });

  it("rejects invalid credentials", async () => {
    const response = await app.request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "wrong" }),
    });

    expect(response.status).toBe(401);
  });
});

describe("complaints API", () => {
  beforeEach(() => {
    resetDbForTests(testDbPath);
  });

  afterEach(() => {
    getDb().close();
  });

  it("creates complaints without auth and lists them with auth", async () => {
    await createSampleComplaint();

    const unauthorizedList = await app.request("http://localhost/api/complaints");
    expect(unauthorizedList.status).toBe(401);

    const listResponse = await app.request("http://localhost/api/complaints", {
      headers: await authHeader("admin"),
    });
    expect(listResponse.status).toBe(200);

    const complaints = await listResponse.json();
    expect(complaints).toHaveLength(1);
    expect(complaints[0]).toMatchObject({
      id: 1,
      name: "Jane Doe",
      email: "jane@example.com",
      category: "bug",
      message: "The submit button does not work on mobile.",
      status: "open",
    });
  });

  it("rejects invalid payloads", async () => {
    const response = await app.request("http://localhost/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "",
        email: "not-an-email",
        category: "bug",
        message: "short",
      }),
    });

    expect(response.status).toBe(400);
  });

  it("filters complaints by status and search", async () => {
    const firstId = await createSampleComplaint("Alice Example");
    await createSampleComplaint("Bob Example");

    await app.request(`http://localhost/api/complaints/${firstId}`, {
      method: "PATCH",
      headers: {
        ...(await authHeader("admin")),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "in_progress" }),
    });

    const statusResponse = await app.request(
      "http://localhost/api/complaints?status=in_progress",
      { headers: await authHeader("admin") },
    );
    expect(statusResponse.status).toBe(200);
    const byStatus = await statusResponse.json();
    expect(byStatus).toHaveLength(1);
    expect(byStatus[0].name).toBe("Alice Example");

    const searchResponse = await app.request(
      "http://localhost/api/complaints?search=Bob",
      { headers: await authHeader("admin") },
    );
    expect(searchResponse.status).toBe(200);
    const bySearch = await searchResponse.json();
    expect(bySearch).toHaveLength(1);
    expect(bySearch[0].name).toBe("Bob Example");
  });

  it("returns one complaint by id and 404 when missing", async () => {
    const id = await createSampleComplaint();

    const found = await app.request(`http://localhost/api/complaints/${id}`, {
      headers: await authHeader("viewer"),
    });
    expect(found.status).toBe(200);
    await expect(found.json()).resolves.toMatchObject({ id, status: "open" });

    const missing = await app.request("http://localhost/api/complaints/999", {
      headers: await authHeader("viewer"),
    });
    expect(missing.status).toBe(404);
  });

  it("lets admins update status but blocks viewers", async () => {
    const id = await createSampleComplaint();

    const viewerAttempt = await app.request(`http://localhost/api/complaints/${id}`, {
      method: "PATCH",
      headers: {
        ...(await authHeader("viewer")),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "in_progress" }),
    });
    expect(viewerAttempt.status).toBe(403);

    const adminUpdate = await app.request(`http://localhost/api/complaints/${id}`, {
      method: "PATCH",
      headers: {
        ...(await authHeader("admin")),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "in_progress" }),
    });
    expect(adminUpdate.status).toBe(200);
    await expect(adminUpdate.json()).resolves.toMatchObject({
      id,
      status: "in_progress",
    });

    const invalidTransition = await app.request(`http://localhost/api/complaints/${id}`, {
      method: "PATCH",
      headers: {
        ...(await authHeader("admin")),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "resolved" }),
    });
    expect(invalidTransition.status).toBe(200);

    const reopen = await app.request(`http://localhost/api/complaints/${id}`, {
      method: "PATCH",
      headers: {
        ...(await authHeader("admin")),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "open" }),
    });
    expect(reopen.status).toBe(200);
  });
});
