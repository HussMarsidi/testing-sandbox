import { z } from "@hono/zod-openapi";
import { COMPLAINT_CATEGORIES } from "./db.js";

export const ComplaintCategorySchema = z
  .enum(COMPLAINT_CATEGORIES)
  .openapi({ example: "bug" });

export const CategoryOptionSchema = z
  .object({
    value: ComplaintCategorySchema,
    label: z.string().openapi({ example: "Bug" }),
  })
  .openapi("CategoryOption");

export const CreateComplaintSchema = z
  .object({
    name: z.string().trim().min(1).max(100).openapi({ example: "Jane Doe" }),
    email: z.string().trim().email().max(255).openapi({ example: "jane@example.com" }),
    category: ComplaintCategorySchema,
    message: z.string().trim().min(10).max(2000).openapi({
      example: "The submit button does not work on mobile.",
    }),
  })
  .openapi("CreateComplaint");

export const ComplaintSchema = z
  .object({
    id: z.number().int().positive().openapi({ example: 1 }),
    name: z.string().openapi({ example: "Jane Doe" }),
    email: z.string().email().openapi({ example: "jane@example.com" }),
    category: ComplaintCategorySchema,
    message: z.string().openapi({ example: "The submit button does not work on mobile." }),
    created_at: z.string().openapi({ example: "2026-09-01T12:00:00.000Z" }),
  })
  .openapi("Complaint");

export const CreateComplaintResponseSchema = z
  .object({
    id: z.number().int().positive().openapi({ example: 1 }),
  })
  .openapi("CreateComplaintResponse");

export const LoginRequestSchema = z
  .object({
    username: z.string().trim().min(1).openapi({ example: "admin" }),
    password: z.string().min(1).openapi({ example: "password" }),
  })
  .openapi("LoginRequest");

export const LoginResponseSchema = z
  .object({
    token: z.string().openapi({ example: "jwt-token" }),
  })
  .openapi("LoginResponse");

export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({ example: "Validation failed" }),
    details: z
      .array(
        z.object({
          field: z.string(),
          message: z.string(),
        }),
      )
      .optional(),
  })
  .openapi("ErrorResponse");
