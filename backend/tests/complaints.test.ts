import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sign } from "hono/jwt";
import { app } from "../src/app.js";
import { getJwtSecret } from "../src/auth.js";
import { getDb, resetDbForTests } from "../src/db.js";

const testDbPath = "data/test-complaints.db";

async function authHeader(): Promise<Record<string, string>> {
  const token = await sign(
    { sub: "admin", exp: Math.floor(Date.now() / 1000) + 3600 },
    getJwtSecret(),
  );

  return {
    Authorization: `Bearer ${token}`,
  };
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

  it("returns a token for valid credentials", async () => {
    const response = await app.request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "password" }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.token).toEqual(expect.any(String));
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
    const createResponse = await app.request("http://localhost/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Jane Doe",
        email: "jane@example.com",
        category: "bug",
        message: "The submit button does not work on mobile.",
      }),
    });

    expect(createResponse.status).toBe(201);
    await expect(createResponse.json()).resolves.toEqual({ id: 1 });

    const unauthorizedList = await app.request("http://localhost/api/complaints");
    expect(unauthorizedList.status).toBe(401);

    const listResponse = await app.request("http://localhost/api/complaints", {
      headers: await authHeader(),
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
});
