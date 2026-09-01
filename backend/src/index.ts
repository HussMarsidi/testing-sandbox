import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { initDb } from "./db.js";

const port = Number(process.env.PORT ?? 3001);

initDb();

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Backend listening on http://localhost:${info.port}`);
  },
);
