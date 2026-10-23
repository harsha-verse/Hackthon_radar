import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Lock,
  LogOut,
  MapPin,
  Plus,
  QrCode,
  ShieldCheck,
  Trash2,
  Trophy,
  Users,
  X,
  ZoomIn,
} from 'lucide-react';
import {
  CompetitionMode,
  CuratedCompetition,
  PublicCompetitionStatus,
  StudentSignupRecord,
  YearOfStudy,
} from './types/v1';
import {
  categorizeCompetitions,
  formatReadableDate,
  getDaysUntilDate,
  initGA4IfConfigured,
  isPastCompetition,
  parseDateEndOfDayIST,
  trackGA4Event,
} from './lib/analytics';

const INITIAL_COMPETITIONS: CuratedCompetition[] = [
  {
    id: 'jit-gameathon-8',
    title: 'GAMEATHON 8.0 — A Global Contest',
    college: 'Jyothy Institute of Technology (JIT), Bengaluru · Dept. of ISE & Bits&Bytes x ACM',
    description:
      'A global game development & software contest with $2000 total prize pool, free Papa John\'s pizza for all participants, free shuttle service from Silk Institute metro, and a 3-day pre-hackathon training series.',
    event_date: '2026-10-23',
    event_date_label: '23 – 24 Oct 2026',
    registration_deadline: '2026-10-22',
    location: 'Jyothy Institute of Technology, Tataguni, Bengaluru',
    mode: 'Offline',
    prize: '$2000 (≈ ₹1,65,000)',
    team_size: '2 – 4 Members',
    entry_fee: 'Free Registration (Papa John\'s Pizza Included)',
    coordinators: 'Sathvik Vasishta (+91 96060 18932) · Priyanka T S (+91 73497 10985)',
    perks: 'Free Papa John\'s Pizza · Free Shuttle from Silk Institute · 3-Day Training Roadmap',
    category: 'GameDev & Innovation',
    registration_status: 'Closing Soon',
    status_override: null,
    registration_url: 'https://gameathon-8.com/',
    brochure_url: null,
    image_url:
      '/assets/aistudio/IMG-20261021-WA0011_3997add3.jpg',
    secondary_image_url:
      '/assets/aistudio/IMG-20261021-WA0010_5edef94c.jpg',
    source_url: 'https://gameathon-8.com/',
    last_verified_at: '2026-10-21T09:50:00Z',
    created_at: '2026-10-21T09:50:00Z',
    updated_at: '2026-10-21T09:50:00Z',
  },
  {
    id: 'pesu-hashcode-14',
    title: 'Hashcode 14.0',
    college: 'PES University · The Innovation Lab & Akamai',
    description:
      "PESU's flagship 24-hour hackathon with ₹1,00,000 prize pool and internship opportunities.",
    event_date: '2026-10-24',
    event_date_label: '24 – 25 Oct 2026',
    registration_deadline: '2026-10-23',
    location: 'PES University, Bengaluru',
    mode: 'Offline',
    prize: '₹1,00,000 + Internships',
    team_size: '2 – 4 Members',
    entry_fee: 'See Official Page',
    coordinators: '6361454703 · 8310013064',
    category: '24-Hour Hackathon',
    registration_status: 'Closing Soon',
    status_override: null,
    registration_url: 'https://hashcode.theinnovationlab.in/',
    brochure_url: null,
    image_url:
      '/assets/aistudio/IMG_20261021_134622_e6cfc487.jpg',
    secondary_image_url: null,
    source_url: 'https://hashcode.theinnovationlab.in/',
    last_verified_at: '2026-10-21T09:50:00Z',
    created_at: '2026-10-21T06:30:00Z',
    updated_at: '2026-10-21T09:50:00Z',
  },
  {
    id: 'pesu-agentathon-2026',
    title: 'AGENTATHON — 24-Hour State Level Hackathon',
    college: 'PES University RR Campus · ENCODE AI',
    description:
      '24-hour state-level AI & autonomous agents hackathon at 13th Floor BE Block, PESU RR Campus.',
    event_date: '2026-10-31',
    event_date_label: '31 Oct – 1 Nov 2026',
    registration_deadline: '2026-10-29',
    location: '13th Floor BE Block, PESU RR Campus, Bengaluru',
    mode: 'Offline',
    prize: '₹36,000',
    team_size: '3 – 4 Members',
    entry_fee: 'See Registration Form',
    coordinators: 'ENCODE AI PESU',
    category: 'AI & Agents',
    registration_status: 'Registration Open',
    status_override: null,
    registration_url: 'https://forms.gle/Eju7ZgjhMGcKKUus7',
    brochure_url: null,
    image_url:
      '/assets/aistudio/IMG_20261021_135446_5f0f8f03.jpg',
    secondary_image_url: null,
    source_url: 'https://forms.gle/Eju7ZgjhMGcKKUus7',
    last_verified_at: '2026-10-21T09:50:00Z',
    created_at: '2026-10-21T06:25:00Z',
    updated_at: '2026-10-21T09:50:00Z',
  },
  {
    id: 'sjbit-lakshya-2026',
    title: 'LAKSHYA — National Level 24 Hours Hackathon',
    college: 'SJB Institute of Technology (SJBIT), Kengeri · Dept. of ISE & DLithe',
    description:
      'National-level 24-hour hackathon across Agritech, Smart & Sustainable Future, and Governance.',
    event_date: '2026-11-05',
    event_date_label: '5 – 6 Nov 2026',
    registration_deadline: '2026-11-03',
    location: 'CSE Seminar Hall, SJBIT, Kengeri, Bengaluru',
    mode: 'Offline',
    prize: '₹35,000 + Internships',
    team_size: '2 – 4 Members',
    entry_fee: '₹1,000 / Team',
    coordinators: 'Keshav S (+91 78925 86349) · Deekshitha J A (+91 80504 62087)',
    category: 'Agritech · Sustainability · Governance',
    registration_status: 'Registration Open',
    status_override: null,
    registration_url: 'https://qrto.org/7Dj757',
    brochure_url: null,
    image_url:
      '/assets/aistudio/WhatsApp_Image_2026-10-21_at_11.55.03_AM_e1a11271.jpeg',
    secondary_image_url: null,
    source_url: 'https://qrto.org/7Dj757',
    last_verified_at: '2026-10-21T09:50:00Z',
    created_at: '2026-10-21T06:20:00Z',
    updated_at: '2026-10-21T09:50:00Z',
  },
  {
    id: 'biet-minearena-1',
    title: 'MINEARENA 1.0 — 24 Hours National Level Hackathon',
    college: 'BIET Davangere · Code Commit Community',
    description:
      'Build · Battle · Conquer. 24-hour national-level hackathon at SSM Cultural Hall, BIET Davangere.',
    event_date: '2026-11-12',
    event_date_label: '12 – 13 Nov 2026',
    registration_deadline: '2026-11-09',
    location: 'SSM Cultural Hall, BIET, Davangere',
    mode: 'Offline',
    prize: '₹75,000',
    team_size: '2 – 4 Members',
    entry_fee: 'See Official Page',
    coordinators: 'Prajwal Raikar (+91 82772 57286) · V Chaitanya (+91 94486 67576)',
    category: 'National Hackathon',
    registration_status: 'Registration Open',
    status_override: null,
    registration_url:
      'https://minearena-1-0.devpost.com/?preview_token=E6ZpH5CiiYbb1%2BpTW%2F6ykttDuJCuTv%2BdWtVjaduSeds%3D',
    brochure_url: null,
    image_url:
      '/assets/aistudio/IMG_20261021_135512_80288e94.jpg',
    secondary_image_url: null,
    source_url:
      'https://minearena-1-0.devpost.com/?preview_token=E6ZpH5CiiYbb1%2BpTW%2F6ykttDuJCuTv%2BdWtVjaduSeds%3D',
    last_verified_at: '2026-10-21T09:50:00Z',
    created_at: '2026-10-21T06:15:00Z',
    updated_at: '2026-10-21T09:50:00Z',
  },
  {
    id: 'dsu-green-pulse-2026',
    title: 'GREEN PULSE — 7-Hour Sustainability Hackathon',
    college: 'Dayananda Sagar University (DSU), Bengaluru · Eco Club',
    description:
      'Where innovation grows, the planet thrives. 7-hour campus sustainability sprint (8:30 AM – 4:30 PM).',
    event_date: '2026-11-13',
    event_date_label: '13 Nov 2026 · 8:30 AM – 4:30 PM',
    registration_deadline: '2026-11-11',
    location: 'Dayananda Sagar University, Bengaluru',
    mode: 'Offline',
    prize: 'Exciting Prize Pool',
    team_size: '2 – 4 Members',
    entry_fee: 'See Registration Page',
    coordinators: 'Dept. of Student Affairs, DSU',
    category: 'GreenTech & Sustainability',
    registration_status: 'Registration Open',
    status_override: null,
    registration_url: 'https://q.me-qr.com/srbk40k9',
    brochure_url: null,
    image_url:
      '/assets/aistudio/IMG_20261021_135134_c1397f09.jpg',
    secondary_image_url: null,
    source_url: 'https://q.me-qr.com/srbk40k9',
    last_verified_at: '2026-10-21T09:50:00Z',
    created_at: '2026-10-21T06:10:00Z',
    updated_at: '2026-10-21T09:50:00Z',
  },
];

const STUDENT_STORAGE_KEY = 'hackathon_radar_student_v2';
const ADMIN_PASSCODE_STORAGE_KEY = 'hackathon_radar_admin_passcode_v2';

function StatusDot({ status }: { status: PublicCompetitionStatus }) {
  if (status === 'Closing Soon') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
        Closing Soon
      </span>
    );
  }
  if (status === 'Registration Open' || status === 'Upcoming') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        Open Now
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
      <span className="h-2 w-2 rounded-full bg-zinc-500" />
      {status}
    </span>
  );
}

export function App() {
  const [competitions, setCompetitions] = useState<CuratedCompetition[]>(
    INITIAL_COMPETITIONS
  );
  const [student, setStudent] = useState<StudentSignupRecord | null>(() => {
    try {
      const saved = localStorage.getItem(STUDENT_STORAGE_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && parsed.name && parsed.phone) return parsed;
      return null;
    } catch {
      return null;
    }
  });

  // Login Form State (Mandatory before entering the website)
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [yearInput, setYearInput] = useState<YearOfStudy>('2nd Year');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);

  // Poster Lightbox Modal State
  const [activePosterComp, setActivePosterComp] =
    useState<CuratedCompetition | null>(null);
  const [lightboxTab, setLightboxTab] = useState<'poster' | 'roadmap' | 'brochure'>('poster');

  // Admin Modal State (View student signups + Scan Poster QR to add events)
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState<string>(() => {
    try {
      return localStorage.getItem(ADMIN_PASSCODE_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminTab, setAdminTab] = useState<'students' | 'add_poster'>('students');
  const [loggedStudents, setLoggedStudents] = useState<StudentSignupRecord[]>([]);
  const [adminStatusMsg, setAdminStatusMsg] = useState<string | null>(null);

  // Admin Add Poster + Auto QR Scanner + Event Brochure State
  const [posterPreviewDataUrl, setPosterPreviewDataUrl] = useState<string>('');
  const [newBrochureDataUrl, setNewBrochureDataUrl] = useState<string>('');
  const [newBrochureFileName, setNewBrochureFileName] = useState<string>('');
  const [isScanningQr, setIsScanningQr] = useState(false);
  const [qrScanFeedback, setQrScanFeedback] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCollege, setNewCollege] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventDateLabel, setNewEventDateLabel] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newMode, setNewMode] = useState<CompetitionMode>('Offline');
  const [newPrize, setNewPrize] = useState('');
  const [newTeamSize, setNewTeamSize] = useState('2 – 4 Members');
  const [newRegUrl, setNewRegUrl] = useState('');
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(() => Date.now());

  useEffect(() => {
    initGA4IfConfigured();
    fetch('/api/competitions')
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.competitions) && data.competitions.length > 0) {
          setCompetitions(data.competitions);
        }
      })
      .catch(() => {
        // Fallback to verified initial competitions
      });
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (student) {
      trackGA4Event(
        'competition_list_viewed',
        { count: competitions.length },
        { dedupeKey: 'view_competitions_feed' }
      );
    }
  }, [student, competitions.length]);

  // Automatically categorize competitions into mutually exclusive Active and Past sections
  const {
    allCompetitions: orderedCompetitions,
    activeCompetitions,
    pastCompetitions,
  } = useMemo(
    () => categorizeCompetitions(competitions, currentTimeMs),
    [competitions, currentTimeMs]
  );

  function handleInputInteraction() {
    if (!hasStartedTyping) {
      setHasStartedTyping(true);
      trackGA4Event('signup_started', {}, { dedupeKey: 'signup_started_once' });
    }
  }

  async function handleMandatoryLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);

    const trimmedName = nameInput.trim();
    const digitsPhone = phoneInput.replace(/\D/g, '');
    const normalizedPhone =
      digitsPhone.length === 12 && digitsPhone.startsWith('91')
        ? digitsPhone.slice(2)
        : digitsPhone;

    if (trimmedName.length < 2) {
      setLoginError('Please enter your name.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      setLoginError('Enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/signups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          phone: normalizedPhone,
          year_of_study: yearInput,
        }),
      });
      const data = await response.json();

      const savedStudent: StudentSignupRecord = data?.student || {
        id: `stu-${Date.now()}`,
        name: trimmedName,
        phone: normalizedPhone,
        year_of_study: yearInput,
        created_at: new Date().toISOString(),
      };

      localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(savedStudent));
      setStudent(savedStudent);
      trackGA4Event('signup_completed', { year_of_study: yearInput });
    } catch {
      const fallbackStudent: StudentSignupRecord = {
        id: `stu-${Date.now()}`,
        name: trimmedName,
        phone: normalizedPhone,
        year_of_study: yearInput,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(fallbackStudent));
      setStudent(fallbackStudent);
      trackGA4Event('signup_completed', { year_of_study: yearInput });
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem(STUDENT_STORAGE_KEY);
    setStudent(null);
    setNameInput('');
    setPhoneInput('');
  }

  async function handleUnlockAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAdminStatusMsg(null);
    try {
      const res = await fetch('/api/admin/signups', {
        headers: { 'x-admin-passcode': adminPasscode.trim() },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAdminStatusMsg(data?.error || 'Invalid passcode (default: radar-admin-2026)');
        return;
      }
      localStorage.setItem(ADMIN_PASSCODE_STORAGE_KEY, adminPasscode.trim());
      setLoggedStudents(data.signups || []);
      setAdminUnlocked(true);
    } catch {
      setAdminStatusMsg('Could not verify admin passcode.');
    }
  }

  async function refreshAdminSignups() {
    try {
      const res = await fetch('/api/admin/signups', {
        headers: { 'x-admin-passcode': adminPasscode.trim() },
      });
      const data = await res.json();
      if (data?.ok) {
        setLoggedStudents(data.signups || []);
      }
    } catch {
      // Ignore error
    }
  }

  function exportStudentsCsv() {
    if (loggedStudents.length === 0) return;
    const header = 'Name,Phone Number,Year of Study,Login Timestamp\n';
    const rows = loggedStudents
      .map(
        (s) =>
          `"${s.name.replace(/"/g, '""')}","${s.phone}","${s.year_of_study}","${s.created_at}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hackathon-radar-students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handlePosterFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrScanFeedback(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = String(reader.result || '');
      setPosterPreviewDataUrl(base64);
      setIsScanningQr(true);
      try {
        const res = await fetch('/api/scan-poster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        const data = await res.json();
        const ext = data?.extracted;

        const extractedTitle = (ext?.title || '').trim();
        const extractedCollege = (ext?.college || '').trim();
        const rawLocation = (ext?.location || '').trim();
        const resolvedLocation =
          rawLocation &&
          !/^(not specified|n\/a|none|unknown|null|tba)$/i.test(rawLocation)
            ? rawLocation
            : extractedCollege;
        const resolvedCollege = extractedCollege || resolvedLocation;

        if (extractedTitle) setNewTitle(extractedTitle);
        if (resolvedCollege) setNewCollege(resolvedCollege);
        if (resolvedLocation) setNewLocation(resolvedLocation);
        if (ext?.event_date) setNewEventDate(ext.event_date);
        if (ext?.event_date_label) setNewEventDateLabel(ext.event_date_label);
        if (ext?.registration_deadline) setNewDeadline(ext.registration_deadline);
        if (ext?.prize) setNewPrize(ext.prize);
        if (ext?.team_size) setNewTeamSize(ext.team_size);

        const detectedUrl = data?.qrUrl || ext?.registration_url || '';
        if (detectedUrl) {
          setNewRegUrl(detectedUrl);
        }

        const autoFilledFields: string[] = [];
        if (extractedTitle) autoFilledFields.push(`Event: "${extractedTitle}"`);
        if (resolvedCollege) autoFilledFields.push(`College/Org: ${resolvedCollege}`);
        if (resolvedLocation) autoFilledFields.push(`Location: ${resolvedLocation}`);
        if (ext?.prize) autoFilledFields.push(`Prize: ${ext.prize}`);
        if (ext?.registration_deadline)
          autoFilledFields.push(`Deadline: ${ext.registration_deadline}`);
        if (detectedUrl) autoFilledFields.push(`Link: ${detectedUrl}`);

        if (autoFilledFields.length > 0) {
          setQrScanFeedback(
            `Auto-extracted from poster → ${autoFilledFields.join(' · ')}`
          );
        } else {
          setQrScanFeedback(
            data?.error ||
              'Poster uploaded. Could not auto-detect all fields — review or edit below.'
          );
        }
      } catch {
        setQrScanFeedback('Could not analyze poster automatically. Fill details below.');
      } finally {
        setIsScanningQr(false);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleBrochureFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setNewBrochureDataUrl('');
      setNewBrochureFileName('');
      return;
    }
    setNewBrochureFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setNewBrochureDataUrl(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  }

  async function handleAdminCreateCompetition(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newRegUrl.trim()) {
      setAdminStatusMsg('Event title and registration URL are required.');
      return;
    }

    const finalCollege =
      newCollege.trim() || newLocation.trim() || 'Karnataka Campus Hackathon';
    const finalLocation = newLocation.trim() || finalCollege;
    const cleanEventDate = newEventDate.trim();
    const cleanDeadline = newDeadline.trim();

    try {
      const res = await fetch('/api/competitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': adminPasscode.trim(),
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          college: finalCollege,
          event_date: cleanEventDate,
          event_date_label:
            newEventDateLabel.trim() ||
            (cleanEventDate ? formatReadableDate(cleanEventDate) : ''),
          registration_deadline: cleanDeadline,
          location: finalLocation,
          mode: newMode,
          prize: newPrize.trim() || null,
          team_size: newTeamSize.trim() || '2 – 4 Members',
          registration_url: newRegUrl.trim(),
          image_url: posterPreviewDataUrl || null,
          brochure_url: newBrochureDataUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAdminStatusMsg(data?.error || 'Could not add hackathon.');
        return;
      }
      setCompetitions((prev) => [...prev, data.competition]);
      setNewTitle('');
      setNewCollege('');
      setNewEventDate('');
      setNewEventDateLabel('');
      setNewDeadline('');
      setNewLocation('');
      setNewPrize('');
      setNewRegUrl('');
      setPosterPreviewDataUrl('');
      setNewBrochureDataUrl('');
      setNewBrochureFileName('');
      setQrScanFeedback(null);
      setAdminStatusMsg('Hackathon added in sequential order!');
    } catch {
      setAdminStatusMsg('Network error while adding hackathon.');
    }
  }

  async function handleAdminUpdateCompetition(
    id: string,
    updates: {
      registration_deadline?: string;
      status_override?: PublicCompetitionStatus | null;
      registration_status?: PublicCompetitionStatus;
      clear_status_override?: boolean;
    }
  ) {
    try {
      const res = await fetch(`/api/competitions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': adminPasscode.trim(),
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok && data?.ok && data.competition) {
        setCompetitions((prev) =>
          prev.map((c) => (c.id === id ? data.competition : c))
        );
        setCurrentTimeMs(Date.now());
        setAdminStatusMsg('Competition updated — section placement refreshed.');
        return;
      }
    } catch {
      // Fallback to local state update
    }

    setCompetitions((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next: CuratedCompetition = { ...c };
        if (updates.registration_deadline !== undefined) {
          next.registration_deadline = updates.registration_deadline;
          const cutoff = parseDateEndOfDayIST(updates.registration_deadline);
          if (cutoff !== null && cutoff >= Date.now()) {
            if (next.status_override === 'Registration Closed') {
              next.status_override = null;
            }
            if (next.registration_status === 'Registration Closed') {
              next.registration_status = 'Registration Open';
            }
          }
        }
        if (updates.clear_status_override) {
          next.status_override = null;
          if (
            next.registration_status === 'Registration Closed' ||
            next.registration_status === 'Results Announced'
          ) {
            next.registration_status = 'Registration Open';
          }
        } else if (updates.status_override !== undefined) {
          next.status_override = updates.status_override;
          if (updates.status_override) {
            next.registration_status = updates.status_override;
          }
        } else if (updates.registration_status !== undefined) {
          next.registration_status = updates.registration_status;
          next.status_override = updates.registration_status;
        }
        return next;
      })
    );
    setCurrentTimeMs(Date.now());
  }

  async function handleAdminDeleteCompetition(id: string) {
    try {
      const res = await fetch(`/api/competitions/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-passcode': adminPasscode.trim() },
      });
      if (res.ok) {
        setCompetitions((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      // Ignore
    }
  }

  function renderCompetitionCard(comp: CuratedCompetition, index: number) {
    const seqNumber = String(index + 1).padStart(2, '0');
    const isPast = isPastCompetition(comp, currentTimeMs);
    const daysLeft = getDaysUntilDate(comp.event_date, currentTimeMs);

    return (
      <article
        key={comp.id}
        className="group bg-[#121216] border border-zinc-800/90 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all shadow-lg"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Left: Real Hackathon Poster Thumbnail (Click to open full poster) */}
          <div
            onClick={() => {
              setActivePosterComp(comp);
              trackGA4Event('competition_clicked', {
                competition_id: comp.id,
                competition_title: comp.title,
              });
            }}
            className="relative sm:w-56 md:w-64 h-64 sm:h-auto bg-zinc-950 shrink-0 cursor-pointer overflow-hidden border-b sm:border-b-0 sm:border-r border-zinc-800/80"
          >
            {comp.image_url ? (
              <img
                src={comp.image_url}
                alt={comp.title}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 p-4 text-center">
                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs">{comp.title}</span>
              </div>
            )}

            {/* Sequential Number Badge (#01, #02...) */}
            <div className="absolute top-3 left-3 h-8 px-2.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 flex items-center gap-1.5 text-xs font-mono font-bold text-white">
              <span className="text-indigo-400">#{seqNumber}</span>
            </div>

            {/* Tap to Zoom Overlay Pill */}
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 flex items-center gap-1 text-[11px] font-medium text-zinc-200">
              <ZoomIn className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full Poster</span>
            </div>
          </div>

          {/* Right: Essential Scannable Info + Direct QR Action */}
          <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
            <div>
              {/* Top Row: Status + College Name */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-indigo-400">
                  {comp.college}
                </span>
                <StatusDot status={comp.registration_status} />
              </div>

              {/* Event Title */}
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {comp.title}
              </h2>

              {/* Key Facts Grid — Google Pay Style Visual Clarity */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* Event Date */}
                <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <CalendarIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Event Date</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-white mt-0.5 truncate">
                    {comp.event_date_label || formatReadableDate(comp.event_date)}
                  </p>
                </div>

                {/* Prize Money */}
                <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Prize Pool</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-amber-300 mt-0.5 truncate">
                    {comp.prize || 'See Poster'}
                  </p>
                </div>

                {/* Team Size / Fee */}
                <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Team Size</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-white mt-0.5 truncate">
                    {comp.team_size || '2 – 4 Members'}
                    {comp.entry_fee && comp.entry_fee !== 'See Official Page'
                      ? ` · ${comp.entry_fee}`
                      : ''}
                  </p>
                </div>
              </div>

              {/* Perks Chip (e.g. Papa John's Pizza, Free Shuttle) */}
              {comp.perks && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 font-medium">
                  <span>✨ {comp.perks}</span>
                </div>
              )}

              {/* Location & Coordinator Line */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                <span className="inline-flex items-center gap-1 text-zinc-300">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  {comp.location}
                </span>
                {!isPast && daysLeft > 0 && (
                  <span className="text-indigo-400 font-medium">
                    • In {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                  </span>
                )}
                {comp.coordinators && (
                  <span className="text-zinc-500 truncate">
                    · Contact: {comp.coordinators}
                  </span>
                )}
              </div>
            </div>

            {/* Action Bar: Direct QR Link + View Poster + Brochure */}
            <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActivePosterComp(comp);
                    setLightboxTab('poster');
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-indigo-400" />
                  <span>View Poster</span>
                </button>

                {comp.brochure_url && (
                  <button
                    type="button"
                    onClick={() => {
                      setActivePosterComp(comp);
                      setLightboxTab('brochure');
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-emerald-900/60 text-xs font-medium text-emerald-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Event Brochure</span>
                  </button>
                )}

                {comp.secondary_image_url && (
                  <button
                    type="button"
                    onClick={() => {
                      setActivePosterComp(comp);
                      setLightboxTab('roadmap');
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-amber-900/50 text-xs font-medium text-amber-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Training Roadmap</span>
                  </button>
                )}
              </div>

              <a
                href={comp.registration_url || comp.source_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackGA4Event('registration_clicked', {
                    competition_id: comp.id,
                    competition_title: comp.title,
                    destination_url: comp.registration_url || comp.source_url,
                  })
                }
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
              >
                <span>Register Now</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // ============================================================================
  // STEP 1: MANDATORY STUDENT SIGN-IN GATE (Before Accessing Website Data)
  // ============================================================================
  if (!student) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
        {/* Top Minimal Brand Bar */}
        <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/Futuristic_Purple_Orbit_Compass_Logo_2351c1b2.png"
              alt="Hackathon Radar"
              className="h-9 w-9 rounded-xl object-cover border border-indigo-500/30 shadow-lg shadow-indigo-600/25"
            />
            <div>
              <span className="font-bold tracking-tight text-base text-white block leading-none">
                Hackathon Radar
              </span>
              <span className="text-[11px] text-zinc-400">
                Verified Campus Posters & Direct QR Links
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAdminModal(true)}
            className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </header>

        {/* Center Mandatory Sign-In Card — Google Pay Style Simplicity */}
        <main className="w-full max-w-md mx-auto px-4 py-8">
          <div className="bg-[#121216] border border-zinc-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-indigo-400 mb-3">
              <ShieldCheck className="w-4 h-4" />
              <span>Student Access Required</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Enter Hackathon Radar
            </h1>
            <p className="text-sm text-zinc-400 mt-1.5">
              Sign in with your Name and Phone Number to view the{' '}
              <span className="text-zinc-200 font-medium">
                {orderedCompetitions.length} verified hackathons
              </span>{' '}
              and direct QR registration links.
            </p>

            {/* Mini preview strip of real posters awaiting inside */}
            <div className="mt-5 flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/80">
              <div className="flex -space-x-2 overflow-hidden shrink-0">
                {orderedCompetitions.slice(0, 4).map((comp) => (
                  <img
                    key={comp.id}
                    src={comp.image_url || ''}
                    alt={comp.title}
                    className="inline-block h-9 w-9 rounded-lg object-cover ring-2 ring-[#121216] bg-zinc-800"
                  />
                ))}
              </div>
              <div className="text-xs text-zinc-300 leading-snug">
                <span className="font-semibold text-white">
                  JIT, PESU, SJBIT, BIET & DSU
                </span>{' '}
                official posters & direct QR registration links inside
              </div>
            </div>

            <form onSubmit={handleMandatoryLogin} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="student-name"
                  className="block text-xs font-medium text-zinc-300 mb-1.5"
                >
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  id="student-name"
                  type="text"
                  required
                  value={nameInput}
                  onFocus={handleInputInteraction}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="student-phone"
                  className="block text-xs font-medium text-zinc-300 mb-1.5"
                >
                  Phone Number (10 digits) <span className="text-rose-400">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl bg-zinc-900 border border-r-0 border-zinc-800 text-xs text-zinc-400 font-mono">
                    +91
                  </span>
                  <input
                    id="student-phone"
                    type="tel"
                    inputMode="numeric"
                    required
                    maxLength={10}
                    value={phoneInput}
                    onFocus={handleInputInteraction}
                    onChange={(e) =>
                      setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 rounded-r-xl bg-[#09090B] border border-zinc-800 text-white placeholder-zinc-500 text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Year of Study <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {(
                    [
                      '1st Year',
                      '2nd Year',
                      '3rd Year',
                      '4th Year',
                      'Other',
                    ] as YearOfStudy[]
                  ).map((yr) => {
                    const active = yearInput === yr;
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setYearInput(yr)}
                        className={`py-2 px-2 rounded-lg text-xs font-medium border transition-all ${
                          active
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-[#09090B] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {yr.replace(' Year', ' Yr')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {loginError && (
                <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-lg px-3 py-2">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{isLoggingIn ? 'Unlocking...' : 'Continue to Hackathons'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </main>

        <footer className="w-full max-w-5xl mx-auto px-4 pb-6 text-center text-xs text-zinc-500">
          Hackathon Radar · Verified Direct Registration Links Decoded from Official Posters
        </footer>

        {/* Admin Modal if triggered from login gate */}
        {showAdminModal && (
          <AdminModal
            adminPasscode={adminPasscode}
            setAdminPasscode={setAdminPasscode}
            adminUnlocked={adminUnlocked}
            handleUnlockAdmin={handleUnlockAdmin}
            adminTab={adminTab}
            setAdminTab={setAdminTab}
            loggedStudents={loggedStudents}
            refreshAdminSignups={refreshAdminSignups}
            exportStudentsCsv={exportStudentsCsv}
            adminStatusMsg={adminStatusMsg}
            posterPreviewDataUrl={posterPreviewDataUrl}
            handlePosterFileChange={handlePosterFileChange}
            newBrochureDataUrl={newBrochureDataUrl}
            newBrochureFileName={newBrochureFileName}
            handleBrochureFileChange={handleBrochureFileChange}
            isScanningQr={isScanningQr}
            qrScanFeedback={qrScanFeedback}
            newTitle={newTitle}
            setNewTitle={setNewTitle}
            newCollege={newCollege}
            setNewCollege={setNewCollege}
            newEventDate={newEventDate}
            setNewEventDate={setNewEventDate}
            newEventDateLabel={newEventDateLabel}
            setNewEventDateLabel={setNewEventDateLabel}
            newDeadline={newDeadline}
            setNewDeadline={setNewDeadline}
            newLocation={newLocation}
            setNewLocation={setNewLocation}
            newMode={newMode}
            setNewMode={setNewMode}
            newPrize={newPrize}
            setNewPrize={setNewPrize}
            newTeamSize={newTeamSize}
            setNewTeamSize={setNewTeamSize}
            newRegUrl={newRegUrl}
            setNewRegUrl={setNewRegUrl}
            handleAdminCreateCompetition={handleAdminCreateCompetition}
            competitions={orderedCompetitions}
            handleAdminUpdateCompetition={handleAdminUpdateCompetition}
            handleAdminDeleteCompetition={handleAdminDeleteCompetition}
            onClose={() => setShowAdminModal(false)}
          />
        )}
      </div>
    );
  }

  // ============================================================================
  // STEP 2: SEQUENTIAL, GOOGLE PAY-STYLE VISUAL HACKATHON FEED
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] selection:bg-indigo-500 selection:text-white">
      {/* Clean Sticky Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[#09090B]/85 border-b border-zinc-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/Futuristic_Purple_Orbit_Compass_Logo_2351c1b2.png"
              alt="Hackathon Radar"
              className="h-9 w-9 rounded-xl object-cover border border-indigo-500/30 shadow-lg shadow-indigo-600/25"
            />
            <div>
              <span className="font-bold text-white text-base tracking-tight block leading-none">
                Hackathon Radar
              </span>
              <span className="text-[11px] text-zinc-400">
                {orderedCompetitions.length} Verified Events in Sequential Order
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Logged in student pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium text-zinc-200">{student.name}</span>
              <span className="text-zinc-500">·</span>
              <span className="text-zinc-400">{student.year_of_study}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAdminModal(true);
                if (adminUnlocked) refreshAdminSignups();
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Admin / Add Poster</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Sequential List — Clean, Visual, Zero Clutter */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Compact Top Banner — Active / Upcoming Competitions */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-zinc-800/80">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Karnataka Official Campus Feed
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              Upcoming Hackathons (
              {activeCompetitions.length > 0
                ? `1 → ${activeCompetitions.length}`
                : '0'}
              )
            </h1>
          </div>
          <p className="text-xs text-zinc-400">
            Tap any poster to zoom in · Tap <strong className="text-zinc-200">Register Now</strong> for the direct QR link
          </p>
        </div>

        {/* Sequential Active Event Cards */}
        <div className="space-y-5">
          {activeCompetitions.map((comp, index) =>
            renderCompetitionCard(comp, index)
          )}
        </div>

        {/* Past Competitions Section (Competitions whose registration has closed) */}
        {pastCompetitions.length > 0 && (
          <section
            id="past-competitions"
            aria-labelledby="past-competitions-heading"
            className="mt-12 pt-8 border-t border-zinc-800/80"
          >
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-zinc-800/80">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Registration Closed · Archive
                </p>
                <h2
                  id="past-competitions-heading"
                  className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1"
                >
                  Past Competitions (1 → {pastCompetitions.length})
                </h2>
              </div>
              <p className="text-xs text-zinc-400">
                Previous competitions whose registration has closed · Posters, brochures & official links remain accessible
              </p>
            </div>

            <div className="space-y-5">
              {pastCompetitions.map((comp, index) =>
                renderCompetitionCard(comp, index)
              )}
            </div>
          </section>
        )}
      </main>

      {/* Full-Screen Poster & Brochure Lightbox Modal */}
      {activePosterComp && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActivePosterComp(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-[#121216] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {activePosterComp.title}
                </h3>
                <p className="text-xs text-zinc-400">{activePosterComp.college}</p>
              </div>
              <button
                type="button"
                onClick={() => setActivePosterComp(null)}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab switch if Brochure or Training Roadmap exists */}
            {(activePosterComp.secondary_image_url ||
              activePosterComp.brochure_url) && (
              <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-950/80">
                <button
                  type="button"
                  onClick={() => setLightboxTab('poster')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    lightboxTab === 'poster'
                      ? 'bg-indigo-600 text-white'
                      : 'text-zinc-400 hover:text-white bg-zinc-900'
                  }`}
                >
                  Official Contest Poster
                </button>
                {activePosterComp.brochure_url && (
                  <button
                    type="button"
                    onClick={() => setLightboxTab('brochure')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      lightboxTab === 'brochure'
                        ? 'bg-emerald-600 text-white'
                        : 'text-zinc-400 hover:text-white bg-zinc-900'
                    }`}
                  >
                    Event Brochure
                  </button>
                )}
                {activePosterComp.secondary_image_url && (
                  <button
                    type="button"
                    onClick={() => setLightboxTab('roadmap')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      lightboxTab === 'roadmap'
                        ? 'bg-amber-600 text-white'
                        : 'text-zinc-400 hover:text-white bg-zinc-900'
                    }`}
                  >
                    3-Day Training Roadmap (19–21 Oct)
                  </button>
                )}
              </div>
            )}

            <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-black">
              {lightboxTab === 'brochure' && activePosterComp.brochure_url ? (
                activePosterComp.brochure_url.startsWith('data:application/pdf') ||
                activePosterComp.brochure_url.toLowerCase().endsWith('.pdf') ? (
                  <div className="w-full space-y-3">
                    <iframe
                      src={activePosterComp.brochure_url}
                      title={`${activePosterComp.title} Brochure`}
                      className="w-full h-[60vh] rounded-lg border border-zinc-800 bg-white"
                    />
                    <div className="flex justify-end">
                      <a
                        href={activePosterComp.brochure_url}
                        download={`${activePosterComp.title.replace(/\s+/g, '-')}-Brochure.pdf`}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Brochure PDF</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={activePosterComp.brochure_url}
                      alt={`${activePosterComp.title} Brochure`}
                      className="max-h-[65vh] w-auto object-contain rounded-lg"
                    />
                    <a
                      href={activePosterComp.brochure_url}
                      download={`${activePosterComp.title.replace(/\s+/g, '-')}-Brochure`}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Brochure</span>
                    </a>
                  </div>
                )
              ) : lightboxTab === 'roadmap' &&
                activePosterComp.secondary_image_url ? (
                <img
                  src={activePosterComp.secondary_image_url}
                  alt={`${activePosterComp.title} Training Roadmap`}
                  className="max-h-[70vh] w-auto object-contain rounded-lg"
                />
              ) : activePosterComp.image_url ? (
                <img
                  src={activePosterComp.image_url}
                  alt={activePosterComp.title}
                  className="max-h-[70vh] w-auto object-contain rounded-lg"
                />
              ) : null}
            </div>

            <div className="px-4 py-3 border-t border-zinc-800 bg-[#121216] flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-zinc-400 truncate max-w-xs">
                QR Link:{' '}
                <span className="text-zinc-200 font-mono">
                  {activePosterComp.registration_url}
                </span>
              </div>
              <a
                href={activePosterComp.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <span>Open Registration Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modal (Student Login Database + Poster QR Code Scanner) */}
      {showAdminModal && (
        <AdminModal
          adminPasscode={adminPasscode}
          setAdminPasscode={setAdminPasscode}
          adminUnlocked={adminUnlocked}
          handleUnlockAdmin={handleUnlockAdmin}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          loggedStudents={loggedStudents}
          refreshAdminSignups={refreshAdminSignups}
          exportStudentsCsv={exportStudentsCsv}
          adminStatusMsg={adminStatusMsg}
          posterPreviewDataUrl={posterPreviewDataUrl}
          handlePosterFileChange={handlePosterFileChange}
          newBrochureDataUrl={newBrochureDataUrl}
          newBrochureFileName={newBrochureFileName}
          handleBrochureFileChange={handleBrochureFileChange}
          isScanningQr={isScanningQr}
          qrScanFeedback={qrScanFeedback}
          newTitle={newTitle}
          setNewTitle={setNewTitle}
          newCollege={newCollege}
          setNewCollege={setNewCollege}
          newEventDate={newEventDate}
          setNewEventDate={setNewEventDate}
          newEventDateLabel={newEventDateLabel}
          setNewEventDateLabel={setNewEventDateLabel}
          newDeadline={newDeadline}
          setNewDeadline={setNewDeadline}
          newLocation={newLocation}
          setNewLocation={setNewLocation}
          newMode={newMode}
          setNewMode={setNewMode}
          newPrize={newPrize}
          setNewPrize={setNewPrize}
          newTeamSize={newTeamSize}
          setNewTeamSize={setNewTeamSize}
          newRegUrl={newRegUrl}
          setNewRegUrl={setNewRegUrl}
          handleAdminCreateCompetition={handleAdminCreateCompetition}
          competitions={orderedCompetitions}
          handleAdminUpdateCompetition={handleAdminUpdateCompetition}
          handleAdminDeleteCompetition={handleAdminDeleteCompetition}
          onClose={() => setShowAdminModal(false)}
        />
      )}
    </div>
  );
}

interface AdminModalProps {
  adminPasscode: string;
  setAdminPasscode: (v: string) => void;
  adminUnlocked: boolean;
  handleUnlockAdmin: (e: React.FormEvent) => void;
  adminTab: 'students' | 'add_poster';
  setAdminTab: (t: 'students' | 'add_poster') => void;
  loggedStudents: StudentSignupRecord[];
  refreshAdminSignups: () => void;
  exportStudentsCsv: () => void;
  adminStatusMsg: string | null;
  posterPreviewDataUrl: string;
  handlePosterFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  newBrochureDataUrl: string;
  newBrochureFileName: string;
  handleBrochureFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isScanningQr: boolean;
  qrScanFeedback: string | null;
  newTitle: string;
  setNewTitle: (v: string) => void;
  newCollege: string;
  setNewCollege: (v: string) => void;
  newEventDate: string;
  setNewEventDate: (v: string) => void;
  newEventDateLabel: string;
  setNewEventDateLabel: (v: string) => void;
  newDeadline: string;
  setNewDeadline: (v: string) => void;
  newLocation: string;
  setNewLocation: (v: string) => void;
  newMode: CompetitionMode;
  setNewMode: (v: CompetitionMode) => void;
  newPrize: string;
  setNewPrize: (v: string) => void;
  newTeamSize: string;
  setNewTeamSize: (v: string) => void;
  newRegUrl: string;
  setNewRegUrl: (v: string) => void;
  handleAdminCreateCompetition: (e: React.FormEvent) => void;
  competitions: CuratedCompetition[];
  handleAdminUpdateCompetition: (
    id: string,
    updates: {
      registration_deadline?: string;
      status_override?: PublicCompetitionStatus | null;
      registration_status?: PublicCompetitionStatus;
      clear_status_override?: boolean;
    }
  ) => void;
  handleAdminDeleteCompetition: (id: string) => void;
  onClose: () => void;
}

const SUPABASE_SCHEMA_SQL = `-- Run once in your Supabase Dashboard -> SQL Editor
CREATE TABLE IF NOT EXISTS public.student_signups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  year_of_study TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.hackathons (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  college TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_date_label TEXT,
  registration_deadline DATE,
  location TEXT,
  mode TEXT DEFAULT 'Offline',
  prize TEXT,
  team_size TEXT,
  entry_fee TEXT,
  coordinators TEXT,
  perks TEXT,
  category TEXT,
  registration_status TEXT DEFAULT 'Registration Open',
  status_override TEXT,
  registration_url TEXT NOT NULL,
  brochure_url TEXT,
  image_url TEXT,
  secondary_image_url TEXT,
  source_url TEXT,
  last_verified_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.student_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read hackathons" ON public.hackathons FOR SELECT USING (true);
CREATE POLICY "Service role full access signups" ON public.student_signups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access hackathons" ON public.hackathons FOR ALL USING (true) WITH CHECK (true);`;

function AdminModal({
  adminPasscode,
  setAdminPasscode,
  adminUnlocked,
  handleUnlockAdmin,
  adminTab,
  setAdminTab,
  loggedStudents,
  refreshAdminSignups,
  exportStudentsCsv,
  adminStatusMsg,
  posterPreviewDataUrl,
  handlePosterFileChange,
  newBrochureDataUrl,
  newBrochureFileName,
  handleBrochureFileChange,
  isScanningQr,
  qrScanFeedback,
  newTitle,
  setNewTitle,
  newCollege,
  setNewCollege,
  newEventDate,
  setNewEventDate,
  newEventDateLabel,
  setNewEventDateLabel,
  newDeadline,
  setNewDeadline,
  newLocation,
  setNewLocation,
  newMode,
  setNewMode,
  newPrize,
  setNewPrize,
  newTeamSize,
  setNewTeamSize,
  newRegUrl,
  setNewRegUrl,
  handleAdminCreateCompetition,
  competitions,
  handleAdminUpdateCompetition,
  handleAdminDeleteCompetition,
  onClose,
}: AdminModalProps) {
  const [sbView, setSbView] = useState(false);
  const [sbStatus, setSbStatus] = useState<{
    connected: boolean;
    projectUrl: string | null;
    authUsersCount: number;
    tablesReady: boolean;
    storageReady: boolean;
  } | null>(null);
  const [isSyncingSb, setIsSyncingSb] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [sbSyncFeedback, setSbSyncFeedback] = useState<string | null>(null);

  async function fetchSupabaseStatus() {
    try {
      const res = await fetch('/api/admin/supabase-status', {
        headers: { 'x-admin-passcode': adminPasscode.trim() || 'radar-admin-2026' },
      });
      const data = await res.json();
      if (data?.ok) {
        setSbStatus(data);
      }
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    if (adminUnlocked) {
      fetchSupabaseStatus();
    }
  }, [adminUnlocked]);

  async function handleForceSupabaseSync() {
    setIsSyncingSb(true);
    setSbSyncFeedback(null);
    try {
      const res = await fetch('/api/admin/supabase-sync', {
        method: 'POST',
        headers: { 'x-admin-passcode': adminPasscode.trim() || 'radar-admin-2026' },
      });
      const data = await res.json();
      if (data?.ok) {
        setSbSyncFeedback(data.message || 'Synced with Supabase!');
        await fetchSupabaseStatus();
        refreshAdminSignups();
      }
    } catch {
      setSbSyncFeedback('Could not sync with Supabase.');
    } finally {
      setIsSyncingSb(false);
    }
  }

  function handleCopySql() {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2500);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121216] border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">
              Hackathon Radar Admin Console
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {!adminUnlocked ? (
            <form onSubmit={handleUnlockAdmin} className="space-y-3">
              <p className="text-xs text-zinc-400">
                Enter the admin passcode to view student login records, check Supabase cloud sync, or upload a new hackathon poster with automatic QR link extraction. (Default passcode:{' '}
                <code className="text-indigo-300 font-mono">radar-admin-2026</code>)
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  placeholder="Enter admin passcode..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#09090B] border border-zinc-800 text-sm text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Unlock
                </button>
              </div>
              {adminStatusMsg && (
                <p className="text-xs text-rose-400">{adminStatusMsg}</p>
              )}
            </form>
          ) : (
            <>
              {/* Admin Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setSbView(false);
                    setAdminTab('students');
                    refreshAdminSignups();
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    !sbView && adminTab === 'students'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  Logged-In Students ({loggedStudents.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSbView(false);
                    setAdminTab('add_poster');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    !sbView && adminTab === 'add_poster'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  + Upload Poster & Auto-Scan QR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSbView(true);
                    fetchSupabaseStatus();
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 ${
                    sbView
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-900 text-emerald-400 hover:text-white border border-emerald-900/60'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Supabase Database</span>
                </button>
              </div>

              {adminStatusMsg && (
                <div className="px-3 py-2 rounded-xl bg-indigo-950/50 border border-indigo-800 text-xs text-indigo-200">
                  {adminStatusMsg}
                </div>
              )}

              {sbView ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          {sbStatus?.connected
                            ? 'Connected to Supabase Cloud'
                            : 'Checking Supabase...'}
                        </span>
                        {sbStatus?.projectUrl && (
                          <p className="text-xs font-mono text-zinc-400 mt-0.5">
                            {sbStatus.projectUrl}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleForceSupabaseSync}
                        disabled={isSyncingSb}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        {isSyncingSb ? 'Syncing...' : 'Sync All Data to Supabase Now'}
                      </button>
                    </div>

                    {sbSyncFeedback && (
                      <p className="text-xs text-emerald-400 font-medium">
                        {sbSyncFeedback}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                      <div className="p-3 rounded-xl bg-[#09090B] border border-zinc-800">
                        <span className="text-[11px] text-zinc-400 block">
                          Authentication → Users
                        </span>
                        <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                          {sbStatus?.authUsersCount ?? loggedStudents.length} Active Users
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Visible now in Supabase Auth tab
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#09090B] border border-zinc-800">
                        <span className="text-[11px] text-zinc-400 block">
                          Storage Bucket Backup
                        </span>
                        <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                          {sbStatus?.storageReady ? 'Active (Synced)' : 'Ready'}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Bucket: hackathon-radar-data
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#09090B] border border-zinc-800">
                        <span className="text-[11px] text-zinc-400 block">
                          SQL Table Editor
                        </span>
                        <span
                          className={`text-sm font-bold mt-0.5 block ${
                            sbStatus?.tablesReady ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {sbStatus?.tablesReady ? 'Tables Active' : 'Run SQL Once Below'}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          student_signups & hackathons
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-white">
                          Want to also see rows in Supabase "Table Editor"?
                        </h3>
                        <p className="text-[11px] text-zinc-400">
                          Your students are already live in <strong>Supabase → Authentication → Users</strong> and <strong>Storage</strong>. To also create the <code>student_signups</code> and <code>hackathons</code> tables in <strong>Table Editor</strong>, copy and run this SQL once in your Supabase SQL Editor:
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopySql}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white cursor-pointer"
                      >
                        {sqlCopied ? 'Copied SQL!' : 'Copy SQL'}
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-[#09090B] border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-44">
                      {SUPABASE_SCHEMA_SQL}
                    </pre>
                  </div>
                </div>
              ) : adminTab === 'students' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-400">
                      Mandatory student login records (Synced with Supabase Auth & Storage)
                    </p>
                    <button
                      type="button"
                      onClick={exportStudentsCsv}
                      disabled={loggedStudents.length === 0}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  {loggedStudents.length === 0 ? (
                    <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center text-xs text-zinc-400">
                      No students have signed in yet.
                    </div>
                  ) : (
                    <div className="border border-zinc-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800">
                          <tr>
                            <th className="py-2.5 px-3">Name</th>
                            <th className="py-2.5 px-3">Phone</th>
                            <th className="py-2.5 px-3">Year</th>
                            <th className="py-2.5 px-3">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/70">
                          {loggedStudents.map((stu) => (
                            <tr key={stu.id} className="text-zinc-200">
                              <td className="py-2 px-3 font-medium">{stu.name}</td>
                              <td className="py-2 px-3 font-mono text-indigo-300">
                                {stu.phone}
                              </td>
                              <td className="py-2 px-3">{stu.year_of_study}</td>
                              <td className="py-2 px-3 text-zinc-500">
                                {new Date(stu.created_at).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <form onSubmit={handleAdminCreateCompetition} className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-white mb-1">
                          1. Upload Hackathon Poster (Auto-Fetches Event Name, College/Organization, Location, Deadline, Prize Pool & QR Link)
                        </label>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handlePosterFileChange}
                          className="block w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                        />
                        {isScanningQr && (
                          <p className="text-xs text-indigo-400 mt-2 animate-pulse">
                            Analyzing poster for Event Name, College/Organization, Location, Prize Pool & QR Code...
                          </p>
                        )}
                        {qrScanFeedback && (
                          <p className="text-xs text-emerald-400 mt-2 font-mono break-all">
                            {qrScanFeedback}
                          </p>
                        )}
                      </div>

                      <div className="pt-2.5 border-t border-zinc-800/80">
                        <label className="block text-xs font-semibold text-emerald-300 mb-1">
                          2. Upload Event Brochure (Optional — PDF or Brochure Image)
                        </label>
                        <input
                          type="file"
                          accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleBrochureFileChange}
                          className="block w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500"
                        />
                        {newBrochureDataUrl && (
                          <p className="text-xs text-emerald-400 mt-1.5 font-mono">
                            ✓ Brochure attached: {newBrochureFileName || 'Event Brochure'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Event Name / Hackathon Title (Auto-filled) *"
                        className="px-3 py-2 rounded-xl bg-[#09090B] border border-zinc-800 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={newCollege}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewCollege(val);
                          if (!newLocation.trim()) {
                            setNewLocation(val);
                          }
                        }}
                        placeholder="College / Organization Name (Auto-filled) *"
                        className="px-3 py-2 rounded-xl bg-[#09090B] border border-zinc-800 text-xs text-white"
                      />
                      <div>
                        <span className="block text-[10px] text-zinc-400 mb-1">
                          Event Date (Auto-filled)
                        </span>
                        <input
                          type="date"
                          value={newEventDate}
                          onChange={(e) => setNewEventDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-zinc-800 text-xs text-white"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] text-zinc-400 mb-1">
                          Registration Deadline (Auto-filled)
                        </span>
                        <input
                          type="date"
                          value={newDeadline}
                          onChange={(e) => setNewDeadline(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-zinc-800 text-xs text-white"
                        />
                      </div>
                      <input
                        type="text"
                        value={newEventDateLabel}
                        onChange={(e) => setNewEventDateLabel(e.target.value)}
                        placeholder="Date Label (e.g. 24-25 Oct 2026)"
                        className="px-3 py-2 rounded-xl bg-[#09090B] border border-zinc-800 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={newPrize}
                        onChange={(e) => setNewPrize(e.target.value)}
                        placeholder="Prize Pool (Auto-filled, e.g. ₹1,00,000)"
                        className="px-3 py-2 rounded-xl bg-[#09090B] border border-zinc-800 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="Location / College Campus (Auto-filled)"
                        className="px-3 py-2 rounded-xl bg-[#09090B] border border-zinc-800 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={newTeamSize}
                        onChange={(e) => setNewTeamSize(e.target.value)}
                        placeholder="Team Size (Auto-filled, e.g. 2 - 4 Members)"
                        className="px-3 py-2 rounded-xl bg-[#09090B] border border-zinc-800 text-xs text-white"
                      />
                    </div>

                    <input
                      type="url"
                      required
                      value={newRegUrl}
                      onChange={(e) => setNewRegUrl(e.target.value)}
                      placeholder="Direct Registration URL (Auto-filled from QR or Poster) *"
                      className="w-full px-3 py-2 rounded-xl bg-[#09090B] border border-zinc-800 text-xs text-white font-mono"
                    />

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Event to Sequential Feed</span>
                    </button>
                  </form>

                  {/* Manage existing events (update deadline, status, or remove) */}
                  <div className="pt-3 border-t border-zinc-800 space-y-2">
                    <p className="text-xs font-semibold text-zinc-400">
                      Current Sequential Events ({competitions.length})
                    </p>
                    {competitions.map((c, idx) => (
                      <div
                        key={c.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs"
                      >
                        <div className="truncate pr-2">
                          <span className="font-mono text-indigo-400 mr-2">
                            #{String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="font-medium text-white">{c.title}</span>
                          <span className="text-zinc-500 ml-2 font-mono">
                            ({c.registration_status})
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <input
                            type="date"
                            value={c.registration_deadline || ''}
                            onChange={(e) =>
                              handleAdminUpdateCompetition(c.id, {
                                registration_deadline: e.target.value,
                              })
                            }
                            title="Registration Deadline"
                            className="px-2 py-1 rounded-lg bg-[#09090B] border border-zinc-800 text-[11px] text-zinc-200"
                          />
                          <select
                            value={c.status_override || 'AUTO'}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'AUTO') {
                                handleAdminUpdateCompetition(c.id, {
                                  clear_status_override: true,
                                });
                              } else {
                                handleAdminUpdateCompetition(c.id, {
                                  status_override: val as PublicCompetitionStatus,
                                  registration_status: val as PublicCompetitionStatus,
                                });
                              }
                            }}
                            title="Registration Status"
                            className="px-2 py-1 rounded-lg bg-[#09090B] border border-zinc-800 text-[11px] text-zinc-200"
                          >
                            <option value="AUTO">Auto (By Deadline)</option>
                            <option value="Upcoming">Upcoming</option>
                            <option value="Registration Open">Registration Open</option>
                            <option value="Closing Soon">Closing Soon</option>
                            <option value="Registration Closed">Registration Closed</option>
                            <option value="Results Announced">Results Announced</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleAdminDeleteCompetition(c.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/50 cursor-pointer"
                            title="Remove Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
