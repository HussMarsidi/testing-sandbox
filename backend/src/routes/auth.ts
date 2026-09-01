import { createRoute } from "@hono/zod-openapi";
import { sign } from "hono/jwt";
import { getJwtSecret } from "../auth.js";
import { verifyUserCredentials } from "../db.js";
import { createOpenAPIApp } from "../openapi-app.js";
import {
  ErrorResponseSchema,
  LoginRequestSchema,
  LoginResponseSchema,
} from "../schemas.js";

const loginRoute = createRoute({
  method: "post",
  path: "/api/auth/login",
  tags: ["Auth"],
  summary: "Sign in with username and password",
  request: {
    body: {
      content: {
        "application/json": {
          schema: LoginRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Signed in successfully",
      content: {
        "application/json": {
          schema: LoginResponseSchema,
        },
      },
    },
    401: {
      description: "Invalid credentials",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Login failed",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

export const authApp = createOpenAPIApp();

authApp.openapi(loginRoute, async (c) => {
  const body = c.req.valid("json");

  try {
    const user = verifyUserCredentials(body.username, body.password);
    if (!user) {
      return c.json({ error: "Invalid username or password" }, 401);
    }

    const token = await sign(
      {
        sub: user.username,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
      },
      getJwtSecret(),
    );

    return c.json({ token, role: user.role }, 200);
  } catch (error) {
    console.error("Login failed", error);
    return c.json({ error: "Failed to sign in" }, 500);
  }
});
