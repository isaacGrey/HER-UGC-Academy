import { requireUser } from "@/lib/auth";
import { Shell } from "@/components/shell";
export default async function PortalLayout({
  children,
  profile: profilePanel,
}: {
  children: React.ReactNode;
  profile: React.ReactNode;
}) {
  const { profile } = await requireUser();
  return (
    <Shell profile={profile}>
      {children}
      {profilePanel}
    </Shell>
  );
}
