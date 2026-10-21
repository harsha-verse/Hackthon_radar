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
 * Computes accurate public-facing competition status from stored dates and admin override.
 * Section 5 Rules:
 * - Never return "Created".
 * - Allowed: 'Upcoming' | 'Registration Open' | 'Closing Soon' | 'Registration Closed' | 'Results Announced'
 * - Never mark an event as open simply because its event_date is in the future if registration_deadline has passed.
 */
export function resolveCompetitionStatus(
  comp: Pick<
    CuratedCompetition,
    'event_date' | 'registration_deadline' | 'registration_status' | 'status_override'
  >,
  referenceDateStr = '2026-10-20'
): PublicCompetitionStatus {
  // 1. Respect explicit admin override when set (e.g., 'Results Announced' or 'Registration Closed')
  if (comp.status_override) {
    return comp.status_override;
  }
  if (comp.registration_status === 'Results Announced') {
    return 'Results Announced';
  }

  const refTime = new Date(`${referenceDateStr}T00:00:00Z`).getTime();
  const deadlineTime = new Date(`${comp.registration_deadline}T23:59:59Z`).getTime();
  const eventTime = new Date(`${comp.event_date}T23:59:59Z`).getTime();

  // 2. If registration deadline has passed, registration is closed—even if event_date is in the future!
  if (!Number.isNaN(deadlineTime) && deadlineTime < refTime) {
    return 'Registration Closed';
  }

  // 3. If the event itself has already passed, registration is closed
  if (!Number.isNaN(eventTime) && eventTime < refTime) {
    return 'Registration Closed';
  }

  // 4. Check days remaining until registration deadline
  if (!Number.isNaN(deadlineTime)) {
    const diffDays = Math.ceil((deadlineTime - refTime) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      return 'Closing Soon';
    }
    if (comp.registration_status === 'Upcoming' && diffDays > 25) {
      return 'Upcoming';
    }
    return 'Registration Open';
  }

  return comp.registration_status || 'Registration Open';
}

export function getDaysUntilDate(
  isoDateStr: string,
  referenceDateStr = '2026-10-20'
): number {
  const refTime = new Date(`${referenceDateStr}T00:00:00Z`).getTime();
  const targetTime = new Date(`${isoDateStr}T00:00:00Z`).getTime();
  if (Number.isNaN(targetTime)) return 0;
  return Math.round((targetTime - refTime) / (1000 * 60 * 60 * 24));
}

export function formatReadableDate(isoDateStr: string): string {
  if (!isoDateStr) return 'Not announced';
  const parsed = new Date(`${isoDateStr}T00:00:00Z`);
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
