export type EventCategory = 'software' | 'hardware' | 'both';
export type ParticipationMode = 'online' | 'offline' | 'hybrid';
export type VerificationStatus =
  | 'verified'
  | 'pending'
  | 'unverified'
  | 'flagged_duplicate'
  | 'conflicting_sources';

export type EventLifecycleStatus =
  | 'upcoming'
  | 'registration_closed'
  | 'ongoing'
  | 'completed'
  | 'cancelled'
  | 'date_unconfirmed'
  | 'historical_archived';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type HackathonDomain =
  | 'AI/ML'
  | 'Web Development'
  | 'Cybersecurity'
  | 'IoT'
  | 'Robotics'
  | 'Blockchain'
  | 'Data Science'
  | 'Design'
  | 'Open Innovation';

export interface RoundMilestone {
  id: string;
  roundNumber: number;
  name: string;
  type: 'registration' | 'submission' | 'preliminary' | 'finale';
  startDate: string | null; // null if organizer has not published exact round date
  endDate: string | null;
  requiresPhysicalAttendance: boolean;
  description: string;
  mode: ParticipationMode;
}

export interface EventSource {
  id: string;
  platform:
    | 'Official Organizer Website'
    | 'College Portal'
    | 'Devfolio / Unstop'
    | 'IEEE / ACM Chapter'
    | 'Organizer Submission'
    | 'Permitted Public Feed';
  url: string;
  discoveredAt: string;
  lastCheckedAt: string;
  isPrimary: boolean;
  evidenceSnippet?: string;
  extractionMethod: 'manual_verified' | 'organizer_submitted' | 'ai_extracted';
  confidenceScore: number; // 0.0 to 1.0
}

export interface FieldChangeRecord {
  id: string;
  field: 'registrationCloseDate' | 'startDate' | 'endDate' | 'officialRegistrationUrl' | 'status';
  previousValue: string;
  newValue: string;
  detectedAt: string;
  sourceUrl: string;
}

export interface HackathonEvent {
  id: string;
  slug: string;
  editionYear: number; // e.g., 2026 vs 2025
  title: string;
  description: string;
  organizer: string;
  organizingCollege: string;
  category: EventCategory;
  domains: HackathonDomain[];
  startDate: string | null; // YYYY-MM-DD or null if unconfirmed
  endDate: string | null;   // YYYY-MM-DD or null if unconfirmed
  registrationOpenDate: string | null;
  registrationCloseDate: string | null;
  timezone: string; // e.g., 'Asia/Kolkata'
  rounds: RoundMilestone[];
  venueName: string;
  city: string;
  district:
    | 'Bengaluru Urban'
    | 'Mysuru'
    | 'Mandya'
    | 'Dakshina Kannada'
    | 'Dharwad'
    | 'Online / Statewide';
  state: string;
  country: string;
  distanceFromBengaluruKm: number;
  mode: ParticipationMode;
  eligibilityCriteria: string;
  eligibleYears: string[];
  eligibleBranches: string[];
  teamSizeMin: number;
  teamSizeMax: number;
  prizePool: number | null;
  prizeBreakdown?: { position: string; amount: string; perks: string }[];
  prizeCurrency: 'INR';
  participationFee: number | null; // null if unknown, 0 for free
  officialRegistrationUrl: string;
  officialWebsite: string;
  organizerContactEmail?: string;
  sources: EventSource[];
  changeHistory: FieldChangeRecord[];
  verificationStatus: VerificationStatus;
  extractedAt: string;
  lastCheckedAt: string;
  lastVerifiedAt: string | null;
  status: EventLifecycleStatus;
  confidenceScore: number; // 0.0 to 1.0
  missingFields: string[];
  beginnerFriendly: boolean;
  themes: string[];
  hardwareRequirements?: string;
  softwareRequirements?: string;
  artworkVariant:
    | 'bengaluru_cloud'
    | 'nitk_robotics'
    | 'bmsce_code'
    | 'mysuru_iot'
    | 'kle_sprint'
    | 'mandya_agri'
    | 'rvce_cyber';
  dataOrigin: 'labeled_sample' | 'live_ingested' | 'user_submitted';
  createdAt: string;
  updatedAt: string;
}

export type SavedRegistrationStage =
  | 'bookmarked'
  | 'team_forming'
  | 'registered_official'
  | 'round1_submitted';

export interface SavedHackathonRecord {
  eventId: string;
  savedAt: string;
  stage: SavedRegistrationStage;
  personalNotes: string;
  reminderEnabled: boolean;
}

export type AcademicCommitmentCategory =
  | 'internal_exam'
  | 'practical_exam'
  | 'semester_exam'
  | 'mandatory_event'
  | 'holiday';

export interface AcademicScheduleItem {
  id: string;
  title: string;
  type: AcademicCommitmentCategory;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  semester: string;
  notes: string;
  sourceDocumentName?: string;
  extractionConfidence: number; // 0.0 to 1.0
  confirmedByStudent: boolean;
  ambiguityFlag?: string; // e.g., "Year was inferred as 2026; please confirm"
}

export interface UploadedAcademicPdfRecord {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedAt: string;
  institutionDetected: string;
  academicYearDetected: string;
  semesterDetected: string;
  storagePrivacy: 'private_student_isolated';
  extractionMethod: 'gemini_pdf_vision' | 'text_parser';
  extractedCount: number;
  confirmedCount: number;
}

export interface CollegeAcademicCalendar {
  collegeId: string;
  collegeName: string;
  shortName: string;
  city: string;
  district: string;
  universityAffiliation: string;
  academicYearLabel: string;
  semesterStart: string;
  semesterEnd: string;
  items: AcademicScheduleItem[];
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  collegeId: string;
  collegeName: string;
  branch: string;
  academicYear: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  city: string;
  district: string;
  skills: string[];
  preferredCategory: EventCategory;
  preferredMode: ParticipationMode | 'any';
  preferredTravelDistanceKm: number;
  prepBufferDays: number; // e.g. 2 days before exams
  travelBufferDays: number; // e.g. 1 day before/after out-of-district offline events
  experienceLevel: ExperienceLevel;
  preferredDomains: HackathonDomain[];
  savedHackathons: SavedHackathonRecord[];
  examConflictAlerts: boolean;
  deadlineReminderDays: number;
  uploadedPdfs: UploadedAcademicPdfRecord[];
}

export interface EligibilityAssessment {
  status: 'eligible' | 'ineligible' | 'unknown';
  summaryLabel: string;
  reasons: string[];
}

/**
 * The 5 Deterministic Compatibility States defined in Section 8 of the Engineering Spec
 */
export type CompatibilityStatus =
  | 'compatible'
  | 'academic_conflict'
  | 'prep_risk'
  | 'travel_risk'
  | 'needs_confirmation';

export interface RoundCompatibilityEvaluation {
  roundId: string;
  roundNumber: number;
  roundName: string;
  roundType: RoundMilestone['type'];
  startDate: string | null;
  endDate: string | null;
  status: CompatibilityStatus;
  reason: string;
}

export interface CompatibilityResult {
  status: CompatibilityStatus;
  badgeLabel: string;
  headlineReasoning: string;
  detailedReasons: string[];
  conflictingCommitments: {
    commitment: AcademicScheduleItem;
    conflictType: 'direct_overlap' | 'prep_buffer_overlap' | 'travel_buffer_overlap' | 'unconfirmed_commitment';
    protectedWindowStart: string;
    protectedWindowEnd: string;
    explanation: string;
  }[];
  roundEvaluations: RoundCompatibilityEvaluation[];
  registrationDeadlineNote: string;
  sourceAttribution: string;
}

export interface SourceAdapterStatus {
  id: string;
  name: string;
  category:
    | 'Official College Circulars'
    | 'Organizer Websites'
    | 'Permitted Public Feeds'
    | 'Student & Organizer Submissions';
  targetUrl: string;
  accessMethod: 'Public JSON/RSS Feed' | 'HTML Metadata + Gemini Extraction' | 'Webhook / Direct Submission';
  enabled: boolean;
  rateLimitPolicy: string;
  lastCheckedAt: string | null;
  lastSuccessAt: string | null;
  status: 'healthy' | 'degraded' | 'requires_credentials' | 'failed';
  recentError: string | null;
  eventsDiscoveredCount: number;
  complianceNote: string;
}

export type ActiveRoute =
  | 'home'
  | 'explore'
  | 'details'
  | 'calendar'
  | 'my-academic-calendar'
  | 'student-hub'
  | 'onboarding'
  | 'submit-event'
  | 'admin'
  | 'sources';
