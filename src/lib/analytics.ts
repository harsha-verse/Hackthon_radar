import { CuratedCompetition, PublicCompetitionStatus } from '../types/v1';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    __ga4Initialized?: boolean;
  }
}

export type GA4FunnelEvent =
  | 'signup_started'
  | 'signup_completed'
  | 'competition_list_viewed'
  | 'competition_clicked'
  | 'registration_clicked'
  | 'brochure_clicked'
  | 'calendar_viewed';

// Prevent duplicate initialization and duplicate view tracking across React rerenders
const firedOnceKeys = new Set<string>();

export function initGA4IfConfigured() {
  if (typeof window === 'undefined' || window.__ga4Initialized) return;
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
  if (!measurementId) {
    window.__ga4Initialized = true;
    return;
  }

  window.__ga4Initialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
    measurementId
  )}`;
  document.head.appendChild(script);
}

/**
 * Strips any accidental PII keys before sending event parameters to GA4 or backend analytics.
 */
function sanitizeAnalyticsParams(
  params?: Record<string, string | number | boolean | null | undefined>
): Record<string, string | number | boolean> {
  if (!params) return {};
  const forbiddenKeys = new Set(['name', 'phone', 'phone_number', 'email', 'mobile']);
  const clean: Record<string, string | number | boolean> = {};

  for (const [k, v] of Object.entries(params)) {
    if (forbiddenKeys.has(k.toLowerCase())) continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      clean[k] = v;
    }
  }
  return clean;
}

export function trackGA4Event(
  eventName: GA4FunnelEvent,
  params?: Record<string, string | number | boolean | null | undefined>,
  options?: { dedupeKey?: string }
) {
  try {
    if (options?.dedupeKey) {
      if (firedOnceKeys.has(options.dedupeKey)) {
        return;
      }
      firedOnceKeys.add(options.dedupeKey);
    }

    initGA4IfConfigured();
    const safeParams = sanitizeAnalyticsParams(params);

    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, safeParams);
    }

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        params: safeParams,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  } catch {
    // Non-blocking analytics
  }
}

/**
 * Parses a YYYY-MM-DD date string as end-of-day (23:59:59.999) in India Standard Time (+05:30),
 * or parses a full ISO datetime string directly. Returns null if empty or invalid.
 */
export function parseDateEndOfDayIST(dateStr?: string | null): number | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const ms = new Date(`${trimmed}T23:59:59.999+05:30`).getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  const ms = new Date(trimmed).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Normalizes a reference time (Date, timestamp, YYYY-MM-DD string, or ISO string) into milliseconds.
 * When omitted, uses the live current timestamp (Date.now()).
 */
export function parseReferenceTimeMs(
  referenceInput?: string | number | Date
): number {
  if (referenceInput === undefined || referenceInput === null) {
    return Date.now();
  }
  if (typeof referenceInput === 'number') {
    return referenceInput;
  }
  if (referenceInput instanceof Date) {
    return referenceInput.getTime();
  }
  const trimmed = referenceInput.trim();
  if (!trimmed) {
    return Date.now();
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const ms = new Date(`${trimmed}T00:00:00.000+05:30`).getTime();
    return Number.isNaN(ms) ? Date.now() : ms;
  }
  const ms = new Date(trimmed).getTime();
  return Number.isNaN(ms) ? Date.now() : ms;
}

/**
 * Computes accurate public-facing competition status from stored dates and admin override.
 * Rules:
 * - Allowed: 'Upcoming' | 'Registration Open' | 'Closing Soon' | 'Registration Closed' | 'Results Announced'
 * - Once registration_deadline has passed, status is 'Registration Closed' (unless Results Announced or overridden).
 * - If registration_deadline is missing, uses existing registration_status and available event_date without inventing dates.
 */
export function resolveCompetitionStatus(
  comp: Pick<
    CuratedCompetition,
    'event_date' | 'registration_deadline' | 'registration_status' | 'status_override'
  >,
  referenceInput?: string | number | Date
): PublicCompetitionStatus {
  // 1. Respect explicit admin override when set
  if (comp.status_override) {
    return comp.status_override;
  }

  // 2. Preserve Results Announced status
  if (comp.registration_status === 'Results Announced') {
    return 'Results Announced';
  }

  const refTime = parseReferenceTimeMs(referenceInput);
  const deadlineTime = parseDateEndOfDayIST(comp.registration_deadline);
  const eventTime = parseDateEndOfDayIST(comp.event_date);

  // 3. When registration_deadline is present:
  if (deadlineTime !== null) {
    if (deadlineTime < refTime) {
      return 'Registration Closed';
    }
    if (comp.registration_status === 'Registration Closed') {
      return 'Registration Closed';
    }
    const diffDays = Math.ceil((deadlineTime - refTime) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      return 'Closing Soon';
    }
    if (comp.registration_status === 'Upcoming' && diffDays > 25) {
      return 'Upcoming';
    }
    return 'Registration Open';
  }

  // 4. When registration_deadline is missing/empty:
  // Use existing registration_status and available event_date without inventing missing dates.
  if (comp.registration_status === 'Registration Closed') {
    return 'Registration Closed';
  }

  if (eventTime !== null && eventTime < refTime) {
    return 'Registration Closed';
  }

  return comp.registration_status || 'Registration Open';
}

/**
 * Returns true if the competition belongs in the Past Competitions section
 * (registration has closed or results have been announced).
 */
export function isPastCompetition(
  comp: Pick<
    CuratedCompetition,
    'event_date' | 'registration_deadline' | 'registration_status' | 'status_override'
  >,
  referenceInput?: string | number | Date
): boolean {
  const status = resolveCompetitionStatus(comp, referenceInput);
  return status === 'Registration Closed' || status === 'Results Announced';
}

/**
 * Splits competitions into mutually exclusive activeCompetitions and pastCompetitions arrays,
 * preserving all competition fields and resolving each competition's accurate registration_status.
 */
export function categorizeCompetitions<
  T extends Pick<
    CuratedCompetition,
    | 'id'
    | 'event_date'
    | 'registration_deadline'
    | 'registration_status'
    | 'status_override'
  >
>(
  competitions: T[],
  referenceInput?: string | number | Date
): {
  allCompetitions: T[];
  activeCompetitions: T[];
  pastCompetitions: T[];
} {
  const seenIds = new Set<string>();
  const allCompetitions: T[] = [];

  for (const comp of competitions) {
    if (!comp || seenIds.has(comp.id)) continue;
    seenIds.add(comp.id);
    allCompetitions.push({
      ...comp,
      registration_status: resolveCompetitionStatus(comp, referenceInput),
    });
  }

  const sortByDateAsc = (a: T, b: T) => {
    const dateA = (a.event_date || a.registration_deadline || '').trim();
    const dateB = (b.event_date || b.registration_deadline || '').trim();
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateA.localeCompare(dateB);
  };

  const activeCompetitions = allCompetitions
    .filter((c) => !isPastCompetition(c, referenceInput))
    .sort(sortByDateAsc);

  const pastCompetitions = allCompetitions
    .filter((c) => isPastCompetition(c, referenceInput))
    .sort(sortByDateAsc);

  return {
    allCompetitions: [...activeCompetitions, ...pastCompetitions],
    activeCompetitions,
    pastCompetitions,
  };
}

export function getDaysUntilDate(
  isoDateStr: string,
  referenceInput?: string | number | Date
): number {
  if (!isoDateStr || !isoDateStr.trim()) return 0;
  const refTime = parseReferenceTimeMs(referenceInput);
  const targetTime = parseDateEndOfDayIST(isoDateStr);
  if (targetTime === null) return 0;
  return Math.ceil((targetTime - refTime) / (1000 * 60 * 60 * 24));
}

export function formatReadableDate(isoDateStr: string): string {
  if (!isoDateStr || !isoDateStr.trim()) return 'Not announced';
  const trimmed = isoDateStr.trim();
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? new Date(`${trimmed}T00:00:00Z`)
    : new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return isoDateStr;
  }
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
