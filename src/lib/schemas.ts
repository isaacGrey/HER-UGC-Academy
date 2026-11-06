import { z } from "zod";
import { roles } from "./constants";
export const secureUrl = z
  .string()
  .trim()
  .url()
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "https:" && !u.username && !u.password;
    } catch {
      return false;
    }
  }, "Use an HTTPS URL without credentials.");
const optionalUrl = z
  .union([secureUrl, z.literal("")])
  .optional()
  .transform((v) => v || null);
const text = z.string().trim().max(500);
const paragraph = z.string().trim().max(10000);
const list = z.array(z.string().trim().max(80)).max(20);
const money = z.coerce.number().min(0).max(1000000000);
const date = z
  .union([z.iso.date(), z.literal("")])
  .optional()
  .transform((v) => v || null);
export const loginSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(128),
});
export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(72)
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "Use a password of at most 72 UTF-8 bytes.",
  );
export const invitationSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  role: z.enum(roles),
});
export const creatorSchema = z.object({
  display_name: text.min(2),
  headline: text,
  bio: paragraph,
  location: text,
  timezone: text,
  languages: list,
  niches: list,
  platforms: list,
  availability: z.enum(["Available", "Limited availability", "Unavailable"]),
  website: optionalUrl,
  rate_min: money,
});
export const brandSchema = z.object({
  name: text.min(2),
  description: paragraph,
  industry: text,
  location: text,
  website: optionalUrl,
  company_size: text,
  remote: z.boolean(),
});
export const opportunitySchema = z
  .object({
    title: text.min(5),
    summary: text.min(10),
    description: paragraph.min(20),
    content_requirements: paragraph,
    creator_requirements: paragraph,
    deliverables: paragraph,
    niches: list.min(1),
    platforms: list.min(1),
    location: text,
    remote: z.boolean(),
    campaign_type: text.min(1),
    compensation_type: z.enum(["PAID", "GIFTED", "AFFILIATE"]),
    compensation_min: money,
    compensation_max: money,
    currency: z.string().regex(/^[A-Z]{3}$/),
    deadline: date,
    start_date: date,
    end_date: date,
    external_platform: text.min(1),
    external_url: secureUrl,
  })
  .refine((v) => v.compensation_max >= v.compensation_min, {
    path: ["compensation_max"],
    message: "Maximum must be at least the minimum.",
  })
  .refine((v) => !v.start_date || !v.end_date || v.end_date >= v.start_date, {
    path: ["end_date"],
    message: "End date must follow the start date.",
  });
export const portfolioSchema = z.object({
  title: text.min(2),
  description: paragraph,
  platform: text,
  url: optionalUrl,
  brand_name: text,
  views: money,
  likes: money,
  display_order: z.coerce.number().int().min(0),
  featured: z.boolean(),
});
export const socialSchema = z
  .object({
    platform: z.enum(["TikTok", "Instagram", "YouTube"]),
    username: text.min(1),
    profile_url: secureUrl,
  })
  .refine(
    (v) => {
      const h = new URL(v.profile_url).hostname;
      const domain = {
        TikTok: "tiktok.com",
        Instagram: "instagram.com",
        YouTube: "youtube.com",
      }[v.platform];
      return (
        h === domain ||
        h.endsWith("." + domain) ||
        (v.platform === "YouTube" && h === "youtu.be")
      );
    },
    {
      path: ["profile_url"],
      message: "Use a profile URL from the selected platform.",
    },
  );
export const metricsSchema = z.object({
  social_account_id: z.uuid(),
  followers: money,
  following: money,
  total_views: money,
  average_views: money,
  average_likes: money,
  average_comments: money,
  average_shares: money,
  video_count: z.coerce.number().int().min(0),
  engagement_rate: z.coerce.number().min(0).max(100),
});
export const campaignSchema = z
  .object({
    name: text.min(2),
    brand_name: text.min(2),
    external_platform: text,
    external_url: optionalUrl,
    status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]),
    start_date: date,
    end_date: date,
    compensation: money,
    notes: paragraph,
  })
  .refine((v) => !v.start_date || !v.end_date || v.end_date >= v.start_date, {
    path: ["end_date"],
    message: "End date must follow start date.",
  });
export const earningsSchema = z.object({
  source: z.enum(["YOUTUBE", "SIDESHIFT", "BRAND_DIRECT", "OTHER"]),
  amount: money,
  currency: z.string().regex(/^[A-Z]{3}$/),
  period: z.iso.date(),
  campaign_name: text,
  external_reference: text,
});
export const planSchema = z.object({
  name: text.min(2),
  description: paragraph,
  price_monthly: money,
  price_yearly: money,
  currency: z.string().regex(/^[A-Z]{3}$/),
  features: list,
  stripe_price_monthly_id: text.transform((v) => v || null),
  stripe_price_yearly_id: text.transform((v) => v || null),
  active: z.boolean(),
  is_default: z.boolean(),
});
export const schemas = {
  creator_profiles: creatorSchema,
  brands: brandSchema,
  opportunities: opportunitySchema,
  portfolio_items: portfolioSchema,
  social_accounts: socialSchema,
  social_metric_snapshots: metricsSchema,
  creator_campaigns: campaignSchema,
  creator_earnings: earningsSchema,
  plans: planSchema,
};
export type EditableTable = keyof typeof schemas;
