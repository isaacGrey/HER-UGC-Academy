import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowUpRight, BriefcaseBusiness } from "lucide-react";
import type { RecordRow } from "@/lib/types";
import type { Role } from "@/lib/constants";
import { signedImage, listValue, stringValue } from "@/lib/data";
import { Avatar, Badge, Verified, currency } from "./ui";
import { SaveButton } from "./forms";
export async function CreatorCard({
  row,
  saved = false,
  role,
}: {
  row: RecordRow;
  metric?: RecordRow;
  saved?: boolean;
  role: Role;
}) {
  const name = stringValue(row, "display_name");
  const photo = await signedImage("avatars", row.avatar_path);
  return (
    <article className="card directory-card creator-directory-card">
      <div className={`directory-cover ${photo ? "has-photo" : ""}`}>
        {photo ? (
          <Image
            src={photo}
            alt={name + " profile photo"}
            fill
            unoptimized
            sizes="(max-width:640px) 100vw, 340px"
          />
        ) : (
          <span className="directory-initials">
            {name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </span>
        )}
        <div className="opportunity-cover-actions">
          {role === "BRAND" ? (
            <SaveButton kind="creator" id={row.id} saved={saved} />
          ) : (
            <span />
          )}
          {row.verified && <Verified />}
        </div>
      </div>
      <div className="directory-body">
        <div className="directory-caption">
          <h3>
            <Link href={`/creators/${row.id}`}>{name}</Link>
          </h3>
          <span className="location">
            <MapPin size={12} />
            {row.location || "Location not provided"}
          </span>
        </div>
        <div className="opportunity-tags">
          {listValue(row, "niches")
            .slice(0, 3)
            .map((n) => (
              <Badge key={n}>{n}</Badge>
            ))}
        </div>
        <p className="creator-availability">
          {row.availability || "Availability not provided"}
        </p>
        <Link href={`/creators/${row.id}`} className="opportunity-details">
          View profile <ArrowUpRight size={14} />
        </Link>
      </div>
    </article>
  );
}
export async function OpportunityCard({
  row,
  brand,
  saved = false,
  role,
}: {
  row: RecordRow;
  brand?: RecordRow;
  saved?: boolean;
  role: Role;
}) {
  const name = brand ? stringValue(brand, "name") : "Brand";
  const cover = await signedImage("opportunity-images", row.cover_path);
  const tags = [...listValue(row, "platforms"), ...listValue(row, "niches")];
  return (
    <article className="card opportunity-card">
      <div className={`opportunity-cover ${cover ? "has-photo" : "no-photo"}`}>
        {cover && (
          <Image
            src={cover}
            alt={`${row.title} — cover photo`}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 330px"
          />
        )}
        {!cover && (
          <BriefcaseBusiness
            className="opportunity-placeholder"
            size={80}
            strokeWidth={1}
            aria-hidden="true"
          />
        )}
        <div className="opportunity-cover-actions">
          {role === "CREATOR" ? (
            <SaveButton kind="opportunity" id={row.id} saved={saved} />
          ) : (
            <span />
          )}
          {row.featured && <Badge tone="amber">FEATURED</Badge>}
        </div>
        <div className="opportunity-cover-caption">
          <h3>
            <Link href={`/opportunities/${row.id}`}>{row.title}</Link>
          </h3>
          <span className="location">
            <MapPin size={12} />
            {row.remote ? "Remote · " : ""}
            {row.location || "Global"}
          </span>
        </div>
      </div>
      <div className="opportunity-body">
        <div className="opportunity-brand">
          <Avatar
            brand
            name={name}
            src={await signedImage("brand-logos", brand?.logo_path)}
          />
          <div>
            <strong>{name}</strong>
            <small>{row.campaign_type || "Creator collaboration"}</small>
          </div>
        </div>
        <p className="summary">{row.summary}</p>
        <div className="opportunity-tags" aria-label="Platforms and niches">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
          {tags.length > 3 && (
            <span className="opportunity-more">+{tags.length - 3} more</span>
          )}
        </div>
        <Link href={`/opportunities/${row.id}`} className="opportunity-details">
          View details <ArrowUpRight size={14} />
        </Link>
      </div>
      <div className="opportunity-budget">
        <span>
          {row.compensation_type === "AFFILIATE"
            ? "AFFILIATE BUDGET"
            : "PER COLLABORATION"}
        </span>
        <strong>
          {row.compensation_type === "GIFTED"
            ? "Gifted"
            : `${currency(row.compensation_min, stringValue(row, "currency", "USD"))} – ${currency(row.compensation_max, stringValue(row, "currency", "USD"))}`}
        </strong>
      </div>
    </article>
  );
}
export async function BrandCard({
  row,
  count = 0,
  saved = false,
  role,
}: {
  row: RecordRow;
  count?: number;
  saved?: boolean;
  role: Role;
}) {
  const name = stringValue(row, "name");
  return (
    <article className="card directory-card brand-directory-card">
      <div className="directory-cover brand-cover">
        <div className="opportunity-cover-actions">
          {role === "CREATOR" ? (
            <SaveButton kind="brand" id={row.id} saved={saved} />
          ) : (
            <span />
          )}
          {row.verified && <Verified />}
        </div>
        <div className="brand-cover-logo">
          <Avatar
            brand
            large
            name={name}
            src={await signedImage("brand-logos", row.logo_path)}
          />
        </div>
        <div className="directory-caption">
          <h3>
            <Link href={`/brands/${row.id}`}>{name}</Link>
          </h3>
          <span className="location">
            <MapPin size={12} />
            {row.location || "Global"}
          </span>
        </div>
      </div>
      <div className="directory-body">
        <small className="directory-label">MEET YOUR NEXT COLLABORATOR</small>
        <div className="opportunity-tags">
          <Badge>{row.industry || "Brand"}</Badge>
          {row.remote && <Badge>Remote friendly</Badge>}
        </div>
        <p className="directory-summary">
          {row.description ||
            "Discover this brand and explore their upcoming collaborations."}
        </p>
        <Link href={`/brands/${row.id}`} className="opportunity-details">
          Explore brand <ArrowUpRight size={14} />
        </Link>
      </div>
      <div className="opportunity-budget">
        <span>OPEN OPPORTUNITIES</span>
        <strong>
          {count} {count === 1 ? "collaboration" : "collaborations"}
        </strong>
      </div>
    </article>
  );
}
