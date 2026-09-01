import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { insertComplaint, listComplaints } from "../db.js";
import {
  ComplaintSchema,
  CreateComplaintResponseSchema,
  CreateComplaintSchema,
  ErrorResponseSchema,
} from "../schemas.js";

const listComplaintsRoute = createRoute({
  method: "get",
  path: "/api/complaints",
  tags: ["Complaints"],
  summary: "List all complaints",
  responses: {
    200: {
      description: "All complaints, newest first",
      content: {
        "application/json": {
          schema: z.array(ComplaintSchema),
        },
      },
    },
  },
});

const createComplaintRoute = createRoute({
  method: "post",
  path: "/api/complaints",
  tags: ["Complaints"],
  summary: "Submit a new complaint",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateComplaintSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Complaint created",
      content: {
        "application/json": {
          schema: CreateComplaintResponseSchema,
        },
      },
    },
    400: {
      description: "Validation failed",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

export const complaintsApp = new OpenAPIHono();

complaintsApp.openapi(listComplaintsRoute, (c) => {
  const complaints = listComplaints();
  return c.json(complaints, 200);
});

complaintsApp.openapi(createComplaintRoute, (c) => {
  const body = c.req.valid("json");
  const complaint = insertComplaint(body);
  return c.json({ id: complaint.id }, 201);
});
