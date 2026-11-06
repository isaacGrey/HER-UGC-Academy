import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Sparkles, ArrowUpRight } from "lucide-react";
export function Wordmark() {
  return (
    <Link
      href="/"
      className="wordmark"
      aria-label="HER Opportunity Portal home"
    >
      <span>
        <strong>Her UGC Academy</strong>
        <small>Opportunity Board</small>
      </span>
    </Link>
  );
}
export function Badge({
  children,
  tone = "",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Verified() {
  return (
    <Badge tone="purple">
      <BadgeCheck size={12} /> HER VERIFIED
    </Badge>
  );
}
export function Status({ value }: { value: string }) {
  const tone = ["ACTIVE", "LIVE", "Available", "COMPLETED"].includes(value)
    ? "green"
    : ["PENDING", "INVITED", "Limited availability"].includes(value)
      ? "amber"
      : ["SUSPENDED", "REVOKED", "REJECTED", "DELETED"].includes(value)
        ? "red"
        : "purple";
  return <Badge tone={tone}>{value.replaceAll("_", " ")}</Badge>;
}
export function Avatar({
  name,
  src,
  brand = false,
  large = false,
}: {
  name: string;
  src?: string;
  brand?: boolean;
  large?: boolean;
}) {
  return (
    <div className={`avatar ${brand ? "brand" : ""} ${large ? "large" : ""}`}>
      {src ? (
        <Image
          src={src}
          fill
          unoptimized
          alt={`${name} ${brand ? "logo" : "profile photo"}`}
          sizes={large ? "90px" : "66px"}
        />
      ) : (
        name
          .split(" ")
          .map((s) => s[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      )}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
export function Empty({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="card empty">
      <Sparkles size={30} />
      <h3>{title}</h3>
      <p>{description}</p>
      {href && (
        <Link href={href} className="button">
          {label || "Explore opportunities"}
          <ArrowUpRight size={15} />
        </Link>
      )}
    </div>
  );
}
export function Metric({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card metric">
      <div className="metric-icon">{icon}</div>
      <strong>{value}</strong>
      <p>{label}</p>
      {note && <div className="metric-note">{note}</div>}
    </div>
  );
}
export const compact = (value: unknown) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);
export function currency(value: unknown, code = "USD") {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  } catch {
    return `${code} ${Number(value) || 0}`;
  }
}
export const dateLabel = (value: unknown) =>
  value
    ? new Date(String(value)).toLocaleDateString("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";
