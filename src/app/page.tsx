import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { homeFor } from "@/lib/constants";
export default async function Home() {
  const { profile } = await requireUser();
  redirect(homeFor(profile.role));
}
