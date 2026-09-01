import { cors } from "hono/cors";
import { createOpenAPIApp } from "./openapi-app.js";
import { authApp } from "./routes/auth.js";
import { categoriesApp } from "./routes/categories.js";
import { complaintsApp } from "./routes/complaints.js";

export function createApp() {
  const app = createOpenAPIApp();

  app.use(
    "*",
    cors({
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    }),
  );

  app.route("/", authApp);
  app.route("/", categoriesApp);
  app.route("/", complaintsApp);

  app.doc("/openapi.json", {
    openapi: "3.0.0",
    info: {
      title: "Feedback Sandbox API",
      version: "1.0.0",
      description: "Complaint submission and listing for the feedback sandbox.",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  });

  app.get("/health", (c) => c.json({ status: "ok" }));

  return app;
}

export const app = createApp();
