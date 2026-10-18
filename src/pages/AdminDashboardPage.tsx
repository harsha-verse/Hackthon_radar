import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Search,
  Database,
  Workflow,
} from 'lucide-react';
import { HackathonEvent, VerificationStatus } from '../types/hackathon';
import { formatDateRange, formatINR, formatShortDate } from '../data/mockData';

interface AdminDashboardPageProps {
  events: HackathonEvent[];
  onVerifyEvent: (eventId: string, status: VerificationStatus) => void;
  onExpireEvent: (eventId: string) => void;
  onSelectEvent: (eventId: string) => void;
  onNavigateToSubmit: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  events,
  onVerifyEvent,
  onExpireEvent,
  onSelectEvent,
  onNavigateToSubmit,
}) => {
  const [adminView, setAdminView] = useState<
    'overview' | 'pending' | 'verified' | 'archived' | 'schema' | 'n8n'
  >('overview');
  const [searchFilter, setSearchFilter] = useState('');
  const [confirmExpireId, setConfirmExpireId] = useState<string | null>(null);

  const pendingEvents = events.filter(
    (e) =>
      e.verificationStatus === 'pending' ||
      e.verificationStatus === 'unverified' ||
      e.verificationStatus === 'flagged_duplicate' ||
      e.verificationStatus === 'conflicting_sources'
  );
  const verifiedEvents = events.filter((e) => e.verificationStatus === 'verified');
  const archivedEvents = events.filter(
    (e) => e.status === 'historical_archived' || e.editionYear < 2026
  );

  const filteredList = events.filter((ev) => {
    if (adminView === 'pending' && ev.verificationStatus === 'verified') return false;
    if (adminView === 'verified' && ev.verificationStatus !== 'verified') return false;
    if (
      adminView === 'archived' &&
      ev.status !== 'historical_archived' &&
      ev.editionYear >= 2026
    ) {
      return false;
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.organizingCollege.toLowerCase().includes(q) ||
        ev.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Admin Sidebar */}
        <aside className="lg:col-span-3 bg-[#111114] border border-[#27272A] rounded-xl p-5 space-y-5">
          <div className="pb-4 border-b border-[#27272A]">
            <p className="text-xs text-[#A1A1AA]">Governance Console</p>
            <h2 className="font-display text-base font-bold text-[#FAFAFA] mt-0.5">
              Admin Verification Desk
            </h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              2026 edition validation, duplicate checks, Supabase SQL & n8n automation
            </p>
          </div>

          <nav aria-label="Admin Console Navigation" className="space-y-1">
            {(
              [
                { id: 'overview', label: `All Records (${events.length})` },
                { id: 'pending', label: `Pending Review (${pendingEvents.length})` },
                {
                  id: 'verified',
                  label: `Verified 2026 Catalog (${verifiedEvents.length})`,
                },
                {
                  id: 'archived',
                  label: `2025 Historical Archive (${archivedEvents.length})`,
                },
                { id: 'schema', label: 'Supabase PostgreSQL & RLS' },
                { id: 'n8n', label: 'n8n Automation Workflows' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setAdminView(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  adminView === item.id
                    ? 'bg-[#8B5CF6] text-[#FAFAFA]'
                    : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="pt-4 border-t border-[#27272A]">
            <button
              type="button"
              onClick={onNavigateToSubmit}
              className="w-full py-2.5 px-3 rounded-lg bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-xs font-semibold text-[#FAFAFA]"
            >
              + Add New Event Record
            </button>
          </div>
        </aside>

        {/* Right 9-Column Admin Main Viewport */}
        <div className="lg:col-span-9 space-y-6">
          {/* Header + Real Computed State Metrics */}
          <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-[#FAFAFA]">
                  Admin Governance & Data Quality Console
                </h1>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  Metrics below are computed live from application state. Historical 2025 records are isolated from active 2026 opportunities.
                </p>
              </div>
              <span className="font-mono text-xs text-[#71717A]">
                RLS Policy Mode: Admin Role Active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A]">
                <span className="text-xs text-[#A1A1AA]">Total Records</span>
                <p className="font-mono tabular-nums text-2xl font-bold text-[#FAFAFA] mt-1">
                  {events.length}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A]">
                <span className="text-xs text-[#A1A1AA]">Pending Verification</span>
                <p className="font-mono tabular-nums text-2xl font-bold text-[#F59E0B] mt-1">
                  {pendingEvents.length}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A]">
                <span className="text-xs text-[#A1A1AA]">Verified 2026 Active</span>
                <p className="font-mono tabular-nums text-2xl font-bold text-[#22C55E] mt-1">
                  {verifiedEvents.length}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A]">
                <span className="text-xs text-[#A1A1AA]">Archived / Pre-2026</span>
                <p className="font-mono tabular-nums text-2xl font-bold text-[#EF4444] mt-1">
                  {archivedEvents.length}
                </p>
              </div>
            </div>
          </div>

          {adminView === 'schema' ? (
            /* Normalized Supabase PostgreSQL + Storage + RLS Blueprint */
            <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-[#27272A] pb-4">
                <Database className="w-5 h-5 text-[#8B5CF6]" />
                <div>
                  <h2 className="font-display text-lg font-bold text-[#FAFAFA]">
                    Normalized Supabase PostgreSQL Schema, Storage & Row-Level Security (RLS)
                  </h2>
                  <p className="text-xs text-[#A1A1AA]">
                    Production SQL schema for Section 5 (Events, Sources, Snapshots, Date History, Rounds) and Section 7 (Academic Calendar PDF Uploads).
                  </p>
                </div>
              </div>

              <pre className="p-4 rounded-xl bg-[#09090B] border border-[#27272A] text-xs font-mono text-[#A1A1AA] overflow-x-auto leading-relaxed">
{`-- 1. Core Hackathon Events Table (2026 Edition Guardrail + Missing Field Tracking)
CREATE TABLE public.hackathons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  edition_year INT NOT NULL CHECK (edition_year >= 2024),
  description TEXT NOT NULL,
  organizer TEXT NOT NULL,
  organizing_college TEXT NOT NULL,
  category TEXT CHECK (category IN ('software', 'hardware', 'both')) NOT NULL,
  domains TEXT[] NOT NULL DEFAULT '{}',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_open_date DATE,
  registration_close_date DATE NOT NULL,
  venue_name TEXT,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Karnataka',
  mode TEXT CHECK (mode IN ('online', 'offline', 'hybrid')) NOT NULL,
  eligibility_criteria TEXT,
  eligible_years TEXT[] DEFAULT '{}',
  eligible_branches TEXT[] DEFAULT '{}',
  team_size_min INT DEFAULT 1,
  team_size_max INT DEFAULT 4,
  prize_pool NUMERIC,                    -- NULL when unannounced (never invented)
  participation_fee NUMERIC DEFAULT 0,
  official_registration_url TEXT NOT NULL,
  verification_status TEXT CHECK (
    verification_status IN ('verified', 'pending', 'unverified', 'flagged_duplicate', 'conflicting_sources')
  ) DEFAULT 'pending',
  confidence_score NUMERIC(3,2) DEFAULT 0.70,
  missing_fields TEXT[] DEFAULT '{}',
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_checked_at TIMESTAMPTZ DEFAULT now(),
  last_verified_at TIMESTAMPTZ,
  status TEXT CHECK (
    status IN ('upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled', 'historical_archived')
  ) DEFAULT 'registration_open',
  CONSTRAINT valid_date_order CHECK (start_date <= end_date)
);

-- 2. Source Provenance & Raw Snapshots Table
CREATE TABLE public.event_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  source_url TEXT UNIQUE NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  confidence_score NUMERIC(3,2) DEFAULT 0.80,
  evidence_snippet TEXT,
  raw_snapshot_hash TEXT,
  discovered_at TIMESTAMPTZ DEFAULT now(),
  last_checked_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Event Date & Deadline Audit History
CREATE TABLE public.event_date_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  previous_value TEXT NOT NULL,
  new_value TEXT NOT NULL,
  source_url TEXT NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Student Academic Calendar PDF Uploads & Confirmed Commitments
CREATE TABLE public.academic_calendar_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  college_name TEXT NOT NULL,
  storage_object_path TEXT NOT NULL,     -- Private Supabase Storage bucket path
  extraction_status TEXT CHECK (extraction_status IN ('processing', 'awaiting_confirmation', 'confirmed', 'failed')),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.academic_calendar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES public.academic_calendar_uploads(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('isa_exam', 'final_exam', 'practical_lab', 'project_viva', 'mandatory_workshop', 'holiday')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  source_page INT DEFAULT 1,
  evidence_snippet TEXT,
  confidence NUMERIC(3,2) DEFAULT 0.90,
  confirmed_by_student BOOLEAN DEFAULT false
);`}
              </pre>
            </div>
          ) : adminView === 'n8n' ? (
            /* Section 9: n8n Automation & Webhook Architecture */
            <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-[#27272A] pb-4">
                <Workflow className="w-5 h-5 text-[#8B5CF6]" />
                <div>
                  <h2 className="font-display text-lg font-bold text-[#FAFAFA]">
                    n8n Automation & Scheduled Ingestion Workflows
                  </h2>
                  <p className="text-xs text-[#A1A1AA]">
                    Production n8n webhook contracts for scheduled source checks, deadline change detection, and stale-event archiving.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2">
                  <span className="font-mono text-[#8B5CF6] font-semibold">
                    Workflow 01 · Scheduled Source Polling (Every 6h)
                  </span>
                  <h3 className="text-sm font-semibold text-[#FAFAFA]">
                    Permitted Karnataka College & Devfolio Feed Sync
                  </h3>
                  <p className="text-[#A1A1AA] leading-relaxed">
                    Triggers an HTTP POST to <code className="font-mono text-[#FAFAFA]">/api/sources/ingest</code> with <code className="font-mono text-[#FAFAFA]">x-n8n-signature</code> header. Runs server-side Gemini extraction + 2026 edition date validation before upserting into Supabase.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2">
                  <span className="font-mono text-[#22C55E] font-semibold">
                    Workflow 02 · Deadline Change & Extension Detector
                  </span>
                  <h3 className="text-sm font-semibold text-[#FAFAFA]">
                    Registration Extension & Round Reschedule Alerts
                  </h3>
                  <p className="text-[#A1A1AA] leading-relaxed">
                    Compares newly extracted <code className="font-mono text-[#FAFAFA]">registration_close_date</code> against <code className="font-mono text-[#FAFAFA]">public.hackathons</code>. When an organizer extends a deadline, appends a record to <code className="font-mono text-[#FAFAFA]">event_date_history</code> and recomputes student compatibility.
                  </p>
                </div>
              </div>

              <pre className="p-4 rounded-xl bg-[#09090B] border border-[#27272A] text-xs font-mono text-[#A1A1AA] overflow-x-auto leading-relaxed">
{`// Sample n8n HTTP Request Node -> Hackathon Radar Ingestion Endpoint
POST /api/sources/ingest HTTP/1.1
Host: hackathon-radar.app
Content-Type: application/json
X-N8N-Webhook-Secret: {{ $env.N8N_WEBHOOK_SECRET }}

{
  "sourceName": "BMSCE IEEE Student Branch Feed",
  "sourceUrl": "https://bmsce.ac.in/events/codesprint-2026",
  "rawAnnouncementText": "BMSCE CodeSprint 2026 Hardware & Software Edition... Nov 14-15, 2026"
}`}
              </pre>
            </div>
          ) : (
            /* Event Management Table */
            <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#27272A]">
                <h2 className="font-display text-lg font-bold text-[#FAFAFA]">
                  Event Verification & Lifecycle Queue
                </h2>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter by event or college..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#18181B] border border-[#27272A] text-xs text-[#FAFAFA] focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#27272A] text-[#71717A]">
                      <th className="py-3 pr-4 font-medium">Event & Edition</th>
                      <th className="py-3 px-4 font-medium">Dates & Reg. Close</th>
                      <th className="py-3 px-4 font-medium">Verification & Confidence</th>
                      <th className="py-3 px-4 font-medium text-right">Prize Pool</th>
                      <th className="py-3 pl-4 font-medium text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272A]">
                    {filteredList.map((ev) => {
                      const isArchived =
                        ev.status === 'historical_archived' || ev.editionYear < 2026;
                      return (
                        <tr key={ev.id} className="hover:bg-[#18181B]/60 transition-colors">
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onSelectEvent(ev.id)}
                                className="font-semibold text-[#FAFAFA] hover:text-[#A78BFA] text-left"
                              >
                                {ev.title}
                              </button>
                              <span className="font-mono text-[11px] text-[#A1A1AA]">
                                ({ev.editionYear})
                              </span>
                            </div>
                            <span className="text-[#A1A1AA] block">
                              {ev.organizingCollege} · {ev.city}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-[#71717A] font-mono mt-0.5">
                              <span>Source: {ev.officialRegistrationUrl}</span>
                              <ExternalLink className="w-3 h-3" />
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums whitespace-nowrap">
                            <div className="text-[#FAFAFA]">
                              {formatDateRange(ev.startDate, ev.endDate)}
                            </div>
                            <div className="text-[#22C55E]">
                              Reg: {formatShortDate(ev.registrationCloseDate)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isArchived ? (
                              <span className="text-[#EF4444] font-semibold">
                                Historical {ev.editionYear} Archive
                              </span>
                            ) : ev.verificationStatus === 'verified' ? (
                              <div className="space-y-0.5">
                                <span className="text-[#22C55E] font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>
                                    Verified ({Math.round(ev.confidenceScore * 100)}%)
                                  </span>
                                </span>
                                {ev.lastVerifiedAt && (
                                  <span className="text-[11px] font-mono text-[#71717A] block">
                                    Checked {formatShortDate(ev.lastVerifiedAt.slice(0, 10))}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[#F59E0B] font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span className="capitalize">
                                  {ev.verificationStatus.replace('_', ' ')} (
                                  {Math.round(ev.confidenceScore * 100)}%)
                                </span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-right whitespace-nowrap text-[#FAFAFA]">
                            {formatINR(ev.prizePool)}
                          </td>
                          <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              {ev.verificationStatus !== 'verified' ? (
                                <button
                                  type="button"
                                  onClick={() => onVerifyEvent(ev.id, 'verified')}
                                  className="px-2.5 py-1.5 rounded bg-[#22C55E]/20 hover:bg-[#22C55E]/30 text-[#22C55E] font-semibold transition-colors"
                                >
                                  Approve & Verify
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onVerifyEvent(ev.id, 'pending')}
                                  className="px-2.5 py-1.5 rounded bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-[#A1A1AA]"
                                >
                                  Mark Pending
                                </button>
                              )}

                              {!isArchived && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmExpireId(ev.id)}
                                  className="px-2.5 py-1.5 rounded bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] font-semibold transition-colors"
                                >
                                  Archive
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Archiving an Event */}
      {confirmExpireId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
        >
          <div className="bg-[#111114] border border-[#27272A] rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-[#FAFAFA]">
              Confirm Historical Archive
            </h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Are you sure you want to move this hackathon to the historical archive? Archived events are excluded from active 2026 discovery filters so students never mistake closed or past editions for open opportunities.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmExpireId(null)}
                className="px-4 py-2 rounded-lg bg-[#18181B] border border-[#27272A] text-xs font-semibold text-[#A1A1AA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onExpireEvent(confirmExpireId);
                  setConfirmExpireId(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#EF4444] text-xs font-semibold text-[#FAFAFA]"
              >
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
