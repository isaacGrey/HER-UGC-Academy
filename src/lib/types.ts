import type { Database } from "./database.types";
export type Value = string | number | boolean | null | string[];
export type RecordRow = { id: string; [key: string]: Value };
export type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "email" | "display_name" | "role" | "status" | "can_invite_admin"
>;
export type ActionResult = {
  ok: boolean;
  message: string;
  fields?: Record<string, string[]>;
  url?: string;
};
export type Field = {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "url"
    | "number"
    | "date"
    | "textarea"
    | "select"
    | "multi"
    | "checkbox"
    | "password";
  required?: boolean;
  options?: readonly string[];
  hint?: string;
  min?: number;
  max?: number;
};
export type EntityConfig = {
  table: string;
  title: string;
  singular: string;
  description: string;
  owner?: "creator_id" | "brand_id";
  fields: Field[];
};
