import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { complaintsApp } from "./routes/complaints.js";

export function createApp() {
  const app = new OpenAPIHono();

  app.use(
    "*",
    cors({
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    }),
  );

  app.route("/", complaintsApp);

  app.doc("/openapi.json", {
    openapi: "3.0.0",
    info: {
      title: "Feedback Sandbox API",
      version: "1.0.0",
      description: "Complaint submission and listing for the feedback sandbox.",
    },
  });

  app.get("/health", (c) => c.json({ status: "ok" }));

  return app;
}

export const app = createApp();
