import { randomBytes } from "crypto";

export function generateInviteCode(): string {
  return randomBytes(9).toString("base64url").slice(0, 12);
}
