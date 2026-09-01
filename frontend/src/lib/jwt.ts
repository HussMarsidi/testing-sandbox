import type { UserRole } from "./auth-storage";

interface JwtPayload {
  sub?: string;
  role?: UserRole;
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (base64.length % 4)) % 4;
  return atob(base64 + "=".repeat(padding));
}

export function parseJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as JwtPayload;
    return payload;
  } catch {
    return null;
  }
}

export function getRoleFromToken(token: string | null): UserRole | null {
  if (!token) {
    return null;
  }

  const payload = parseJwtPayload(token);
  if (payload?.role === "admin" || payload?.role === "viewer") {
    return payload.role;
  }

  return null;
}
