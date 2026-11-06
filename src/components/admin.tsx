import NavigationForm from "next/form";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { rows, param, invitationStatus, type SearchParams } from "@/lib/data";
import {
  moderate,
  invitationAction,
  inviteMember,
  setFlag,
} from "@/lib/actions";
import { PageHeading, Empty, Status, Badge, dateLabel, currency } from "./ui";
import { ActionButton, Form } from "./forms";
import type { RecordRow } from "@/lib/types";
const config: Record<
  string,
  { table: string; title: string; description: string; search: string }
> = {
  creators: {
    table: "creator_profiles",
    title: "Creators",
    description:
      "Support the people behind the content. Manage profiles and academy verification.",
    search: "display_name",
  },
  brands: {
    table: "brands",
    title: "Brands",
    description: "A trusted community starts with thoughtful brand partners.",
    search: "name",
  },
  accounts: {
    table: "profiles",
    title: "Account access",
    description:
      "Access changes take effect on the next server request, including existing sessions.",
    search: "email",
  },
  opportunities: {
    table: "opportunities",
    title: "Opportunity review",
    description:
      "Keep every brief clear, credible, and right for the HER community.",
    search: "title",
  },
  invitations: {
    table: "invitations",
    title: "An invitation to something good.",
    description: "Welcome new creators and brands into your private community.",
    search: "email",
  },
  plans: {
    table: "plans",
    title: "Subscription plans",
    description:
      "Manage future brand subscriptions. Invited brands join free while billing is off.",
    search: "name",
  },
  "audit-log": {
    table: "audit_logs",
    title: "Audit log",
    description:
      "An append-only record of privileged changes. Tokens and credentials are never included.",
    search: "action",
  },
};
export async function AdminList({
  kind,
  params,
}: {
  kind: string;
  params: SearchParams;
}) {
  const { client, profile } = await requireUser(["ADMIN"]);
  const c = config[kind];
  const page = Math.max(1, Math.min(1000, Number(param(params, "page")) || 1));
  const columns =
    kind === "invitations"
      ? "id,email,role,invited_by,expires_at,accepted_at,revoked_at,created_at"
      : "*";
  let query = client
    .from(c.table)
    .select(columns, { count: "exact" })
    .order("created_at", { ascending: false });
  if (param(params, "q"))
    query = query.ilike(
      c.search,
      `%${param(params, "q").replace(/[%_]/g, "").slice(0, 100)}%`,
    );
  if (param(params, "status") && ["accounts", "opportunities"].includes(kind))
    query = query.eq("status", param(params, "status"));
  if (kind === "audit-log") {
    if (param(params, "from"))
      query = query.gte("created_at", param(params, "from"));
    if (param(params, "to"))
      query = query.lte("created_at", `${param(params, "to")}T23:59:59Z`);
    if (param(params, "actor"))
      query = query.eq("actor_id", param(params, "actor"));
  }
  const { data, error, count } = await query.range(
    (page - 1) * 20,
    page * 20 - 1,
  );
  if (error) throw new Error("Admin data unavailable");
  const items = (data || []) as unknown as RecordRow[];
  return (
    <>
      <PageHeading
        eyebrow="ACADEMY ADMINISTRATION"
        title={c.title}
        description={c.description}
      >
        {["invitations", "plans"].includes(kind) && (
          <Link href={`/admin/${kind}/new`} className="button">
            <Plus size={16} />
            {kind === "invitations" ? "Invite a member" : "Create plan"}
          </Link>
        )}
      </PageHeading>
      <NavigationForm action="" className="searchbar">
        <div className="search-wrap">
          <Search size={17} />
          <input
            className="search-input"
            name="q"
            aria-label={`Search ${kind}`}
            defaultValue={param(params, "q")}
            placeholder={`Search ${kind}…`}
          />
        </div>
        {["accounts", "opportunities"].includes(kind) && (
          <div className="field">
            <label htmlFor="status" className="sr-only">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={param(params, "status")}
            >
              <option value="">All statuses</option>
              {(kind === "accounts"
                ? ["ACTIVE", "SUSPENDED", "REVOKED", "DELETED"]
                : ["DRAFT", "PENDING", "LIVE", "APPROVED", "CLOSED", "REJECTED"]
              ).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
        {kind === "audit-log" && (
          <>
            <div className="field">
              <label htmlFor="from">From</label>
              <input
                id="from"
                name="from"
                type="date"
                defaultValue={param(params, "from")}
              />
            </div>
            <div className="field">
              <label htmlFor="to">To</label>
              <input
                id="to"
                name="to"
                type="date"
                defaultValue={param(params, "to")}
              />
            </div>
          </>
        )}
        <button className="button">Search</button>
      </NavigationForm>
      <p style={{ fontSize: 12, marginBottom: 14 }}>{count || 0} records</p>
      {items.length ? (
        <div className="card table-wrap" style={{ padding: 16 }}>
          <table className="mobile-cards">
            <thead>
              <tr>
                <th>{kind === "audit-log" ? "Action" : "Name / record"}</th>
                <th>Details</th>
                <th>{kind === "audit-log" ? "When" : "Status"}</th>
                <th>{kind === "audit-log" ? "Actor" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const inviteStatus = invitationStatus(item);
                return (
                  <tr key={item.id}>
                    <td>
                      <strong>
                        {item.display_name ||
                          item.name ||
                          item.title ||
                          item.email ||
                          item.action}
                      </strong>
                      <small>
                        {kind === "accounts"
                          ? item.email
                          : dateLabel(item.created_at)}
                      </small>
                    </td>
                    <td>
                      {kind === "invitations" ? (
                        <>
                          <Badge>{item.role}</Badge>
                          <small style={{ display: "block" }}>
                            Expires {dateLabel(item.expires_at)}
                          </small>
                        </>
                      ) : kind === "accounts" ? (
                        <Badge>{item.role}</Badge>
                      ) : kind === "plans" ? (
                        <>
                          {currency(item.price_monthly, String(item.currency))}
                          /month
                        </>
                      ) : kind === "audit-log" ? (
                        <>
                          <strong>{item.entity_type}</strong>
                          <small>{item.entity_id}</small>
                        </>
                      ) : (
                        <small>
                          {item.headline ||
                            item.industry ||
                            String(item.summary || "").slice(0, 80)}
                        </small>
                      )}
                    </td>
                    <td>
                      {kind === "audit-log" ? (
                        dateLabel(item.created_at)
                      ) : kind === "invitations" ? (
                        <Status value={inviteStatus} />
                      ) : item.status ? (
                        <Status value={String(item.status)} />
                      ) : (
                        <Badge
                          tone={item.verified || item.active ? "green" : ""}
                        >
                          {kind === "plans"
                            ? item.active
                              ? "ACTIVE"
                              : "INACTIVE"
                            : item.verified
                              ? "VERIFIED"
                              : "UNVERIFIED"}
                        </Badge>
                      )}
                    </td>
                    <td>
                      <div
                        className={
                          kind === "opportunities"
                            ? "row opportunity-admin-actions"
                            : "row"
                        }
                      >
                        {kind === "accounts" && item.id !== profile.id && (
                          <>
                            {item.status !== "ACTIVE" && (
                              <ActionButton
                                action={moderate.bind(
                                  null,
                                  "profiles",
                                  item.id,
                                  "ACTIVE",
                                )}
                                label="Restore"
                              />
                            )}
                            {item.status === "ACTIVE" && (
                              <ActionButton
                                action={moderate.bind(
                                  null,
                                  "profiles",
                                  item.id,
                                  "SUSPENDED",
                                )}
                                label="Suspend"
                                danger
                                confirm="Suspend this account? Access will be blocked on its next server request."
                              />
                            )}
                            <ActionButton
                              action={moderate.bind(
                                null,
                                "profiles",
                                item.id,
                                "REVOKED",
                              )}
                              label="Revoke"
                              danger
                              confirm="Revoke this member’s academy access? Their data will remain available to administrators."
                            />
                            <ActionButton
                              action={moderate.bind(
                                null,
                                "profiles",
                                item.id,
                                "DELETED",
                              )}
                              label="Soft delete"
                              danger
                              confirm="Soft delete this account and remove its marketplace visibility? Stored records are retained."
                            />
                          </>
                        )}
                        {["creators", "brands"].includes(kind) && (
                          <>
                            <Link
                              href={`/${kind}/${item.id}`}
                              className="button secondary small"
                            >
                              View
                            </Link>
                            <Link
                              href={`/admin/${kind}/${item.id}/edit`}
                              className="button secondary small"
                            >
                              Edit
                            </Link>
                            <ActionButton
                              action={moderate.bind(
                                null,
                                c.table,
                                item.id,
                                item.verified ? "unverify" : "verify",
                              )}
                              label={item.verified ? "Unverify" : "Verify"}
                            />
                          </>
                        )}
                        {kind === "opportunities" && (
                          <>
                            <Link
                              href={`/opportunities/${item.id}`}
                              className="button secondary small"
                            >
                              Review
                            </Link>
                            {["PENDING", "APPROVED"].includes(
                              String(item.status),
                            ) && (
                              <>
                                <ActionButton
                                  action={moderate.bind(
                                    null,
                                    "opportunities",
                                    item.id,
                                    "LIVE",
                                  )}
                                  label="Approve & publish"
                                  className="opportunity-status-action"
                                />
                                <ActionButton
                                  action={moderate.bind(
                                    null,
                                    "opportunities",
                                    item.id,
                                    "REJECTED",
                                    "Please revise the brief and resubmit. Contact the academy for detailed feedback.",
                                  )}
                                  label="Reject"
                                  danger
                                  confirm="Reject this brief and return it to the brand for revision?"
                                />
                              </>
                            )}
                            {item.status === "LIVE" && (
                              <ActionButton
                                action={moderate.bind(
                                  null,
                                  "opportunities",
                                  item.id,
                                  "CLOSED",
                                )}
                                label="Close"
                                className="opportunity-status-action"
                                confirm="Close this listing and remove it from marketplace discovery?"
                              />
                            )}
                            {item.status === "LIVE" && (
                              <ActionButton
                                action={moderate.bind(
                                  null,
                                  "opportunities",
                                  item.id,
                                  item.featured ? "unfeature" : "feature",
                                )}
                                label={item.featured ? "Unfeature" : "Feature"}
                              />
                            )}
                          </>
                        )}
                        {kind === "invitations" &&
                          !item.accepted_at &&
                          !item.revoked_at && (
                            <>
                              <ActionButton
                                action={invitationAction.bind(
                                  null,
                                  item.id,
                                  "resend",
                                )}
                                label="Resend"
                              />
                              <ActionButton
                                action={invitationAction.bind(
                                  null,
                                  item.id,
                                  "revoke",
                                )}
                                label="Revoke"
                                danger
                                confirm="Revoke this invitation? Its link will no longer be usable."
                              />
                            </>
                          )}
                        {kind === "plans" && (
                          <Link
                            href={`/admin/plans/${item.id}/edit`}
                            className="button secondary small"
                          >
                            Edit plan
                          </Link>
                        )}
                        {kind === "audit-log" && (
                          <small>{item.actor_id || "System"}</small>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          title="No records found"
          description="Try another search, or add your first community members."
        />
      )}
      <div className="pagination">
        {page > 1 && (
          <Link
            className="button secondary small"
            href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => typeof v === "string") as [string, string][]), page: String(page - 1) })}`}
          >
            Previous
          </Link>
        )}
        <span>
          Page {page} of {Math.max(1, Math.ceil((count || 0) / 20))}
        </span>
        {page * 20 < (count || 0) && (
          <Link
            className="button secondary small"
            href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => typeof v === "string") as [string, string][]), page: String(page + 1) })}`}
          >
            Next
          </Link>
        )}
      </div>
    </>
  );
}
export async function InvitationForm() {
  const { profile } = await requireUser(["ADMIN"]);
  return (
    <>
      <PageHeading
        eyebrow="GROW THE COMMUNITY"
        title="Send an invitation."
        description="One personal invitation. A new world of possibility. Links expire after seven days and can only be used once."
      />
      <section className="card">
        <Form
          action={inviteMember}
          fields={[
            {
              name: "email",
              label: "Email address",
              type: "email",
              required: true,
            },
            {
              name: "role",
              label: "Account type",
              type: "select",
              required: true,
              options: profile.can_invite_admin
                ? ["CREATOR", "BRAND", "ADMIN"]
                : ["CREATOR", "BRAND"],
            },
          ]}
          submit="Send invitation"
        />
      </section>
    </>
  );
}
export async function AdminSettings() {
  await requireUser(["ADMIN"]);
  const flags = await rows("feature_flags");
  return (
    <>
      <PageHeading
        eyebrow="ACADEMY ADMINISTRATION"
        title="Portal settings"
        description="Manage business features. All changes are enforced on the server and recorded in the audit log."
      />
      <div className="stack">
        {flags.map((flag) => (
          <section className="card spread" key={flag.id}>
            <div>
              <h3>{flag.description}</h3>
              <small>{flag.id}</small>
              <div style={{ marginTop: 10 }}>
                <Badge tone={flag.enabled ? "green" : ""}>
                  {flag.enabled ? "ENABLED" : "DISABLED"}
                </Badge>
              </div>
            </div>
            <ActionButton
              label={flag.enabled ? "Disable" : "Enable"}
              action={setFlag.bind(null, flag.id, !flag.enabled)}
              confirm={
                flag.id === "brand_billing_enabled"
                  ? "Change brand billing availability? Stripe must be configured before billing can be enabled."
                  : undefined
              }
            />
          </section>
        ))}
        <section className="card stack">
          <h3>External integration status</h3>
          <p>
            Social profiles and analytics work in manual mode. TikTok,
            Instagram, and YouTube API adapters require provider approval and
            implementation before activation. SideShift links open the external
            platform.
          </p>
          <div className="row">
            <Badge>NO LIVE SOCIAL SYNC</Badge>
            <Badge>SIDESHIFT: EXTERNAL LINKS</Badge>
          </div>
        </section>
      </div>
    </>
  );
}
