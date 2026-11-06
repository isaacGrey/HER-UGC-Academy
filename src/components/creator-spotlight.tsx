import Link from "next/link";
import Image from "next/image";
import { rows, signedImage, stringValue } from "@/lib/data";
import { requireUser } from "@/lib/auth";
export async function CreatorSpotlight() {
  const { profile } = await requireUser();
  if (profile.role !== "BRAND") return null;
  const creators = await rows("creator_profiles", {}, 20);
  const creator = creators.find((c) => c.avatar_path) || creators[0];
  if (!creator) return null;
  const photo = await signedImage("avatars", creator.avatar_path);
  const work = (await rows("portfolio_items", { creator_id: creator.id }))
    .filter((w) => w.featured)
    .slice(0, 3);
  return (
    <section className="reference-spotlight">
      <div className="spotlight-person">
        {photo && (
          <div className="spotlight-photo">
            <Image
              fill
              unoptimized
              src={photo}
              alt={String(creator.display_name)}
              sizes="190px"
            />
          </div>
        )}
        <div>
          <small>CREATOR SPOTLIGHT</small>
          <h2>{creator.display_name}</h2>
          <p>{creator.location}</p>
          <p>{creator.headline}</p>
          <Link href={"/creators/" + creator.id} className="button">
            View profile →
          </Link>
        </div>
      </div>
      <div className="spotlight-work">
        <h3>Featured work</h3>
        <p>Chosen by the creator</p>
        <div className="grid">
          {work.length ? (
            await Promise.all(
              work.map(async (w) => {
                const image = await signedImage(
                  "portfolio-images",
                  w.image_path,
                );
                return (
                  <a
                    className="spotlight-work-item"
                    key={w.id}
                    href={String(w.url || "/creators/" + creator.id)}
                  >
                    {image && (
                      <Image
                        src={image}
                        alt={stringValue(w, "title")}
                        width={200}
                        height={260}
                        unoptimized
                      />
                    )}
                    <strong>{w.title}</strong>
                  </a>
                );
              }),
            )
          ) : (
            <p className="spotlight-empty">
              This creator hasn’t selected featured work yet.
              <br />
              <Link href={"/creators/" + creator.id}>
                Explore their profile →
              </Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
