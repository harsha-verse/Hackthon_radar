import {
  AcademicScheduleItem,
  CompatibilityResult,
  CompatibilityStatus,
  HackathonEvent,
  RoundCompatibilityEvaluation,
  StudentProfile,
} from '../types/hackathon';

/**
 * Pure UTC date helpers (YYYY-MM-DD) for deterministic date arithmetic
 */
export function addDaysUTC(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatPrettyDate(dateStr: string | null): string {
  if (!dateStr) return 'Date Unconfirmed';
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatPrettyRange(startStr: string | null, endStr: string | null): string {
  if (!startStr || !endStr) return 'Schedule Unconfirmed';
  if (startStr === endStr) return formatPrettyDate(startStr);
  const s = new Date(`${startStr}T00:00:00Z`);
  const e = new Date(`${endStr}T00:00:00Z`);
  const sMonth = s.toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' });
  const eMonth = e.toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' });
  const sDay = s.getUTCDate();
  const eDay = e.getUTCDate();
  const year = e.getUTCFullYear();
  if (sMonth === eMonth && s.getUTCFullYear() === e.getUTCFullYear()) {
    return `${sMonth} ${sDay}–${eDay}, ${year}`;
  }
  return `${sMonth} ${sDay} – ${eMonth} ${eDay}, ${year}`;
}

export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

/**
 * Data Quality Rule (Section 6):
 * Prevents historical / previous-year events (e.g., 2025 events when current year is 2026)
 * from being treated as current upcoming opportunities.
 */
export function validateEventCurrentness(
  event: HackathonEvent,
  referenceDateStr: string
): {
  isCurrentOpportunity: boolean;
  computedStatus: HackathonEvent['status'];
  qualityNotice: string | null;
} {
  const refYear = Number(referenceDateStr.slice(0, 4));

  if (event.editionYear < refYear || event.status === 'historical_archived') {
    return {
      isCurrentOpportunity: false,
      computedStatus: 'historical_archived',
      qualityNotice: `Historical ${event.editionYear} edition — no confirmed ${refYear} edition has been published by the organizer.`,
    };
  }

  if (!event.startDate || !event.endDate || event.status === 'date_unconfirmed') {
    return {
      isCurrentOpportunity: true,
      computedStatus: 'date_unconfirmed',
      qualityNotice: 'Organizer has announced the event but final participation dates are not yet confirmed.',
    };
  }

  if (event.endDate < referenceDateStr) {
    return {
      isCurrentOpportunity: false,
      computedStatus: 'completed',
      qualityNotice: `Event concluded on ${formatPrettyDate(event.endDate)}.`,
    };
  }

  if (
    event.registrationCloseDate &&
    event.registrationCloseDate < referenceDateStr &&
    event.startDate >= referenceDateStr
  ) {
    return {
      isCurrentOpportunity: false,
      computedStatus: 'registration_closed',
      qualityNotice: `Registration closed on ${formatPrettyDate(event.registrationCloseDate)}.`,
    };
  }

  return {
    isCurrentOpportunity: true,
    computedStatus: 'upcoming',
    qualityNotice: null,
  };
}

/**
 * Deterministic Academic Compatibility Engine (Section 8)
 *
 * Evaluates a hackathon's participation dates and individual rounds against:
 * 1. Confirmed examinations, practicals, and mandatory college commitments
 * 2. Configurable pre-examination preparation buffers (e.g., 2 days before exam)
 * 3. Physical travel & recovery buffers for out-of-city offline events
 * 4. Schedule completeness & unconfirmed PDF commitments
 */
export function evaluateAcademicCompatibility(
  event: HackathonEvent,
  commitments: AcademicScheduleItem[],
  student: Pick<
    StudentProfile,
    'city' | 'preferredTravelDistanceKm' | 'prepBufferDays' | 'travelBufferDays'
  >
): CompatibilityResult {
  const detailedReasons: string[] = [];
  const conflictingCommitments: CompatibilityResult['conflictingCommitments'] = [];
  const roundEvaluations: RoundCompatibilityEvaluation[] = [];

  const regDeadlineNote = event.registrationCloseDate
    ? `Registration closes ${formatPrettyDate(event.registrationCloseDate)} (evaluated separately from participation dates ${formatPrettyRange(event.startDate, event.endDate)}).`
    : 'Registration closing date has not been published by the organizer.';

  const primarySource = event.sources.find((s) => s.isPrimary) || event.sources[0];
  const sourceAttribution = primarySource
    ? `${primarySource.platform} (${primarySource.url})`
    : event.officialWebsite;

  // 1. Check if event participation dates are missing or unconfirmed
  if (!event.startDate || !event.endDate || event.status === 'date_unconfirmed') {
    return {
      status: 'needs_confirmation',
      badgeLabel: 'Needs Confirmation',
      headlineReasoning:
        'Needs confirmation: The organizer has not yet published confirmed final participation dates.',
      detailedReasons: [
        'Hackathon start or end dates are missing or marked as tentative in the source circular.',
        'Compatibility cannot be guaranteed until the official schedule is finalized.',
      ],
      conflictingCommitments: [],
      roundEvaluations: [],
      registrationDeadlineNote: regDeadlineNote,
      sourceAttribution,
    };
  }

  const evStart = event.startDate;
  const evEnd = event.endDate;

  // Determine if physical travel buffer applies
  const requiresInterCityTravel =
    event.mode === 'offline' &&
    event.city.toLowerCase() !== student.city.toLowerCase() &&
    event.distanceFromBengaluruKm > 40;

  const effectiveTravelStart =
    requiresInterCityTravel && student.travelBufferDays > 0
      ? addDaysUTC(evStart, -student.travelBufferDays)
      : evStart;
  const effectiveTravelEnd =
    requiresInterCityTravel && student.travelBufferDays > 0
      ? addDaysUTC(evEnd, student.travelBufferDays)
      : evEnd;

  // Filter academic commitments (exclude holidays, since holidays help students attend!)
  const blockingCommitments = commitments.filter((c) => c.type !== 'holiday');

  let hasDirectConflict = false;
  let hasPrepRisk = false;
  let hasTravelRisk = false;
  let hasUnconfirmedOverlap = false;

  for (const item of blockingCommitments) {
    const isExam =
      item.type === 'internal_exam' ||
      item.type === 'practical_exam' ||
      item.type === 'semester_exam';

    const prepStart =
      isExam && student.prepBufferDays > 0
        ? addDaysUTC(item.startDate, -student.prepBufferDays)
        : item.startDate;
    const prepEnd =
      isExam && student.prepBufferDays > 0
        ? addDaysUTC(item.startDate, -1)
        : item.startDate;

    // A. Check Direct Participation Overlap
    if (rangesOverlap(evStart, evEnd, item.startDate, item.endDate)) {
      if (!item.confirmedByStudent) {
        hasUnconfirmedOverlap = true;
        conflictingCommitments.push({
          commitment: item,
          conflictType: 'unconfirmed_commitment',
          protectedWindowStart: item.startDate,
          protectedWindowEnd: item.endDate,
          explanation: `Overlaps unconfirmed PDF entry "${item.title}" (${formatPrettyRange(
            item.startDate,
            item.endDate
          )}). Confirm this date in My Academic Calendar.`,
        });
      } else {
        hasDirectConflict = true;
        conflictingCommitments.push({
          commitment: item,
          conflictType: 'direct_overlap',
          protectedWindowStart: item.startDate,
          protectedWindowEnd: item.endDate,
          explanation: `Participation window (${formatPrettyRange(
            evStart,
            evEnd
          )}) directly overlaps "${item.title}" (${formatPrettyRange(
            item.startDate,
            item.endDate
          )}).`,
        });
      }
      continue;
    }

    // B. Check Protected Preparation Buffer Overlap (before exams)
    if (
      isExam &&
      student.prepBufferDays > 0 &&
      rangesOverlap(evStart, evEnd, prepStart, prepEnd)
    ) {
      if (!item.confirmedByStudent) {
        hasUnconfirmedOverlap = true;
      } else {
        hasPrepRisk = true;
      }
      conflictingCommitments.push({
        commitment: item,
        conflictType: 'prep_buffer_overlap',
        protectedWindowStart: prepStart,
        protectedWindowEnd: item.endDate,
        explanation: `Participation (${formatPrettyRange(
          evStart,
          evEnd
        )}) intrudes into your ${student.prepBufferDays}-day preparation buffer (${formatPrettyRange(
          prepStart,
          prepEnd
        )}) before "${item.title}" on ${formatPrettyDate(item.startDate)}.`,
      });
      continue;
    }

    // C. Check Travel & Recovery Window Overlap
    if (
      requiresInterCityTravel &&
      rangesOverlap(effectiveTravelStart, effectiveTravelEnd, item.startDate, item.endDate)
    ) {
      hasTravelRisk = true;
      conflictingCommitments.push({
        commitment: item,
        conflictType: 'travel_buffer_overlap',
        protectedWindowStart: effectiveTravelStart,
        protectedWindowEnd: effectiveTravelEnd,
        explanation: `Attending in ${event.city} with a ${student.travelBufferDays}-day travel buffer (${formatPrettyRange(
          effectiveTravelStart,
          effectiveTravelEnd
        )}) overlaps "${item.title}" (${formatPrettyRange(item.startDate, item.endDate)}).`,
      });
    }
  }

  // Also check if travel distance exceeds student's max travel preference for offline events
  if (
    event.mode === 'offline' &&
    event.distanceFromBengaluruKm > student.preferredTravelDistanceKm
  ) {
    hasTravelRisk = true;
    detailedReasons.push(
      `Travel distance to ${event.city} (~${event.distanceFromBengaluruKm} km) exceeds your configured ${student.preferredTravelDistanceKm} km travel limit.`
    );
  }

  // Evaluate each round individually
  let anyRoundUnconfirmed = false;
  for (const round of event.rounds) {
    if (!round.startDate || !round.endDate) {
      if (round.type === 'finale' || round.type === 'preliminary') {
        anyRoundUnconfirmed = true;
      }
      roundEvaluations.push({
        roundId: round.id,
        roundNumber: round.roundNumber,
        roundName: round.name,
        roundType: round.type,
        startDate: round.startDate,
        endDate: round.endDate,
        status: 'needs_confirmation',
        reason: 'Organizer has not yet published exact dates for this round.',
      });
      continue;
    }

    // Registration rounds don't require full-day attendance
    if (round.type === 'registration') {
      roundEvaluations.push({
        roundId: round.id,
        roundNumber: round.roundNumber,
        roundName: round.name,
        roundType: round.type,
        startDate: round.startDate,
        endDate: round.endDate,
        status: 'compatible',
        reason: `Online registration deadline (${formatPrettyDate(round.endDate)}) does not require full-day absence.`,
      });
      continue;
    }

    const rDirect = blockingCommitments.find(
      (c) =>
        c.confirmedByStudent &&
        rangesOverlap(round.startDate!, round.endDate!, c.startDate, c.endDate)
    );
    if (rDirect) {
      roundEvaluations.push({
        roundId: round.id,
        roundNumber: round.roundNumber,
        roundName: round.name,
        roundType: round.type,
        startDate: round.startDate,
        endDate: round.endDate,
        status: 'academic_conflict',
        reason: `Overlaps "${rDirect.title}" (${formatPrettyRange(rDirect.startDate, rDirect.endDate)}).`,
      });
      continue;
    }

    const rPrep = blockingCommitments.find((c) => {
      if (!c.confirmedByStudent || student.prepBufferDays <= 0) return false;
      const isExam =
        c.type === 'internal_exam' ||
        c.type === 'practical_exam' ||
        c.type === 'semester_exam';
      if (!isExam) return false;
      const pStart = addDaysUTC(c.startDate, -student.prepBufferDays);
      const pEnd = addDaysUTC(c.startDate, -1);
      return rangesOverlap(round.startDate!, round.endDate!, pStart, pEnd);
    });

    if (rPrep) {
      roundEvaluations.push({
        roundId: round.id,
        roundNumber: round.roundNumber,
        roundName: round.name,
        roundType: round.type,
        startDate: round.startDate,
        endDate: round.endDate,
        status: 'prep_risk',
        reason: `Overlaps ${student.prepBufferDays}-day preparation buffer before "${rPrep.title}".`,
      });
      continue;
    }

    roundEvaluations.push({
      roundId: round.id,
      roundNumber: round.roundNumber,
      roundName: round.name,
      roundType: round.type,
      startDate: round.startDate,
      endDate: round.endDate,
      status: 'compatible',
      reason: 'No overlap with confirmed exams or preparation buffers.',
    });
  }

  // Final state resolution priority:
  // 1. academic_conflict -> 2. prep_risk -> 3. travel_risk -> 4. needs_confirmation -> 5. compatible
  let finalStatus: CompatibilityStatus = 'compatible';
  let badgeLabel = 'Compatible';
  let headlineReasoning = `Compatible with known commitments: No exam overlap, and your ${student.prepBufferDays}-day preparation buffer is preserved.`;

  if (hasDirectConflict) {
    finalStatus = 'academic_conflict';
    badgeLabel = 'Academic Conflict';
    headlineReasoning = conflictingCommitments[0].explanation;
  } else if (hasPrepRisk) {
    finalStatus = 'prep_risk';
    badgeLabel = 'Preparation Risk';
    headlineReasoning = conflictingCommitments[0].explanation;
  } else if (hasTravelRisk) {
    finalStatus = 'travel_risk';
    badgeLabel = 'Travel / Schedule Risk';
    headlineReasoning =
      conflictingCommitments[0]?.explanation ||
      detailedReasons[0] ||
      'Requires inter-city travel that conflicts with your travel settings.';
  } else if (hasUnconfirmedOverlap || anyRoundUnconfirmed || event.missingFields.length > 0) {
    finalStatus = 'needs_confirmation';
    badgeLabel = 'Needs Confirmation';
    headlineReasoning = hasUnconfirmedOverlap
      ? conflictingCommitments[0].explanation
      : anyRoundUnconfirmed
      ? 'Potentially suitable: No known exam overlap for published dates, but the organizer has not yet confirmed the final-round schedule.'
      : `Needs confirmation: ${event.missingFields.join(', ')} not yet published by organizer.`;
  }

  for (const c of conflictingCommitments) {
    detailedReasons.push(c.explanation);
  }
  if (detailedReasons.length === 0) {
    detailedReasons.push(
      `Participation window (${formatPrettyRange(evStart, evEnd)}) does not overlap any confirmed exams or their ${student.prepBufferDays}-day preparation windows.`
    );
  }

  return {
    status: finalStatus,
    badgeLabel,
    headlineReasoning,
    detailedReasons,
    conflictingCommitments,
    roundEvaluations,
    registrationDeadlineNote: regDeadlineNote,
    sourceAttribution,
  };
}

/**
 * Automated Deterministic Test Suite (Section 8 & Section 14 Stage 4)
 * Verifies the exact November exam schedule scenarios from the product specification.
 */
export interface CompatibilityTestCaseResult {
  id: string;
  name: string;
  scenarioDescription: string;
  expectedStatus: CompatibilityStatus;
  actualStatus: CompatibilityStatus;
  passed: boolean;
  explanationOutput: string;
}

export function runCompatibilityEngineTestSuite(): CompatibilityTestCaseResult[] {
  // Reference student academic schedule from the prompt:
  // - Internal examination: November 10, 2026
  // - Practical examination: November 13, 2026
  // - End-semester exam: November 20, 2026
  // - Preferred preparation buffer: 2 days before an examination
  const specCommitments: AcademicScheduleItem[] = [
    {
      id: 'test-internal-nov10',
      title: 'Internal Examination',
      type: 'internal_exam',
      startDate: '2026-11-10',
      endDate: '2026-11-10',
      semester: 'Odd Sem 2026',
      notes: 'Spec test fixture',
      extractionConfidence: 0.99,
      confirmedByStudent: true,
    },
    {
      id: 'test-practical-nov13',
      title: 'Practical Examination',
      type: 'practical_exam',
      startDate: '2026-11-13',
      endDate: '2026-11-13',
      semester: 'Odd Sem 2026',
      notes: 'Spec test fixture',
      extractionConfidence: 0.99,
      confirmedByStudent: true,
    },
    {
      id: 'test-endsem-nov20',
      title: 'End-Semester Examination',
      type: 'semester_exam',
      startDate: '2026-11-20',
      endDate: '2026-11-20',
      semester: 'Odd Sem 2026',
      notes: 'Spec test fixture',
      extractionConfidence: 0.99,
      confirmedByStudent: true,
    },
  ];

  const studentPrefs = {
    city: 'Bengaluru',
    preferredTravelDistanceKm: 200,
    prepBufferDays: 2,
    travelBufferDays: 1,
  };

  const makeMockEvent = (
    id: string,
    title: string,
    startDate: string | null,
    endDate: string | null,
    overrides?: Partial<HackathonEvent>
  ): HackathonEvent => ({
    id,
    slug: id,
    editionYear: 2026,
    title,
    description: 'Test fixture event',
    organizer: 'Test Organizer',
    organizingCollege: 'Test College',
    category: 'software',
    domains: ['AI/ML'],
    startDate,
    endDate,
    registrationOpenDate: '2026-10-01',
    registrationCloseDate: '2026-10-25',
    timezone: 'Asia/Kolkata',
    rounds: [],
    venueName: 'Bengaluru Campus',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    country: 'India',
    distanceFromBengaluruKm: 10,
    mode: 'offline',
    eligibilityCriteria: 'All students',
    eligibleYears: ['3rd Year'],
    eligibleBranches: ['All Branches'],
    teamSizeMin: 2,
    teamSizeMax: 4,
    prizePool: 100000,
    prizeCurrency: 'INR',
    participationFee: 0,
    officialRegistrationUrl: 'https://example.edu/reg',
    officialWebsite: 'https://example.edu',
    sources: [],
    changeHistory: [],
    verificationStatus: 'verified',
    extractedAt: '2026-10-15T00:00:00Z',
    lastCheckedAt: '2026-10-18T00:00:00Z',
    lastVerifiedAt: '2026-10-18T00:00:00Z',
    status: 'upcoming',
    confidenceScore: 0.98,
    missingFields: [],
    beginnerFriendly: true,
    themes: [],
    artworkVariant: 'bengaluru_cloud',
    dataOrigin: 'labeled_sample',
    createdAt: '2026-10-15T00:00:00Z',
    updatedAt: '2026-10-18T00:00:00Z',
    ...overrides,
  });

  const testCases: {
    id: string;
    name: string;
    scenarioDescription: string;
    event: HackathonEvent;
    expected: CompatibilityStatus;
  }[] = [
    {
      id: 'tc-1',
      name: 'AI Innovation Hackathon (Nov 6–7)',
      scenarioDescription:
        'Participation Nov 6–7 vs Internal Exam Nov 10 (protected prep buffer is Nov 8–9). Should be Compatible.',
      event: makeMockEvent('ai-innov', 'AI Innovation Hackathon', '2026-11-06', '2026-11-07'),
      expected: 'compatible',
    },
    {
      id: 'tc-2',
      name: 'Campus Code Challenge (Nov 12–14)',
      scenarioDescription:
        'Participation Nov 12–14 directly overlaps Nov 13 Practical Exam (even though registration closed Oct 25). Should be Academic Conflict.',
      event: makeMockEvent('campus-code', 'Campus Code Challenge', '2026-11-12', '2026-11-14'),
      expected: 'academic_conflict',
    },
    {
      id: 'tc-3',
      name: 'National Buildathon (Nov 18–19)',
      scenarioDescription:
        'Participation Nov 18–19 hits the 2-day preparation buffer before the Nov 20 End-Semester Exam. Should be Preparation Risk.',
      event: makeMockEvent('nat-build', 'National Buildathon', '2026-11-18', '2026-11-19'),
      expected: 'prep_risk',
    },
    {
      id: 'tc-4',
      name: 'Unconfirmed Final Round Schedule (Nov 2–3)',
      scenarioDescription:
        'No exam conflict on Nov 2–3, but Round 2 Finale has unconfirmed dates (startDate: null). Should be Needs Confirmation.',
      event: makeMockEvent('unconf-round', 'Open Systems Sprint', '2026-11-02', '2026-11-03', {
        rounds: [
          {
            id: 'r-final',
            roundNumber: 2,
            name: 'Grand Finale',
            type: 'finale',
            startDate: null,
            endDate: null,
            requiresPhysicalAttendance: true,
            description: 'Dates TBA by organizer',
            mode: 'offline',
          },
        ],
      }),
      expected: 'needs_confirmation',
    },
    {
      id: 'tc-5',
      name: 'Inter-District Travel Buffer Overlap (Nov 11–12 in Surathkal)',
      scenarioDescription:
        'Offline event in Surathkal (350 km away) on Nov 11–12 requires 1-day travel buffer (Nov 10–13), overlapping Nov 10 & Nov 13 exams. Should be Travel Risk.',
      event: makeMockEvent('coastal-hack', 'Coastal Hardware Sprint', '2026-11-11', '2026-11-12', {
        city: 'Surathkal',
        distanceFromBengaluruKm: 350,
      }),
      expected: 'travel_risk',
    },
  ];

  return testCases.map((tc) => {
    const res = evaluateAcademicCompatibility(tc.event, specCommitments, studentPrefs);
    return {
      id: tc.id,
      name: tc.name,
      scenarioDescription: tc.scenarioDescription,
      expectedStatus: tc.expected,
      actualStatus: res.status,
      passed: res.status === tc.expected,
      explanationOutput: res.headlineReasoning,
    };
  });
}
