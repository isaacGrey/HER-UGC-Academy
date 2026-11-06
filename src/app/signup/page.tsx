import { notFound } from "next/navigation";
// An explicit tombstone prevents the catch-all workspace route from streaming this URL.
export default function DisabledSignup() {
  notFound();
}
