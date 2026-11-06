import { describe, it, expect } from "vitest";
import {
  hasAccess,
  newToken,
  hashToken,
  validInvitation,
  safeReturnPath,
  derivedMetrics,
  completeness,
} from "../../src/lib/security";
import {
  secureUrl,
  passwordSchema,
  opportunitySchema,
  socialSchema,
} from "../../src/lib/schemas";
describe("Access enforcement", () => {
  it("requires both an allowed role and active state", () => {
    expect(hasAccess("ADMIN", "ACTIVE", ["ADMIN"])).toBe(true);
    for (const status of [
      "INVITED",
      "SUSPENDED",
      "REVOKED",
      "DELETED",
    ] as const)
      expect(hasAccess("ADMIN", status, ["ADMIN"])).toBe(false);
    expect(hasAccess("CREATOR", "ACTIVE", ["ADMIN"])).toBe(false);
  });
  it("never permits external return paths", () => {
    for (const path of [
      "https://evil.test",
      "//evil.test",
      "/\\evil.test",
      "javascript:alert(1)",
    ])
      expect(safeReturnPath(path)).toBe("/dashboard");
    expect(safeReturnPath("/reset-password")).toBe("/reset-password");
  });
});
describe("Invitation integrity", () => {
  it("creates unpredictable 256-bit tokens and stores distinct SHA-256 digests", () => {
    const a = newToken(),
      b = newToken();
    expect(a.token).toHaveLength(64);
    expect(a.hash).toHaveLength(64);
    expect(a.token).not.toBe(a.hash);
    expect(a.token).not.toBe(b.token);
    expect(hashToken(a.token)).toBe(a.hash);
  });
  it("rejects accepted, revoked, and expired invitations", () => {
    const valid = {
      accepted_at: null,
      revoked_at: null,
      expires_at: "2030-01-01",
    };
    expect(validInvitation(valid, 0)).toBe(true);
    expect(validInvitation({ ...valid, accepted_at: "2020-01-01" }, 0)).toBe(
      false,
    );
    expect(validInvitation({ ...valid, revoked_at: "2020-01-01" }, 0)).toBe(
      false,
    );
    expect(validInvitation(valid, Date.parse("2031-01-01"))).toBe(false);
  });
});
describe("Input boundaries", () => {
  it("rejects unsafe external URLs and embedded credentials", () => {
    for (const value of [
      "javascript:alert(1)",
      "data:text/html,hello",
      "http://example.com",
      "https://user:pass@example.com",
    ])
      expect(secureUrl.safeParse(value).success).toBe(false);
    expect(secureUrl.safeParse("https://example.com/apply").success).toBe(true);
  });
  it("enforces a strong minimum password length", () => {
    expect(passwordSchema.safeParse("short").success).toBe(false);
    expect(passwordSchema.safeParse("a long private passphrase").success).toBe(
      true,
    );
  });
  it("rejects inverted compensation and date ranges", () => {
    const base = {
      title: "A beauty campaign",
      summary: "An authentic product story",
      description: "Create a thoughtful review of a new skincare product.",
      content_requirements: "",
      creator_requirements: "",
      deliverables: "",
      niches: ["Beauty"],
      platforms: ["TikTok"],
      location: "Global",
      remote: true,
      campaign_type: "UGC",
      compensation_type: "PAID",
      compensation_min: 100,
      compensation_max: 500,
      currency: "USD",
      external_platform: "SideShift",
      external_url: "https://example.com/apply",
      start_date: "2026-10-01",
      end_date: "2026-10-20",
    };
    expect(opportunitySchema.safeParse(base).success).toBe(true);
    expect(
      opportunitySchema.safeParse({ ...base, compensation_max: 50 }).success,
    ).toBe(false);
    expect(
      opportunitySchema.safeParse({ ...base, end_date: "2026-09-01" }).success,
    ).toBe(false);
  });
  it("matches social URLs to the selected provider", () => {
    expect(
      socialSchema.safeParse({
        platform: "TikTok",
        username: "demo",
        profile_url: "https://evil-tiktok.com/demo",
      }).success,
    ).toBe(false);
    expect(
      socialSchema.safeParse({
        platform: "TikTok",
        username: "demo",
        profile_url: "https://www.tiktok.com/@demo",
      }).success,
    ).toBe(true);
  });
});
describe("Honest analytics", () => {
  it("handles empty and populated metrics without NaN", () => {
    expect(derivedMetrics(0, 0, 0, 0, 0)).toEqual({
      averageViews: 0,
      engagementRate: 0,
    });
    expect(derivedMetrics(1000, 50, 10, 20, 10)).toEqual({
      averageViews: 100,
      engagementRate: 8,
    });
  });
  it("does not count an empty tag array toward completeness", () =>
    expect(
      completeness({ name: "Creator", niches: [] }, ["name", "niches"]),
    ).toBe(50));
});
