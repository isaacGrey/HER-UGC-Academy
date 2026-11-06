import { CreatorSpotlight } from "./creator-spotlight";
import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  Users,
  Eye,
  Building2,
  Sparkles,
  Clock3,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { requireUser, ownedBrand } from "@/lib/auth";
import { rows, record } from "@/lib/data";
import { completeness } from "@/lib/security";
import { PageHeading, Metric, Badge, Empty, compact, dateLabel } from "./ui";
import { OpportunityCard, CreatorCard } from "./cards";
import type { RecordRow } from "@/lib/types";
export async function Dashboard() {
  const { client, profile } = await requireUser();
  const admin = profile.role === "ADMIN";
  const brand = profile.role === "BRAND";
  const count = async (table: string, filters: Record<string, string> = {}) => {
    let query = client.from(table).select("id", { count: "exact", head: true });
    for (const [key, value] of Object.entries(filters))
      query = query.eq(key, value);
    const res = await query;
    if (res.error) throw new Error("Dashboard unavailable");
    return res.count || 0;
  };
  if (admin) {
    const counts = await Promise.all([
      count("profiles", { role: "CREATOR" }),
      count("brands"),
      count("opportunities", { status: "LIVE" }),
      count("opportunities", { status: "PENDING" }),
      count("profiles", { status: "ACTIVE", role: "CREATOR" }),
      count("profiles", { status: "SUSPENDED" }),
    ]);
    const { data: activity, error } = await client
      .from("audit_logs")
      .select("id,action,entity_type,created_at")
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) throw new Error("Activity unavailable");
    return (
      <>
        <PageHeading
          eyebrow="ACADEMY AT A GLANCE"
          title="A community with momentum."
          description="A clear view of your creators, brands, and the opportunities connecting them."
        >
          <Link className="button" href="/admin/invitations/new">
            <Mail size={16} />
            Invite a member
          </Link>
        </PageHeading>
        <div className="metrics admin-summary">
          <Metric
            label="Total creators"
            value={counts[0]}
            note={`${counts[4]} active accounts`}
            icon={<Users size={18} />}
          />
          <Metric
            label="Community brands"
            value={counts[1]}
            icon={<Building2 size={18} />}
          />
          <Metric
            label="Live opportunities"
            value={counts[2]}
            icon={<BriefcaseBusiness size={18} />}
          />
          <Metric
            label="Awaiting review"
            value={counts[3]}
            note="Ready for your attention"
            icon={<Clock3 size={18} />}
          />
        </div>
        <div className="grid two" style={{ marginTop: 26 }}>
          <section className="card">
            <div className="section-head">
              <h2>Recent activity</h2>
              <Link href="/admin/audit-log">View audit log →</Link>
            </div>
            {activity?.length ? (
              <div className="stack">
                {activity.map((a) => (
                  <div className="row" key={a.id}>
                    <div className="icon-button">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <strong style={{ fontSize: 12 }}>
                        {a.action.replaceAll("_", " ")}
                      </strong>
                      <small style={{ display: "block" }}>
                        {a.entity_type} · {dateLabel(a.created_at)}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>
                No activity yet. Invite your first community members to get
                started.
              </p>
            )}
          </section>
          <section className="card stack admin-review-panel">
            <h2>Keep the community moving</h2>
            <div className="notice">
              {counts[3]} opportunities are waiting for review.
            </div>
            <Link href="/admin/opportunities?status=PENDING" className="button">
              Review opportunities <ArrowUpRight size={14} />
            </Link>
            <div className="notice">
              {counts[5]} accounts are currently suspended.
            </div>
            <Link href="/admin/accounts" className="button secondary">
              Manage account access
            </Link>
          </section>
        </div>
      </>
    );
  }
  const brandId = brand ? (await ownedBrand()).brandId : undefined;
  const own = await record(
    brand ? "brands" : "creator_profiles",
    brandId || profile.id,
  );
  const score = own
    ? completeness(
        own,
        brand
          ? [
              "name",
              "description",
              "industry",
              "location",
              "website",
              "logo_path",
            ]
          : [
              "display_name",
              "headline",
              "bio",
              "location",
              "niches",
              "platforms",
              "avatar_path",
            ],
      )
    : 0;
  const saved = await count(brand ? "saved_creators" : "saved_opportunities", {
    user_id: profile.id,
  });
  const live = await count("opportunities", {
    status: "LIVE",
    ...(brandId ? { brand_id: brandId } : {}),
  });
  const pending = brand
    ? await count("opportunities", { status: "PENDING", brand_id: brandId! })
    : await count("creator_campaigns", {
        creator_id: profile.id,
        status: "ACTIVE",
      });
  const { data: recent } = await client
    .from(brand ? "creator_profiles" : "opportunities")
    .select("*")
    .eq(brand ? "availability" : "status", brand ? "Available" : "LIVE")
    .order("created_at", { ascending: false })
    .limit(3);
  const brands = brand ? [] : await rows("brands", {}, 1000);
  return (
    <>
      <PageHeading
        eyebrow={
          brand
            ? "YOUR BRAND, YOUR NEXT CHAPTER"
            : "YOUR CREATIVE CAREER, IN MOTION"
        }
        title={
          brand
            ? "Home"
            : `Welcome back, ${profile.display_name.split(" ")[0]}.`
        }
        description={
          brand
            ? "Your next creative partnership is waiting. Let’s make something meaningful."
            : "A little inspiration. A new connection. Your next opportunity is here."
        }
      >
        <Link
          href={brand ? "/brand/opportunities/new" : "/opportunities"}
          className="button"
        >
          {brand ? "Create opportunity" : "Explore opportunities"}
          <ArrowUpRight size={16} />
        </Link>
      </PageHeading>
      <CreatorSpotlight />
      <div className="metrics">
        <Metric
          label={brand ? "Live opportunities" : "Open opportunities"}
          value={live}
          icon={<BriefcaseBusiness size={18} />}
        />
        <Metric
          label={brand ? "Saved creators" : "Saved opportunities"}
          value={saved}
          icon={<Bookmark size={18} />}
        />
        <Metric
          label={brand ? "Pending approval" : "Active campaigns"}
          value={pending}
          icon={<Clock3 size={18} />}
        />
        <Metric
          label="Profile complete"
          value={`${score}%`}
          icon={<Users size={18} />}
        />
      </div>
      <section className="card welcome" style={{ margin: "26px 0 32px" }}>
        <div>
          <Badge tone="purple">A LITTLE STEP. A BIG POSSIBILITY.</Badge>
          <h2 style={{ marginTop: 13 }}>
            {score === 100
              ? "Your next great collaboration starts with a hello."
              : "Make a first impression that feels like you."}
          </h2>
          <p>
            {brand
              ? "A thoughtful company profile helps creators see where they fit in your story."
              : "Your voice, your style, your perspective. Help brands discover what makes you different."}
          </p>
          <Link href={brand ? "/brand/profile" : "/profile"} className="button">
            {score === 100 ? "Review your profile" : "Complete your profile"}
            <ArrowUpRight size={14} />
          </Link>
        </div>
        <div aria-hidden="true" className="welcome-art">
          her.
        </div>
      </section>
      <div className="section-head">
        <div>
          <h2>
            {brand
              ? "Meet your next creative partners"
              : "Opportunities worth a look"}
          </h2>
          <p style={{ fontSize: 12, marginTop: 5 }}>
            {brand
              ? "Creators open to their next collaboration."
              : "Fresh briefs from brands in your community."}
          </p>
        </div>
        <Link href={brand ? "/creators" : "/opportunities"}>View all →</Link>
      </div>
      {recent?.length ? (
        <div className="grid">
          {(recent as RecordRow[]).map((row) =>
            brand ? (
              <CreatorCard row={row} key={row.id} role={profile.role} />
            ) : (
              <OpportunityCard
                row={row}
                brand={brands.find((b) => b.id === row.brand_id)}
                key={row.id}
                role={profile.role}
              />
            ),
          )}
        </div>
      ) : (
        <Empty
          title="Your community is growing"
          description="New creators and opportunities will appear here as the academy welcomes members."
        />
      )}
    </>
  );
}
export async function Analytics() {
  const { client, profile } = await requireUser(["CREATOR"]);
  const accounts = await rows("social_accounts", { creator_id: profile.id });
  const { data, error } = accounts.length
    ? await client
        .from("social_metric_snapshots")
        .select("*")
        .in(
          "social_account_id",
          accounts.map((a) => a.id),
        )
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [], error: null };
  if (error) throw new Error("Analytics unavailable");
  const snapshots = (data || []) as RecordRow[];
  const latest = accounts
    .map((a) => snapshots.find((s) => s.social_account_id === a.id))
    .filter(Boolean) as RecordRow[];
  const total = (key: string) =>
    latest.reduce((sum, s) => sum + Number(s[key] || 0), 0);
  return (
    <>
      <PageHeading
        eyebrow="YOUR CREATIVE IMPACT"
        title="Every story makes an impression."
        description="A clear view of your social performance, built from your own reported metrics."
      >
        <Link href="/analytics/new" className="button">
          <Sparkles size={16} />
          Add snapshot
        </Link>
      </PageHeading>
      <div className="notice" style={{ marginBottom: 24 }}>
        Self-reported analytics · No API synchronization is active. Counts sum
        the latest snapshot per account and may include overlapping audiences.
      </div>
      <div className="metrics">
        <Metric
          icon={<Users size={18} />}
          label="Followers across accounts"
          value={compact(total("followers"))}
        />
        <Metric
          icon={<Eye size={18} />}
          label="Total views across accounts"
          value={compact(total("total_views"))}
        />
        <Metric
          icon={<Building2 size={18} />}
          label="Social accounts"
          value={accounts.length}
        />
        <Metric
          icon={<Clock3 size={18} />}
          label="Recorded snapshots"
          value={snapshots.length}
        />
      </div>
      <div className="grid two" style={{ marginTop: 24 }}>
        {accounts.map((account) => {
          const history = snapshots
            .filter((s) => s.social_account_id === account.id)
            .slice(0, 8)
            .reverse();
          const max = Math.max(1, ...history.map((h) => Number(h.followers)));
          return (
            <section className="card stack" key={account.id}>
              <div className="section-head">
                <div>
                  <h3>{account.platform}</h3>
                  <small>@{account.username}</small>
                </div>
                <Badge>SELF REPORTED</Badge>
              </div>
              {history.length ? (
                <>
                  <div
                    className="chart"
                    role="img"
                    aria-label={`${account.platform} reported follower history`}
                  >
                    {history.map((h) => (
                      <div key={h.id} className="chart-column">
                        <small>{compact(h.followers)}</small>
                        <div
                          className="chart-bar"
                          style={{
                            height: `${(Number(h.followers) / max) * 100}%`,
                          }}
                        />
                        <small>{dateLabel(h.created_at).split(",")[0]}</small>
                      </div>
                    ))}
                  </div>
                  <div className="table-scroll">
                    <table>
                      <caption className="sr-only">
                        Reported metrics for {account.platform}
                      </caption>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Followers</th>
                          <th>Avg views</th>
                          <th>Engagement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h) => (
                          <tr key={h.id}>
                            <td>{dateLabel(h.created_at)}</td>
                            <td>{compact(h.followers)}</td>
                            <td>{compact(h.average_views)}</td>
                            <td>{h.engagement_rate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p>
                  No snapshots yet. Add a snapshot to start tracking your
                  progress.
                </p>
              )}
            </section>
          );
        })}
      </div>
      {!accounts.length && (
        <div style={{ marginTop: 24 }}>
          <Empty
            title="Start with your social profiles"
            description="Add a social account, then record your first performance snapshot."
            href="/socials/new"
            label="Add social account"
          />
        </div>
      )}
    </>
  );
}
