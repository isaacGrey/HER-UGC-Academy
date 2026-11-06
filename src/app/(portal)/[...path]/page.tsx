import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { Dashboard, Analytics } from "@/components/dashboard";
import { Discovery } from "@/components/discovery";
import { Detail } from "@/components/detail";
import { ProfileEditor, ManageList, Editor } from "@/components/manage";
import { AdminList, InvitationForm, AdminSettings } from "@/components/admin";
import { Billing } from "@/components/billing";
import { PageHeading } from "@/components/ui";
import type { SearchParams } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ path: string[] }>;
  searchParams: Promise<SearchParams>;
}) {
  const { path: segments } = await params;
  const path = "/" + segments.join("/");
  const search = await searchParams;
  if (segments[0] === "signup") notFound();
  const { profile } = await requireUser(
    segments[0] === "admin"
      ? ["ADMIN"]
      : segments[0] === "brand"
        ? ["BRAND"]
        : [
              "dashboard",
              "profile",
              "portfolio",
              "socials",
              "analytics",
              "campaigns",
              "earnings",
              "saved",
              "settings",
            ].includes(segments[0])
          ? ["CREATOR"]
          : undefined,
  );
  let content: React.ReactNode;
  const browse = ["creators", "brands", "opportunities"].includes(segments[0]);
  if (browse && !(segments[0] === "opportunities" && segments[1] === "saved")) {
    const kind = segments[0] as "creators" | "brands" | "opportunities";
    if (segments.length === 1)
      content = <Discovery kind={kind} params={search} />;
    else if (segments.length === 2)
      content = (
        <>
          {kind === "creators" && search.view !== "page" && (
            <Discovery kind="creators" params={search} />
          )}
          <Detail
            kind={kind}
            id={segments[1]}
            standalone={search.view === "page"}
          />
        </>
      );
    else notFound();
  } else if (["/dashboard", "/brand/dashboard", "/admin"].includes(path))
    content = <Dashboard />;
  else if (
    [
      "/profile",
      "/profile/edit",
      "/brand/profile",
      "/brand/profile/edit",
    ].includes(path)
  )
    content = <ProfileEditor brand={segments[0] === "brand"} />;
  else if (path === "/analytics") content = <Analytics />;
  else if (path === "/analytics/new")
    content = <Editor table="social_metric_snapshots" />;
  else if (path === "/brand/creators" || path === "/brand/creators/saved")
    content = (
      <Discovery
        kind="creators"
        params={search}
        savedOnly={path.endsWith("/saved")}
      />
    );
  else if (
    path === "/saved" ||
    path === "/opportunities/saved" ||
    path === "/saved/brands"
  )
    content = (
      <>
        <div className="row" style={{ marginBottom: 24 }}>
          <Link className="button secondary small" href="/saved">
            Saved opportunities
          </Link>
          <Link className="button secondary small" href="/saved/brands">
            Saved brands
          </Link>
        </div>
        <Discovery
          kind={path === "/saved/brands" ? "brands" : "opportunities"}
          params={search}
          savedOnly
        />
      </>
    );
  else if (path === "/brand/billing") content = <Billing />;
  else if (path === "/admin/settings") content = <AdminSettings />;
  else if (path === "/admin/invitations/new") content = <InvitationForm />;
  else if (
    segments[0] === "admin" &&
    [
      "creators",
      "brands",
      "accounts",
      "opportunities",
      "invitations",
      "plans",
      "audit-log",
    ].includes(segments[1])
  ) {
    if (segments.length === 2)
      content = <AdminList kind={segments[1]} params={search} />;
    else if (segments[1] === "plans" && segments[2] === "new")
      content = <Editor table="plans" />;
    else if (
      segments.length === 4 &&
      segments[3] === "edit" &&
      ["creators", "brands", "plans"].includes(segments[1])
    )
      content = (
        <Editor
          table={segments[1] === "creators" ? "creator_profiles" : segments[1]}
          id={segments[2]}
        />
      );
    else notFound();
  } else if (path === "/settings" || path === "/brand/settings")
    content = (
      <>
        <PageHeading
          eyebrow="YOUR ACCOUNT"
          title="Account settings"
          description="Your login details and membership access are managed securely through the academy."
        />
        <section className="card stack">
          <h3>{profile.display_name}</h3>
          <p>{profile.email}</p>
          <p>Account type: {profile.role.toLowerCase()} · Access: active</p>
          <Link href="/forgot-password" className="button secondary">
            Request a password reset
          </Link>
          <p className="notice">
            Contact the academy to change your login email or request account
            deletion.
          </p>
        </section>
      </>
    );
  else {
    const routes: Record<string, string> = {
      "/portfolio": "portfolio_items",
      "/socials": "social_accounts",
      "/campaigns": "creator_campaigns",
      "/earnings": "creator_earnings",
      "/brand/opportunities": "opportunities",
    };
    const base = Object.keys(routes).find(
      (base) => path === base || path.startsWith(base + "/"),
    );
    if (!base) notFound();
    const suffix = path.slice(base.length).split("/").filter(Boolean);
    const table = routes[base];
    if (!suffix.length) content = <ManageList table={table} base={base} />;
    else if (suffix.length === 1 && suffix[0] === "new")
      content = <Editor table={table} />;
    else if (suffix.length === 2 && suffix[1] === "edit")
      content = <Editor table={table} id={suffix[0]} />;
    else notFound();
  }
  return content;
}
