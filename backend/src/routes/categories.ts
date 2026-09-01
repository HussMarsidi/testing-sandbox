import { createRoute, z } from "@hono/zod-openapi";
import { listCategories } from "../categories.js";
import { createOpenAPIApp } from "../openapi-app.js";
import { CategoryOptionSchema } from "../schemas.js";

const listCategoriesRoute = createRoute({
  method: "get",
  path: "/api/categories",
  tags: ["Categories"],
  summary: "List complaint categories",
  responses: {
    200: {
      description: "Available complaint categories",
      content: {
        "application/json": {
          schema: z.array(CategoryOptionSchema),
        },
      },
    },
    500: {
      description: "Failed to load categories",
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
    },
  },
});

export const categoriesApp = createOpenAPIApp();

categoriesApp.openapi(listCategoriesRoute, (c) => {
  try {
    return c.json(listCategories(), 200);
  } catch (error) {
    console.error("List categories failed", error);
    return c.json({ error: "Failed to load categories" }, 500);
  }
});
