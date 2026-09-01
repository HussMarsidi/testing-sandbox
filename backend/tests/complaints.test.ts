import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { getDb, resetDbForTests } from "../src/db.js";

const testDbPath = "data/test-complaints.db";

describe("complaints API", () => {
  beforeEach(() => {
    resetDbForTests(testDbPath);
  });

  afterEach(() => {
    getDb().close();
  });

  it("creates and lists complaints", async () => {
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

    const listResponse = await app.request("http://localhost/api/complaints");
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
