import { verify } from "hono/jwt";
import { getJwtSecret } from "./auth.js";
import type { UserRole } from "./db.js";

export interface AuthPayload {
  sub: string;
  role: UserRole;
}

export async function getAuthPayload(
  authorizationHeader: string | undefined,
): Promise<AuthPayload | null> {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.slice("Bearer ".length);

  try {
    const payload = await verify(token, getJwtSecret(), "HS256");
    const sub = payload.sub;
    const role = payload.role;

    if (typeof sub !== "string" || (role !== "admin" && role !== "viewer")) {
      return null;
    }

    return { sub, role };
  } catch {
    return null;
  }
}
