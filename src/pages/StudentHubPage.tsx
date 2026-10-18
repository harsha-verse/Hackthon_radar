import React, { useState } from 'react';
import {
  Bookmark,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ArrowRight,
  FileText,
} from 'lucide-react';
import {
  ActiveRoute,
  CollegeAcademicCalendar,
  EventCategory,
  ExperienceLevel,
  HackathonDomain,
  HackathonEvent,
  ParticipationMode,
  SavedRegistrationStage,
  StudentProfile,
} from '../types/hackathon';
import {
  checkStudentEligibility,
  evaluateAcademicCompatibility,
  formatDateRange,
  formatShortDate,
  getDaysRemaining,
} from '../data/mockData';

interface StudentHubPageProps {
  initialSection?: 'dashboard' | 'saved' | 'onboarding';
  student: StudentProfile;
  onUpdateStudent: (updated: StudentProfile) => void;
  events: HackathonEvent[];
  colleges: CollegeAcademicCalendar[];
  onToggleSave: (eventId: string) => void;
  onUpdateStage: (eventId: string, stage: SavedRegistrationStage) => void;
  onSelectEvent: (eventId: string) => void;
  onNavigate: (route: ActiveRoute) => void;
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

export const StudentHubPage: React.FC<StudentHubPageProps> = ({
  initialSection = 'dashboard',
  student,
  onUpdateStudent,
  events,
  colleges,
  onToggleSave,
  onUpdateStage,
  onSelectEvent,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'saved' | 'onboarding'>(
    initialSection
  );
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  const activeCollege =
    colleges.find((c) => c.collegeId === student.collegeId) || colleges[0];

  const current2026Events = events.filter((e) => e.editionYear >= 2026);

  const savedEventsList = student.savedHackathons
    .map((record) => {
      const event = events.find((e) => e.id === record.eventId);
      return event ? { record, event } : null;
    })
    .filter(
      (
        x
      ): x is {
        record: StudentProfile['savedHackathons'][0];
        event: HackathonEvent;
      } => x !== null
    );

  // Recommend 2026 events using domain interests, eligibility, and compatibility
  const recommendedEvents = current2026Events
    .map((ev) => ({
      event: ev,
      elig: checkStudentEligibility(ev, student),
      comp: evaluateAcademicCompatibility(ev, activeCollege.items, student),
    }))
    .filter(({ event, elig }) => {
      if (elig.status === 'ineligible') return false;
      const matchesDomain = event.domains.some((d) =>
        student.preferredDomains.includes(d)
      );
      return matchesDomain;
    });

  const savedRiskEvents = savedEventsList
    .map(({ event, record }) => ({
      event,
      record,
      comp: evaluateAcademicCompatibility(event, activeCollege.items, student),
    }))
    .filter(({ comp }) => comp.status !== 'compatible');

  const togglePreferredDomain = (domain: HackathonDomain) => {
    const exists = student.preferredDomains.includes(domain);
    const updatedDomains = exists
      ? student.preferredDomains.filter((d) => d !== domain)
      : [...student.preferredDomains, domain];
    onUpdateStudent({ ...student, preferredDomains: updatedDomains });
  };

  const handleSaveProfileComplete = () => {
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 3000);
    setActiveTab('dashboard');
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-3 bg-[#111114] border border-[#27272A] rounded-xl p-5 space-y-5">
          <div className="pb-4 border-b border-[#27272A]">
            <p className="text-xs text-[#A1A1AA]">Student Workspace</p>
            <h2 className="font-display text-base font-bold text-[#FAFAFA] mt-0.5">
              {student.name}
            </h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              {student.academicYear} · {student.branch} · {activeCollege.shortName}
            </p>
          </div>

          <nav aria-label="Student Dashboard Sections" className="space-y-1">
            {(
              [
                { id: 'dashboard', label: 'Overview & Recommendations' },
                { id: 'saved', label: `Saved Hackathons (${savedEventsList.length})` },
                { id: 'onboarding', label: 'Onboarding & Preferences' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === item.id
                    ? 'bg-[#8B5CF6] text-[#FAFAFA]'
                    : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA]'
                }`}
              >
                {item.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => onNavigate('my-academic-calendar')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold text-[#A78BFA] hover:bg-[#18181B] transition-colors flex items-center justify-between"
            >
              <span>My Academic Calendar PDF</span>
              <FileText className="w-3.5 h-3.5" />
            </button>
          </nav>

          <div className="pt-4 border-t border-[#27272A] space-y-1.5 text-xs">
            <span className="text-[#71717A] block">Active Compatibility Buffers</span>
            <p className="text-[#A1A1AA]">
              Exam Prep Buffer: <span className="font-mono text-[#FAFAFA]">{student.prepBufferDays}d</span>
            </p>
            <p className="text-[#A1A1AA]">
              Inter-City Travel Buffer: <span className="font-mono text-[#FAFAFA]">±{student.travelBufferDays}d</span>
            </p>
          </div>
        </aside>

        <div className="lg:col-span-9 space-y-6">
          {profileSavedToast && (
            <div className="p-3.5 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/40 text-xs text-[#22C55E] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Student profile and buffer settings updated. Compatibility across all 2026 hackathons has been recalculated.
              </span>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#FAFAFA]">
                    Welcome back, {student.name.split(' ')[0]}
                  </h1>
                  <p className="text-sm text-[#A1A1AA] mt-1">
                    Personalized 2026 hackathon recommendations with transparent compatibility reasoning for {activeCollege.shortName}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('my-academic-calendar')}
                  className="px-4 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-semibold text-[#FAFAFA] shrink-0"
                >
                  Upload / Manage Academic PDF
                </button>
              </div>

              {savedRiskEvents.length > 0 && (
                <div className="bg-[#111114] border border-[#F59E0B]/40 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#F59E0B]">
                      <AlertTriangle className="w-4 h-4" />
                      <span>
                        Saved Events with Academic or Preparation Buffer Risks ({savedRiskEvents.length})
                      </span>
                    </div>
                  </div>
                  {savedRiskEvents.map(({ event, comp }) => (
                    <div
                      key={event.id}
                      className="p-3.5 rounded-lg bg-[#18181B] border border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-[#FAFAFA]">
                          {event.title} · <span className="text-[#F59E0B]">{comp.badgeLabel}</span>
                        </p>
                        <p className="text-[#A1A1AA] mt-0.5">{comp.headlineReasoning}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectEvent(event.id)}
                        className="text-xs font-semibold text-[#A78BFA] hover:underline shrink-0"
                      >
                        Inspect Proof
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommended Events with Explicit Compatibility & Domain Reasoning */}
              <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-4">
                <div className="border-b border-[#27272A] pb-3">
                  <h2 className="font-display text-lg font-bold text-[#FAFAFA]">
                    Recommended 2026 Opportunities & Why They Match
                  </h2>
                  <p className="text-xs text-[#A1A1AA]">
                    Explains eligibility, domain overlap, and deterministic academic compatibility instead of showing an arbitrary score.
                  </p>
                </div>

                <div className="space-y-3">
                  {recommendedEvents.map(({ event, elig, comp }) => {
                    const matchedDomains = event.domains.filter((d) =>
                      student.preferredDomains.includes(d)
                    );
                    return (
                      <div
                        key={event.id}
                        className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                      >
                        <div className="space-y-1.5 max-w-2xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`font-semibold ${
                                comp.status === 'compatible'
                                  ? 'text-[#22C55E]'
                                  : comp.status === 'academic_conflict'
                                  ? 'text-[#EF4444]'
                                  : 'text-[#F59E0B]'
                              }`}
                            >
                              {comp.badgeLabel}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#FAFAFA] font-medium">
                              {elig.summaryLabel}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#A1A1AA]">
                              Matches {matchedDomains.join(', ')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onSelectEvent(event.id)}
                            className="text-sm font-bold text-[#FAFAFA] hover:text-[#A78BFA] text-left block"
                          >
                            {event.title}
                          </button>
                          <p className="text-[#A1A1AA]">{comp.headlineReasoning}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => onSelectEvent(event.id)}
                          className="px-3.5 py-2 rounded-lg bg-[#111114] border border-[#27272A] text-xs font-semibold text-[#FAFAFA] shrink-0 self-start md:self-center"
                        >
                          View Details
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 space-y-6">
              <div className="border-b border-[#27272A] pb-4">
                <h1 className="font-display text-xl font-bold text-[#FAFAFA]">
                  Saved Hackathons & Registration Stage Tracker
                </h1>
              </div>

              {savedEventsList.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Bookmark className="w-8 h-8 text-[#71717A] mx-auto" />
                  <p className="text-sm font-semibold text-[#FAFAFA]">
                    No saved hackathons yet
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('explore')}
                    className="px-4 py-2 rounded-lg bg-[#8B5CF6] text-xs font-semibold text-[#FAFAFA]"
                  >
                    Browse Explore Page
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedEventsList.map(({ event, record }) => (
                    <div
                      key={event.id}
                      className="p-5 rounded-xl bg-[#18181B] border border-[#27272A] flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA]">
                          <span>{event.city}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums text-[#22C55E]">
                            Reg Deadline: {formatShortDate(event.registrationCloseDate)} (
                            {getDaysRemaining(event.registrationCloseDate)}d left)
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            Participation: {formatDateRange(event.startDate, event.endDate)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectEvent(event.id)}
                          className="font-display text-base font-bold text-[#FAFAFA] hover:text-[#A78BFA] text-left"
                        >
                          {event.title}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <select
                          value={record.stage}
                          onChange={(e) =>
                            onUpdateStage(
                              event.id,
                              e.target.value as SavedRegistrationStage
                            )
                          }
                          className="bg-[#111114] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA]"
                        >
                          <option value="bookmarked">Bookmarked (Not Registered)</option>
                          <option value="team_forming">Forming Team</option>
                          <option value="registered_official">Registered on Official Portal</option>
                          <option value="round1_submitted">Round 1 Submitted</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => onToggleSave(event.id)}
                          className="p-2 rounded-lg bg-[#111114] border border-[#27272A] text-[#71717A] hover:text-[#EF4444]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'onboarding' && (
            <div className="bg-[#111114] border border-[#27272A] rounded-xl p-6 sm:p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-[#FAFAFA]">
                    Student Onboarding & Preferences
                  </h1>
                  <span className="font-mono text-xs text-[#A78BFA]">
                    Step {onboardingStep} of 5
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {(
                    [
                      { step: 1, label: '1. Basic Info' },
                      { step: 2, label: '2. Track Type' },
                      { step: 3, label: '3. Domains' },
                      { step: 4, label: '4. Experience' },
                      { step: 5, label: '5. Prep Buffers' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => setOnboardingStep(item.step)}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-colors truncate ${
                        onboardingStep === item.step
                          ? 'bg-[#8B5CF6] text-[#FAFAFA] border-[#8B5CF6]'
                          : 'bg-[#18181B] text-[#A1A1AA] border-[#27272A]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {onboardingStep === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#A1A1AA] block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={student.name}
                      onChange={(e) =>
                        onUpdateStudent({ ...student, name: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#A1A1AA] block">
                      College / Institution
                    </label>
                    <select
                      value={student.collegeId}
                      onChange={(e) => {
                        const found = colleges.find(
                          (c) => c.collegeId === e.target.value
                        );
                        if (found) {
                          onUpdateStudent({
                            ...student,
                            collegeId: found.collegeId,
                            collegeName: found.collegeName,
                            city: found.city,
                            district: found.district,
                          });
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA]"
                    >
                      {colleges.map((c) => (
                        <option key={c.collegeId} value={c.collegeId}>
                          {c.collegeName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#A1A1AA] block">
                      Department / Branch
                    </label>
                    <select
                      value={student.branch}
                      onChange={(e) =>
                        onUpdateStudent({ ...student, branch: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA]"
                    >
                      {['CSE', 'ISE', 'ECE', 'EEE', 'AI & DS', 'ME', 'Robotics'].map(
                        (b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#A1A1AA] block">
                      Academic Year
                    </label>
                    <select
                      value={student.academicYear}
                      onChange={(e) =>
                        onUpdateStudent({
                          ...student,
                          academicYear: e.target.value as StudentProfile['academicYear'],
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA]"
                    >
                      {(['1st Year', '2nd Year', '3rd Year', '4th Year'] as const).map(
                        (yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              )}

              {onboardingStep === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(['software', 'hardware', 'both'] as EventCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        onUpdateStudent({ ...student, preferredCategory: cat })
                      }
                      className={`p-5 rounded-xl border text-left capitalize text-sm font-bold ${
                        student.preferredCategory === cat
                          ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#FAFAFA]'
                          : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA]'
                      }`}
                    >
                      {cat} Track
                    </button>
                  ))}
                </div>
              )}

              {onboardingStep === 3 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ALL_DOMAINS.map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => togglePreferredDomain(domain)}
                      className={`p-3.5 rounded-xl border text-left text-xs font-semibold ${
                        student.preferredDomains.includes(domain)
                          ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#FAFAFA]'
                          : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA]'
                      }`}
                    >
                      {domain}
                    </button>
                  ))}
                </div>
              )}

              {onboardingStep === 4 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(['beginner', 'intermediate', 'advanced'] as ExperienceLevel[]).map(
                    (lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() =>
                          onUpdateStudent({ ...student, experienceLevel: lvl })
                        }
                        className={`p-4 rounded-xl border text-left capitalize text-xs font-semibold ${
                          student.experienceLevel === lvl
                            ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#FAFAFA]'
                            : 'bg-[#18181B] border-[#27272A] text-[#A1A1AA]'
                        }`}
                      >
                        {lvl} Builder
                      </button>
                    )
                  )}
                </div>
              )}

              {onboardingStep === 5 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[#A1A1AA] block mb-1.5">
                        Pre-Examination Preparation Buffer (Days)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={7}
                        value={student.prepBufferDays}
                        onChange={(e) =>
                          onUpdateStudent({
                            ...student,
                            prepBufferDays: Number(e.target.value),
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA] font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#A1A1AA] block mb-1.5">
                        Maximum Travel Distance (km)
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={800}
                        value={student.preferredTravelDistanceKm}
                        onChange={(e) =>
                          onUpdateStudent({
                            ...student,
                            preferredTravelDistanceKm: Number(e.target.value),
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA] font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-[#27272A] flex items-center justify-between">
                <button
                  type="button"
                  disabled={onboardingStep === 1}
                  onClick={() =>
                    setOnboardingStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4 | 5)
                  }
                  className="px-4 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-xs font-semibold text-[#A1A1AA] disabled:opacity-40"
                >
                  Previous Step
                </button>

                {onboardingStep < 5 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setOnboardingStep((s) => Math.min(5, s + 1) as 1 | 2 | 3 | 4 | 5)
                    }
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#8B5CF6] text-xs font-semibold text-[#FAFAFA]"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveProfileComplete}
                    className="px-5 py-2.5 rounded-lg bg-[#22C55E] text-xs font-semibold text-[#09090B]"
                  >
                    Save Preferences
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
