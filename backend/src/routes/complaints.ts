import { createRoute, z } from "@hono/zod-openapi";
import { getAuthPayload } from "../auth-utils.js";
import {
  getComplaintById,
  insertComplaint,
  listComplaints,
  updateComplaintStatus,
} from "../db.js";
import { createOpenAPIApp } from "../openapi-app.js";
import { InvalidStatusTransitionError } from "../status.js";
import {
  ComplaintIdParamSchema,
  ComplaintListQuerySchema,
  ComplaintSchema,
  CreateComplaintResponseSchema,
  CreateComplaintSchema,
  ErrorResponseSchema,
  UpdateComplaintStatusSchema,
} from "../schemas.js";

const listComplaintsRoute = createRoute({
  method: "get",
  path: "/api/complaints",
  tags: ["Complaints"],
  summary: "List complaints with optional filters",
  security: [{ bearerAuth: [] }],
  request: {
    query: ComplaintListQuerySchema,
  },
  responses: {
    200: {
      description: "Complaints matching the filters, newest first",
      content: {
        "application/json": {
          schema: z.array(ComplaintSchema),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Failed to list complaints",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

const getComplaintRoute = createRoute({
  method: "get",
  path: "/api/complaints/{id}",
  tags: ["Complaints"],
  summary: "Get one complaint by id",
  security: [{ bearerAuth: [] }],
  request: {
    params: ComplaintIdParamSchema,
  },
  responses: {
    200: {
      description: "Complaint details",
      content: {
        "application/json": {
          schema: ComplaintSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Complaint not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Failed to load complaint",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

const updateComplaintStatusRoute = createRoute({
  method: "patch",
  path: "/api/complaints/{id}",
  tags: ["Complaints"],
  summary: "Update complaint status (admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    params: ComplaintIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateComplaintStatusSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Complaint updated",
      content: {
        "application/json": {
          schema: ComplaintSchema,
        },
      },
    },
    400: {
      description: "Invalid status transition",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Complaint not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: "Failed to update complaint",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
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
    500: {
      description: "Failed to submit complaint",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

export const complaintsApp = createOpenAPIApp();

complaintsApp.openapi(listComplaintsRoute, async (c) => {
  const auth = await getAuthPayload(c.req.header("Authorization"));
  if (!auth) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const query = c.req.valid("query");
    const complaints = listComplaints(query);
    return c.json(complaints, 200);
  } catch (error) {
    console.error("List complaints failed", error);
    return c.json({ error: "Failed to list complaints" }, 500);
  }
});

complaintsApp.openapi(getComplaintRoute, async (c) => {
  const auth = await getAuthPayload(c.req.header("Authorization"));
  if (!auth) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const { id } = c.req.valid("param");
    const complaint = getComplaintById(id);
    if (!complaint) {
      return c.json({ error: "Complaint not found" }, 404);
    }

    return c.json(complaint, 200);
  } catch (error) {
    console.error("Get complaint failed", error);
    return c.json({ error: "Failed to load complaint" }, 500);
  }
});

complaintsApp.openapi(updateComplaintStatusRoute, async (c) => {
  const auth = await getAuthPayload(c.req.header("Authorization"));
  if (!auth) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (auth.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }

  try {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const complaint = updateComplaintStatus(id, body.status);
    if (!complaint) {
      return c.json({ error: "Complaint not found" }, 404);
    }

    return c.json(complaint, 200);
  } catch (error) {
    if (error instanceof InvalidStatusTransitionError) {
      return c.json({ error: error.message }, 400);
    }

    console.error("Update complaint failed", error);
    return c.json({ error: "Failed to update complaint" }, 500);
  }
});

complaintsApp.openapi(createComplaintRoute, (c) => {
  const body = c.req.valid("json");
  if (!body) {
    return c.json({ error: "Validation failed" }, 400);
  }

  try {
    const complaint = insertComplaint(body);
    console.log("Create complaint successful", complaint.id);
    return c.json({ id: complaint.id }, 201);
  } catch (error) {
    if (error instanceof RangeError) {
      return c.json({ error: "Validation failed" }, 400);
    }

    console.error("Create complaint failed", error);
    return c.json({ error: "Failed to submit complaint" }, 500);
  }
});
