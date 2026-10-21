export type PublicCompetitionStatus =
  | 'Upcoming'
  | 'Registration Open'
  | 'Closing Soon'
  | 'Registration Closed'
  | 'Results Announced';

export type CompetitionMode = 'Online' | 'Offline' | 'Hybrid';

export interface CuratedCompetition {
  id: string;
  title: string;
  college: string;
  description: string;
  event_date: string;            // YYYY-MM-DD
  event_date_label: string;      // e.g. "24 – 25 Oct 2026"
  registration_deadline: string; // YYYY-MM-DD
  location: string;
  mode: CompetitionMode;
  prize: string | null;          // e.g. "₹1,00,000"
  team_size?: string;            // e.g. "2 – 4 Members"
  entry_fee?: string;            // e.g. "₹1,000 / Team" or "Free"
  coordinators?: string;         // Real coordinator contact from poster
  perks?: string;                // e.g. "Free Pizza · Free Shuttle"
  category: string;
  registration_status: PublicCompetitionStatus;
  status_override?: PublicCompetitionStatus | null;
  registration_url: string;      // Exact URL decoded from Poster QR Code
  brochure_url: string | null;
  image_url: string | null;      // Real uploaded poster path
  secondary_image_url?: string | null; // e.g. Training roadmap poster
  source_url: string;
  last_verified_at: string;
  created_at: string;
  updated_at: string;
}

export type YearOfStudy =
  | '1st Year'
  | '2nd Year'
  | '3rd Year'
  | '4th Year'
  | 'Other';

export interface StudentSignupRecord {
  id: string;
  name: string;
  phone: string;
  year_of_study: YearOfStudy;
  created_at: string;
}
