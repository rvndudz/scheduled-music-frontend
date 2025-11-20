import path from "node:path";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createPresignedUploadUrl, getPublicBaseUrl } from "@/lib/r2Client";

export const runtime = "nodejs";

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || "track";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fileName?: string;
      contentType?: string;
    };

    if (!body?.fileName) {
      return NextResponse.json(
        { error: "fileName is required." },
        { status: 400 },
      );
    }
    const trackId = randomUUID();
    const safeName = toSlug(path.parse(body.fileName).name);
    const ext = path.extname(body.fileName) || ".mp3";
    const objectKey = `tracks/${trackId}-${safeName}${ext}`;

    const uploadUrl = await createPresignedUploadUrl(
      objectKey,
      body.contentType || "audio/mpeg",
    );
    const publicBase = getPublicBaseUrl();
    const objectUrl = `${publicBase}/${objectKey}`;

    return NextResponse.json(
      { uploadUrl, objectUrl, track_id: trackId, objectKey },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to create upload URL:", error);
    return NextResponse.json(
      { error: "Unable to create upload URL." },
      { status: 500 },
    );
  }
}
