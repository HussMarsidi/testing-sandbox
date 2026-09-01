import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "../app.js";

const rootDir = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const outputPath = resolve(rootDir, "openapi.json");

const spec = app.getOpenAPIDocument({
  openapi: "3.0.0",
  info: {
    title: "Feedback Sandbox API",
    version: "1.0.0",
    description: "Complaint submission and listing for the feedback sandbox.",
  },
});

writeFileSync(outputPath, `${JSON.stringify(spec, null, 2)}\n`);
console.log(`Wrote OpenAPI spec to ${outputPath}`);
