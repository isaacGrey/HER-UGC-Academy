import "server-only";
import { db } from "./supabase/server";
import type { RecordRow } from "./types";
export async function rows(
  table: string,
  filters: Record<string, string> = {},
  limit = 100,
) {
  let query = (await db()).from(table).select("*");
  for (const [key, value] of Object.entries(filters))
    query = query.eq(key, value);
  const { data, error } = await query.limit(limit);
  if (error) throw new Error(`Unable to load ${table}`);
  return (data || []) as RecordRow[];
}
export async function record(table: string, id: string) {
  const { data, error } = await (
    await db()
  )
    .from(table)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Unable to load ${table}`);
  return data as RecordRow | null;
}
export async function signedImage(bucket: string, path: unknown) {
  if (typeof path !== "string" || !path) return undefined;
  const { data } = await (
    await db()
  ).storage
    .from(bucket)
    .createSignedUrl(path, 600);
  return data?.signedUrl;
}
export type SearchParams = Record<string, string | string[] | undefined>;
export const param = (params: SearchParams, key: string) =>
  typeof params[key] === "string" ? (params[key] as string) : "";
export const stringValue = (row: RecordRow, key: string, fallback = "") =>
  String(row[key] ?? fallback);
export const listValue = (row: RecordRow, key: string) =>
  Array.isArray(row[key]) ? [...new Set(row[key] as string[])] : [];
export function invitationStatus(row: RecordRow) {
  return row.accepted_at
    ? "ACCEPTED"
    : row.revoked_at
      ? "REVOKED"
      : Date.parse(String(row.expires_at)) < Date.now()
        ? "EXPIRED"
        : "INVITED";
}
