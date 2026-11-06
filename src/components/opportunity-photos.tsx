import Image from "next/image";
import { signedImage } from "@/lib/data";
import type { RecordRow } from "@/lib/types";

export async function OpportunityPhotos({
  row,
  coverOnly = false,
}: {
  row: RecordRow;
  coverOnly?: boolean;
}) {
  const keys = coverOnly
    ? ["cover_path"]
    : ["cover_path", "photo_1", "photo_2", "photo_3"];
  const photos = await Promise.all(
    keys.map(async (key) => ({
      key,
      url: await signedImage("opportunity-images", row[key]),
    })),
  );
  return (
    <div className="stack">
      {photos
        .filter((photo) => photo.url)
        .map((photo) => (
          <div
            key={photo.key}
            style={{
              position: "relative",
              aspectRatio: "16 / 9",
              overflow: "hidden",
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <Image
              src={photo.url!}
              alt={`${row.title} — ${photo.key === "cover_path" ? "cover photo" : "attachment " + photo.key.slice(-1)}`}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, 600px"
              style={{ objectFit: "cover" }}
            />
          </div>
        ))}
    </div>
  );
}
