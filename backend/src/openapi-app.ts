import { OpenAPIHono } from "@hono/zod-openapi";

export function createOpenAPIApp() {
  return new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: "Validation failed",
            details: result.error.issues.map((issue) => ({
              field: issue.path.join(".") || "body",
              message: issue.message,
            })),
          },
          400,
        );
      }
    },
  });
}
