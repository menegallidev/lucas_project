export const APP_TIME_ZONE = "America/Sao_Paulo";
export const APP_LOCALE = "pt-BR";

type DateInput = Date | string | number;

type AppDateTimeParts = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(locale: string, options: Intl.DateTimeFormatOptions) {
    const key = `${locale}:${JSON.stringify(options)}`;
    let formatter = formatterCache.get(key);

    if (!formatter) {
        formatter = new Intl.DateTimeFormat(locale, options);
        formatterCache.set(key, formatter);
    }

    return formatter;
}

function toDate(input: DateInput) {
    const date = input instanceof Date ? input : new Date(input);

    if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid date value.");
    }

    return date;
}

function getPartsInTimeZone(input: DateInput, timeZone: string): AppDateTimeParts {
    const date = toDate(input);
    const formatter = getFormatter("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    });

    const rawParts = formatter.formatToParts(date);
    const mapped: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
    for (const part of rawParts) {
        if (part.type !== "literal") {
            mapped[part.type] = part.value;
        }
    }

    const year = Number(mapped.year);
    const month = Number(mapped.month);
    const day = Number(mapped.day);
    const hour = Number(mapped.hour);
    const minute = Number(mapped.minute);
    const second = Number(mapped.second);

    if ([year, month, day, hour, minute, second].some((value) => !Number.isFinite(value))) {
        throw new Error("Could not resolve date parts.");
    }

    return { year, month, day, hour, minute, second };
}

function getTimeZoneOffsetMinutes(input: DateInput, timeZone: string) {
    const date = toDate(input);
    const parts = getPartsInTimeZone(date, timeZone);
    const utcMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    return (utcMs - date.getTime()) / 60000;
}

function pad2(value: number) {
    return String(value).padStart(2, "0");
}

function isIntBetween(value: number, min: number, max: number) {
    return Number.isInteger(value) && value >= min && value <= max;
}

export function formatInAppTimeZone(
    input: DateInput,
    options: Intl.DateTimeFormatOptions,
    locale = APP_LOCALE
) {
    const formatter = getFormatter(locale, { ...options, timeZone: APP_TIME_ZONE });
    return formatter.format(toDate(input));
}

export function getAppDateTimeParts(input: DateInput): AppDateTimeParts {
    return getPartsInTimeZone(input, APP_TIME_ZONE);
}

export function toDateKeyInAppTimeZone(input: DateInput) {
    const parts = getAppDateTimeParts(input);
    return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function toMonthValueInAppTimeZone(input: DateInput) {
    const parts = getAppDateTimeParts(input);
    return `${parts.year}-${pad2(parts.month)}`;
}

export function dateFromAppParts({
    year,
    month,
    day,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
}: {
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
    second?: number;
    millisecond?: number;
}) {
    const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
    const first = new Date(utcGuess);
    const firstOffset = getTimeZoneOffsetMinutes(first, APP_TIME_ZONE);
    let result = new Date(utcGuess - firstOffset * 60_000);

    const secondOffset = getTimeZoneOffsetMinutes(result, APP_TIME_ZONE);
    if (secondOffset !== firstOffset) {
        result = new Date(utcGuess - secondOffset * 60_000);
    }

    return result;
}

export function getAppMonthRange(year: number, monthIndex: number) {
    const start = dateFromAppParts({ year, month: monthIndex + 1, day: 1 });
    const nextMonthUTC = new Date(Date.UTC(year, monthIndex + 1, 1));
    const end = dateFromAppParts({
        year: nextMonthUTC.getUTCFullYear(),
        month: nextMonthUTC.getUTCMonth() + 1,
        day: 1,
    });

    return { start, end };
}

export function getAppDayRange(input: DateInput) {
    const parts = getAppDateTimeParts(input);
    const start = dateFromAppParts({
        year: parts.year,
        month: parts.month,
        day: parts.day,
    });

    const nextDayUTC = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
    const end = dateFromAppParts({
        year: nextDayUTC.getUTCFullYear(),
        month: nextDayUTC.getUTCMonth() + 1,
        day: nextDayUTC.getUTCDate(),
    });

    return { start, end };
}

export function parseDateKeyInAppTimeZone(dateValue: string) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (!isIntBetween(year, 1, 9999) || !isIntBetween(month, 1, 12) || !isIntBetween(day, 1, 31)) return null;
    return dateFromAppParts({ year, month, day });
}

export function combineDateAndTimeInAppTimeZone(dateValue: string, timeValue?: string) {
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
    if (!dateMatch) return null;

    const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue ?? "00:00");
    if (!timeMatch) return null;

    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    const hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);

    if (
        !isIntBetween(year, 1, 9999) ||
        !isIntBetween(month, 1, 12) ||
        !isIntBetween(day, 1, 31) ||
        !isIntBetween(hour, 0, 23) ||
        !isIntBetween(minute, 0, 59)
    ) {
        return null;
    }

    return dateFromAppParts({ year, month, day, hour, minute, second: 0, millisecond: 0 });
}

export function parseDateTimeLocalInAppTimeZone(value: string) {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hour = Number(match[4]);
    const minute = Number(match[5]);

    if (
        !isIntBetween(year, 1, 9999) ||
        !isIntBetween(month, 1, 12) ||
        !isIntBetween(day, 1, 31) ||
        !isIntBetween(hour, 0, 23) ||
        !isIntBetween(minute, 0, 59)
    ) {
        return null;
    }

    return dateFromAppParts({ year, month, day, hour, minute, second: 0, millisecond: 0 });
}

export function toDateTimeLocalInAppTimeZone(input: DateInput) {
    const parts = getAppDateTimeParts(input);
    return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}T${pad2(parts.hour)}:${pad2(parts.minute)}`;
}
