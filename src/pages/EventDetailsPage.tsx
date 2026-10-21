import React, { useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Calendar,
  Download,
} from 'lucide-react';
import {
  ActiveRoute,
  CollegeAcademicCalendar,
  HackathonEvent,
  SavedRegistrationStage,
  StudentProfile,
} from '../types/hackathon';
import {
  checkStudentEligibility,
  evaluateAcademicCompatibility,
  formatDateRange,
  formatINR,
  formatShortDate,
  getDaysRemaining,
} from '../data/mockData';
import { EventArtworkBanner } from '../components/VisualAssets';

interface EventDetailsPageProps {
  event: HackathonEvent;
  student: StudentProfile;
  onUpdateStudent?: (updated: StudentProfile) => void;
  collegeCalendar?: CollegeAcademicCalendar;
  isSaved: boolean;
  savedStage?: SavedRegistrationStage;
  onToggleSave: (eventId: string) => void;
  onUpdateStage: (eventId: string, stage: SavedRegistrationStage) => void;
  onBack: () => void;
  onNavigate: (route: ActiveRoute) => void;
}

export const EventDetailsPage: React.FC<EventDetailsPageProps> = ({
  event,
  student,
  onUpdateStudent,
  collegeCalendar,
  isSaved,
  savedStage = 'bookmarked',
  onToggleSave,
  onUpdateStage,
  onBack,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<
    'compatibility' | 'overview' | 'schedule' | 'eligibility' | 'prizes'
  >('compatibility');
  const [showOfficialRedirectModal, setShowOfficialRedirectModal] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const daysLeft = getDaysRemaining(event.registrationCloseDate);
  const eligibility = checkStudentEligibility(event, student);
  const compatibility = evaluateAcademicCompatibility(
    event,
    collegeCalendar?.items || [],
    student
  );

  const handleCopyShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  const handleDownloadIcsCalendar = () => {
    const startCompact = (event.startDate || '2026-11-06').replace(/-/g, '');
    const endCompact = (event.endDate || '2026-11-07').replace(/-/g, '');
    const regCompact = (event.registrationCloseDate || '2026-10-30').replace(
      /-/g,
      ''
    );

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Hackathon Radar//Karnataka 2026//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}-participation@hackathonradar.app`,
      `DTSTART;VALUE=DATE:${startCompact}`,
      `DTEND;VALUE=DATE:${endCompact}`,
      `SUMMARY:${event.title} (Participation Window)`,
      `LOCATION:${event.venueName}, ${event.city}`,
      `DESCRIPTION:Compatibility Status: ${compatibility.badgeLabel}. ${compatibility.headlineReasoning} Official URL: ${event.officialRegistrationUrl}`,
      'END:VEVENT',
      'BEGIN:VEVENT',
      `UID:${event.id}-regdeadline@hackathonradar.app`,
      `DTSTART;VALUE=DATE:${regCompact}`,
      `DTEND;VALUE=DATE:${regCompact}`,
      `SUMMARY:Registration Closes: ${event.title}`,
      `DESCRIPTION:Submit your team registration on ${event.officialRegistrationUrl}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.slug}-2026-schedule.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore Hackathons</span>
        </button>

        <div className="text-xs text-[#71717A] font-mono">
          ID: {event.id} · {event.editionYear} Edition · Confidence:{' '}
          {Math.round(event.confidenceScore * 100)}%
        </div>
      </div>

      {/* Historical / Unverified Notice when applicable */}
      {(event.editionYear < 2026 ||
        event.verificationStatus !== 'verified' ||
        event.missingFields.length > 0) && (
        <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-[#FAFAFA]">
              {event.editionYear < 2026
                ? `Historical ${event.editionYear} Edition Archive — Not a Current 2026 Opportunity`
                : 'Notice: Partial or Unverified Organizer Details'}
            </p>
            <p className="text-[#A1A1AA] leading-relaxed">
              {event.editionYear < 2026
                ? 'This record is from a previous year and has no confirmed 2026 edition. Hackathon Radar never copies old dates into a new year.'
                : `Verification status: ${event.verificationStatus}. Missing/unconfirmed fields: ${
                    event.missingFields.join(', ') || 'None'
                  }. Never assume missing schedule details are guaranteed compatible.`}
            </p>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-[#111114] border border-[#27272A] rounded-xl overflow-hidden">
        <EventArtworkBanner
          variant={event.artworkVariant}
          category={event.category}
          city={`${event.city}, ${event.state}`}
          className="h-36 w-full"
        />

        <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA]">
              <span className="font-semibold text-[#FAFAFA]">
                {event.category === 'both'
                  ? 'Software + Hardware'
                  : event.category === 'software'
                  ? 'Software Track'
                  : 'Hardware Track'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{event.mode} Mode</span>
              <span aria-hidden="true">·</span>
              <span>
                {event.venueName} (~{event.distanceFromBengaluruKm} km from Bengaluru)
              </span>
              <span aria-hidden="true">·</span>
              {event.verificationStatus === 'verified' ? (
                <span className="text-[#22C55E] font-medium">
                  Verified Source (Checked {formatShortDate(event.lastCheckedAt.slice(0, 10))})
                </span>
              ) : (
                <span className="text-[#F59E0B] font-medium">
                  Awaiting Official Verification
                </span>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#FAFAFA]">
              {event.title}
            </h1>

            <p className="text-sm text-[#A1A1AA]">
              Organized by <span className="text-[#FAFAFA] font-medium">{event.organizer}</span> · {event.organizingCollege}
            </p>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleDownloadIcsCalendar}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-[#FAFAFA] transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4 text-[#8B5CF6]" />
              <span>Export .ICS</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleSave(event.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                isSaved
                  ? 'bg-[#8B5CF6]/15 border-[#8B5CF6] text-[#FAFAFA]'
                  : 'bg-[#18181B] border-[#27272A] text-[#FAFAFA] hover:bg-[#27272A]'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#8B5CF6] text-[#8B5CF6]' : ''}`} />
              <span>{isSaved ? 'Saved in Workspace' : 'Save Event'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowOfficialRedirectModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#8B5CF6] hover:bg-[#7C3AED] text-[#FAFAFA] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Official Registration Portal</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content + Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Interactive Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1 border-b border-[#27272A]">
            {(
              [
                {
                  id: 'compatibility',
                  label: `Academic Compatibility (${compatibility.badgeLabel})`,
                },
                { id: 'overview', label: 'Overview & Themes' },
                { id: 'schedule', label: `Rounds & Date History (${event.rounds.length})` },
                { id: 'eligibility', label: 'Eligibility & Rules' },
                { id: 'prizes', label: 'Prizes & Venue' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'border-[#8B5CF6] text-[#FAFAFA]'
                    : 'border-transparent text-[#A1A1AA] hover:text-[#FAFAFA]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Deterministic Academic Compatibility Proof */}
          {activeTab === 'compatibility' && (
            <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272A] pb-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#FAFAFA]">
                    Deterministic Academic Compatibility Analysis
                  </h2>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    Evaluated against {collegeCalendar?.collegeName} ({student.prepBufferDays}-day exam prep buffer · ±{student.travelBufferDays}-day travel buffer)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('my-academic-calendar')}
                  className="text-xs font-semibold text-[#A78BFA] hover:underline shrink-0"
                >
                  Upload PDF / Manage Full Calendar →
                </button>
              </div>

              {/* Headline Verdict */}
              <div
                className={`p-4 rounded-xl border space-y-2 text-xs ${
                  compatibility.status === 'compatible'
                    ? 'bg-[#22C55E]/10 border-[#22C55E]/40 text-[#22C55E]'
                    : compatibility.status === 'academic_conflict'
                    ? 'bg-[#EF4444]/10 border-[#EF4444]/40 text-[#EF4444]'
                    : compatibility.status === 'prep_risk'
                    ? 'bg-[#F59E0B]/10 border-[#F59E0B]/40 text-[#F59E0B]'
                    : compatibility.status === 'travel_risk'
                    ? 'bg-[#38BDF8]/10 border-[#38BDF8]/40 text-[#38BDF8]'
                    : 'bg-[#8B5CF6]/10 border-[#8B5CF6]/40 text-[#A78BFA]'
                }`}
              >
                <div className="font-bold text-sm flex items-center gap-2">
                  {compatibility.status === 'compatible' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span>Classification: {compatibility.badgeLabel}</span>
                </div>
                <p className="text-[#FAFAFA] leading-relaxed">
                  {compatibility.headlineReasoning}
                </p>
                <p className="text-[#A1A1AA] font-mono text-[11px]">
                  {compatibility.registrationDeadlineNote}
                </p>
              </div>

              {/* Interactive What-If Buffer Controls */}
              {onUpdateStudent && (
                <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <span className="text-[#A1A1AA] font-medium block">
                      What-If Exam Prep Buffer (Before Exams):
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 5].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() =>
                            onUpdateStudent({ ...student, prepBufferDays: days })
                          }
                          className={`px-3 py-1.5 rounded-lg font-mono font-semibold border transition-colors ${
                            student.prepBufferDays === days
                              ? 'bg-[#8B5CF6] border-[#8B5CF6] text-[#FAFAFA]'
                              : 'bg-[#111114] border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA]'
                          }`}
                        >
                          {days}d
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[#A1A1AA] font-medium block">
                      What-If Inter-City Travel Buffer:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() =>
                            onUpdateStudent({ ...student, travelBufferDays: days })
                          }
                          className={`px-3 py-1.5 rounded-lg font-mono font-semibold border transition-colors ${
                            student.travelBufferDays === days
                              ? 'bg-[#8B5CF6] border-[#8B5CF6] text-[#FAFAFA]'
                              : 'bg-[#111114] border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA]'
                          }`}
                        >
                          ±{days}d
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Round-by-Round Compatibility Breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[#FAFAFA] tracking-wide">
                  Round-by-Round Attendance Evaluation
                </h3>
                {compatibility.roundEvaluations.map((r) => (
                  <div
                    key={r.roundId}
                    className="p-3.5 rounded-xl bg-[#18181B] border border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#8B5CF6] font-semibold">
                          Round 0{r.roundNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#FAFAFA]">
                          {r.roundName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[#A1A1AA]">
                          {formatDateRange(r.startDate, r.endDate)}
                        </span>
                      </div>
                      <p className="text-[#A1A1AA]">{r.reason}</p>
                    </div>
                    <span
                      className={`font-semibold shrink-0 capitalize ${
                        r.status === 'compatible'
                          ? 'text-[#22C55E]'
                          : r.status === 'academic_conflict'
                          ? 'text-[#EF4444]'
                          : 'text-[#F59E0B]'
                      }`}
                    >
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#27272A] text-xs text-[#71717A]">
                Date Source Attribution:{' '}
                <span className="font-mono text-[#A1A1AA]">
                  {compatibility.sourceAttribution}
                </span>
              </div>
            </div>
          )}

          {/* Tab 2: Overview */}
          {activeTab === 'overview' && (
            <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#FAFAFA]">
                About the Hackathon
              </h2>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                {event.description}
              </p>

              <div className="pt-4 border-t border-[#27272A] space-y-3">
                <h3 className="text-sm font-semibold text-[#FAFAFA]">
                  Problem Tracks & Themes
                </h3>
                <ul className="space-y-2 text-sm text-[#A1A1AA]">
                  {event.themes.map((theme, i) => (
                    <li key={theme} className="flex items-start gap-2.5">
                      <span className="font-mono text-xs text-[#8B5CF6] mt-0.5">
                        0{i + 1}.
                      </span>
                      <span>{theme}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tab 3: Schedule & Change History */}
          {activeTab === 'schedule' && (
            <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-5">
              <h2 className="font-display text-lg font-bold text-[#FAFAFA]">
                Round Milestones & Historical Field Audit
              </h2>

              <div className="space-y-3">
                {event.rounds.map((round) => (
                  <div
                    key={round.id}
                    className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                        <span className="font-mono font-semibold text-[#8B5CF6]">
                          Round 0{round.roundNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="uppercase tracking-wider text-[#FAFAFA]">
                          {round.type}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{round.mode}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-[#FAFAFA]">
                        {round.name}
                      </h3>
                      <p className="text-xs text-[#A1A1AA]">{round.description}</p>
                    </div>
                    <span className="font-mono tabular-nums text-xs font-semibold text-[#FAFAFA]">
                      {formatDateRange(round.startDate, round.endDate)}
                    </span>
                  </div>
                ))}
              </div>

              {event.changeHistory.length > 0 && (
                <div className="pt-4 border-t border-[#27272A] space-y-2 text-xs">
                  <h3 className="font-semibold text-[#FAFAFA]">
                    Detected Schedule / Deadline Change History
                  </h3>
                  {event.changeHistory.map((ch) => (
                    <div
                      key={ch.id}
                      className="p-3 rounded-lg bg-[#18181B] border border-[#27272A] font-mono text-[#A1A1AA]"
                    >
                      Field "{ch.field}" updated from {ch.previousValue} →{' '}
                      <span className="text-[#22C55E]">{ch.newValue}</span> on{' '}
                      {ch.detectedAt.slice(0, 10)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Eligibility */}
          {activeTab === 'eligibility' && (
            <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-5">
              <h2 className="font-display text-lg font-bold text-[#FAFAFA]">
                Eligibility Check ({eligibility.summaryLabel})
              </h2>
              <div className="space-y-2">
                {eligibility.reasons.map((r) => (
                  <div
                    key={r}
                    className="p-3.5 rounded-lg bg-[#18181B] border border-[#27272A] text-xs text-[#FAFAFA]"
                  >
                    {r}
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#A1A1AA]">{event.eligibilityCriteria}</p>
            </div>
          )}

          {/* Tab 5: Prizes */}
          {activeTab === 'prizes' && (
            <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#FAFAFA]">
                Prize Pool: {formatINR(event.prizePool)}
              </h2>
              <p className="text-xs text-[#A1A1AA]">
                Venue: {event.venueName}, {event.city}, {event.state}
              </p>
            </div>
          )}
        </div>

        {/* Right 4 Columns: Countdown & Source Provenance */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A1A1AA]">Registration Deadline</span>
              <span className="font-mono tabular-nums text-[#FAFAFA] font-semibold">
                {formatShortDate(event.registrationCloseDate)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center bg-[#18181B] border border-[#27272A] rounded-xl p-3">
              <div>
                <span className="font-mono tabular-nums text-2xl font-bold text-[#FAFAFA] block">
                  {Math.max(0, daysLeft)}
                </span>
                <span className="text-[11px] text-[#71717A]">Days</span>
              </div>
              <div className="border-x border-[#27272A]">
                <span className="font-mono tabular-nums text-2xl font-bold text-[#FAFAFA] block">
                  09
                </span>
                <span className="text-[11px] text-[#71717A]">Hours</span>
              </div>
              <div>
                <span className="font-mono tabular-nums text-2xl font-bold text-[#FAFAFA] block">
                  15
                </span>
                <span className="text-[11px] text-[#71717A]">Mins</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowOfficialRedirectModal(true)}
              className="w-full py-3 px-4 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-semibold text-[#FAFAFA] transition-colors inline-flex items-center justify-center gap-2"
            >
              <span>Register on Official Website</span>
              <ExternalLink className="w-4 h-4" />
            </button>

            {isSaved && (
              <div className="pt-4 border-t border-[#27272A] space-y-2">
                <label className="text-xs font-medium text-[#A1A1AA] block">
                  Your Team Registration Status:
                </label>
                <select
                  value={savedStage}
                  onChange={(e) =>
                    onUpdateStage(event.id, e.target.value as SavedRegistrationStage)
                  }
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA]"
                >
                  <option value="bookmarked">Bookmarked (Not Registered Yet)</option>
                  <option value="team_forming">Forming Team</option>
                  <option value="registered_official">Registered on Official Portal</option>
                  <option value="round1_submitted">Round 1 / Abstract Submitted</option>
                </select>
              </div>
            )}

            <div className="pt-4 border-t border-[#27272A] flex items-center justify-between">
              <button
                type="button"
                onClick={() => onNavigate('calendar')}
                className="inline-flex items-center gap-1.5 text-xs text-[#A1A1AA] hover:text-[#FAFAFA]"
              >
                <Calendar className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>View on Monthly Calendar</span>
              </button>

              <button
                type="button"
                onClick={handleCopyShare}
                className="inline-flex items-center gap-1.5 text-xs text-[#A1A1AA] hover:text-[#FAFAFA]"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedShareLink ? 'Link Copied' : 'Share Event'}</span>
              </button>
            </div>
          </div>

          {/* Discovery Sources & Evidence */}
          <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-3">
            <h3 className="text-xs font-semibold text-[#FAFAFA] tracking-wide">
              Source Records & Supporting Evidence ({event.sources.length})
            </h3>
            <div className="space-y-2 pt-1">
              {event.sources.map((src) => (
                <div
                  key={src.id}
                  className="p-3 rounded-lg bg-[#18181B] border border-[#27272A] text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#FAFAFA]">{src.platform}</span>
                    <span className="font-mono text-[11px] text-[#22C55E]">
                      {Math.round(src.confidenceScore * 100)}% conf
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-[#A78BFA] truncate">
                    {src.url}
                  </p>
                  {src.evidenceSnippet && (
                    <p className="text-[11px] text-[#A1A1AA] italic">
                      "{src.evidenceSnippet}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {showOfficialRedirectModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
        >
          <div className="bg-[#111114] border border-[#27272A] rounded-xl max-w-md w-full p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#FAFAFA]">
              Proceed to Official Organizer Portal
            </h2>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Complete your team registration on the official organizer website:
            </p>
            <div className="p-3 rounded-lg bg-[#18181B] border border-[#27272A] font-mono text-xs text-[#A78BFA] break-all">
              {event.officialRegistrationUrl}
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowOfficialRedirectModal(false)}
                className="px-4 py-2 rounded-lg bg-[#18181B] border border-[#27272A] text-xs font-semibold text-[#A1A1AA]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isSaved) onToggleSave(event.id);
                  onUpdateStage(event.id, 'registered_official');
                  setShowOfficialRedirectModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-[#8B5CF6] text-xs font-semibold text-[#FAFAFA]"
              >
                Mark as Registered in Tracker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
