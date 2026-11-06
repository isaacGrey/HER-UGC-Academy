import { createHash, randomBytes } from "node:crypto";
import type { AccountStatus, Role } from "./constants";
export function hasAccess(
  role: Role,
  status: AccountStatus,
  allowed: readonly Role[],
) {
  return status === "ACTIVE" && allowed.includes(role);
}
export function newToken() {
  const token = randomBytes(32).toString("hex");
  return { token, hash: hashToken(token) };
}
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function safeReturnPath(path: string | null) {
  return path && /^\/(?!\/)/.test(path) && !path.includes("\\")
    ? path
    : "/dashboard";
}
export function validInvitation(
  invite: {
    accepted_at: string | null;
    revoked_at: string | null;
    expires_at: string;
  },
  now = Date.now(),
) {
  return (
    !invite.accepted_at &&
    !invite.revoked_at &&
    Date.parse(invite.expires_at) > now
  );
}
export function derivedMetrics(
  views: number,
  likes: number,
  comments: number,
  shares: number,
  count: number,
) {
  return {
    averageViews: count > 0 ? views / count : 0,
    engagementRate:
      views > 0
        ? Math.min(100, ((likes + comments + shares) / views) * 100)
        : 0,
  };
}
export function completeness(row: Record<string, unknown>, keys: string[]) {
  return Math.round(
    (keys.filter((k) =>
      Array.isArray(row[k])
        ? (row[k] as unknown[]).length > 0
        : Boolean(row[k]),
    ).length /
      keys.length) *
      100,
  );
}
