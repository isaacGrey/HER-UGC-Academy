import "server-only";
import { randomUUID } from "node:crypto";
export type MetricSnapshot = {
  followers: number;
  totalViews: number;
  averageViews: number;
  engagementRate: number;
  source: "MANUAL" | "API";
};
export interface SocialAdapter {
  platform: string;
  available: boolean;
  sync(accountId: string): Promise<MetricSnapshot>;
}
export const socialAdapters: SocialAdapter[] = [
  "TikTok",
  "Instagram",
  "YouTube",
].map((platform) => ({
  platform,
  available: false,
  async sync() {
    throw new Error(
      `${platform} API approval and adapter configuration are required.`,
    );
  },
}));
export const sideShift = {
  mode: "EXTERNAL_LINK" as const,
  apiAvailable: false,
};
export async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.RESEND_API_KEY)
    return { sent: false, reason: "Email provider is not configured." };
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [to],
        subject,
        text,
      }),
    });
    return {
      sent: response.ok,
      reason: response.ok
        ? "Sent"
        : "Email delivery failed. Retry from invitations.",
    };
  } catch {
    return {
      sent: false,
      reason: "Email delivery failed. Please retry from invitations.",
    };
  }
}
export async function reportError(error: unknown, context: string) {
  const eventId = randomUUID().replaceAll("-", "");
  console.error(
    JSON.stringify({
      level: "error",
      eventId,
      context,
      type: error instanceof Error ? error.name : "UnknownError",
    }),
  );
  if (!process.env.SENTRY_DSN) return;
  try {
    const dsn = new URL(process.env.SENTRY_DSN);
    const project = dsn.pathname.split("/").pop();
    await fetch(`${dsn.protocol}//${dsn.host}/api/${project}/envelope/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-sentry-envelope" },
      body:
        JSON.stringify({ event_id: eventId, dsn: process.env.SENTRY_DSN }) +
        "\n" +
        JSON.stringify({ type: "event" }) +
        "\n" +
        JSON.stringify({
          event_id: eventId,
          level: "error",
          message: `Portal operation failed: ${context}`,
          platform: "javascript",
        }),
    });
  } catch {
    console.error(
      JSON.stringify({ eventId, context: "error_delivery_failed" }),
    );
  }
}
