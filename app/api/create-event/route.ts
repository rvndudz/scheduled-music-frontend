import path from "node:path";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface TrackRecord {
  track_id: string;
  track_name: string;
  track_url: string;
  track_duration_seconds: number;
}

interface EventRecord {
  event_id: string;
  event_name: string;
  artist_name: string;
  start_time_utc: string;
  end_time_utc: string;
  tracks: TrackRecord[];
}

const eventsFilePath = path.join(process.cwd(), "data", "events.json");

class ValidationError extends Error {}

const ensureIsoDate = (value: unknown, field: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`${field} is required.`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${field} must be a valid date.`);
  }

  return date.toISOString();
};

const ensureTracks = (tracks: unknown): TrackRecord[] => {
  if (!Array.isArray(tracks) || tracks.length === 0) {
    throw new ValidationError("At least one track is required.");
  }

  return tracks.map((track, index) => {
    if (typeof track !== "object" || track === null) {
      throw new ValidationError(`Track #${index + 1} is invalid.`);
    }

    const {
      track_id,
      track_name,
      track_url,
      track_duration_seconds,
    } = track as Record<string, unknown>;

    if (typeof track_id !== "string" || !track_id.trim()) {
      throw new ValidationError(`Track #${index + 1} is missing track_id.`);
    }

    if (typeof track_name !== "string" || !track_name.trim()) {
      throw new ValidationError(`Track #${index + 1} is missing track_name.`);
    }

    if (typeof track_url !== "string" || !track_url.trim()) {
      throw new ValidationError(`Track #${index + 1} is missing track_url.`);
    }

    const duration = Number(track_duration_seconds);
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new ValidationError(
        `Track #${index + 1} has an invalid track_duration_seconds.`,
      );
    }

    return {
      track_id,
      track_name,
      track_url,
      track_duration_seconds: Math.round(duration),
    };
  });
};

const readEventsFile = async (): Promise<EventRecord[]> => {
  try {
    const raw = await fs.readFile(eventsFilePath, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? (data as EventRecord[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await fs.mkdir(path.dirname(eventsFilePath), { recursive: true });
      return [];
    }

    throw error;
  }
};

const persistEvents = async (events: EventRecord[]) => {
  await fs.mkdir(path.dirname(eventsFilePath), { recursive: true });
  await fs.writeFile(
    eventsFilePath,
    `${JSON.stringify(events, null, 2)}\n`,
    "utf-8",
  );
};

export async function POST(request: Request) {
  try {
    let payload: Record<string, unknown>;
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      throw new ValidationError("Invalid JSON payload.");
    }
    const { event_name, artist_name, start_time_utc, end_time_utc, tracks } =
      payload;

    if (typeof event_name !== "string" || !event_name.trim()) {
      throw new ValidationError("event_name is required.");
    }

    if (typeof artist_name !== "string" || !artist_name.trim()) {
      throw new ValidationError("artist_name is required.");
    }

    const startIso = ensureIsoDate(start_time_utc, "start_time_utc");
    const endIso = ensureIsoDate(end_time_utc, "end_time_utc");

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      throw new ValidationError("end_time_utc must be after start_time_utc.");
    }

    const normalizedTracks = ensureTracks(tracks);

    const newEvent: EventRecord = {
      event_id: randomUUID(),
      event_name: event_name.trim(),
      artist_name: artist_name.trim(),
      start_time_utc: startIso,
      end_time_utc: endIso,
      tracks: normalizedTracks,
    };

    const existingEvents = await readEventsFile();
    existingEvents.push(newEvent);

    try {
      await persistEvents(existingEvents);
    } catch (persistError) {
      console.error("Failed to write events file:", persistError);
      return NextResponse.json(
        { error: "Failed to save the event to disk." },
        { status: 500 },
      );
    }

    return NextResponse.json({ event: newEvent }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Unexpected create-event error:", error);
    return NextResponse.json(
      { error: "Unexpected error while creating the event." },
      { status: 500 },
    );
  }
}
