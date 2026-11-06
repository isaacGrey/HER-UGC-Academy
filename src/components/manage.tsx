import Link from "next/link";
import { OpportunityPhotos } from "./opportunity-photos";
import { Plus, ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser, ownedBrand } from "@/lib/auth";
import { rows, record } from "@/lib/data";
import { entities } from "@/lib/entities";
import {
  saveEntity,
  deleteEntity,
  submitOpportunity,
  saveContact,
} from "@/lib/actions";
import { Form, ActionButton, UploadForm } from "./forms";
import { PageHeading, Empty, Badge, Status, dateLabel, currency } from "./ui";
export async function Editor({ table, id }: { table: string; id?: string }) {
  const { profile } = await requireUser();
  const config = entities[table];
  if (!config) notFound();
  const value = id ? await record(table, id) : null;
  if (id && !value) notFound();
  if (profile.role !== "ADMIN") {
    if (table === "brands" && id !== (await ownedBrand()).brandId) notFound();
    if (table === "creator_profiles" && id !== profile.id) notFound();
    if (
      config.owner === "creator_id" &&
      value &&
      value.creator_id !== profile.id
    )
      notFound();
    if (
      table === "opportunities" &&
      value &&
      (value.brand_id !== (await ownedBrand()).brandId ||
        !["DRAFT", "REJECTED"].includes(String(value.status)))
    )
      notFound();
  }
  let fields = config.fields;
  if (table === "social_metric_snapshots") {
    const accounts = await rows(
      "social_accounts",
      profile.role === "ADMIN" ? {} : { creator_id: profile.id },
    );
    if (!accounts.length)
      return (
        <Empty
          title="Connect a social profile first"
          description="Add a manual account before recording your performance."
          href="/socials/new"
          label="Add social account"
        />
      );
    fields = fields.map((f) =>
      f.name === "social_account_id"
        ? {
            ...f,
            options: accounts.map(
              (a) => `${a.id}|${a.platform} · ${a.username}`,
            ),
          }
        : f,
    );
  }
  return (
    <>
      <PageHeading
        eyebrow="YOUR WORKSPACE"
        title={
          id
            ? `Edit ${config.singular.toLowerCase()}`
            : `Add ${config.singular.toLowerCase()}`
        }
        description={config.description}
      />
      <div className="card">
        <Form
          action={saveEntity.bind(null, table, id)}
          fields={fields}
          values={
            value || {
              currency: "USD",
              compensation_type: "PAID",
              campaign_type: "UGC",
              external_platform: "SideShift",
              availability: "Available",
            }
          }
        />
      </div>
      {table === "opportunities" && id && (
        <section className="card stack" style={{ marginTop: 24 }}>
          <h2>Opportunity photos</h2>
          <p>
            Add a cover for the opportunity card and up to three additional
            photos. Uploading to a slot replaces its photo.
          </p>
          <OpportunityPhotos row={value!} />
          <div className="grid two">
            {[0, 1, 2, 3].map((slot) => (
              <UploadForm
                key={slot}
                bucket="opportunity-images"
                recordId={id}
                slot={slot}
              />
            ))}
          </div>
        </section>
      )}
      {table === "opportunities" && !id && (
        <p className="notice">
          Save your opportunity, then open Edit to add its cover and up to three
          photos.
        </p>
      )}
      {table === "portfolio_items" && id && (
        <div className="card" style={{ marginTop: 24 }}>
          <UploadForm bucket="portfolio-images" recordId={id} />
        </div>
      )}
    </>
  );
}
export async function ProfileEditor({ brand = false }: { brand?: boolean }) {
  const { profile } = await requireUser(brand ? ["BRAND"] : ["CREATOR"]);
  const id = brand ? (await ownedBrand()).brandId : profile.id;
  const table = brand ? "brands" : "creator_profiles";
  const [value, contact] = await Promise.all([
    record(table, id),
    record(brand ? "brand_contacts" : "creator_contacts", id),
  ]);
  if (!value) notFound();
  return (
    <>
      <PageHeading
        eyebrow={
          brand ? "MAKE YOUR INTRODUCTION" : "MADE FOR YOUR NEXT CHAPTER"
        }
        title={entities[table].title}
        description={entities[table].description}
      >
        <Link
          className="button secondary"
          href={`/${brand ? "brands" : "creators"}/${id}`}
        >
          View profile <ArrowUpRight size={15} />
        </Link>
      </PageHeading>
      <div className="detail-grid">
        <div className="card">
          <Form
            action={saveEntity.bind(null, table, id)}
            fields={entities[table].fields}
            values={value}
          />
        </div>
        <aside className="stack" style={{ alignSelf: "start" }}>
          <div className="card">
            <UploadForm
              bucket={brand ? "brand-logos" : "avatars"}
              recordId={id}
            />
          </div>
          <div className="card stack">
            <h3>Contact details</h3>
            <p style={{ fontSize: 12 }}>
              Your email is visible to authorized community members. Creator
              contact details are shared with brands and administrators.
            </p>
            <Form
              action={saveContact.bind(null, brand ? "brand" : "creator")}
              fields={[
                ...(brand
                  ? [
                      { name: "contact_name", label: "Contact name" },
                      { name: "contact_title", label: "Job title" },
                    ]
                  : []),
                {
                  name: "contact_email",
                  label: "Business email",
                  type: "email",
                  required: true,
                },
              ]}
              values={contact || {}}
              submit="Save contact"
            />
          </div>
        </aside>
      </div>
    </>
  );
}
export async function ManageList({
  table,
  base,
}: {
  table: string;
  base: string;
}) {
  const { profile } = await requireUser();
  const config = entities[table];
  if (!config) notFound();
  const filters: Record<string, string> =
    config.owner === "creator_id"
      ? { creator_id: profile.id }
      : config.owner === "brand_id"
        ? { brand_id: (await ownedBrand()).brandId }
        : {};
  const items = await rows(table, filters);
  return (
    <>
      <PageHeading
        eyebrow="YOUR WORKSPACE"
        title={config.title}
        description={config.description}
      >
        <Link className="button" href={`${base}/new`}>
          <Plus size={16} />
          Add {config.singular.toLowerCase()}
        </Link>
      </PageHeading>
      {table === "social_accounts" && (
        <div className="notice" style={{ marginBottom: 24 }}>
          TikTok, Instagram, and YouTube use manual mode. OAuth is unavailable
          until the corresponding API adapter and approvals are configured.
        </div>
      )}
      {table === "creator_earnings" && (
        <div className="notice" style={{ marginBottom: 24 }}>
          YouTube entries are platform revenue. Other sources are campaign
          earnings. These records are self reported and do not trigger payments.
        </div>
      )}
      {items.length ? (
        <div className="record-list">
          {items.map((item) => (
            <article className="card" key={item.id}>
              <div className="spread">
                <div>
                  <h3>
                    {item.title ||
                      item.name ||
                      item.username ||
                      item.campaign_name ||
                      item.source ||
                      "Record"}
                  </h3>
                  <p style={{ marginTop: 7, fontSize: 12 }}>
                    {String(
                      item.description ||
                        item.summary ||
                        item.profile_url ||
                        item.brand_name ||
                        "",
                    ).slice(0, 200)}
                  </p>
                  <div className="tags">
                    {item.status && <Status value={String(item.status)} />}{" "}
                    {table === "social_accounts" && <Badge>MANUAL</Badge>}
                    {table === "creator_earnings" && (
                      <Badge>SELF REPORTED</Badge>
                    )}
                    {item.platform && (
                      <Badge tone="purple">{item.platform}</Badge>
                    )}
                    <small>{dateLabel(item.created_at)}</small>
                    {item.amount !== undefined && (
                      <strong>
                        {currency(item.amount, String(item.currency))}
                      </strong>
                    )}
                  </div>
                  {item.rejection_reason && (
                    <p className="notice error">
                      Review feedback: {item.rejection_reason}
                    </p>
                  )}
                </div>
                <div className="row">
                  {table !== "opportunities" ||
                  ["DRAFT", "REJECTED"].includes(String(item.status)) ? (
                    <Link
                      className="button secondary small"
                      href={`${base}/${item.id}/edit`}
                    >
                      Edit
                    </Link>
                  ) : (
                    <Link
                      className="button secondary small"
                      href={`/opportunities/${item.id}`}
                    >
                      View
                    </Link>
                  )}
                  {table === "opportunities" &&
                    ["DRAFT", "REJECTED"].includes(String(item.status)) && (
                      <ActionButton
                        action={submitOpportunity.bind(null, item.id)}
                        label="Submit for review"
                      />
                    )}
                  {[
                    "portfolio_items",
                    "social_accounts",
                    "creator_campaigns",
                    "creator_earnings",
                  ].includes(table) && (
                    <ActionButton
                      action={deleteEntity.bind(null, table, item.id)}
                      label="Delete"
                      danger
                      confirm="Delete this record permanently? Related history may also be removed. This cannot be undone."
                    />
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title={`Make room for your first ${config.singular.toLowerCase()}`}
          description={config.description}
          href={`${base}/new`}
          label={`Add ${config.singular.toLowerCase()}`}
        />
      )}
    </>
  );
}
