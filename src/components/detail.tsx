import { CreatorProfile } from "./creator-profile";
import Link from "next/link";
import { OpportunityPhotos } from "./opportunity-photos";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowUpRight, Eye, Heart, MapPin } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { record, rows, signedImage, stringValue, listValue } from "@/lib/data";
import type { RecordRow } from "@/lib/types";
import {
  Avatar,
  Badge,
  Verified,
  PageHeading,
  Empty,
  compact,
  currency,
  dateLabel,
} from "./ui";
import { SaveButton } from "./forms";
import { OpportunityCard } from "./cards";
export async function PortfolioGrid({ items }: { items: RecordRow[] }) {
  if (!items.length)
    return (
      <Empty
        title="A portfolio in the making"
        description="Work will appear here as this creator adds portfolio pieces."
      />
    );
  return (
    <div className="grid two">
      {await Promise.all(
        items.map(async (item) => (
          <article className="card" key={item.id}>
            {item.image_path ? (
              <div className="portfolio-image">
                <Image
                  src={
                    (await signedImage("portfolio-images", item.image_path))!
                  }
                  fill
                  unoptimized
                  alt={stringValue(item, "title")}
                  sizes="400px"
                />
              </div>
            ) : (
              <div className="notice" style={{ marginBottom: 16 }}>
                <Badge>{item.platform || "Portfolio"}</Badge>
                <p style={{ marginTop: 12 }}>
                  Original creator work · external portfolio
                </p>
              </div>
            )}
            <h3>{item.title}</h3>
            <p style={{ fontSize: 12, marginTop: 8 }}>{item.description}</p>
            <div className="row" style={{ margin: "14px 0" }}>
              <small className="row">
                <Eye size={13} />
                {compact(item.views)} views
              </small>
              <small className="row">
                <Heart size={13} />
                {compact(item.likes)} likes
              </small>
              <Badge>SELF REPORTED</Badge>
            </div>
            {item.url && (
              <a
                href={String(item.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="button secondary small"
              >
                View original <ArrowUpRight size={13} />
              </a>
            )}
          </article>
        )),
      )}
    </div>
  );
}
export async function Detail({
  kind,
  id,
  standalone = false,
}: {
  kind: "creators" | "brands" | "opportunities";
  id: string;
  standalone?: boolean;
}) {
  const { client, profile } = await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const item = await record(
    kind === "creators" ? "creator_profiles" : kind,
    id,
  );
  if (!item) notFound();
  const event =
    kind === "creators"
      ? "PROFILE_VIEWED"
      : kind === "brands"
        ? "BRAND_VIEWED"
        : "OPPORTUNITY_VIEWED";
  await client
    .from("analytics_events")
    .insert({ user_id: profile.id, event, entity_id: id });
  const singular =
    kind === "creators"
      ? "creator"
      : kind === "brands"
        ? "brand"
        : "opportunity";
  const canSave =
    kind === "creators" ? profile.role === "BRAND" : profile.role === "CREATOR";
  const saves = canSave
    ? await rows(`saved_${kind}`, {
        user_id: profile.id,
        [`${singular}_id`]: id,
      })
    : [];
  if (kind === "opportunities") {
    const brand = await record("brands", String(item.brand_id));
    return (
      <>
        <Link href="/opportunities" className="link">
          ← All opportunities
        </Link>
        <div style={{ height: 24 }} />
        <PageHeading
          eyebrow={String(brand?.name || "CREATOR OPPORTUNITY")}
          title={String(item.title)}
          description={String(item.summary)}
        >
          {canSave && (
            <SaveButton kind="opportunity" id={id} saved={saves.length > 0} />
          )}
        </PageHeading>
        <div className="detail-grid">
          <div className="stack">
            <section className="card stack">
              <div className="tags">
                {listValue(item, "platforms").map((p) => (
                  <Badge tone="purple" key={p}>
                    {p}
                  </Badge>
                ))}
                {listValue(item, "niches").map((n) => (
                  <Badge key={n}>{n}</Badge>
                ))}
              </div>
              <OpportunityPhotos row={item} />
              <h2>The opportunity</h2>
              <p className="prose">{item.description}</p>
              {[
                ["content_requirements", "What you’ll create"],
                ["creator_requirements", "Who we’re looking for"],
                ["deliverables", "Deliverables"],
              ].map(
                ([key, label]) =>
                  item[key] && (
                    <div key={key}>
                      <h3>{label}</h3>
                      <p className="prose" style={{ marginTop: 12 }}>
                        {item[key]}
                      </p>
                    </div>
                  ),
              )}
            </section>
            {brand && (
              <section className="card">
                <div className="row">
                  <Avatar
                    brand
                    name={String(brand.name)}
                    src={await signedImage("brand-logos", brand.logo_path)}
                  />
                  <div>
                    <h3>{brand.name}</h3>
                    {brand.verified && <Verified />}
                  </div>
                </div>
                <p style={{ margin: "20px 0" }}>{brand.description}</p>
                <Link href={`/brands/${brand.id}`} className="link">
                  Meet the brand →
                </Link>
              </section>
            )}
          </div>
          <aside className="stack" style={{ alignSelf: "start" }}>
            <div className="card stack">
              <div>
                <small>COLLABORATION BUDGET</small>
                <div className="compensation">
                  {currency(item.compensation_min, String(item.currency))} –{" "}
                  {currency(item.compensation_max, String(item.currency))}
                </div>
                <Badge tone="green">{item.compensation_type}</Badge>
              </div>
              <hr style={{ margin: 0 }} />
              <span className="location">
                <MapPin size={15} />
                {item.remote ? "Remote · " : ""}
                {item.location}
              </span>
              <div>
                <small>Apply before</small>
                <h3>
                  {item.deadline
                    ? dateLabel(item.deadline)
                    : "Until the opportunity closes"}
                </h3>
              </div>
              {item.status === "LIVE" && profile.role === "CREATOR" ? (
                <a
                  href={`/api/opportunities/${id}/apply`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button"
                  style={{ width: "100%" }}
                >
                  Apply on {item.external_platform}
                  <ArrowUpRight size={15} />
                </a>
              ) : (
                <p className="notice">
                  External applications are available to creators on live
                  opportunities.
                </p>
              )}
              <small>
                Applications, contracts, and payments are handled by the
                external platform.
              </small>
            </div>
          </aside>
        </div>
      </>
    );
  }
  if (kind === "brands") {
    const opportunities = await rows("opportunities", {
      brand_id: id,
      status: "LIVE",
    });
    const contacts = await record("brand_contacts", id);
    return (
      <>
        <Link href="/brands" className="link">
          ← All brands
        </Link>
        <section className="card stack" style={{ margin: "24px 0" }}>
          <div className="spread">
            <div className="row">
              <Avatar
                large
                brand
                name={String(item.name)}
                src={await signedImage("brand-logos", item.logo_path)}
              />
              <div>
                <h1>{item.name}</h1>
                <div className="tags">
                  <Badge>{item.industry}</Badge>
                  {item.verified && <Verified />}
                </div>
                <span className="location">
                  <MapPin size={14} />
                  {item.location || "Global"}
                </span>
              </div>
            </div>
            {canSave && (
              <SaveButton kind="brand" id={id} saved={saves.length > 0} />
            )}
          </div>
          <p className="prose">{item.description}</p>
          <div className="row">
            {item.website && (
              <a
                className="button secondary"
                href={String(item.website)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit website <ArrowUpRight size={14} />
              </a>
            )}
            {contacts?.contact_email && (
              <a className="button" href={`mailto:${contacts.contact_email}`}>
                Contact {contacts.contact_name || "the brand"}
              </a>
            )}
          </div>
        </section>
        <div className="section-head">
          <h2>Open opportunities</h2>
          <Badge>{opportunities.length} OPEN</Badge>
        </div>
        {opportunities.length ? (
          <div className="grid">
            {opportunities.map((o) => (
              <OpportunityCard
                row={o}
                brand={item}
                role={profile.role}
                key={o.id}
              />
            ))}
          </div>
        ) : (
          <Empty
            title="Something good is on the horizon"
            description="This brand has no open opportunities right now. Save it to find it again later."
          />
        )}
      </>
    );
  }
  const [portfolio, accounts, contacts] = await Promise.all([
    rows("portfolio_items", { creator_id: id }),
    rows("social_accounts", { creator_id: id }),
    record("creator_contacts", id),
  ]);
  const { data: metrics } = accounts.length
    ? await client
        .from("social_metric_snapshots")
        .select("*")
        .in(
          "social_account_id",
          accounts.map((a) => a.id),
        )
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] };
  const latest = metrics?.[0];
  return (
    <CreatorProfile
      item={item}
      accounts={accounts}
      contacts={contacts}
      latest={latest}
      canSave={canSave}
      saved={saves.length > 0}
      standalone={standalone}
    >
      <PortfolioGrid
        items={portfolio.sort(
          (a, b) => Number(a.display_order) - Number(b.display_order),
        )}
      />
    </CreatorProfile>
  );
}
