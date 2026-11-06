import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge, Avatar, compact } from "./ui";
import { signedImage, listValue } from "@/lib/data";
import type { RecordRow } from "@/lib/types";
import { ProfilePanel } from "./profile-panel";
export async function CreatorProfile({
  item,
  accounts,
  latest,
  contacts,
  children,
  standalone = false,
}: {
  item: RecordRow;
  accounts: RecordRow[];
  latest?: Record<string, unknown>;
  contacts: RecordRow | null;
  canSave: boolean;
  saved: boolean;
  children: React.ReactNode;
  standalone?: boolean;
}) {
  const name = String(item.display_name);
  const photo = await signedImage("avatars", item.avatar_path);
  const content = (
    <div className="reference-profile">
      <div className="reference-profile-heading">
        <Avatar large name={name} src={photo} />
        <div>
          <h1>{name}</h1>
          <p>{item.location || "Location not provided"}</p>
          <div className="tags">
            {listValue(item, "niches").map((n) => (
              <Badge key={n}>{n}</Badge>
            ))}
          </div>
          <p className="creator-availability">
            {item.availability || "Availability not provided"}
          </p>
          <div className="row">
            {accounts.map((a) => (
              <a
                key={a.id}
                className="icon-button"
                href={String(a.profile_url)}
                target="_blank"
                rel="noopener noreferrer"
                title={String(a.platform)}
                aria-label={"Open " + a.platform + " profile"}
              >
                {String(a.platform).slice(0, 2)}
              </a>
            ))}
          </div>
        </div>
        {contacts?.contact_email && (
          <a
            className="button contact-creator"
            href={"mailto:" + contacts.contact_email}
          >
            Contact creator
          </a>
        )}
      </div>
      <section className="reference-profile-stats">
        {[
          [
            "Total views",
            latest ? compact(latest.total_views) : "Not provided",
          ],
          [
            "Avg views per video",
            latest ? compact(latest.average_views) : "Not provided",
          ],
          ["Followers", latest ? compact(latest.followers) : "Not provided"],
          [
            "Engagement rate",
            latest ? String(latest.engagement_rate) + "%" : "Not provided",
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        ))}
        <p>
          {latest
            ? "Self-reported analytics · latest account snapshot"
            : "Analytics not connected"}
        </p>
      </section>
      <section className="reference-profile-media">
        <h2>Featured work</h2>
        <p>In the creator’s order · self-reported metrics</p>
        {children}
      </section>
      <section className="reference-profile-accounts">
        <h2>Platforms & accounts</h2>
        <div className="grid">
          {accounts.map((a) => (
            <a
              key={a.id}
              className="card"
              href={String(a.profile_url)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <strong>{a.platform}</strong>
              <p>{a.username}</p>
              <span className="link">
                View account <ArrowUpRight size={12} />
              </span>
            </a>
          ))}
        </div>
      </section>
      <details className="reference-background">
        <summary>Creator background</summary>
        <p>{item.bio || "No introduction provided yet."}</p>
        <p>{item.headline}</p>
        <p>
          Languages: {listValue(item, "languages").join(", ") || "Not provided"}
        </p>
        {item.website && (
          <a
            href={String(item.website)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit website ↗
          </a>
        )}
      </details>
    </div>
  );
  return standalone ? (
    <>
      <Link href="/creators" className="link">
        ← Discover
      </Link>
      {content}
    </>
  ) : (
    <ProfilePanel name={name} id={item.id}>
      {content}
    </ProfilePanel>
  );
}
