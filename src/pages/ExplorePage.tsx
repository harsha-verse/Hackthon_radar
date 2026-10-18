import React, { useMemo, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  X,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import {
  CollegeAcademicCalendar,
  CompatibilityStatus,
  EventCategory,
  HackathonDomain,
  HackathonEvent,
  ParticipationMode,
  StudentProfile,
} from '../types/hackathon';
import {
  checkStudentEligibility,
  evaluateAcademicCompatibility,
  getDaysRemaining,
} from '../data/mockData';
import { EventCard } from '../components/EventCard';

interface ExplorePageProps {
  events: HackathonEvent[];
  student: StudentProfile;
  collegeCalendar?: CollegeAcademicCalendar;
  savedIds: string[];
  onToggleSave: (eventId: string) => void;
  onSelectEvent: (eventId: string) => void;
  initialQuery?: string;
  initialDistrict?: string;
}

const ALL_DOMAINS: HackathonDomain[] = [
  'AI/ML',
  'Web Development',
  'Cybersecurity',
  'IoT',
  'Robotics',
  'Blockchain',
  'Data Science',
  'Design',
  'Open Innovation',
];

const DISTRICTS = [
  'All Districts',
  'Bengaluru Urban',
  'Mysuru',
  'Mandya',
  'Dakshina Kannada',
  'Dharwad',
];

export const ExplorePage: React.FC<ExplorePageProps> = ({
  events,
  student,
  collegeCalendar,
  savedIds,
  onToggleSave,
  onSelectEvent,
  initialQuery = '',
  initialDistrict = 'All Districts',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    initialDistrict || 'All Districts'
  );
  const [selectedCategory, setSelectedCategory] = useState<'all' | EventCategory>('all');
  const [selectedMode, setSelectedMode] = useState<'all' | ParticipationMode>('all');
  const [selectedDomains, setSelectedDomains] = useState<HackathonDomain[]>([]);
  const [compatibilityFilter, setCompatibilityFilter] = useState<
    'all' | 'compatible_only' | 'hide_direct_conflicts' | CompatibilityStatus
  >('all');
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [onlyBeginner, setOnlyBeginner] = useState(false);
  const [onlyFree, setOnlyFree] = useState(false);
  const [includeHistorical2025Archive, setIncludeHistorical2025Archive] =
    useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sortBy, setSortBy] = useState<
    'compatibility' | 'deadline' | 'event_date' | 'prize'
  >('compatibility');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const toggleDomain = (domain: HackathonDomain) => {
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedDistrict('All Districts');
    setSelectedCategory('all');
    setSelectedMode('all');
    setSelectedDomains([]);
    setCompatibilityFilter('all');
    setOnlyEligible(false);
    setOnlyBeginner(false);
    setOnlyFree(false);
    setIncludeHistorical2025Archive(false);
    setOnlyVerified(false);
  };

  const compatibilityRank: Record<CompatibilityStatus, number> = {
    compatible: 1,
    needs_confirmation: 2,
    travel_risk: 3,
    prep_risk: 4,
    academic_conflict: 5,
  };

  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        // Section 6 Rule: Never present previous-year (2025) events as current opportunities!
        const isHistorical =
          ev.editionYear < 2026 || ev.status === 'historical_archived';
        if (isHistorical && !includeHistorical2025Archive) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = ev.title.toLowerCase().includes(q);
          const matchCollege = ev.organizingCollege.toLowerCase().includes(q);
          const matchCity = ev.city.toLowerCase().includes(q);
          const matchDomain = ev.domains.some((d) => d.toLowerCase().includes(q));
          if (!matchTitle && !matchCollege && !matchCity && !matchDomain) {
            return false;
          }
        }

        if (
          selectedDistrict !== 'All Districts' &&
          ev.district !== selectedDistrict
        ) {
          return false;
        }

        if (selectedCategory !== 'all') {
          if (selectedCategory === 'software' && ev.category === 'hardware')
            return false;
          if (selectedCategory === 'hardware' && ev.category === 'software')
            return false;
          if (selectedCategory === 'both' && ev.category !== 'both') return false;
        }

        if (selectedMode !== 'all' && ev.mode !== selectedMode) {
          return false;
        }

        if (selectedDomains.length > 0) {
          const hasMatchingDomain = selectedDomains.some((d) =>
            ev.domains.includes(d)
          );
          if (!hasMatchingDomain) return false;
        }

        if (compatibilityFilter !== 'all') {
          const comp = evaluateAcademicCompatibility(
            ev,
            collegeCalendar?.items || [],
            student
          );
          if (
            compatibilityFilter === 'compatible_only' &&
            comp.status !== 'compatible'
          ) {
            return false;
          }
          if (
            compatibilityFilter === 'hide_direct_conflicts' &&
            comp.status === 'academic_conflict'
          ) {
            return false;
          }
          if (
            compatibilityFilter !== 'compatible_only' &&
            compatibilityFilter !== 'hide_direct_conflicts' &&
            comp.status !== compatibilityFilter
          ) {
            return false;
          }
        }

        if (onlyEligible) {
          const elig = checkStudentEligibility(ev, student);
          if (elig.status === 'ineligible') return false;
        }

        if (onlyBeginner && !ev.beginnerFriendly) {
          return false;
        }

        if (onlyFree && (ev.participationFee ?? 0) > 0) {
          return false;
        }

        if (onlyVerified && ev.verificationStatus !== 'verified') {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'compatibility') {
          const compA = evaluateAcademicCompatibility(
            a,
            collegeCalendar?.items || [],
            student
          );
          const compB = evaluateAcademicCompatibility(
            b,
            collegeCalendar?.items || [],
            student
          );
          return compatibilityRank[compA.status] - compatibilityRank[compB.status];
        }
        if (sortBy === 'deadline') {
          return (a.registrationCloseDate || '9999').localeCompare(
            b.registrationCloseDate || '9999'
          );
        }
        if (sortBy === 'event_date') {
          return (a.startDate || '9999').localeCompare(b.startDate || '9999');
        }
        return (b.prizePool ?? 0) - (a.prizePool ?? 0);
      });
  }, [
    events,
    includeHistorical2025Archive,
    searchQuery,
    selectedDistrict,
    selectedCategory,
    selectedMode,
    selectedDomains,
    compatibilityFilter,
    onlyEligible,
    onlyBeginner,
    onlyFree,
    onlyVerified,
    sortBy,
    collegeCalendar,
    student,
  ]);

  const historicalBlockedCount = events.filter(
    (e) => e.editionYear < 2026 || e.status === 'historical_archived'
  ).length;

  const FilterControlsContent = () => (
    <div className="space-y-6 text-sm">
      {/* Academic Compatibility Filter */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-semibold text-[#FAFAFA] tracking-wide">
          Academic Compatibility ({collegeCalendar?.shortName})
        </h3>
        <div className="space-y-1">
          {(
            [
              { id: 'all', label: 'All Compatibility States' },
              { id: 'compatible_only', label: 'Compatible Only' },
              { id: 'hide_direct_conflicts', label: 'Hide Direct Exam Conflicts' },
              { id: 'prep_risk', label: `Preparation Risk (${student.prepBufferDays}d Buffer)` },
              { id: 'travel_risk', label: 'Travel / Schedule Risk' },
              { id: 'needs_confirmation', label: 'Needs Confirmation' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setCompatibilityFilter(opt.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                compatibilityFilter === opt.id
                  ? 'bg-[#8B5CF6]/20 text-[#FAFAFA] font-semibold border border-[#8B5CF6]/50'
                  : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location / District Filter */}
      <div className="space-y-2.5 pt-4 border-t border-[#27272A]">
        <h3 className="text-xs font-semibold text-[#FAFAFA] tracking-wide">
          Karnataka District
        </h3>
        <div className="space-y-1">
          {DISTRICTS.map((dist) => (
            <button
              key={dist}
              type="button"
              onClick={() => setSelectedDistrict(dist)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                selectedDistrict === dist
                  ? 'bg-[#8B5CF6]/15 text-[#FAFAFA] font-semibold border border-[#8B5CF6]/40'
                  : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA]'
              }`}
            >
              <span>{dist}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Event Category */}
      <div className="space-y-2.5 pt-4 border-t border-[#27272A]">
        <h3 className="text-xs font-semibold text-[#FAFAFA] tracking-wide">
          Event Track Category
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { id: 'all', label: 'All Tracks' },
              { id: 'software', label: 'Software' },
              { id: 'hardware', label: 'Hardware' },
              { id: 'both', label: 'Both Tracks' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                selectedCategory === cat.id
                  ? 'bg-[#8B5CF6] text-[#FAFAFA] border-[#8B5CF6]'
                  : 'bg-[#18181B] text-[#A1A1AA] border-[#27272A] hover:text-[#FAFAFA]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Domains & Technologies */}
      <div className="space-y-2.5 pt-4 border-t border-[#27272A]">
        <h3 className="text-xs font-semibold text-[#FAFAFA] tracking-wide">
          Domains & Stacks
        </h3>
        <div className="space-y-1.5">
          {ALL_DOMAINS.map((domain) => {
            const checked = selectedDomains.includes(domain);
            return (
              <label
                key={domain}
                className="flex items-center justify-between text-xs text-[#A1A1AA] hover:text-[#FAFAFA] cursor-pointer py-1"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleDomain(domain)}
                    className="rounded border-[#27272A] bg-[#18181B] text-[#8B5CF6]"
                  />
                  <span>{domain}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Data Quality & Historical Guardrail Toggle */}
      <div className="space-y-2.5 pt-4 border-t border-[#27272A]">
        <h3 className="text-xs font-semibold text-[#FAFAFA] tracking-wide">
          Eligibility & Data Quality Rules
        </h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-[#A1A1AA] hover:text-[#FAFAFA] cursor-pointer">
            <input
              type="checkbox"
              checked={onlyEligible}
              onChange={(e) => setOnlyEligible(e.target.checked)}
              className="rounded border-[#27272A] bg-[#18181B] text-[#8B5CF6]"
            />
            <span>
              Eligible for {student.academicYear} {student.branch} only
            </span>
          </label>
          <label className="flex items-center gap-2 text-xs text-[#A1A1AA] hover:text-[#FAFAFA] cursor-pointer">
            <input
              type="checkbox"
              checked={onlyVerified}
              onChange={(e) => setOnlyVerified(e.target.checked)}
              className="rounded border-[#27272A] bg-[#18181B] text-[#8B5CF6]"
            />
            <span>Verified official sources only</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-[#A1A1AA] hover:text-[#FAFAFA] cursor-pointer">
            <input
              type="checkbox"
              checked={includeHistorical2025Archive}
              onChange={(e) => setIncludeHistorical2025Archive(e.target.checked)}
              className="rounded border-[#27272A] bg-[#18181B] text-[#8B5CF6]"
            />
            <span>
              Include 2025 Historical Archive ({historicalBlockedCount} blocked by default)
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="border-b border-[#27272A] pb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#FAFAFA]">
              Explore 2026 Hackathons & Academic Compatibility
            </h1>
            <p className="text-sm text-[#A1A1AA] mt-1">
              Every listing is evaluated against your confirmed {collegeCalendar?.shortName} academic calendar ({student.prepBufferDays}-day exam prep buffer & ±{student.travelBufferDays}-day travel buffer).
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-[#A1A1AA]">
            Showing {filteredEvents.length} opportunities · {historicalBlockedCount} stale 2025 record hidden
          </div>
        </div>

        {/* Search & Toolbar Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 2026 hackathons by title, organizing college, city, or domain..."
              aria-label="Search hackathons"
              className="w-full pl-10 pr-9 py-2.5 bg-[#111114] border border-[#27272A] rounded-lg text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#FAFAFA]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#111114] border border-[#27272A] text-xs font-semibold text-[#FAFAFA]"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#8B5CF6]" />
              <span>Filters</span>
            </button>

            <div className="flex items-center gap-2 bg-[#111114] border border-[#27272A] rounded-lg px-3 py-2">
              <label htmlFor="sort-select" className="text-xs text-[#71717A] whitespace-nowrap">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-transparent text-xs font-medium text-[#FAFAFA] focus:outline-none"
              >
                <option value="compatibility" className="bg-[#111114]">
                  Academic Compatibility
                </option>
                <option value="deadline" className="bg-[#111114]">
                  Registration Deadline
                </option>
                <option value="event_date" className="bg-[#111114]">
                  Participation Start Date
                </option>
                <option value="prize" className="bg-[#111114]">
                  Prize Pool (High to Low)
                </option>
              </select>
            </div>

            <div
              role="group"
              aria-label="Layout view toggle"
              className="hidden sm:flex items-center p-1 bg-[#111114] border border-[#27272A] rounded-lg"
            >
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#27272A] text-[#FAFAFA]'
                    : 'text-[#71717A] hover:text-[#FAFAFA]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#27272A] text-[#FAFAFA]'
                    : 'text-[#71717A] hover:text-[#FAFAFA]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside
          aria-label="Hackathon Filters"
          className="hidden lg:block lg:col-span-3 bg-[#111114] border border-[#27272A] rounded-xl p-5"
        >
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#27272A]">
            <h2 className="text-sm font-semibold text-[#FAFAFA]">Filter & Compatibility</h2>
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 text-xs text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
          <FilterControlsContent />
        </aside>

        <div className="lg:col-span-9 space-y-4">
          {/* Historical Data Guardrail Banner */}
          <div className="px-4 py-3 rounded-xl bg-[#111114] border border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#A1A1AA]">
              <ShieldAlert className="w-4 h-4 text-[#8B5CF6] shrink-0" />
              <span>
                <strong className="text-[#FAFAFA]">2026 Current-Edition Guardrail Active:</strong> Previous-year (2025) hackathons are automatically excluded from current upcoming opportunities unless explicitly inspected in archive mode.
              </span>
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="bg-[#111114] border border-[#27272A] rounded-xl p-12 text-center space-y-4">
              <h3 className="font-display text-lg font-semibold text-[#FAFAFA]">
                No hackathons match your current filter combination
              </h3>
              <p className="text-sm text-[#A1A1AA] max-w-md mx-auto">
                Try switching the Academic Compatibility filter back to "All Compatibility States" or clearing active domain filters.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-4 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-semibold text-[#FAFAFA] transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 gap-5'
                  : 'space-y-4'
              }
            >
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  student={student}
                  collegeCalendar={collegeCalendar}
                  isSaved={savedIds.includes(event.id)}
                  onToggleSave={onToggleSave}
                  onSelectEvent={onSelectEvent}
                  layout={viewMode}
                  showBanner={viewMode === 'grid'}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Slide-Over Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-[#111114] border-l border-[#27272A] h-full overflow-y-auto p-5 z-10 space-y-5">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <h2 className="font-display text-base font-bold text-[#FAFAFA]">
                Filter Hackathons
              </h2>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA]"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FilterControlsContent />
          </div>
        </div>
      )}
    </div>
  );
};
