import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  ArrowRight,
  Globe,
  History,
} from 'lucide-react';
import {
  ActiveRoute,
  CollegeAcademicCalendar,
  FieldChangeRecord,
  HackathonDomain,
  HackathonEvent,
  SourceAdapterStatus,
  StudentProfile,
} from '../types/hackathon';
import { evaluateAcademicCompatibility } from '../lib/compatibilityEngine';

interface SourceIngestionPageProps {
  adapters: SourceAdapterStatus[];
  events: HackathonEvent[];
  student: StudentProfile;
  collegeCalendar?: CollegeAcademicCalendar;
  onAddIngestedEvent: (newEvent: HackathonEvent) => void;
  onApplyEventScheduleChange: (
    eventId: string,
    updatedDates: {
      startDate: string;
      endDate: string;
      registrationCloseDate: string;
    },
    changes: FieldChangeRecord[]
  ) => void;
  onSelectEvent: (eventId: string) => void;
  onNavigate: (route: ActiveRoute) => void;
}

const SAMPLE_2026_CIRCULAR = `OFFICIAL ANNOUNCEMENT — JSS STU (SJCE) MYSURU
Event: SJCE Cyber-Physical & Edge AI Buildathon 2026
Organizer: IEEE SJCE Student Branch & Department of CSE, JSS Science and Technology University, Mysuru
Edition Year: 2026
Registration Closes: October 31, 2026
Hackathon Participation Dates: November 8, 2026 to November 9, 2026 (36 Hours Offline in Mysuru)
Eligibility: Open to 1st, 2nd, 3rd, and 4th Year B.E./B.Tech students across Karnataka.
Prize Pool: INR 1,50,000 · Participation Fee: Free (INR 0)
Official URL: https://jssstuniv.in/events/sjce-buildathon-2026`;

const SAMPLE_2025_HISTORICAL_TRAP = `ARCHIVE CIRCULAR — BENGALURU OPEN HACK 2025
Event: Bengaluru Open Systems Hackathon 2025
Organizer: Bengaluru College Innovation Network
Registration Closed: January 20, 2025
Hackathon Participation Dates: February 14, 2025 to February 15, 2025
Prize Pool: INR 2,00,000
Official URL: https://example-blr-college.edu.in/open-hack-2025`;

export const SourceIngestionPage: React.FC<SourceIngestionPageProps> = ({
  adapters,
  events,
  student,
  collegeCalendar,
  onAddIngestedEvent,
  onApplyEventScheduleChange,
  onSelectEvent,
  onNavigate,
}) => {
  const [sourceUrl, setSourceUrl] = useState(
    'https://jssstuniv.in/events/sjce-buildathon-2026'
  );
  const [rawText, setRawText] = useState(SAMPLE_2026_CIRCULAR);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionResult, setIngestionResult] = useState<any | null>(null);
  const [publishedEventId, setPublishedEventId] = useState<string | null>(null);

  // Stage 6: Schedule Change & Deadline Extension Detector State
  const active2026Events = events.filter((e) => e.editionYear >= 2026);
  const defaultTargetEvent =
    active2026Events.find((e) => e.id === 'hack-rvce-deeptech-2026') ||
    active2026Events[0];

  const [changeEventId, setChangeEventId] = useState<string>(
    defaultTargetEvent?.id || ''
  );
  const [newRegCloseDate, setNewRegCloseDate] = useState<string>('2026-11-15');
  const [newStartDate, setNewStartDate] = useState<string>('2026-11-28');
  const [newEndDate, setNewEndDate] = useState<string>('2026-11-29');
  const [corrigendumUrl, setCorrigendumUrl] = useState<string>(
    'https://rvce.edu.in/deeptech-2026/corrigendum-post-exams'
  );
  const [isDetectingChanges, setIsDetectingChanges] = useState(false);
  const [changeDetectionResult, setChangeDetectionResult] = useState<any | null>(
    null
  );
  const [appliedScheduleUpdate, setAppliedScheduleUpdate] = useState(false);

  const selectedTargetEvent =
    active2026Events.find((e) => e.id === changeEventId) || defaultTargetEvent;

  const handleSelectTargetEventForChange = (id: string) => {
    setChangeEventId(id);
    setChangeDetectionResult(null);
    setAppliedScheduleUpdate(false);
    const found = active2026Events.find((e) => e.id === id);
    if (found) {
      // Pre-fill a realistic post-exam reschedule window so user can test compatibility shift
      setNewRegCloseDate('2026-11-15');
      setNewStartDate('2026-11-28');
      setNewEndDate('2026-11-29');
      setCorrigendumUrl(`${found.officialWebsite}/schedule-update`);
    }
  };

  const handleRunLiveIngestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIngesting(true);
    setIngestionResult(null);
    setPublishedEventId(null);

    try {
      const response = await fetch('/api/sources/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUrl,
          rawAnnouncementText: rawText,
        }),
      });
      const data = await response.json();
      setIngestionResult(data);
    } catch (err: any) {
      setIngestionResult({
        ok: false,
        error: err?.message || 'Failed to connect to ingestion endpoint.',
      });
    } finally {
      setIsIngesting(false);
    }
  };

  const handleRunChangeDetection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetEvent) return;
    setIsDetectingChanges(true);
    setChangeDetectionResult(null);
    setAppliedScheduleUpdate(false);

    try {
      const response = await fetch('/api/sources/detect-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedTargetEvent.id,
          currentStartDate: selectedTargetEvent.startDate,
          currentEndDate: selectedTargetEvent.endDate,
          currentRegCloseDate: selectedTargetEvent.registrationCloseDate,
          newStartDate,
          newEndDate,
          newRegCloseDate,
          sourceUrl: corrigendumUrl,
          announcementNote:
            'Organizer rescheduled finale after VTU/BMSCE end-semester exams',
        }),
      });
      const data = await response.json();
      setChangeDetectionResult(data);
    } catch (err: any) {
      setChangeDetectionResult({
        ok: false,
        error: err?.message || 'Failed to run schedule change detection.',
      });
    } finally {
      setIsDetectingChanges(false);
    }
  };

  const handleCommitDetectedChanges = () => {
    if (!selectedTargetEvent || !changeDetectionResult?.ok) return;
    onApplyEventScheduleChange(
      selectedTargetEvent.id,
      changeDetectionResult.updatedDates,
      changeDetectionResult.changes
    );
    setAppliedScheduleUpdate(true);
  };

  const handlePublishCandidateToDatabase = () => {
    if (!ingestionResult?.candidate) return;
    const c = ingestionResult.candidate;
    const newId = `hack-ingested-${Date.now().toString().slice(-4)}`;
    const newEvent: HackathonEvent = {
      id: newId,
      slug: (c.title || 'ingested-hackathon')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-'),
      editionYear: Number(c.editionYear || 2026),
      title: c.title || 'Ingested Karnataka Hackathon 2026',
      description: c.description || rawText.slice(0, 260),
      organizer: c.organizer || 'College Innovation Cell',
      organizingCollege: c.organizingCollege || 'Karnataka Engineering College',
      category:
        c.category === 'hardware' || c.category === 'both'
          ? c.category
          : 'software',
      domains: (Array.isArray(c.domains) && c.domains.length > 0
        ? c.domains
        : ['AI/ML', 'Web Development']) as HackathonDomain[],
      startDate: c.startDate || '2026-11-08',
      endDate: c.endDate || '2026-11-09',
      registrationOpenDate: '2026-10-15',
      registrationCloseDate: c.registrationCloseDate || '2026-10-31',
      timezone: 'Asia/Kolkata',
      rounds: [
        {
          id: `r1-${newId}`,
          roundNumber: 1,
          name: 'Online Registration & Proposal',
          type: 'registration',
          startDate: '2026-10-15',
          endDate: c.registrationCloseDate || '2026-10-31',
          requiresPhysicalAttendance: false,
          description: 'Submit team registration before deadline.',
          mode: 'online',
        },
        {
          id: `r2-${newId}`,
          roundNumber: 2,
          name: 'On-Campus Hackathon Finale',
          type: 'finale',
          startDate: c.startDate || '2026-11-08',
          endDate: c.endDate || '2026-11-09',
          requiresPhysicalAttendance: true,
          description: 'Extracted from official source announcement.',
          mode: c.mode === 'online' || c.mode === 'hybrid' ? c.mode : 'offline',
        },
      ],
      venueName: `${c.organizingCollege || 'Campus'} Auditorium`,
      city: c.city || 'Mysuru',
      district: c.district === 'Mysuru' ? 'Mysuru' : 'Bengaluru Urban',
      state: 'Karnataka',
      country: 'India',
      distanceFromBengaluruKm: (c.city || '').toLowerCase().includes('mys') ? 145 : 12,
      mode: c.mode === 'online' || c.mode === 'hybrid' ? c.mode : 'offline',
      eligibilityCriteria:
        'Extracted from permitted source circular. Verify on official URL.',
      eligibleYears:
        Array.isArray(c.eligibleYears) && c.eligibleYears.length > 0
          ? c.eligibleYears
          : ['1st Year', '2nd Year', '3rd Year', '4th Year'],
      eligibleBranches: ['All Branches'],
      teamSizeMin: 2,
      teamSizeMax: 4,
      prizePool: c.prizePool ? Number(c.prizePool) : null,
      prizeCurrency: 'INR',
      participationFee: c.participationFee ? Number(c.participationFee) : 0,
      officialRegistrationUrl: c.sourceUrl || sourceUrl,
      officialWebsite: c.sourceUrl || sourceUrl,
      sources: [
        {
          id: `src-${newId}`,
          platform: 'Permitted Public Feed',
          url: c.sourceUrl || sourceUrl,
          discoveredAt: new Date().toISOString(),
          lastCheckedAt: new Date().toISOString(),
          isPrimary: true,
          evidenceSnippet: c.evidenceSnippet || rawText.slice(0, 120),
          extractionMethod: 'ai_extracted',
          confidenceScore: Number(c.confidenceScore ?? 0.9),
        },
      ],
      changeHistory: [],
      verificationStatus: 'pending',
      extractedAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      lastVerifiedAt: null,
      status: c.status || 'upcoming',
      confidenceScore: Number(c.confidenceScore ?? 0.9),
      missingFields: Array.isArray(c.missingFields) ? c.missingFields : [],
      beginnerFriendly: true,
      themes: ['Cyber-Physical Systems', 'Applied AI'],
      artworkVariant: 'mysuru_iot',
      dataOrigin: 'live_ingested',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddIngestedEvent(newEvent);
    setPublishedEventId(newId);
  };

  const handleDownloadN8nWorkflowJson = () => {
    const workflowJson = {
      name: 'Hackathon Radar — Scheduled Permitted Source Ingestion & Compatibility Refresh',
      nodes: [
        {
          id: 'cron-trigger',
          name: 'Every 6 Hours Schedule Trigger',
          type: 'n8n-nodes-base.scheduleTrigger',
          parameters: { rule: { interval: [{ field: 'hours', hoursInterval: 6 }] } },
        },
        {
          id: 'fetch-permitted-sources',
          name: 'Fetch Enabled Source Adapters',
          type: 'n8n-nodes-base.httpRequest',
          parameters: {
            method: 'POST',
            url: '{{$env.APP_URL}}/api/sources/ingest',
            sendBody: true,
          },
        },
        {
          id: 'historical-year-guardrail',
          name: 'Reject <2026 Historical Editions',
          type: 'n8n-nodes-base.if',
          parameters: {
            conditions: {
              number: [
                {
                  value1: '={{$json.candidate.editionYear}}',
                  operation: 'largerEqual',
                  value2: 2026,
                },
              ],
            },
          },
        },
      ],
    };

    const blob = new Blob([JSON.stringify(workflowJson, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hackathon-radar-n8n-workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Compute before/after compatibility preview for Stage 6 Change Detector
  const currentComp = selectedTargetEvent
    ? evaluateAcademicCompatibility(
        selectedTargetEvent,
        collegeCalendar?.items || [],
        student
      )
    : null;

  const previewUpdatedComp =
    selectedTargetEvent && changeDetectionResult?.ok
      ? evaluateAcademicCompatibility(
          {
            ...selectedTargetEvent,
            startDate: changeDetectionResult.updatedDates.startDate,
            endDate: changeDetectionResult.updatedDates.endDate,
            registrationCloseDate:
              changeDetectionResult.updatedDates.registrationCloseDate,
            rounds: selectedTargetEvent.rounds.map((r, idx) =>
              idx === selectedTargetEvent.rounds.length - 1
                ? {
                    ...r,
                    startDate: changeDetectionResult.updatedDates.startDate,
                    endDate: changeDetectionResult.updatedDates.endDate,
                  }
                : r
            ),
          },
          collegeCalendar?.items || [],
          student
        )
      : null;

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Page Header */}
      <div className="border-b border-[#27272A] pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#A78BFA] font-medium mb-1">
            <span>Stage 5 & Stage 6 Implementation</span>
            <span aria-hidden="true">·</span>
            <span>
              Permitted Source Adapters · Historical 2025 Rejection · Schedule Diff Detector
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#FAFAFA]">
            Real Event Ingestion, Change Tracking & Source Health
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1 max-w-3xl">
            Test the end-to-end permitted source extraction pipeline (`POST /api/sources/ingest`), verify that 2025 historical circulars are blocked, and simulate organizer deadline extensions & round reschedules (`POST /api/sources/detect-changes`).
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadN8nWorkflowJson}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-xs font-semibold text-[#FAFAFA] shrink-0"
        >
          <Download className="w-4 h-4 text-[#8B5CF6]" />
          <span>Download n8n Workflow JSON</span>
        </button>
      </div>

      {/* 1. Live End-to-End Source Extraction & Historical Validation Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form
          onSubmit={handleRunLiveIngestion}
          className="lg:col-span-7 bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#27272A] pb-3">
            <h2 className="font-display text-lg font-bold text-[#FAFAFA]">
              1. End-to-End Permitted Source Extraction Pipeline
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSourceUrl('https://jssstuniv.in/events/sjce-buildathon-2026');
                  setRawText(SAMPLE_2026_CIRCULAR);
                  setIngestionResult(null);
                }}
                className="px-2.5 py-1 rounded bg-[#18181B] border border-[#27272A] text-[11px] font-medium text-[#22C55E]"
              >
                Load 2026 SJCE Mysuru Circular
              </button>
              <button
                type="button"
                onClick={() => {
                  setSourceUrl('https://example-blr-college.edu.in/open-hack-2025');
                  setRawText(SAMPLE_2025_HISTORICAL_TRAP);
                  setIngestionResult(null);
                }}
                className="px-2.5 py-1 rounded bg-[#18181B] border border-[#27272A] text-[11px] font-medium text-[#F59E0B]"
              >
                Load 2025 Historical Trap
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#A1A1AA] block">
              Permitted Source URL
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#18181B] border border-[#27272A] text-xs font-mono text-[#FAFAFA]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#A1A1AA] block">
              Official Announcement / Feed Payload Text
            </label>
            <textarea
              rows={7}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-xs font-mono text-[#FAFAFA]"
            />
          </div>

          <button
            type="submit"
            disabled={isIngesting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-semibold text-[#FAFAFA]"
          >
            <RefreshCw className={`w-4 h-4 ${isIngesting ? 'animate-spin' : ''}`} />
            <span>
              {isIngesting
                ? 'Running Server Extraction & 2026 Validation...'
                : 'Extract, Validate & Check Edition Year'}
            </span>
          </button>
        </form>

        {/* Right 5 Columns: Extraction & Validation Output */}
        <div className="lg:col-span-5 bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#FAFAFA] border-b border-[#27272A] pb-3">
            Extraction & Data Quality Verdict
          </h2>

          {!ingestionResult ? (
            <div className="py-12 text-center space-y-2 text-xs text-[#71717A]">
              <Globe className="w-7 h-7 text-[#71717A] mx-auto mb-2" />
              <p className="text-[#A1A1AA] font-medium">
                Click "Extract, Validate & Check Edition Year" to run the server pipeline.
              </p>
              <p>
                Try both the 2026 SJCE Mysuru circular and the 2025 Historical Trap to see how Section 6 Data Quality Rules prevent stale events from polluting current listings.
              </p>
            </div>
          ) : !ingestionResult.ok ? (
            <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444]">
              {ingestionResult.error}
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                  ingestionResult.isHistoricalRejected
                    ? 'bg-[#F59E0B]/10 border-[#F59E0B]/40 text-[#F59E0B]'
                    : 'bg-[#22C55E]/10 border-[#22C55E]/40 text-[#22C55E]'
                }`}
              >
                {ingestionResult.isHistoricalRejected ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-semibold">
                    {ingestionResult.isHistoricalRejected
                      ? 'Historical Edition Blocked from Upcoming Opportunities'
                      : 'Validated 2026 Upcoming Event Candidate'}
                  </p>
                  <p className="text-[#FAFAFA]/90 leading-relaxed">
                    {ingestionResult.validationSummary}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2">
                <div className="flex items-center justify-between text-[#71717A] font-mono">
                  <span>Engine: {ingestionResult.extractionEngine}</span>
                  <span>
                    Confidence: {Math.round((ingestionResult.candidate.confidenceScore || 0.9) * 100)}%
                  </span>
                </div>
                <p className="text-sm font-bold text-[#FAFAFA]">
                  {ingestionResult.candidate.title}
                </p>
                <p className="text-[#A1A1AA]">
                  College: {ingestionResult.candidate.organizingCollege} ({ingestionResult.candidate.city})
                </p>
                <p className="font-mono text-[#FAFAFA]">
                  Edition: {ingestionResult.candidate.editionYear} · Reg Close:{' '}
                  {ingestionResult.candidate.registrationCloseDate || 'Unconfirmed'} · Participation:{' '}
                  {ingestionResult.candidate.startDate} to {ingestionResult.candidate.endDate}
                </p>
                <p className="text-[#71717A]">
                  Assigned Verification Status: <strong className="text-[#F59E0B]">pending</strong> (Auto-extracted records require human verification before earning a Verified badge)
                </p>
              </div>

              {!ingestionResult.isHistoricalRejected && !publishedEventId && (
                <button
                  type="button"
                  onClick={handlePublishCandidateToDatabase}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-xs font-semibold text-[#09090B]"
                >
                  Save Candidate to Active Event Database & Compute Compatibility
                </button>
              )}

              {publishedEventId && (
                <div className="p-3.5 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 flex items-center justify-between">
                  <span className="text-[#FAFAFA] font-medium">
                    Added to Live Database!
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectEvent(publishedEventId)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#A78BFA] hover:underline"
                  >
                    <span>Inspect Event & Compatibility</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Stage 6: Live Organizer Schedule Change & Deadline Extension Detector */}
      <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-6">
        <div className="border-b border-[#27272A] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-[#8B5CF6]" />
            <div>
              <h2 className="font-display text-lg font-bold text-[#FAFAFA]">
                2. Organizer Schedule Change & Deadline Extension Detector (`POST /api/sources/detect-changes`)
              </h2>
              <p className="text-xs text-[#A1A1AA] mt-0.5">
                Simulate an official corrigendum where an organizer extends registration or moves participation dates after college exams—recording an audit trail in <code className="font-mono text-[#FAFAFA]">changeHistory</code> and recalculating student compatibility.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleRunChangeDetection}
            className="lg:col-span-7 space-y-4 text-xs"
          >
            <div className="space-y-1.5">
              <label className="text-[#A1A1AA] font-medium block">
                Select Active 2026 Hackathon to Check for Organizer Schedule Updates
              </label>
              <select
                value={changeEventId}
                onChange={(e) => handleSelectTargetEventForChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-xs text-[#FAFAFA]"
              >
                {active2026Events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} (Current: {ev.startDate} to {ev.endDate} · Reg:{' '}
                    {ev.registrationCloseDate})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[#A1A1AA] block mb-1">
                  Updated Reg. Close Date
                </label>
                <input
                  type="date"
                  value={newRegCloseDate}
                  onChange={(e) => setNewRegCloseDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#18181B] border border-[#27272A] font-mono text-xs text-[#FAFAFA]"
                />
              </div>
              <div>
                <label className="text-[#A1A1AA] block mb-1">
                  Rescheduled Start Date
                </label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#18181B] border border-[#27272A] font-mono text-xs text-[#FAFAFA]"
                />
              </div>
              <div>
                <label className="text-[#A1A1AA] block mb-1">
                  Rescheduled End Date
                </label>
                <input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#18181B] border border-[#27272A] font-mono text-xs text-[#FAFAFA]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[#A1A1AA] block">
                Official Corrigendum / Updated Source URL
              </label>
              <input
                type="url"
                value={corrigendumUrl}
                onChange={(e) => setCorrigendumUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-[#18181B] border border-[#27272A] font-mono text-xs text-[#FAFAFA]"
              />
            </div>

            <button
              type="submit"
              disabled={isDetectingChanges}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-semibold text-[#FAFAFA]"
            >
              <RefreshCw
                className={`w-4 h-4 ${isDetectingChanges ? 'animate-spin' : ''}`}
              />
              <span>Run Server Diff & Preview Compatibility Impact</span>
            </button>
          </form>

          {/* Right 5 cols: Diff & Compatibility Shift Preview */}
          <div className="lg:col-span-5 bg-[#18181B] border border-[#27272A] rounded-xl p-5 space-y-4 text-xs">
            <h3 className="font-display text-sm font-bold text-[#FAFAFA] border-b border-[#27272A] pb-2.5">
              Detected Schedule Diff & Compatibility Recalculation
            </h3>

            {!changeDetectionResult ? (
              <div className="py-6 text-[#A1A1AA] space-y-2 leading-relaxed">
                <p>
                  Current Status for <strong className="text-[#FAFAFA]">{selectedTargetEvent?.title}</strong>:
                </p>
                {currentComp && (
                  <div className="p-3 rounded-lg bg-[#111114] border border-[#27272A] space-y-1">
                    <span className="font-semibold text-[#F59E0B] block">
                      Current Verdict: {currentComp.badgeLabel}
                    </span>
                    <p className="text-[#71717A]">{currentComp.headlineReasoning}</p>
                  </div>
                )}
                <p className="text-[#71717A]">
                  Click "Run Server Diff & Preview Compatibility Impact" to test how rescheduling the event to Nov 28–29, 2026 resolves the exam preparation conflict.
                </p>
              </div>
            ) : !changeDetectionResult.ok ? (
              <div className="p-3.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444]">
                {changeDetectionResult.error}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[#22C55E] font-medium">
                  {changeDetectionResult.auditMessage}
                </p>

                <div className="space-y-1.5">
                  {changeDetectionResult.changes.map((chg: FieldChangeRecord) => (
                    <div
                      key={chg.id}
                      className="p-2.5 rounded bg-[#111114] border border-[#27272A] font-mono text-[11px]"
                    >
                      <span className="text-[#A78BFA]">{chg.field}</span>:{' '}
                      <span className="line-through text-[#71717A]">
                        {chg.previousValue}
                      </span>{' '}
                      → <span className="text-[#22C55E] font-semibold">{chg.newValue}</span>
                    </div>
                  ))}
                </div>

                {currentComp && previewUpdatedComp && (
                  <div className="p-3 rounded-lg bg-[#111114] border border-[#27272A] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#71717A]">Compatibility Shift:</span>
                      <span className="font-semibold text-[#22C55E]">
                        {currentComp.badgeLabel} → {previewUpdatedComp.badgeLabel}
                      </span>
                    </div>
                    <p className="text-[#A1A1AA]">{previewUpdatedComp.headlineReasoning}</p>
                  </div>
                )}

                {!appliedScheduleUpdate ? (
                  <button
                    type="button"
                    onClick={handleCommitDetectedChanges}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-xs font-semibold text-[#09090B]"
                  >
                    Apply Schedule Update & Save Change Audit History
                  </button>
                ) : (
                  <div className="p-3 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 flex items-center justify-between">
                    <span className="text-[#FAFAFA] font-medium">
                      Schedule & Change History Updated!
                    </span>
                    {selectedTargetEvent && (
                      <button
                        type="button"
                        onClick={() => onSelectEvent(selectedTargetEvent.id)}
                        className="text-[#A78BFA] font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <span>Inspect Event</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Source Coverage & Health Dashboard */}
      <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-5">
        <div className="border-b border-[#27272A] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-[#FAFAFA]">
              3. Source Coverage & Adapter Health Dashboard
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Honest source coverage disclosure: Hackathon Radar only ingests from permitted feeds, official circulars, and direct submissions—never claiming unrestricted internet-wide scraping.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="text-xs font-semibold text-[#A78BFA] hover:underline shrink-0"
          >
            View Ingested Events in Explore →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {adapters.map((adapter) => (
            <div
              key={adapter.id}
              className="p-5 rounded-xl bg-[#18181B] border border-[#27272A] flex flex-col justify-between space-y-4 text-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#A1A1AA] font-medium">{adapter.category}</span>
                  <span
                    className={`font-semibold ${
                      adapter.status === 'healthy'
                        ? 'text-[#22C55E]'
                        : adapter.status === 'requires_credentials'
                        ? 'text-[#F59E0B]'
                        : 'text-[#EF4444]'
                    }`}
                  >
                    {adapter.status === 'healthy'
                      ? 'Connected & Healthy'
                      : adapter.status === 'requires_credentials'
                      ? 'Requires Feed / Partner Key'
                      : 'Failed'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#FAFAFA]">{adapter.name}</h3>
                <p className="font-mono text-[11px] text-[#71717A] break-all">
                  {adapter.targetUrl}
                </p>
                <p className="text-[#A1A1AA] leading-relaxed">
                  {adapter.complianceNote}
                </p>
                {adapter.recentError && (
                  <p className="text-[11px] text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded p-2">
                    {adapter.recentError}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#27272A] flex items-center justify-between text-[11px] font-mono text-[#71717A]">
                <span>Discovered: {adapter.eventsDiscoveredCount}</span>
                <span>
                  Last Check:{' '}
                  {adapter.lastCheckedAt ? adapter.lastCheckedAt.slice(0, 10) : 'Never'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
