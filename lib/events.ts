import type { EventRecord, TrackRecord } from "@/types/events";
import { normalizeUtcDateString } from "@/lib/timezone";
import { readObjectAsText, writeTextObject } from "@/lib/r2Client";

const EVENTS_OBJECT_KEY = "json/events.json";

export class ValidationError extends Error {}

export const ensureIsoDate = (value: unknown, field: string): string => {
  try {
    return normalizeUtcDateString(value, field);
  } catch (error) {
    if (error instanceof Error) {
      throw new ValidationError(error.message);
    }
    throw error;
  }
};

export const ensureTracks = (tracks: unknown): TrackRecord[] => {
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
      track_bitrate_kbps,
      track_size_bytes,
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
      ...(typeof track_bitrate_kbps === "number"
        ? { track_bitrate_kbps: Math.round(track_bitrate_kbps) }
        : {}),
      ...(typeof track_size_bytes === "number"
        ? { track_size_bytes: Math.round(track_size_bytes) }
        : {}),
    };
  });
};

export const readEventsFile = async (): Promise<EventRecord[]> => {
  const raw = await readObjectAsText(EVENTS_OBJECT_KEY);
  if (!raw) {
    return [];
  }
  const data = JSON.parse(raw);
  return Array.isArray(data) ? (data as EventRecord[]) : [];
};

export const persistEvents = async (events: EventRecord[]) => {
  const body = `${JSON.stringify(events, null, 2)}\n`;
  await writeTextObject(EVENTS_OBJECT_KEY, body);
};

export const findOverlappingEvent = (
  events: EventRecord[],
  startIso: string,
  endIso: string,
  excludeId?: string,
): EventRecord | null => {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();

  return (
    events.find((event) => {
      if (excludeId && event.event_id === excludeId) {
        return false;
      }
      const existingStart = new Date(event.start_time_utc).getTime();
      const existingEnd = new Date(event.end_time_utc).getTime();

      return start < existingEnd && end > existingStart;
    }) ?? null
  );
};

export const isEventExpired = (
  event: EventRecord,
  referenceDate = new Date(),
) => new Date(event.end_time_utc).getTime() <= referenceDate.getTime();

export type { EventRecord, TrackRecord };
