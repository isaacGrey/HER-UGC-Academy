export const roles = ["CREATOR", "BRAND", "ADMIN"] as const;
export type Role = (typeof roles)[number];
export const statuses = [
  "INVITED",
  "ACTIVE",
  "SUSPENDED",
  "REVOKED",
  "DELETED",
] as const;
export type AccountStatus = (typeof statuses)[number];
export const niches = [
  "Beauty",
  "Fashion",
  "Lifestyle",
  "SaaS",
  "Technology",
  "Finance",
  "Health & Wellness",
  "Travel",
  "Food",
  "Fitness",
  "Gaming",
  "Parenting",
];
export const platforms = ["TikTok", "Instagram", "YouTube"];
export const homeFor = (role: Role) =>
  role === "ADMIN"
    ? "/admin"
    : role === "BRAND"
      ? "/brand/dashboard"
      : "/dashboard";
