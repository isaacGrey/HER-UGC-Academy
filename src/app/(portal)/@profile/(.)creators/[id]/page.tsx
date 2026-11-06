import { Detail } from "@/components/detail";
import { InterceptedProfile } from "@/components/profile-panel";
export default async function Profile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <InterceptedProfile>
      <Detail kind="creators" id={id} />
    </InterceptedProfile>
  );
}
