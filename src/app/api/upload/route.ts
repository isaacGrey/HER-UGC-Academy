import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { requireUser, ownedBrand } from "@/lib/auth";
import { sameOrigin } from "@/lib/http";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { ok: false, message: "Forbidden" },
      { status: 403 },
    );
  const { client, profile } = await requireUser(["CREATOR", "BRAND", "ADMIN"]);
  if (Number(request.headers.get("content-length")) > 6 * 1024 * 1024)
    return NextResponse.json(
      { ok: false, message: "Maximum file size is 5 MB." },
      { status: 413 },
    );
  const form = await request.formData();
  const bucket = String(form.get("bucket"));
  const file = form.get("file");
  if (
    !(file instanceof File) ||
    ![
      "avatars",
      "brand-logos",
      "portfolio-images",
      "opportunity-images",
    ].includes(bucket) ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 5 * 1024 * 1024 ||
    file.size < 12
  )
    return NextResponse.json(
      { ok: false, message: "Upload a JPG, PNG, or WebP image under 5 MB." },
      { status: 400 },
    );
  if (
    bucket !== "opportunity-images" &&
    (profile.role === "ADMIN" ||
      (bucket === "brand-logos") !== (profile.role === "BRAND"))
  )
    return NextResponse.json(
      { ok: false, message: "This upload is not permitted." },
      { status: 403 },
    );
  const bytes = Buffer.from(await file.arrayBuffer());
  const valid =
    file.type === "image/jpeg"
      ? bytes[0] === 0xff && bytes[1] === 0xd8 && /\.jpe?g$/i.test(file.name)
      : file.type === "image/png"
        ? bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
          /\.png$/i.test(file.name)
        : bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP" &&
          /\.webp$/i.test(file.name);
  if (!valid)
    return NextResponse.json(
      { ok: false, message: "The file contents do not match its image type." },
      { status: 400 },
    );
  const slot = Number(form.get("slot") || 0);
  if (
    bucket === "opportunity-images" &&
    (!Number.isInteger(slot) ||
      slot < 0 ||
      slot > 3 ||
      profile.role === "CREATOR")
  )
    return NextResponse.json(
      {
        ok: false,
        message: "Choose a cover or one of three attachment slots.",
      },
      { status: 400 },
    );
  let recordId = profile.id;
  const table =
    bucket === "opportunity-images"
      ? "opportunities"
      : bucket === "avatars"
        ? "creator_profiles"
        : bucket === "brand-logos"
          ? "brands"
          : "portfolio_items";
  const column =
    bucket === "opportunity-images"
      ? slot === 0
        ? "cover_path"
        : "photo_" + slot
      : bucket === "avatars"
        ? "avatar_path"
        : bucket === "brand-logos"
          ? "logo_path"
          : "image_path";
  if (bucket === "brand-logos") recordId = (await ownedBrand()).brandId;
  if (bucket === "portfolio-images") {
    recordId = String(form.get("recordId"));
    const { data } = await client
      .from("portfolio_items")
      .select("id")
      .eq("id", recordId)
      .eq("creator_id", profile.id)
      .single();
    if (!data)
      return NextResponse.json(
        { ok: false, message: "Portfolio item unavailable." },
        { status: 403 },
      );
  }
  if (bucket === "opportunity-images") {
    recordId = String(form.get("recordId"));
    const { data: listing } = await client
      .from("opportunities")
      .select("brand_id,status")
      .eq("id", recordId)
      .single();
    if (
      !listing ||
      (profile.role !== "ADMIN" &&
        (listing.brand_id !== (await ownedBrand()).brandId ||
          !["DRAFT", "REJECTED"].includes(listing.status)))
    )
      return NextResponse.json(
        { ok: false, message: "This opportunity cannot be edited." },
        { status: 403 },
      );
  }
  const extension =
    file.type === "image/jpeg"
      ? "jpg"
      : file.type === "image/png"
        ? "png"
        : "webp";
  const path = `${profile.id}/${randomUUID()}.${extension}`;
  const { data: old } = await client
    .from(table)
    .select(column)
    .eq("id", recordId)
    .single();
  const { error: uploadError } = await client.storage
    .from(bucket)
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError)
    return NextResponse.json(
      { ok: false, message: "Upload failed. Please try again." },
      { status: 500 },
    );
  const { error: updateError } = await client
    .from(table)
    .update({
      [column]: path,
      ...(bucket === "portfolio-images" ? { media_type: "IMAGE" } : {}),
    })
    .eq("id", recordId)
    .select("id")
    .single();
  if (updateError) {
    await client.storage.from(bucket).remove([path]);
    return NextResponse.json(
      { ok: false, message: "The image could not be attached." },
      { status: 500 },
    );
  }
  const previous = old as unknown as Record<string, string> | null;
  if (previous?.[column]?.startsWith(profile.id + "/"))
    await client.storage.from(bucket).remove([previous[column]]);
  return NextResponse.json({ ok: true, message: "Image uploaded." });
}
