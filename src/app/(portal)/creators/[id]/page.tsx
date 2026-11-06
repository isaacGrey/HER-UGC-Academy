import { Detail } from "@/components/detail";
export default async function Profile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Detail kind="creators" id={id} standalone />;
}
