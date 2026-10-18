import React from 'react';
import { Bookmark, ArrowUpRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  CollegeAcademicCalendar,
  HackathonEvent,
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
import { EventArtworkBanner } from './VisualAssets';

interface EventCardProps {
  event: HackathonEvent;
  student: StudentProfile;
  collegeCalendar?: CollegeAcademicCalendar;
  isSaved: boolean;
  onToggleSave: (eventId: string) => void;
  onSelectEvent: (eventId: string) => void;
  layout?: 'grid' | 'list';
  showBanner?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  student,
  collegeCalendar,
  isSaved,
  onToggleSave,
  onSelectEvent,
  layout = 'grid',
  showBanner = false,
}) => {
  const daysLeft = getDaysRemaining(event.registrationCloseDate);
  const eligibility = checkStudentEligibility(event, student);
  const compatibility = evaluateAcademicCompatibility(
    event,
    collegeCalendar?.items || [],
    student
  );

  const isHistorical =
    event.editionYear < 2026 || event.status === 'historical_archived';
  const isExpired =
    isHistorical || event.status === 'completed' || daysLeft < 0;
  const isUrgent = !isExpired && daysLeft <= 7;

  return (
    <article
      className={`group bg-[#111114] hover:bg-[#18181B]/70 border border-[#27272A] hover:border-[#3F3F46] rounded-xl overflow-hidden transition-colors flex flex-col justify-between ${
        layout === 'list' ? 'sm:flex-row sm:items-stretch' : ''
      }`}
    >
      {showBanner && layout === 'grid' && (
        <div onClick={() => onSelectEvent(event.id)} className="cursor-pointer">
          <EventArtworkBanner
            variant={event.artworkVariant}
            category={event.category}
            city={event.city}
          />
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2.5">
          {/* Quiet 1-line unboxed kicker with typographic separators (Zero-Pill Discipline) */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#A1A1AA]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[#FAFAFA] font-semibold">
                {event.editionYear} Edition
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-[#FAFAFA]/90">
                {event.category === 'both'
                  ? 'Software & Hardware'
                  : event.category === 'software'
                  ? 'Software'
                  : 'Hardware'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{event.mode}</span>
              <span aria-hidden="true">·</span>
              <span>{event.city}, KA</span>
              <span aria-hidden="true">·</span>
              {isHistorical ? (
                <span className="text-[#EF4444] font-semibold">
                  Historical {event.editionYear} Archive
                </span>
              ) : event.verificationStatus === 'verified' ? (
                <span className="text-[#22C55E] font-medium">
                  Verified Official Source
                </span>
              ) : (
                <span className="text-[#F59E0B] font-medium">
                  Unverified / Pending Review
                </span>
              )}
              <span aria-hidden="true">·</span>
              <span className="text-[#71717A]">
                {event.dataOrigin === 'live_ingested'
                  ? 'Live Ingested'
                  : event.dataOrigin === 'user_submitted'
                  ? 'User Submitted'
                  : 'Sample Record'}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(event.id);
              }}
              aria-label={
                isSaved
                  ? `Remove ${event.title} from saved`
                  : `Save ${event.title}`
              }
              className={`p-2 -m-1 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${
                isSaved
                  ? 'text-[#8B5CF6] bg-[#8B5CF6]/10'
                  : 'text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B]'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Primary Event Title & Organizer */}
          <div>
            <h3 className="font-display text-base sm:text-lg font-semibold text-[#FAFAFA] leading-snug">
              <button
                type="button"
                onClick={() => onSelectEvent(event.id)}
                className="text-left hover:text-[#A78BFA] transition-colors focus-visible:outline-none focus-visible:underline"
              >
                {event.title}
              </button>
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-1">
              {event.organizingCollege} · {event.organizer}
            </p>
          </div>

          {/* Unboxed domain list separated by middots */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#71717A] pt-0.5">
            {event.domains.map((domain, index) => (
              <React.Fragment key={domain}>
                {index > 0 && <span aria-hidden="true">·</span>}
                <span className="text-[#A1A1AA]">{domain}</span>
              </React.Fragment>
            ))}
            {event.beginnerFriendly && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#38BDF8]">Beginner Friendly</span>
              </>
            )}
          </div>
        </div>

        {/* Deterministic Academic Compatibility Explanation Bar */}
        {!isHistorical && (
          <div
            className={`px-3.5 py-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
              compatibility.status === 'compatible'
                ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
                : compatibility.status === 'academic_conflict'
                ? 'bg-[#EF4444]/10 border-[#EF4444]/35 text-[#EF4444]'
                : compatibility.status === 'prep_risk'
                ? 'bg-[#F59E0B]/10 border-[#F59E0B]/35 text-[#F59E0B]'
                : compatibility.status === 'travel_risk'
                ? 'bg-[#38BDF8]/10 border-[#38BDF8]/35 text-[#38BDF8]'
                : 'bg-[#8B5CF6]/10 border-[#8B5CF6]/35 text-[#A78BFA]'
            }`}
          >
            {compatibility.status === 'compatible' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <span className="font-semibold block">
                {compatibility.badgeLabel} ({collegeCalendar?.shortName || 'Academic Schedule'})
              </span>
              <p className="text-[#FAFAFA]/90 leading-relaxed">
                {compatibility.headlineReasoning}
              </p>
            </div>
          </div>
        )}

        {/* Bottom aligned metadata row */}
        <div className="pt-3 border-t border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-x-5 gap-y-1 text-xs">
            <div>
              <span className="text-[#71717A] block sm:inline sm:mr-1.5">
                Participation:
              </span>
              <span className="font-mono tabular-nums text-[#FAFAFA]">
                {formatDateRange(event.startDate, event.endDate)}
              </span>
            </div>
            <div>
              <span className="text-[#71717A] block sm:inline sm:mr-1.5">
                Reg. Closes:
              </span>
              <span
                className={`font-mono tabular-nums font-medium ${
                  isExpired
                    ? 'text-[#71717A] line-through'
                    : isUrgent
                    ? 'text-[#F59E0B]'
                    : 'text-[#22C55E]'
                }`}
              >
                {formatShortDate(event.registrationCloseDate)}
                {!isExpired && daysLeft < 365 && ` (${daysLeft}d left)`}
              </span>
            </div>
            <div>
              <span className="text-[#71717A] block sm:inline sm:mr-1.5">Prize:</span>
              <span className="font-mono tabular-nums text-[#FAFAFA] font-medium">
                {formatINR(event.prizePool)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <span
              className={`text-xs font-medium ${
                eligibility.status === 'eligible'
                  ? 'text-[#22C55E]'
                  : eligibility.status === 'ineligible'
                  ? 'text-[#EF4444]'
                  : 'text-[#F59E0B]'
              }`}
            >
              {eligibility.summaryLabel}
            </span>

            <button
              type="button"
              onClick={() => onSelectEvent(event.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#18181B] hover:bg-[#27272A] text-[#FAFAFA] border border-[#27272A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
            >
              <span>Inspect Compatibility</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
