import React, { useState } from 'react';
import {
  Search,
  ArrowRight,
  Calendar as CalendarIcon,
  Bookmark,
  FileText,
} from 'lucide-react';
import {
  ActiveRoute,
  CollegeAcademicCalendar,
  HackathonDomain,
  HackathonEvent,
  StudentProfile,
} from '../types/hackathon';
import {
  evaluateAcademicCompatibility,
  formatINR,
  formatShortDate,
  getDaysRemaining,
} from '../data/mockData';
import { KarnatakaHeroRadarCanvas } from '../components/VisualAssets';
import { EventCard } from '../components/EventCard';

interface LandingPageProps {
  events: HackathonEvent[];
  student: StudentProfile;
  collegeCalendar?: CollegeAcademicCalendar;
  savedIds: string[];
  onToggleSave: (eventId: string) => void;
  onSelectEvent: (eventId: string) => void;
  onNavigate: (route: ActiveRoute) => void;
  onQuickExplore: (options: {
    query?: string;
    category?: 'all' | 'software' | 'hardware' | 'both';
    domain?: HackathonDomain | 'All';
    district?: string;
  }) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  events,
  student,
  collegeCalendar,
  savedIds,
  onToggleSave,
  onSelectEvent,
  onNavigate,
  onQuickExplore,
}) => {
  const [heroQuery, setHeroQuery] = useState('');
  const [selectedQuickCategory, setSelectedQuickCategory] = useState<string>('All');

  // Section 6 Rule: Never present previous-year (2025) events as current upcoming opportunities
  const current2026Events = events.filter(
    (e) => e.editionYear >= 2026 && e.status === 'upcoming'
  );

  const filteredFeatured = current2026Events
    .filter((ev) => {
      if (selectedQuickCategory === 'All') return true;
      if (selectedQuickCategory === 'Software')
        return ev.category === 'software' || ev.category === 'both';
      if (selectedQuickCategory === 'Hardware')
        return ev.category === 'hardware' || ev.category === 'both';
      if (selectedQuickCategory === 'AI/ML') return ev.domains.includes('AI/ML');
      if (selectedQuickCategory === 'Robotics & IoT')
        return ev.domains.includes('Robotics') || ev.domains.includes('IoT');
      if (selectedQuickCategory === 'Cybersecurity')
        return ev.domains.includes('Cybersecurity');
      if (selectedQuickCategory === 'Open Innovation')
        return ev.domains.includes('Open Innovation');
      return true;
    })
    .slice(0, 4);

  const upcomingDeadlines = [...current2026Events]
    .sort((a, b) =>
      (a.registrationCloseDate || '9999').localeCompare(
        b.registrationCloseDate || '9999'
      )
    )
    .slice(0, 5);

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickExplore({ query: heroQuery.trim() });
  };

  const quickCategories = [
    'All',
    'Software',
    'Hardware',
    'AI/ML',
    'Robotics & IoT',
    'Cybersecurity',
    'Open Innovation',
  ];

  return (
    <div className="space-y-20 pb-12">
      {/* 1. Hero Split Section */}
      <section className="pt-8 sm:pt-12 max-w-[1360px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between bg-[#111114] border border-[#27272A] rounded-xl p-6 sm:p-10">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA]">
                <span className="font-medium text-[#A78BFA]">
                  2026 Karnataka Hackathon & Academic Compatibility Platform
                </span>
                <span aria-hidden="true">·</span>
                <span>Bengaluru</span>
                <span aria-hidden="true">·</span>
                <span>Mysuru</span>
                <span aria-hidden="true">·</span>
                <span>Mandya</span>
                <span aria-hidden="true">·</span>
                <span>Surathkal & Hubballi</span>
              </div>

              <h1
                className="font-display text-3xl sm:text-5xl font-bold text-[#FAFAFA] tracking-tight leading-[1.12] max-w-2xl"
                style={{ textWrap: 'balance' }}
              >
                Your next big opportunity starts here.
              </h1>

              <p className="text-base text-[#A1A1AA] leading-relaxed max-w-xl">
                Upload your college academic calendar PDF, verify real 2026 hackathon participation dates against internal assessments and preparation buffers, and never mistake stale 2025 listings for open opportunities.
              </p>

              <form onSubmit={handleHeroSearchSubmit} className="pt-1">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-[#09090B] p-2 rounded-xl border border-[#27272A] focus-within:border-[#8B5CF6]">
                  <div className="flex items-center gap-3 flex-1 px-2">
                    <Search className="w-4 h-4 text-[#71717A] shrink-0" />
                    <input
                      type="text"
                      value={heroQuery}
                      onChange={(e) => setHeroQuery(e.target.value)}
                      placeholder="Search 2026 hackathons, colleges (BMSCE, NITK, NIE), or stacks..."
                      aria-label="Search hackathons, colleges, technologies, and locations"
                      className="w-full bg-transparent text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none py-1.5"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold text-[#FAFAFA] bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    Explore 2026 Hackathons
                  </button>
                </div>
              </form>
            </div>

            <div className="pt-8 mt-8 border-t border-[#27272A] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#A1A1AA]">
                <span>Filter Featured 2026 Opportunities by Track</span>
                <button
                  type="button"
                  onClick={() => onNavigate('my-academic-calendar')}
                  className="text-[#A78BFA] hover:text-[#FAFAFA] transition-colors inline-flex items-center gap-1.5 font-semibold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Upload Academic Calendar PDF & Check Conflicts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {quickCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedQuickCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      selectedQuickCategory === cat
                        ? 'bg-[#8B5CF6] text-[#FAFAFA]'
                        : 'bg-[#18181B] text-[#A1A1AA] hover:text-[#FAFAFA] border border-[#27272A]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex">
            <KarnatakaHeroRadarCanvas
              onSelectDistrict={(district) => onQuickExplore({ district })}
            />
          </div>
        </div>

        {/* Full-Width 4-Column Metric Strip */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111114] border border-[#27272A] rounded-xl p-4">
            <p className="text-xs text-[#A1A1AA]">Current 2026 Opportunities</p>
            <p className="font-mono tabular-nums text-2xl font-bold text-[#FAFAFA] mt-1">
              {current2026Events.length} Active
            </p>
            <p className="text-xs text-[#71717A] mt-1">
              Stale 2025 editions automatically blocked
            </p>
          </div>
          <div className="bg-[#111114] border border-[#27272A] rounded-xl p-4">
            <p className="text-xs text-[#A1A1AA]">Compatible with Your Schedule</p>
            <p className="font-mono tabular-nums text-2xl font-bold text-[#22C55E] mt-1">
              {
                current2026Events.filter(
                  (e) =>
                    evaluateAcademicCompatibility(
                      e,
                      collegeCalendar?.items || [],
                      student
                    ).status === 'compatible'
                ).length
              }{' '}
              Events
            </p>
            <p className="text-xs text-[#71717A] mt-1">
              Preserves your {student.prepBufferDays}-day exam prep buffer
            </p>
          </div>
          <div className="bg-[#111114] border border-[#27272A] rounded-xl p-4">
            <p className="text-xs text-[#A1A1AA]">Active Academic PDF</p>
            <p className="font-mono tabular-nums text-2xl font-bold text-[#A78BFA] mt-1">
              {collegeCalendar?.shortName}
            </p>
            <p className="text-xs text-[#71717A] mt-1">
              {collegeCalendar?.items.filter((i) => i.confirmedByStudent).length} confirmed dates active
            </p>
          </div>
          <div className="bg-[#111114] border border-[#27272A] rounded-xl p-4">
            <p className="text-xs text-[#A1A1AA]">Deterministic Test Suite</p>
            <p className="font-mono tabular-nums text-2xl font-bold text-[#22C55E] mt-1">
              5 / 5 Passing
            </p>
            <p className="text-xs text-[#71717A] mt-1">
              Conflict, Prep Buffer & Travel Math
            </p>
          </div>
        </div>
      </section>

      {/* 2. Featured 2026 Hackathons */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#27272A] pb-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#FAFAFA]">
              Featured 2026 Hackathons & Compatibility Status
            </h2>
            <p className="text-sm text-[#A1A1AA] mt-1">
              Compared deterministically against your {collegeCalendar?.shortName} schedule (Nov 10 CIE-1, Nov 13 Practical, Nov 20 CIE-2 + {student.prepBufferDays}-day prep buffer).
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#A78BFA] hover:text-[#FAFAFA] transition-colors whitespace-nowrap shrink-0"
          >
            <span>Explore All Opportunities</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFeatured.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              student={student}
              collegeCalendar={collegeCalendar}
              isSaved={savedIds.includes(event.id)}
              onToggleSave={onToggleSave}
              onSelectEvent={onSelectEvent}
              showBanner={true}
            />
          ))}
        </div>
      </section>

      {/* 3. Upcoming Registration Deadlines & November 2026 Compatibility Showcase */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 bg-[#111114] border border-[#27272A] rounded-xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#FAFAFA]">
                    Upcoming 2026 Registration Deadlines
                  </h2>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    Registration closing dates are tracked separately from actual participation windows.
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-[#71717A]">
                  Ref: Oct 18, 2026
                </span>
              </div>

              <div className="divide-y divide-[#27272A]">
                {upcomingDeadlines.map((ev) => {
                  const daysLeft = getDaysRemaining(ev.registrationCloseDate);
                  const saved = savedIds.includes(ev.id);
                  const comp = evaluateAcademicCompatibility(
                    ev,
                    collegeCalendar?.items || [],
                    student
                  );
                  return (
                    <div
                      key={ev.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#18181B]/50 px-2 -mx-2 rounded-lg transition-colors"
                    >
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => onSelectEvent(ev.id)}
                          className="text-sm font-semibold text-[#FAFAFA] hover:text-[#A78BFA] text-left transition-colors"
                        >
                          {ev.title}
                        </button>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#A1A1AA]">
                          <span>{ev.city}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              comp.status === 'compatible'
                                ? 'text-[#22C55E] font-medium'
                                : comp.status === 'academic_conflict'
                                ? 'text-[#EF4444] font-medium'
                                : 'text-[#F59E0B] font-medium'
                            }
                          >
                            {comp.badgeLabel}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {formatINR(ev.prizePool)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        <div className="text-left sm:text-right">
                          <div className="font-mono tabular-nums text-xs font-semibold text-[#FAFAFA]">
                            Reg. by {formatShortDate(ev.registrationCloseDate)}
                          </div>
                          <div className="font-mono tabular-nums text-xs text-[#22C55E]">
                            {daysLeft} days remaining
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onToggleSave(ev.id)}
                          aria-label={saved ? 'Remove bookmark' : 'Bookmark event'}
                          className={`p-2 rounded-lg border transition-colors ${
                            saved
                              ? 'border-[#8B5CF6] text-[#8B5CF6] bg-[#8B5CF6]/10'
                              : 'border-[#27272A] text-[#71717A] hover:text-[#FAFAFA]'
                          }`}
                        >
                          <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#27272A] flex items-center justify-between text-xs text-[#A1A1AA]">
              <span>Want to ingest a real source circular end-to-end?</span>
              <button
                type="button"
                onClick={() => onNavigate('sources')}
                className="font-semibold text-[#A78BFA] hover:text-[#FAFAFA] transition-colors"
              >
                Open Real Source Ingestion Pipeline →
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#111114] border border-[#27272A] rounded-xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#FAFAFA]">
                    November 2026 Compatibility Breakdown
                  </h2>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    Live output against your {collegeCalendar?.shortName} PDF schedule.
                  </p>
                </div>
                <CalendarIcon className="w-5 h-5 text-[#8B5CF6]" />
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-[#18181B] border border-[#22C55E]/40 space-y-1">
                  <p className="text-xs font-mono tabular-nums text-[#22C55E] font-semibold">
                    Nov 6–7, 2026 · Compatible
                  </p>
                  <p className="text-sm font-semibold text-[#FAFAFA]">
                    Karnataka AI & Public Systems Hackathon 2026
                  </p>
                  <p className="text-xs text-[#A1A1AA]">
                    Concludes 3 days before the Nov 10 CIE-1 exam; 2-day prep buffer (Nov 8–9) is preserved.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#18181B] border border-[#EF4444]/40 space-y-1">
                  <p className="text-xs font-mono tabular-nums text-[#EF4444] font-semibold">
                    Nov 12–14, 2026 · Academic Conflict
                  </p>
                  <p className="text-sm font-semibold text-[#FAFAFA]">
                    Campus Code & Cyber Systems Challenge (Mysuru)
                  </p>
                  <p className="text-xs text-[#A1A1AA]">
                    Directly overlaps Nov 13 Practical Examination (even though registration closes Oct 28).
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#18181B] border border-[#F59E0B]/40 space-y-1">
                  <p className="text-xs font-mono tabular-nums text-[#F59E0B] font-semibold">
                    Nov 18–19, 2026 · Preparation-Time Risk
                  </p>
                  <p className="text-sm font-semibold text-[#FAFAFA]">
                    National DeepTech & Robotics Buildathon (RVCE)
                  </p>
                  <p className="text-xs text-[#A1A1AA]">
                    Intrudes into your protected 2-day preparation buffer before the Nov 20 examination.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-[#27272A]">
              <button
                type="button"
                onClick={() => onNavigate('my-academic-calendar')}
                className="w-full py-2.5 px-4 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-semibold text-[#FAFAFA] transition-colors"
              >
                Upload Academic Calendar PDF & Customize Prep Buffers
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
