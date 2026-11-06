import NavigationForm from "next/form";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { rows, param, type SearchParams } from "@/lib/data";
import { niches, platforms } from "@/lib/constants";
import type { RecordRow } from "@/lib/types";
import { CreatorCard, OpportunityCard, BrandCard } from "./cards";
import { Empty, PageHeading } from "./ui";
const PAGE = 12;
export async function Discovery({
  kind,
  params,
  savedOnly = false,
}: {
  kind: "creators" | "brands" | "opportunities";
  params: SearchParams;
  savedOnly?: boolean;
}) {
  const { client, profile } = await requireUser();
  const table = {
    creators: "creator_discovery",
    brands: "brands",
    opportunities: "opportunities",
  }[kind];
  const page = Math.max(1, Math.min(1000, Number(param(params, "page")) || 1));
  let query = client.from(table).select("*", { count: "exact" });
  const q = param(params, "q")
    .replace(/[%_,()]/g, " ")
    .trim()
    .slice(0, 100);
  const nameColumn = {
    creators: "display_name",
    brands: "name",
    opportunities: "title",
  }[kind];
  if (q) query = query.ilike(nameColumn, `%${q}%`);
  if (kind === "opportunities") query = query.eq("status", "LIVE");
  if (param(params, "niche") && kind !== "brands")
    query = query.contains("niches", [param(params, "niche")]);
  if (param(params, "platform") && kind !== "brands")
    query = query.contains("platforms", [param(params, "platform")]);
  if (param(params, "location"))
    query = query.ilike(
      "location",
      `%${param(params, "location").replace(/[%_]/g, "").slice(0, 80)}%`,
    );
  if (param(params, "verified") === "true" && kind !== "opportunities")
    query = query.eq("verified", true);
  if (param(params, "industry") && kind === "brands")
    query = query.eq("industry", param(params, "industry"));
  if (kind === "creators" && param(params, "availability"))
    query = query.eq("availability", param(params, "availability"));
  if (kind === "creators" && param(params, "language"))
    query = query.contains("languages", [param(params, "language")]);
  if (kind === "creators") {
    for (const [filter, column] of [
      ["minFollowers", "followers"],
      ["minViews", "average_views"],
      ["minTotalViews", "total_views"],
      ["minEngagement", "engagement_rate"],
    ] as const)
      if (param(params, filter))
        query = query.gte(
          column,
          Math.max(0, Number(param(params, filter)) || 0),
        );
    if (param(params, "maxFollowers"))
      query = query.lte(
        "followers",
        Math.max(0, Number(param(params, "maxFollowers")) || 0),
      );
    if (param(params, "academy"))
      query = query.eq("academy_status", param(params, "academy"));
  }
  if (kind === "opportunities") {
    if (param(params, "min"))
      query = query.gte(
        "compensation_max",
        Math.max(0, Number(param(params, "min")) || 0),
      );
    if (param(params, "max"))
      query = query.lte(
        "compensation_min",
        Math.max(0, Number(param(params, "max")) || 0),
      );
    if (param(params, "remote")) query = query.eq("remote", true);
    if (param(params, "campaign_type"))
      query = query.eq("campaign_type", param(params, "campaign_type"));
    if (param(params, "brand"))
      query = query.eq("brand_id", param(params, "brand"));
    if (param(params, "days"))
      query = query.gte(
        "created_at",
        new Date(
          Date.now() -
            Math.min(365, Math.max(1, Number(param(params, "days")) || 30)) *
              86400000,
        ).toISOString(),
      );
  }
  const canSave =
    kind === "creators" ? profile.role === "BRAND" : profile.role === "CREATOR";
  const savedTable = {
    creators: "saved_creators",
    brands: "saved_brands",
    opportunities: "saved_opportunities",
  }[kind];
  const savedKey = {
    creators: "creator_id",
    brands: "brand_id",
    opportunities: "opportunity_id",
  }[kind];
  const saves = canSave
    ? await rows(savedTable, { user_id: profile.id }, 1000)
    : [];
  const savedIds = saves.map((r) => String(r[savedKey]));
  if (savedOnly)
    query = query.in(
      "id",
      savedIds.length ? savedIds : ["00000000-0000-0000-0000-000000000000"],
    );
  const sort = param(params, "sort");
  if (sort === "name") query = query.order(nameColumn);
  else if (
    kind === "creators" &&
    [
      "average_views",
      "total_views",
      "engagement_rate",
      "last_snapshot_at",
    ].includes(sort)
  )
    query = query.order(sort, { ascending: false, nullsFirst: false });
  else if (kind === "opportunities" && sort === "high")
    query = query.order("compensation_max", { ascending: false });
  else if (kind === "opportunities" && sort === "low")
    query = query.order("compensation_min");
  else if (kind === "opportunities" && sort === "featured")
    query = query
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });
  else query = query.order("created_at", { ascending: false });
  const { data, error, count } = await query.range(
    (page - 1) * PAGE,
    page * PAGE - 1,
  );
  if (error) throw new Error("Discovery could not be loaded");
  const items = (data || []) as RecordRow[];
  const brands = kind === "opportunities" ? await rows("brands", {}, 1000) : [];
  const brandOpportunities =
    kind === "brands" && items.length
      ? await client
          .from("opportunities")
          .select("brand_id")
          .eq("status", "LIVE")
          .in(
            "brand_id",
            items.map((r) => r.id),
          )
      : null;
  const label =
    kind === "creators"
      ? "Discover"
      : kind === "opportunities"
        ? "Explore"
        : "Brands";
  const select = (name: string, label: string, options: string[]) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} defaultValue={param(params, name)}>
        <option value="">All {label.toLowerCase()}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
  const pageHref = (n: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params))
      if (typeof v === "string") p.set(k, v);
    p.set("page", String(n));
    return `?${p}`;
  };
  return (
    <>
      <PageHeading
        eyebrow=""
        title={savedOnly ? `Your saved ${kind}` : label}
        description={
          kind === "creators"
            ? "Discover academy creators with a distinct voice, thoughtful content, and the skills to bring your brand to life."
            : kind === "brands"
              ? "Find thoughtful companies, explore their stories, and discover your next collaboration."
              : "Thoughtful brands. Meaningful collaborations. Discover a brief that feels like you."
        }
      />
      <NavigationForm action="" className="searchbar">
        <div className="search-wrap">
          <Search size={18} />
          <input
            className="search-input"
            name="q"
            aria-label={`Search ${kind}`}
            placeholder={`Search ${kind} by name…`}
            defaultValue={param(params, "q")}
          />
        </div>
        {Object.entries(params)
          .filter(
            ([k, v]) => k !== "q" && k !== "page" && typeof v === "string",
          )
          .map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={String(v)} />
          ))}
        <button className="button">Search</button>
      </NavigationForm>
      <div className={"discovery-layout reference-discovery " + kind}>
        <details className="card filter-card reference-filters">
          <summary>Filters & sorting</summary>
          <h3 className="row">
            <SlidersHorizontal size={16} />
            Refine your search
          </h3>
          <details className="filter-mobile">
            <summary>Filters & sorting</summary>
          </details>
          <NavigationForm action="">
            <input type="hidden" name="q" value={param(params, "q")} />
            {kind !== "brands" && select("niche", "Niches", niches)}
            {kind !== "brands" && select("platform", "Platforms", platforms)}
            {kind === "brands" && select("industry", "Industries", niches)}
            <div className="field">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                placeholder="City or country"
                defaultValue={param(params, "location")}
              />
            </div>
            {kind === "creators" && (
              <>
                {select("availability", "Availability", [
                  "Available",
                  "Limited availability",
                  "Unavailable",
                ])}
                <div className="field">
                  <label htmlFor="language">Language</label>
                  <input
                    id="language"
                    name="language"
                    defaultValue={param(params, "language")}
                    placeholder="e.g. English"
                  />
                </div>
                {select("academy", "Academy status", [
                  "Graduate",
                  "Student",
                  "Alumni",
                ])}
                {[
                  ["minFollowers", "Minimum followers"],
                  ["maxFollowers", "Maximum followers"],
                  ["minViews", "Minimum average views"],
                  ["minTotalViews", "Minimum total views"],
                  ["minEngagement", "Minimum engagement (%)"],
                ].map(([name, label]) => (
                  <div className="field" key={name}>
                    <label htmlFor={name}>{label}</label>
                    <input
                      id={name}
                      name={name}
                      type="number"
                      min="0"
                      step="any"
                      defaultValue={param(params, name)}
                    />
                  </div>
                ))}
              </>
            )}
            {kind !== "opportunities" && (
              <div className="field">
                <label className="row">
                  <input
                    type="checkbox"
                    name="verified"
                    value="true"
                    defaultChecked={param(params, "verified") === "true"}
                  />
                  HER verified only
                </label>
              </div>
            )}
            {kind === "opportunities" && (
              <>
                <div className="field">
                  <label htmlFor="min">Minimum budget</label>
                  <input
                    id="min"
                    name="min"
                    type="number"
                    min="0"
                    defaultValue={param(params, "min")}
                  />
                </div>
                <div className="field">
                  <label htmlFor="max">Maximum budget</label>
                  <input
                    id="max"
                    name="max"
                    type="number"
                    min="0"
                    defaultValue={param(params, "max")}
                  />
                </div>
                {select("campaign_type", "Campaign types", [
                  "UGC",
                  "Ambassador",
                  "Product review",
                  "Sponsored content",
                ])}
                <div className="field">
                  <label htmlFor="brand">Brand</label>
                  <select
                    id="brand"
                    name="brand"
                    defaultValue={param(params, "brand")}
                  >
                    <option value="">All brands</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="days">Date posted</label>
                  <select
                    id="days"
                    name="days"
                    defaultValue={param(params, "days")}
                  >
                    <option value="">Any time</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </select>
                </div>
                <div className="field">
                  <label className="row">
                    <input
                      type="checkbox"
                      name="remote"
                      value="true"
                      defaultChecked={Boolean(param(params, "remote"))}
                    />
                    Remote / worldwide
                  </label>
                </div>
              </>
            )}
            <div className="field">
              <label htmlFor="sort">Sort by</label>
              <select name="sort" id="sort" defaultValue={sort || "newest"}>
                <option value="newest">Newest first</option>
                <option value="name">Alphabetical</option>
                {kind === "creators" && (
                  <>
                    <option value="average_views">Highest average views</option>
                    <option value="total_views">Highest total views</option>
                    <option value="engagement_rate">Highest engagement</option>
                    <option value="last_snapshot_at">
                      Latest metrics update
                    </option>
                  </>
                )}
                {kind === "opportunities" && (
                  <>
                    <option value="high">Budget: high to low</option>
                    <option value="low">Budget: low to high</option>
                    <option value="featured">Featured first</option>
                  </>
                )}
              </select>
            </div>
            <button className="button">Apply filters</button>
            <Link href="?" className="button secondary">
              Clear filters
            </Link>
          </NavigationForm>
        </details>
        <section>
          <div className="toolbar">
            <span>
              <strong>{count || 0}</strong> {kind}{" "}
              {savedOnly ? "saved" : "in the community"}
            </span>
            <span>Curated by Her UGC Academy</span>
          </div>
          {items.length ? (
            <div className={`grid ${"opportunity-grid"}`}>
              {items.map((row) =>
                kind === "creators" ? (
                  <CreatorCard
                    key={row.id}
                    row={row}
                    metric={
                      Number(row.metric_account_count) > 0 ? row : undefined
                    }
                    saved={savedIds.includes(row.id)}
                    role={profile.role}
                  />
                ) : kind === "brands" ? (
                  <BrandCard
                    key={row.id}
                    row={row}
                    saved={savedIds.includes(row.id)}
                    role={profile.role}
                    count={
                      brandOpportunities?.data?.filter(
                        (o) => o.brand_id === row.id,
                      ).length || 0
                    }
                  />
                ) : (
                  <OpportunityCard
                    key={row.id}
                    row={row}
                    brand={brands.find((b) => b.id === row.brand_id)}
                    saved={savedIds.includes(row.id)}
                    role={profile.role}
                  />
                ),
              )}
            </div>
          ) : (
            <Empty
              title={
                savedOnly
                  ? "Your collection starts here"
                  : "No matches just yet"
              }
              description={
                savedOnly
                  ? `Explore ${kind} and save the ones you love.`
                  : "Try broadening your filters or check back for new additions."
              }
              href={`/${kind}`}
              label={`Browse ${kind}`}
            />
          )}
          <div className="pagination">
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="button secondary small"
              >
                Previous
              </Link>
            )}
            <span>
              Page {page} of {Math.max(1, Math.ceil((count || 0) / PAGE))}
            </span>
            {page * PAGE < (count || 0) && (
              <Link
                className="button secondary small"
                href={pageHref(page + 1)}
              >
                Next
              </Link>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
