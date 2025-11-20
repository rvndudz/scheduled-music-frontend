const SRI_LANKA_OFFSET_MINUTES = 5 * 60 + 30;
const SRI_LANKA_TIMEZONE = "Asia/Colombo";

const pad = (value: number, length = 2) => value.toString().padStart(length, "0");

export const formatUtcWithOffset = (date: Date) => {
  const iso = date.toISOString(); // yields YYYY-MM-DDTHH:MM:SS.mmmZ
  const withoutMs = iso.replace(/\.\d{3}Z$/, "");
  return `${withoutMs}+00:00`;
};

const parseNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const extractSriLankaDate = (value: string) => {
  const trimmed = value.trim();
  const [datePart, timePart] = trimmed.split("T");
  if (!datePart || !timePart) {
    return NaN;
  }

  const [yearStr, monthStr, dayStr] = datePart.split("-");
  const [hourStr, minuteStr, secondPart = "00"] = timePart.split(":");

  const [secondStr, milliPart = "000"] = secondPart.split(".");

  const year = parseNumber(yearStr);
  const month = parseNumber(monthStr);
  const day = parseNumber(dayStr);
  const hour = parseNumber(hourStr);
  const minute = parseNumber(minuteStr);
  const second = parseNumber(secondStr);
  const millisecond = parseNumber(milliPart.padEnd(3, "0"));

  if (
    [year, month, day, hour, minute, second, millisecond].some((num) =>
      Number.isNaN(num),
    )
  ) {
    return NaN;
  }

  const utcTimestamp =
    Date.UTC(year, month - 1, day, hour, minute, second, millisecond) -
    SRI_LANKA_OFFSET_MINUTES * 60 * 1000;

  return utcTimestamp;
};

export const convertSriLankaInputToUtc = (value: string, label: string) => {
  if (!value) {
    throw new Error(`${label} is required.`);
  }
  const timestamp = extractSriLankaDate(value);
  if (Number.isNaN(timestamp)) {
    throw new Error(`${label} must be a valid date.`);
  }
  return formatUtcWithOffset(new Date(timestamp));
};

export const toSriLankaInputValue = (isoString: string) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const localTimestamp =
    date.getTime() + SRI_LANKA_OFFSET_MINUTES * 60 * 1000;
  const local = new Date(localTimestamp);
  const year = local.getUTCFullYear();
  const month = pad(local.getUTCMonth() + 1);
  const day = pad(local.getUTCDate());
  const hours = pad(local.getUTCHours());
  const minutes = pad(local.getUTCMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const sriLankaFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: SRI_LANKA_TIMEZONE,
});

export const formatSriLankaDateTime = (isoString: string) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return sriLankaFormatter.format(date);
};

export const normalizeUtcDateString = (value: unknown, field: string) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required.`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${field} must be a valid date.`);
  }
  return formatUtcWithOffset(date);
};
