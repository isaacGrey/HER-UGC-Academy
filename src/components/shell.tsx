"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Building2,
  BriefcaseBusiness,
  Mail,
  ShieldCheck,
  CreditCard,
  Settings,
  ScrollText,
  UserRound,
  Images,
  ChartNoAxesCombined,
  Link2,
  Bookmark,
  ArrowUpRight,
  Menu,
  LogOut,
  Wallet,
} from "lucide-react";
import type { Profile } from "@/lib/types";
import { logout } from "@/lib/actions";
import { Wordmark, Avatar } from "./ui";
const creatorNav = [
  ["/opportunities", "Explore", BriefcaseBusiness],
  ["/brands", "Brands", Building2],
  ["/dashboard", "Home", LayoutDashboard],
  ["/profile", "My profile", UserRound],
  ["/portfolio", "Portfolio", Images],
  ["/socials", "Social accounts", Link2],
  ["/analytics", "Analytics", ChartNoAxesCombined],
  ["/campaigns", "My campaigns", BriefcaseBusiness],
  ["/earnings", "Earnings journal", Wallet],
  ["/saved", "Saved collection", Bookmark],
  ["/settings", "Settings", Settings],
] as const;
const brandNav = [
  ["/brand/dashboard", "Home", LayoutDashboard],
  ["/brands", "Brands", Building2],
  ["/brand/profile", "Brand profile", Building2],
  ["/creators", "Discover", Users],
  ["/brand/creators/saved", "Saved creators", Bookmark],
  ["/brand/opportunities", "Campaigns", BriefcaseBusiness],
  ["/brand/billing", "Billing", CreditCard],
  ["/brand/settings", "Settings", Settings],
] as const;
const adminNav = [
  ["/admin", "Overview", LayoutDashboard],
  ["/admin/creators", "Creators", Users],
  ["/admin/brands", "Brands", Building2],
  ["/admin/opportunities", "Opportunities", BriefcaseBusiness],
  ["/admin/invitations", "Invitations", Mail],
  ["/admin/accounts", "Accounts", ShieldCheck],
  ["/admin/plans", "Plans", CreditCard],
  ["/admin/settings", "Settings", Settings],
  ["/admin/audit-log", "Audit log", ScrollText],
] as const;
export function Shell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const links =
    profile.role === "ADMIN"
      ? adminNav
      : profile.role === "BRAND"
        ? brandNav
        : creatorNav;
  const nav = (
    <nav aria-label="Workspace navigation">
      {links.map(([href, label, Icon]) => (
        <Link className={path === href ? "active" : ""} key={href} href={href}>
          <Icon size={18} />
          {label}
        </Link>
      ))}
    </nav>
  );
  const account = (
    <div className="account">
      <Avatar name={profile.display_name} />
      <span>
        <strong style={{ fontSize: 12 }}>{profile.display_name}</strong>
        <small style={{ display: "block", fontSize: 10 }}>
          {profile.role.toLowerCase()} account
        </small>
      </span>
      <form action={logout}>
        <button className="icon-button" aria-label="Sign out">
          <LogOut size={15} />
        </button>
      </form>
    </div>
  );
  return (
    <>
      <aside className="sidebar">
        <Wordmark />
        <div className="sidebar-label">
          {profile.role === "ADMIN"
            ? "ACADEMY ADMIN"
            : profile.role === "BRAND"
              ? "BRAND WORKSPACE"
              : "CREATOR WORKSPACE"}
        </div>
        {nav}
        <div className="sidebar-footer">
          <p style={{ fontSize: 12, marginBottom: 12 }}>
            Your next chapter starts here.
          </p>
          <Link href="/opportunities" className="button secondary small">
            Explore marketplace <ArrowUpRight size={14} />
          </Link>
        </div>
      </aside>
      <div className="workspace">
        <header className="workspace-header">
          <details className="mobile-menu">
            <summary aria-label="Open navigation">
              <Menu size={22} />
            </summary>
            <div className="drawer">
              {nav}
              <Link className="button secondary" href="/opportunities">
                Explore marketplace
              </Link>
            </div>
          </details>
          <span className="breadcrumb">
            Workspace{" "}
            <span style={{ margin: "0 12px", color: "#b7b1c1" }}>/</span>{" "}
            {links.find(([href]) => href === path)?.[1] || "Details"}
          </span>
          {account}
        </header>
        <main id="main" className="main">
          {children}
          <p className="footer-note">
            Made for your next opportunity. · Her UGC Academy
          </p>
        </main>
      </div>
    </>
  );
}
