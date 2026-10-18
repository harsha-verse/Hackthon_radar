import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import {
  ActiveRoute,
  EventCategory,
  HackathonDomain,
  HackathonEvent,
  ParticipationMode,
} from '../types/hackathon';

interface SubmitEventPageProps {
  existingEvents: HackathonEvent[];
  onSubmitNewEvent: (newEvent: HackathonEvent) => void;
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

export const SubmitEventPage: React.FC<SubmitEventPageProps> = ({
  existingEvents,
  onSubmitNewEvent,
  onNavigate,
}) => {
  const [activeSection, setActiveSection] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [title, setTitle] = useState('');
  const [organizingCollege, setOrganizingCollege] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [officialRegistrationUrl, setOfficialRegistrationUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('software');
  const [mode, setMode] = useState<ParticipationMode>('offline');
  const [city, setCity] = useState('Bengaluru');
  const [district, setDistrict] =
    useState<HackathonEvent['district']>('Bengaluru Urban');
  const [venueName, setVenueName] = useState('');
  const [domains, setDomains] = useState<HackathonDomain[]>([
    'AI/ML',
    'Web Development',
  ]);
  const [startDate, setStartDate] = useState('2026-12-12');
  const [endDate, setEndDate] = useState('2026-12-13');
  const [registrationCloseDate, setRegistrationCloseDate] =
    useState('2026-11-30');
  const [eligibilityCriteria, setEligibilityCriteria] = useState(
    'Open to all undergraduate engineering and degree students across Karnataka.'
  );
  const [eligibleYears, setEligibleYears] = useState<string[]>([
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
  ]);
  const [prizePoolInput, setPrizePoolInput] = useState('100000');
  const [participationFeeInput, setParticipationFeeInput] = useState('0');
  const [beginnerFriendly, setBeginnerFriendly] = useState(true);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const duplicateCandidates = existingEvents.filter((ev) => {
    const cleanTitle = title.trim().toLowerCase();
    const cleanUrl = officialRegistrationUrl.trim().toLowerCase();
    if (cleanTitle.length > 4 && ev.title.toLowerCase().includes(cleanTitle))
      return true;
    if (
      cleanUrl.length > 8 &&
      ev.officialRegistrationUrl.toLowerCase() === cleanUrl
    )
      return true;
    return false;
  });

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 5) {
      errs.title = 'Enter a descriptive hackathon name (minimum 5 characters).';
    }
    if (!organizingCollege.trim()) {
      errs.organizingCollege = 'Specify the organizing college or university.';
    }
    if (
      !officialRegistrationUrl.trim() ||
      !officialRegistrationUrl.trim().startsWith('http')
    ) {
      errs.officialRegistrationUrl =
        'Provide a valid official registration URL starting with https://';
    }
    if (!description.trim() || description.trim().length < 20) {
      errs.description =
        'Provide a brief event description (minimum 20 characters).';
    }
    if (startDate.startsWith('2025') || endDate.startsWith('2025')) {
      errs.startDate =
        'Section 6 Guardrail: Cannot submit historical 2025 dates as a current 2026 opportunity.';
    }
    if (registrationCloseDate > startDate) {
      errs.registrationCloseDate =
        'Registration deadline must be on or before the event start date.';
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setActiveSection(1);
      return;
    }

    const parsedPrize = prizePoolInput.trim() ? Number(prizePoolInput) : null;
    const parsedFee = participationFeeInput.trim()
      ? Number(participationFeeInput)
      : 0;

    const newRecord: HackathonEvent = {
      id: `hack-sub-${Date.now().toString().slice(-4)}`,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      editionYear: Number(startDate.slice(0, 4)) || 2026,
      title: title.trim(),
      description: description.trim(),
      organizer: organizer.trim() || organizingCollege.trim(),
      organizingCollege: organizingCollege.trim(),
      category,
      domains: domains.length > 0 ? domains : ['Open Innovation'],
      startDate,
      endDate,
      registrationOpenDate: '2026-10-18',
      registrationCloseDate,
      timezone: 'Asia/Kolkata',
      rounds: [
        {
          id: `r1-${Date.now()}`,
          roundNumber: 1,
          name: 'Team Registration & Abstract Submission',
          type: 'registration',
          startDate: '2026-10-18',
          endDate: registrationCloseDate,
          requiresPhysicalAttendance: false,
          description: 'Register team and submit initial proposal.',
          mode: 'online',
        },
        {
          id: `r2-${Date.now()}`,
          roundNumber: 2,
          name: 'Main Hackathon Finale',
          type: 'finale',
          startDate,
          endDate,
          requiresPhysicalAttendance: mode !== 'online',
          description: 'Final build and live evaluation.',
          mode,
        },
      ],
      venueName: venueName.trim() || `${organizingCollege.trim()} Campus`,
      city: city.trim(),
      district,
      state: 'Karnataka',
      country: 'India',
      distanceFromBengaluruKm: city.toLowerCase().includes('mys') ? 145 : 15,
      mode,
      eligibilityCriteria: eligibilityCriteria.trim(),
      eligibleYears,
      eligibleBranches: ['All Branches'],
      teamSizeMin: 2,
      teamSizeMax: 4,
      prizePool: parsedPrize,
      prizeCurrency: 'INR',
      participationFee: parsedFee,
      officialRegistrationUrl: officialRegistrationUrl.trim(),
      officialWebsite: sourceUrl.trim() || officialRegistrationUrl.trim(),
      sources: [
        {
          id: `src-${Date.now()}`,
          platform: 'Organizer Submission',
          url: sourceUrl.trim() || officialRegistrationUrl.trim(),
          discoveredAt: new Date().toISOString(),
          lastCheckedAt: new Date().toISOString(),
          isPrimary: true,
          extractionMethod: 'organizer_submitted',
          confidenceScore: 0.9,
        },
      ],
      changeHistory: [],
      verificationStatus:
        duplicateCandidates.length > 0 ? 'flagged_duplicate' : 'pending',
      extractedAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      lastVerifiedAt: null,
      status: 'upcoming',
      confidenceScore: 0.9,
      missingFields: parsedPrize === null ? ['Prize Pool Breakdown'] : [],
      beginnerFriendly,
      themes: ['Open Student Innovation', 'Applied Engineering Prototype'],
      artworkVariant: 'bengaluru_cloud',
      dataOrigin: 'user_submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSubmitNewEvent(newRecord);
    setSubmittedSuccess(true);
  };

  if (submittedSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-[#111114] border border-[#27272A] rounded-xl p-8 text-center space-y-5">
          <CheckCircle2 className="w-12 h-12 text-[#22C55E] mx-auto" />
          <h1 className="font-display text-2xl font-bold text-[#FAFAFA]">
            Event Submitted to Verification Queue
          </h1>
          <p className="text-sm text-[#A1A1AA] leading-relaxed">
            Your submission for <strong className="text-[#FAFAFA]">{title}</strong> has been queued for admin source verification and compatibility indexing.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="px-4 py-2.5 rounded-lg bg-[#8B5CF6] text-xs font-semibold text-[#FAFAFA]"
            >
              Inspect in Admin Verification Queue
            </button>
            <button
              type="button"
              onClick={() => onNavigate('explore')}
              className="px-4 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-xs font-semibold text-[#FAFAFA]"
            >
              Return to Explore Hackathons
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="border-b border-[#27272A] pb-5">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#FAFAFA]">
          Submit a 2026 Hackathon Event
        </h1>
        <p className="text-sm text-[#A1A1AA] mt-1">
          Every submission undergoes source URL validation, historical-year filtering, and duplicate checks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-3 bg-[#111114] border border-[#27272A] rounded-xl p-4 space-y-1.5">
          {(
            [
              { id: 1, label: '1. Basic Information' },
              { id: 2, label: '2. Event Details & Mode' },
              { id: 3, label: '3. Eligibility & Rules' },
              { id: 4, label: '4. 2026 Dates' },
              { id: 5, label: '5. Review & Submit' },
            ] as const
          ).map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveSection(step.id)}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                activeSection === step.id
                  ? 'bg-[#8B5CF6] text-[#FAFAFA]'
                  : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#FAFAFA]'
              }`}
            >
              {step.label}
            </button>
          ))}
        </aside>

        <form
          onSubmit={handleFinalSubmit}
          className="lg:col-span-9 bg-[#111114] border border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6"
        >
          {duplicateCandidates.length > 0 && (
            <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/40 flex items-start gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#FAFAFA]">
                  Potential Duplicate Event Detected
                </p>
                <p className="text-[#A1A1AA]">
                  Matches existing record: {duplicateCandidates[0].title}.
                </p>
              </div>
            </div>
          )}

          {activeSection === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-bold text-[#FAFAFA] border-b border-[#27272A] pb-3">
                01. Basic Information & Source Links
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#A1A1AA] block">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., SJCE Mysuru Open Hack 2026"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA]"
                  />
                  {validationErrors.title && (
                    <p className="text-xs text-[#EF4444]">{validationErrors.title}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#A1A1AA] block">
                    Organizing College / Institution *
                  </label>
                  <input
                    type="text"
                    value={organizingCollege}
                    onChange={(e) => setOrganizingCollege(e.target.value)}
                    placeholder="e.g., JSS Science and Technology University, Mysuru"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA]"
                  />
                  {validationErrors.organizingCollege && (
                    <p className="text-xs text-[#EF4444]">
                      {validationErrors.organizingCollege}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#A1A1AA] block">
                    Official Registration URL *
                  </label>
                  <input
                    type="url"
                    value={officialRegistrationUrl}
                    onChange={(e) => setOfficialRegistrationUrl(e.target.value)}
                    placeholder="https://example.edu.in/register"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA] font-mono"
                  />
                  {validationErrors.officialRegistrationUrl && (
                    <p className="text-xs text-[#EF4444]">
                      {validationErrors.officialRegistrationUrl}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#A1A1AA] block">
                    Discovery Source / Circular URL
                  </label>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://example.edu.in/circular-2026.pdf"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#A1A1AA] block">
                  Event Description *
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the hackathon tracks, duration, and deliverables..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA]"
                />
                {validationErrors.description && (
                  <p className="text-xs text-[#EF4444]">
                    {validationErrors.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeSection === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-bold text-[#FAFAFA] border-b border-[#27272A] pb-3">
                02. Category, Domains & Location
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#A1A1AA] block mb-1.5">
                    Hackathon Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventCategory)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA]"
                  >
                    <option value="software">Software</option>
                    <option value="hardware">Hardware</option>
                    <option value="both">Both Software & Hardware</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#A1A1AA] block mb-1.5">
                    Participation Mode
                  </label>
                  <select
                    value={mode}
                    onChange={(e) =>
                      setMode(e.target.value as ParticipationMode)
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA]"
                  >
                    <option value="offline">Offline (On-Campus)</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#A1A1AA] block mb-1.5">
                    District
                  </label>
                  <select
                    value={district}
                    onChange={(e) =>
                      setDistrict(e.target.value as HackathonEvent['district'])
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA]"
                  >
                    <option value="Bengaluru Urban">Bengaluru Urban</option>
                    <option value="Mysuru">Mysuru</option>
                    <option value="Mandya">Mandya</option>
                    <option value="Dakshina Kannada">Dakshina Kannada</option>
                    <option value="Dharwad">Dharwad</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeSection === 3 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-bold text-[#FAFAFA] border-b border-[#27272A] pb-3">
                03. Eligibility & Prize Pool
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#A1A1AA] block mb-1.5">
                    Total Prize Pool in INR (Leave blank if unannounced)
                  </label>
                  <input
                    type="number"
                    value={prizePoolInput}
                    onChange={(e) => setPrizePoolInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA] font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#A1A1AA] block mb-1.5">
                    Participation Fee (INR)
                  </label>
                  <input
                    type="number"
                    value={participationFeeInput}
                    onChange={(e) => setParticipationFeeInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA] font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 4 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-bold text-[#FAFAFA] border-b border-[#27272A] pb-3">
                04. Registration Deadline & 2026 Participation Dates
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#A1A1AA] block mb-1.5">
                    Registration Closing Date *
                  </label>
                  <input
                    type="date"
                    value={registrationCloseDate}
                    onChange={(e) => setRegistrationCloseDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA] font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#A1A1AA] block mb-1.5">
                    Participation Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA] font-mono"
                  />
                  {validationErrors.startDate && (
                    <p className="text-xs text-[#EF4444] mt-1">
                      {validationErrors.startDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-[#A1A1AA] block mb-1.5">
                    Participation End Date *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA] font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 5 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-[#FAFAFA] border-b border-[#27272A] pb-3">
                05. Review Submission
              </h2>
              <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] space-y-2 text-xs">
                <p>
                  <span className="text-[#71717A]">Title:</span>{' '}
                  <span className="font-semibold text-[#FAFAFA]">
                    {title || 'Not entered'}
                  </span>
                </p>
                <p>
                  <span className="text-[#71717A]">Dates:</span>{' '}
                  <span className="font-mono text-[#FAFAFA]">
                    Reg Due {registrationCloseDate} · Participation {startDate} to{' '}
                    {endDate}
                  </span>
                </p>
              </div>
            </div>
          )}

          <div className="pt-5 border-t border-[#27272A] flex items-center justify-between">
            <button
              type="button"
              disabled={activeSection === 1}
              onClick={() =>
                setActiveSection((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4 | 5)
              }
              className="px-4 py-2.5 rounded-lg bg-[#18181B] border border-[#27272A] text-xs font-semibold text-[#A1A1AA] disabled:opacity-40"
            >
              Previous Section
            </button>

            {activeSection < 5 ? (
              <button
                type="button"
                onClick={() =>
                  setActiveSection(
                    (s) => Math.min(5, s + 1) as 1 | 2 | 3 | 4 | 5
                  )
                }
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#8B5CF6] text-xs font-semibold text-[#FAFAFA]"
              >
                <span>Next Section</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-[#22C55E] text-xs font-semibold text-[#09090B]"
              >
                Submit Event for Review
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
