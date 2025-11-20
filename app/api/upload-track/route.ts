import path from "node:path";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { parseBuffer } from "music-metadata";

import { uploadFileToR2 } from "@/lib/r2Client";

export const runtime = "nodejs";

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing MP3 file in form data." },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith(".mp3")) {
      return NextResponse.json(
        { error: "Only MP3 uploads are supported." },
        { status: 400 },
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    let metadata;
    try {
      metadata = await parseBuffer(fileBuffer, {
        mimeType: file.type || "audio/mpeg",
        size: file.size,
      });
    } catch (metadataError) {
      console.error("MP3 metadata parsing failed:", metadataError);
      return NextResponse.json(
        { error: "Unable to read MP3 metadata. Please check the file." },
        { status: 422 },
      );
    }

    const duration =
      typeof metadata.format.duration === "number"
        ? Math.round(metadata.format.duration)
        : null;
    const bitrate =
      typeof metadata.format.bitrate === "number"
        ? Math.round(metadata.format.bitrate / 1000)
        : null;

    if (!duration) {
      return NextResponse.json(
        { error: "Track duration metadata is missing." },
        { status: 422 },
      );
    }

    const trackName =
      metadata.common.title?.trim() ||
      path.parse(file.name).name ||
      "Untitled Track";
    const trackId = randomUUID();
    const safeTitle = toSlug(trackName) || trackId;
    const extension = path.extname(file.name) || ".mp3";

    let trackUrl: string;
    try {
      trackUrl = await uploadFileToR2({
        objectKey: `tracks/${trackId}-${safeTitle}${extension}`,
        body: fileBuffer,
        contentType: file.type || "audio/mpeg",
      });
    } catch (uploadError) {
      console.error("R2 upload failed:", uploadError);
      return NextResponse.json(
        { error: "Uploading track to Cloudflare R2 failed." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        track_id: trackId,
        track_name: trackName,
        track_url: trackUrl,
        track_duration_seconds: duration,
        ...(bitrate ? { track_bitrate_kbps: bitrate } : {}),
        track_size_bytes: file.size,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unhandled upload-track error:", error);
    return NextResponse.json(
      { error: "Unexpected error while uploading track." },
      { status: 500 },
    );
  }
}
