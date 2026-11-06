import { Discovery } from "@/components/discovery";
import type { SearchParams } from "@/lib/data";
export default async function Creators({searchParams}:{searchParams:Promise<SearchParams>}) {return <Discovery kind="creators" params={await searchParams}/>;}
