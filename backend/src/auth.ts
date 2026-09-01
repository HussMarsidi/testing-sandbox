import { scryptSync, timingSafeEqual } from "node:crypto";

export const DEFAULT_ADMIN_USERNAME = "admin";
export const DEFAULT_ADMIN_PASSWORD = "password";
const PASSWORD_SALT = "feedback-sandbox-salt";

export function hashPassword(password: string): string {
  return scryptSync(password, PASSWORD_SALT, 32).toString("hex");
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const candidate = Buffer.from(hashPassword(password), "hex");
  const expected = Buffer.from(passwordHash, "hex");

  if (candidate.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(candidate, expected);
}

export function getJwtSecret(): string {
  return process.env.JWT_SECRET ?? "feedback-sandbox-dev-secret";
}
