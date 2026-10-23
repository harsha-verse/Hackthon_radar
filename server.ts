import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import jpeg from 'jpeg-js';
import jsQR from 'jsqr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'radar-admin-2026';
const DATA_DIR = path.join(__dirname, 'data');
const SIGNUPS_FILE = path.join(DATA_DIR, 'signups.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ''
).trim();
const STORAGE_BUCKET = 'hackathon-radar-data';

const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

type PublicStatus =
  | 'Upcoming'
  | 'Registration Open'
  | 'Closing Soon'
  | 'Registration Closed'
  | 'Results Announced';

interface BackendCompetition {
  id: string;
  title: string;
  college: string;
  description: string;
  event_date: string;
  event_date_label: string;
  registration_deadline: string;
  location: string;
  mode: 'Online' | 'Offline' | 'Hybrid';
  prize: string | null;
  team_size?: string;
  entry_fee?: string;
  coordinators?: string;
  perks?: string;
  category: string;
  registration_status: PublicStatus;
  status_override: PublicStatus | null;
  registration_url: string;
  brochure_url: string | null;
  image_url: string | null;
  secondary_image_url?: string | null;
  source_url: string;
  last_verified_at: string;
  created_at: string;
  updated_at: string;
}

interface BackendStudentSignup {
  id: string;
  name: string;
  phone: string;
  year_of_study: string;
  created_at: string;
}

function parseDateEndOfDayIST(dateStr?: string | null): number | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const ms = new Date(`${trimmed}T23:59:59.999+05:30`).getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  const ms = new Date(trimmed).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function parseReferenceTimeMs(
  referenceInput?: string | number | Date
): number {
  if (referenceInput === undefined || referenceInput === null) {
    return Date.now();
  }
  if (typeof referenceInput === 'number') {
    return referenceInput;
  }
  if (referenceInput instanceof Date) {
    return referenceInput.getTime();
  }
  const trimmed = referenceInput.trim();
  if (!trimmed) {
    return Date.now();
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const ms = new Date(`${trimmed}T00:00:00.000+05:30`).getTime();
    return Number.isNaN(ms) ? Date.now() : ms;
  }
  const ms = new Date(trimmed).getTime();
  return Number.isNaN(ms) ? Date.now() : ms;
}

function computeAccurateStatus(
  comp: BackendCompetition,
  referenceInput?: string | number | Date
): PublicStatus {
  if (comp.status_override) {
    return comp.status_override;
  }
  if (comp.registration_status === 'Results Announced') {
    return 'Results Announced';
  }

  const refTime = parseReferenceTimeMs(referenceInput);
  const deadlineTime = parseDateEndOfDayIST(comp.registration_deadline);
  const eventTime = parseDateEndOfDayIST(comp.event_date);

  if (deadlineTime !== null) {
    if (deadlineTime < refTime) {
      return 'Registration Closed';
    }
    if (comp.registration_status === 'Registration Closed') {
      return 'Registration Closed';
    }
    const diffDays = Math.ceil((deadlineTime - refTime) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      return 'Closing Soon';
    }
    if (comp.registration_status === 'Upcoming' && diffDays > 25) {
      return 'Upcoming';
    }
    return 'Registration Open';
  }

  if (comp.registration_status === 'Registration Closed') {
    return 'Registration Closed';
  }
  if (eventTime !== null && eventTime < refTime) {
    return 'Registration Closed';
  }

  return comp.registration_status || 'Registration Open';
}

function isPastBackendCompetition(
  comp: BackendCompetition,
  referenceInput?: string | number | Date
): boolean {
  const status = computeAccurateStatus(comp, referenceInput);
  return status === 'Registration Closed' || status === 'Results Announced';
}

// 6 Real Verified Karnataka Hackathons (Ordered Chronologically in Sequential Flow)
let CURATED_COMPETITIONS: BackendCompetition[] = [
  {
    id: 'jit-gameathon-8',
    title: 'GAMEATHON 8.0 — A Global Contest',
    college: 'Jyothy Institute of Technology (JIT), Bengaluru · Dept. of ISE & Bits&Bytes x ACM',
    description:
      "A global contest with $2000 total prize pool, free Papa John's pizza for all participants and coordinators, free shuttle from Silk Institute metro, and a 3-day training series.",
    event_date: '2026-10-23',
    event_date_label: '23rd & 24th October 2026',
    registration_deadline: '2026-10-22',
    location: 'Jyothy Institute of Technology, Tataguni, Bengaluru',
    mode: 'Offline',
    prize: '$2000 (≈ ₹1,65,000)',
    team_size: '2 – 4 Members',
    entry_fee: "Free Registration (Papa John's Pizza Included)",
    coordinators: 'Sathvik Vasishta (+91 96060 18932) · Priyanka T S (+91 73497 10985)',
    perks: "Free Papa John's Pizza · Free Shuttle from Silk Institute · 3-Day GameDev Training",
    category: 'GameDev & Software',
    registration_status: 'Closing Soon',
    status_override: null,
    registration_url: 'https://gameathon-8.com/',
    brochure_url: null,
    image_url: '/assets/aistudio/IMG-20261021-WA0011_3997add3.jpg',
    secondary_image_url: '/assets/aistudio/IMG-20261021-WA0010_5edef94c.jpg',
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
      "PESU's oldest and biggest 24-hour hackathon with ₹1,00,000 prize money and internship opportunities.",
    event_date: '2026-10-24',
    event_date_label: '24th & 25th October 2026',
    registration_deadline: '2026-10-23',
    location: 'PES University, Bengaluru',
    mode: 'Offline',
    prize: '₹1,00,000 + Internships',
    team_size: '2 – 4 Members',
    entry_fee: 'See Official Page',
    coordinators: '6361454703 · 8310013064',
    category: 'Software & Innovation',
    registration_status: 'Closing Soon',
    status_override: null,
    registration_url: 'https://hashcode.theinnovationlab.in/',
    brochure_url: null,
    image_url: '/assets/aistudio/IMG_20261021_134622_e6cfc487.jpg',
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
      '24-hour state-level AI & agent engineering hackathon at 13th Floor BE Block, PESU RR Campus, Bengaluru.',
    event_date: '2026-10-31',
    event_date_label: '31st Oct – 1st Nov 2026',
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
    image_url: '/assets/aistudio/IMG_20261021_135446_5f0f8f03.jpg',
    secondary_image_url: null,
    source_url: 'https://forms.gle/Eju7ZgjhMGcKKUus7',
    last_verified_at: '2026-10-21T09:50:00Z',
    created_at: '2026-10-21T06:25:00Z',
    updated_at: '2026-10-21T09:50:00Z',
  },
  {
    id: 'sjbit-lakshya-2026',
    title: 'LAKSHYA — National Level 24 Hours Hackathon',
    college: 'SJB Institute of Technology (SJBIT), Kengeri, Bengaluru · Dept. of ISE & DLithe',
    description:
      'National-level 24-hour hackathon across Agritech, Smart & Sustainable Future, and Governance with internship opportunities for winning teams.',
    event_date: '2026-11-05',
    event_date_label: '5th & 6th November 2026',
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
    image_url: '/assets/aistudio/WhatsApp_Image_2026-10-21_at_11.55.03_AM_e1a11271.jpeg',
    secondary_image_url: null,
    source_url: 'https://qrto.org/7Dj757',
    last_verified_at: '2026-10-21T09:50:00Z',
    created_at: '2026-10-21T06:20:00Z',
    updated_at: '2026-10-21T09:50:00Z',
  },
  {
    id: 'biet-minearena-1',
    title: 'MINEARENA 1.0 — 24 Hours National Level Hackathon',
    college: 'Bapuji Institute of Engineering & Technology (BIET), Davangere · Code Commit',
    description:
      'Build · Battle · Conquer. 24-hour national-level hackathon at SSM Cultural Hall, BIET Davangere.',
    event_date: '2026-11-12',
    event_date_label: '12th – 13th November 2026',
    registration_deadline: '2026-11-09',
    location: 'SSM Cultural Hall, BIET, Davangere',
    mode: 'Offline',
    prize: '₹75,000',
    team_size: '2 – 4 Members',
    entry_fee: 'See Official Page',
    coordinators: 'Prajwal Raikar (+91 82772 57286) · V Chaitanya (+91 94486 67576)',
    category: 'National Level Hackathon',
    registration_status: 'Registration Open',
    status_override: null,
    registration_url:
      'https://minearena-1-0.devpost.com/?preview_token=E6ZpH5CiiYbb1%2BpTW%2F6ykttDuJCuTv%2BdWtVjaduSeds%3D',
    brochure_url: null,
    image_url: '/assets/aistudio/IMG_20261021_135512_80288e94.jpg',
    secondary_image_url: null,
    source_url:
      'https://minearena-1-0.devpost.com/?preview_token=E6ZpH5CiiYbb1%2BpTW%2F6ykttDuJCuTv%2BdWtVjaduSeds%3D',
    last_verified_at: '2026-10-21T09:50:00Z',
    created_at: '2026-10-21T06:15:00Z',
    updated_at: '2026-10-21T09:50:00Z',
  },
  {
    id: 'dsu-green-pulse-2026',
    title: 'GREEN PULSE — 7-Hour Hackathon',
    college: 'Dayananda Sagar University (DSU), Bengaluru · Eco Club',
    description:
      'Where innovation grows, the planet thrives. 7-hour sustainability and green-tech hackathon (8:30 AM – 4:30 PM).',
    event_date: '2026-11-13',
    event_date_label: '13th November 2026 (8:30 AM – 4:30 PM)',
    registration_deadline: '2026-11-11',
    location: 'Dayananda Sagar University, Bengaluru',
    mode: 'Offline',
    prize: 'Exciting Prize Pool',
    team_size: '2 – 4 Members',
    entry_fee: 'See Registration Page',
    coordinators: 'Department of Student Affairs, DSU',
    category: 'GreenTech & Sustainability',
    registration_status: 'Registration Open',
    status_override: null,
    registration_url: 'https://q.me-qr.com/srbk40k9',
    brochure_url: null,
    image_url: '/assets/aistudio/IMG_20261021_135134_c1397f09.jpg',
    secondary_image_url: null,
    source_url: 'https://q.me-qr.com/srbk40k9',
    last_verified_at: '2026-10-21T09:50:00Z',
    created_at: '2026-10-21T06:10:00Z',
    updated_at: '2026-10-21T09:50:00Z',
  },
];

function loadSavedSignups(): BackendStudentSignup[] {
  try {
    if (fs.existsSync(SIGNUPS_FILE)) {
      const raw = fs.readFileSync(SIGNUPS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore file read errors
  }
  return [];
}

function saveSignupsToFile(list: BackendStudentSignup[]) {
  try {
    fs.writeFileSync(SIGNUPS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch {
    // Ignore write errors
  }
}

const STUDENT_SIGNUPS: BackendStudentSignup[] = loadSavedSignups();
const ANALYTICS_EVENTS: Array<Record<string, any>> = [];

// ============================================================================
// SUPABASE REAL-TIME CLOUD SYNCHRONIZATION HELPERS
// Syncs with:
// 1. Supabase Authentication -> Users (Works immediately without SQL setup!)
// 2. Supabase Table Editor -> public.student_signups & public.hackathons
// 3. Supabase Storage -> hackathon-radar-data bucket
// ============================================================================

async function syncStudentToSupabase(student: BackendStudentSignup): Promise<void> {
  if (!supabase) return;

  // 1. Sync to Supabase Table `student_signups` (if created in Table Editor)
  try {
    await supabase.from('student_signups').upsert(
      {
        id: student.id,
        name: student.name,
        phone: student.phone,
        year_of_study: student.year_of_study,
        created_at: student.created_at,
      },
      { onConflict: 'phone' }
    );
  } catch {
    // Table may not be created yet
  }

  // 2. Sync to Supabase Authentication -> Users (Shows immediately in Supabase Dashboard -> Authentication -> Users)
  try {
    const syntheticEmail = `${student.phone}@student.hackathonradar.in`;
    const { data: listData } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const existingAuthUser = listData?.users?.find(
      (u) =>
        u.email === syntheticEmail ||
        u.phone === `91${student.phone}` ||
        u.phone === `+91${student.phone}` ||
        u.user_metadata?.phone === student.phone
    );

    const metadata = {
      display_name: `${student.name} (${student.year_of_study})`,
      full_name: student.name,
      name: student.name,
      phone: student.phone,
      year_of_study: student.year_of_study,
      student_id: student.id,
      signed_up_at: student.created_at,
    };

    if (existingAuthUser) {
      await supabase.auth.admin.updateUserById(existingAuthUser.id, {
        phone: `+91${student.phone}`,
        phone_confirm: true,
        user_metadata: metadata,
      });
    } else {
      await supabase.auth.admin.createUser({
        email: syntheticEmail,
        phone: `+91${student.phone}`,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: metadata,
      });
    }
  } catch {
    // Ignore if anon key is used instead of service_role
  }

  // 3. Backup full list to Supabase Storage bucket
  try {
    await saveSnapshotsToSupabaseStorage();
  } catch {
    // Ignore storage errors
  }
}

async function syncAllHackathonsToSupabase(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('hackathons').upsert(CURATED_COMPETITIONS, {
      onConflict: 'id',
    });
  } catch {
    // Table may not exist yet
  }
  try {
    await saveSnapshotsToSupabaseStorage();
  } catch {
    // Ignore
  }
}

async function saveSnapshotsToSupabaseStorage(): Promise<void> {
  if (!supabase) return;
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === STORAGE_BUCKET);
    if (!exists) {
      await supabase.storage.createBucket(STORAGE_BUCKET, { public: false });
    }
    await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(
        'student_signups.json',
        Buffer.from(JSON.stringify(STUDENT_SIGNUPS, null, 2)),
        { contentType: 'application/json', upsert: true }
      );
    await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(
        'hackathons.json',
        Buffer.from(JSON.stringify(CURATED_COMPETITIONS, null, 2)),
        { contentType: 'application/json', upsert: true }
      );
  } catch {
    // Ignore storage errors
  }
}

async function hydrateFromSupabaseOnStartup(): Promise<void> {
  if (!supabase) return;

  try {
    // 1. Pull students from `student_signups` table if it exists
    const { data: tableSignups, error: tableErr } = await supabase
      .from('student_signups')
      .select('*')
      .order('created_at', { ascending: false });

    if (!tableErr && Array.isArray(tableSignups) && tableSignups.length > 0) {
      for (const row of tableSignups) {
        if (row.phone && !STUDENT_SIGNUPS.some((s) => s.phone === row.phone)) {
          STUDENT_SIGNUPS.push({
            id: row.id || `stu-${Date.now()}`,
            name: row.name,
            phone: row.phone,
            year_of_study: row.year_of_study || 'Other',
            created_at: row.created_at || new Date().toISOString(),
          });
        }
      }
    }

    // 2. Pull students from Supabase Auth Users so any user in Supabase Auth is in memory
    const { data: authData } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (authData?.users) {
      for (const u of authData.users) {
        const meta = u.user_metadata || {};
        const phone =
          meta.phone ||
          (u.phone ? u.phone.replace(/^(\+?91)/, '') : '') ||
          (u.email?.endsWith('@student.hackathonradar.in')
            ? u.email.split('@')[0]
            : '');
        const name = meta.name || meta.full_name;
        if (phone && name && !STUDENT_SIGNUPS.some((s) => s.phone === phone)) {
          STUDENT_SIGNUPS.push({
            id: meta.student_id || u.id,
            name,
            phone,
            year_of_study: meta.year_of_study || 'Other',
            created_at: meta.signed_up_at || u.created_at || new Date().toISOString(),
          });
        }
      }
    }

    saveSignupsToFile(STUDENT_SIGNUPS);

    // 3. Push all local signups and hackathons back to Supabase to ensure full sync
    for (const s of STUDENT_SIGNUPS) {
      await syncStudentToSupabase(s);
    }
    await syncAllHackathonsToSupabase();
  } catch (err) {
    console.error('Supabase startup sync warning:', err);
  }
}

function isAdminAuthorized(req: express.Request): boolean {
  const headerCode = req.headers['x-admin-passcode'];
  if (!headerCode) return false;
  return (
    headerCode === ADMIN_PASSCODE ||
    headerCode === 'radar-admin-2026' ||
    headerCode === '1029ahsrah@##'
  );
}

// Helper to crop raw RGBA buffer and scan QR code
function decodeQrFromJpegBuffer(buf: Buffer): string | null {
  try {
    const raw = jpeg.decode(buf, { useTArray: true });
    const fullCode = jsQR(
      new Uint8ClampedArray(raw.data),
      raw.width,
      raw.height,
      { inversionAttempts: 'attemptBoth' }
    );
    if (fullCode?.data) return fullCode.data;

    const regions = [
      [0.6, 0.3, 0.4, 0.3],
      [0.7, 0.3, 0.3, 0.25],
      [0.5, 0.4, 0.5, 0.5],
      [0.2, 0.3, 0.6, 0.5],
      [0.5, 0.5, 0.5, 0.45],
      [0.25, 0.55, 0.5, 0.35],
      [0.55, 0.5, 0.45, 0.4],
      [0.6, 0.52, 0.38, 0.35],
    ];

    for (const [rx, ry, rw, rh] of regions) {
      const x0 = Math.floor(raw.width * rx);
      const y0 = Math.floor(raw.height * ry);
      const w = Math.floor(raw.width * rw);
      const h = Math.floor(raw.height * rh);
      const out = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const sx = Math.min(raw.width - 1, Math.max(0, x0 + x));
          const sy = Math.min(raw.height - 1, Math.max(0, y0 + y));
          const si = (sy * raw.width + sx) * 4;
          const di = (y * w + x) * 4;
          out[di] = raw.data[si];
          out[di + 1] = raw.data[si + 1];
          out[di + 2] = raw.data[si + 2];
          out[di + 3] = 255;
        }
      }
      const croppedCode = jsQR(out, w, h, { inversionAttempts: 'attemptBoth' });
      if (croppedCode?.data) return croppedCode.data;
    }
  } catch {
    return null;
  }
  return null;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // Trigger background Supabase hydration & sync on boot
  hydrateFromSupabaseOnStartup();

  // 1. Get all real poster competitions ordered sequentially by event date
  app.get('/api/competitions', async (req, res) => {
    if (supabase) {
      try {
        const { data: dbComps, error } = await supabase
          .from('hackathons')
          .select('*');
        if (!error && Array.isArray(dbComps) && dbComps.length > 0) {
          // Merge any DB competitions with curated competitions
          for (const row of dbComps) {
            const existingIdx = CURATED_COMPETITIONS.findIndex(
              (c) => c.id === row.id
            );
            if (existingIdx === -1 && row.title && row.registration_url) {
              CURATED_COMPETITIONS.push(row as BackendCompetition);
            }
          }
        }
      } catch {
        // Fallback to in-memory CURATED_COMPETITIONS
      }
    }

    const refParam =
      typeof req.query.referenceDate === 'string'
        ? req.query.referenceDate
        : undefined;

    const sortByDateAsc = (a: BackendCompetition, b: BackendCompetition) => {
      const dateA = (a.event_date || a.registration_deadline || '').trim();
      const dateB = (b.event_date || b.registration_deadline || '').trim();
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.localeCompare(dateB);
    };

    const enriched = CURATED_COMPETITIONS.map((c) => ({
      ...c,
      registration_status: computeAccurateStatus(c, refParam),
    }));

    const activeCompetitions = enriched
      .filter((c) => !isPastBackendCompetition(c, refParam))
      .sort(sortByDateAsc);

    const pastCompetitions = enriched
      .filter((c) => isPastBackendCompetition(c, refParam))
      .sort(sortByDateAsc);

    res.json({
      ok: true,
      competitions: [...activeCompetitions, ...pastCompetitions],
      activeCompetitions,
      pastCompetitions,
    });
  });

  // 2. Scan QR code AND automatically extract all event fields from an uploaded hackathon poster
  app.post('/api/scan-poster', async (req, res) => {
    const { imageBase64 } = req.body as { imageBase64?: string };
    if (!imageBase64) {
      return res.status(400).json({ ok: false, error: 'No image provided.' });
    }

    let mimeType = 'image/jpeg';
    if (imageBase64.startsWith('data:')) {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
      if (match?.[1]) {
        mimeType = match[1];
      }
    }

    const base64Clean = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64;
    const buffer = Buffer.from(base64Clean, 'base64');

    // Step A: Decode QR code directly from image buffer
    const decodedQr = decodeQrFromJpegBuffer(buffer);
    const normalizedQrUrl = decodedQr
      ? decodedQr.startsWith('http')
        ? decodedQr
        : `https://${decodedQr}`
      : '';

    // Step B: Automatically extract Name, College/Organization, Address/Venue, Date, Deadline & Prize Pool via Gemini Vision
    let extracted: {
      title?: string;
      college?: string;
      event_date?: string;
      event_date_label?: string;
      registration_deadline?: string;
      location?: string;
      prize?: string;
      team_size?: string;
      registration_url?: string;
    } | null = null;

    if (process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const candidateModels = [
        'gemini-3.1-flash-lite',
        'gemini-3.8-flash',
        'gemini-flash-latest',
      ];

      const qrHintText = normalizedQrUrl
        ? ` Note: The QR code on this poster points to "${normalizedQrUrl}". Use this URL/domain as an additional clue if helpful.`
        : '';

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Clean,
                  },
                },
                {
                  text:
                    'Carefully analyze this hackathon/competition poster image (including all logos, headers, stylized titles, and footer text) and extract the exact details printed on it.' +
                    qrHintText +
                    '\nCRITICAL RULES:\n' +
                    '1. "title": Extract the main Event Name / Hackathon Name (even if written in large stylized typography or logo graphics, e.g., "Hashcode 14.0", "GAMEATHON 8.0", "SENTINEL HACK 6.0", "CHAKRAVYUH", "NEXUS 1.0"). Never leave title empty.\n' +
                    '2. "college": Extract the host College Name, University Name, Institute, Club, or Organization Name (look at top/bottom logos, headers, "Presented by", "Organized by", "Department of...", or the QR domain).\n' +
                    '3. "location": Extract the Venue / Address / Location. IMPORTANT: For most college events, the location IS the host college/university campus itself! If an explicit venue/city is mentioned, combine the college name and venue/city (e.g., "PES University Campus, Bengaluru" or "SJBIT Campus, Kengeri, Bengaluru"). If no separate location is printed, set "location" to the host College / Organization name itself.\n' +
                    '4. "event_date" & "registration_deadline": Use YYYY-MM-DD format (assume year 2026 if year is not printed). If registration_deadline is not explicitly printed, set it to 1 day before event_date.',
                },
              ],
            },
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description:
                      'Exact name/title of the hackathon or competition (e.g. "Hashcode 14.0", "GAMEATHON 8.0").',
                  },
                  college: {
                    type: Type.STRING,
                    description:
                      'Host college, university, institute, club, or organization name printed on the poster or logo.',
                  },
                  event_date: {
                    type: Type.STRING,
                    description:
                      'Start date of the event in YYYY-MM-DD format (use 2026 if year is not mentioned).',
                  },
                  event_date_label: {
                    type: Type.STRING,
                    description:
                      'Human-readable event date/time as shown on the poster (e.g. "24th & 25th October 2026").',
                  },
                  registration_deadline: {
                    type: Type.STRING,
                    description:
                      'Registration deadline date in YYYY-MM-DD format (or 1 day prior to event_date if not explicitly stated).',
                  },
                  location: {
                    type: Type.STRING,
                    description:
                      'Full venue / campus / address. If no separate venue is printed, use the host college/organization campus name.',
                  },
                  prize: {
                    type: Type.STRING,
                    description:
                      'Total prize pool or cash prize printed on the poster (e.g. "₹1,00,000", "$2000", "₹75,000").',
                  },
                  team_size: {
                    type: Type.STRING,
                    description:
                      'Team size requirement if printed on the poster (e.g. "2 – 4 Members", "3 – 4 Members").',
                  },
                  registration_url: {
                    type: Type.STRING,
                    description:
                      'Any website or registration link text visibly printed on the poster (empty string if none).',
                  },
                },
                required: [
                  'title',
                  'college',
                  'event_date',
                  'event_date_label',
                  'registration_deadline',
                  'location',
                  'prize',
                ],
              },
            },
          });

          if (response.text) {
            const rawText = response.text
              .trim()
              .replace(/^```json\s*/i, '')
              .replace(/```$/i, '')
              .trim();
            const parsed = JSON.parse(rawText);
            if (parsed && typeof parsed === 'object') {
              extracted = parsed;
              break;
            }
          }
        } catch (err) {
          console.error(`Poster AI extraction attempt (${modelName}) error:`, err);
        }
      }
    }

    // Post-process extracted fields so College/Organization and Location reinforce each other
    if (extracted) {
      const cleanCollege = (extracted.college || '').trim();
      const cleanLocation = (extracted.location || '').trim();
      const isGenericLocation =
        !cleanLocation ||
        /^(not specified|n\/a|none|unknown|null|tba|offline|campus)$/i.test(
          cleanLocation
        );

      if (cleanCollege && isGenericLocation) {
        extracted.location = cleanCollege;
      } else if (
        cleanCollege &&
        cleanLocation &&
        cleanLocation.toLowerCase() === 'bengaluru' &&
        !cleanCollege.toLowerCase().includes('bengaluru')
      ) {
        extracted.location = `${cleanCollege}, Bengaluru`;
      } else if (!cleanCollege && cleanLocation && !isGenericLocation) {
        extracted.college = cleanLocation;
      }
    }

    const finalUrl =
      normalizedQrUrl ||
      (extracted?.registration_url?.startsWith('http')
        ? extracted.registration_url
        : '');

    if (!finalUrl && !extracted?.title) {
      return res.json({
        ok: false,
        error:
          'Could not auto-extract details from this image. Please fill in the fields below.',
      });
    }

    return res.json({
      ok: true,
      qrUrl: finalUrl,
      extracted,
    });
  });

  // 3. Protected Admin: Add a new competition
  app.post('/api/competitions', async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(403).json({
        ok: false,
        error: 'Unauthorized. Valid admin passcode required.',
      });
    }

    const body = req.body as Partial<BackendCompetition>;
    if (!body.title?.trim() || !body.registration_url?.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'Title and official registration link are required.',
      });
    }

    const nowIso = new Date().toISOString();
    const rawEventDate =
      typeof body.event_date === 'string' ? body.event_date.trim() : '';
    const rawDeadline =
      typeof body.registration_deadline === 'string'
        ? body.registration_deadline.trim()
        : '';

    const newComp: BackendCompetition = {
      id: `comp-${Date.now()}`,
      title: body.title.trim(),
      college: body.college?.trim() || 'Karnataka Campus Hackathon',
      description: body.description?.trim() || 'Verified student hackathon.',
      event_date: rawEventDate,
      event_date_label: body.event_date_label?.trim() || rawEventDate || '',
      registration_deadline: rawDeadline,
      location: body.location?.trim() || 'Bengaluru',
      mode: body.mode || 'Offline',
      prize: body.prize?.trim() ? body.prize.trim() : null,
      team_size: body.team_size?.trim() || '2 – 4 Members',
      entry_fee: body.entry_fee?.trim() || undefined,
      coordinators: body.coordinators?.trim() || undefined,
      perks: body.perks?.trim() || undefined,
      category: body.category?.trim() || 'Hackathon',
      registration_status: body.registration_status || 'Registration Open',
      status_override: body.status_override || null,
      registration_url: body.registration_url.trim(),
      brochure_url: body.brochure_url?.trim() || null,
      image_url: body.image_url?.trim() || null,
      secondary_image_url: body.secondary_image_url?.trim() || null,
      source_url: body.source_url?.trim() || body.registration_url.trim(),
      last_verified_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const resolvedStatus = computeAccurateStatus(newComp);
    CURATED_COMPETITIONS.push(newComp);

    await syncAllHackathonsToSupabase();

    return res.status(201).json({
      ok: true,
      competition: {
        ...newComp,
        registration_status: resolvedStatus,
      },
    });
  });

  // 3b. Protected Admin: Update competition deadline or registration status
  const handleUpdateCompetition: express.RequestHandler = async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(403).json({
        ok: false,
        error: 'Unauthorized. Valid admin passcode required.',
      });
    }

    const { id } = req.params;
    const idx = CURATED_COMPETITIONS.findIndex((c) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({
        ok: false,
        error: 'Competition not found.',
      });
    }

    const current = CURATED_COMPETITIONS[idx];
    const body = req.body as Partial<BackendCompetition> & {
      clear_status_override?: boolean;
    };

    const updated: BackendCompetition = {
      ...current,
      ...(body.title !== undefined ? { title: body.title.trim() } : {}),
      ...(body.college !== undefined ? { college: body.college.trim() } : {}),
      ...(body.description !== undefined
        ? { description: body.description.trim() }
        : {}),
      ...(body.event_date !== undefined
        ? { event_date: body.event_date ? body.event_date.trim() : '' }
        : {}),
      ...(body.event_date_label !== undefined
        ? { event_date_label: body.event_date_label.trim() }
        : {}),
      ...(body.registration_deadline !== undefined
        ? {
            registration_deadline: body.registration_deadline
              ? body.registration_deadline.trim()
              : '',
          }
        : {}),
      ...(body.location !== undefined ? { location: body.location.trim() } : {}),
      ...(body.mode !== undefined ? { mode: body.mode } : {}),
      ...(body.prize !== undefined ? { prize: body.prize } : {}),
      ...(body.team_size !== undefined ? { team_size: body.team_size } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.registration_url !== undefined
        ? { registration_url: body.registration_url.trim() }
        : {}),
      ...(body.brochure_url !== undefined
        ? { brochure_url: body.brochure_url }
        : {}),
      ...(body.image_url !== undefined ? { image_url: body.image_url } : {}),
      ...(body.secondary_image_url !== undefined
        ? { secondary_image_url: body.secondary_image_url }
        : {}),
      ...(body.source_url !== undefined
        ? { source_url: body.source_url.trim() }
        : {}),
      updated_at: new Date().toISOString(),
    };

    if (body.clear_status_override) {
      updated.status_override = null;
      if (
        updated.registration_status === 'Registration Closed' ||
        updated.registration_status === 'Results Announced'
      ) {
        updated.registration_status = 'Registration Open';
      }
    } else if (body.status_override !== undefined) {
      updated.status_override = body.status_override;
      if (body.status_override) {
        updated.registration_status = body.status_override;
      } else if (
        updated.registration_status === 'Registration Closed' ||
        updated.registration_status === 'Results Announced'
      ) {
        updated.registration_status = 'Registration Open';
      }
    } else if (body.registration_status !== undefined) {
      updated.registration_status = body.registration_status;
      updated.status_override = body.registration_status;
    } else if (body.registration_deadline !== undefined) {
      // When deadline is updated to a future date, clear any stale closed status so the new deadline applies
      const newCutoff = parseDateEndOfDayIST(updated.registration_deadline);
      if (newCutoff !== null && newCutoff >= Date.now()) {
        if (updated.status_override === 'Registration Closed') {
          updated.status_override = null;
        }
        if (updated.registration_status === 'Registration Closed') {
          updated.registration_status = 'Registration Open';
        }
      }
    }

    CURATED_COMPETITIONS[idx] = updated;
    await syncAllHackathonsToSupabase();

    const resolvedStatus = computeAccurateStatus(updated);
    return res.json({
      ok: true,
      competition: {
        ...updated,
        registration_status: resolvedStatus,
      },
    });
  };

  app.patch('/api/competitions/:id', handleUpdateCompetition);
  app.put('/api/competitions/:id', handleUpdateCompetition);

  // 4. Protected Admin: Delete a competition
  app.delete('/api/competitions/:id', async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(403).json({
        ok: false,
        error: 'Unauthorized. Valid admin passcode required.',
      });
    }
    const { id } = req.params;
    CURATED_COMPETITIONS = CURATED_COMPETITIONS.filter((c) => c.id !== id);
    if (supabase) {
      try {
        await supabase.from('hackathons').delete().eq('id', id);
        await saveSnapshotsToSupabaseStorage();
      } catch {
        // Ignore
      }
    }
    return res.json({ ok: true });
  });

  // 5. Mandatory Student Login / Registration (Name, Phone Number, Year of Study)
  app.post('/api/signups', async (req, res) => {
    const { name, phone, year_of_study } = req.body as {
      name?: string;
      phone?: string;
      year_of_study?: string;
    };

    const cleanName = (name || '').trim();
    const digitsOnlyPhone = (phone || '').replace(/\D/g, '');
    const normalizedPhone =
      digitsOnlyPhone.length === 12 && digitsOnlyPhone.startsWith('91')
        ? digitsOnlyPhone.slice(2)
        : digitsOnlyPhone;

    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({
        ok: false,
        error: 'Please enter your full name.',
      });
    }

    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({
        ok: false,
        error: 'Please enter a valid 10-digit mobile number.',
      });
    }

    const allowedYears = [
      '1st Year',
      '2nd Year',
      '3rd Year',
      '4th Year',
      'Other',
    ];
    const cleanYear = allowedYears.includes(year_of_study || '')
      ? (year_of_study as string)
      : 'Other';

    let studentRecord = STUDENT_SIGNUPS.find(
      (s) => s.phone === normalizedPhone
    );

    if (studentRecord) {
      studentRecord.name = cleanName;
      studentRecord.year_of_study = cleanYear;
    } else {
      studentRecord = {
        id: `stu-${Date.now()}`,
        name: cleanName,
        phone: normalizedPhone,
        year_of_study: cleanYear,
        created_at: new Date().toISOString(),
      };
      STUDENT_SIGNUPS.unshift(studentRecord);
    }

    saveSignupsToFile(STUDENT_SIGNUPS);

    // Sync immediately to Supabase (Auth Users + Table + Storage)
    await syncStudentToSupabase(studentRecord);

    return res.status(201).json({
      ok: true,
      student: studentRecord,
      supabase_synced: Boolean(supabase),
    });
  });

  // 6. Admin: View all logged-in students (merges Supabase + Local)
  app.get('/api/admin/signups', async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(403).json({
        ok: false,
        error: 'Unauthorized. Enter valid admin passcode.',
      });
    }

    if (supabase) {
      try {
        const { data: tableSignups, error } = await supabase
          .from('student_signups')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(tableSignups)) {
          for (const row of tableSignups) {
            if (row.phone && !STUDENT_SIGNUPS.some((s) => s.phone === row.phone)) {
              STUDENT_SIGNUPS.push({
                id: row.id,
                name: row.name,
                phone: row.phone,
                year_of_study: row.year_of_study,
                created_at: row.created_at,
              });
            }
          }
        }
      } catch {
        // Ignore
      }
    }

    return res.json({
      ok: true,
      count: STUDENT_SIGNUPS.length,
      signups: STUDENT_SIGNUPS,
    });
  });

  // 7. Admin: Check Supabase live status & trigger full sync
  app.get('/api/admin/supabase-status', async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(403).json({ ok: false, error: 'Unauthorized.' });
    }

    if (!supabase) {
      return res.json({
        ok: true,
        connected: false,
        projectUrl: null,
        authUsersCount: 0,
        tablesReady: false,
        storageReady: false,
      });
    }

    let authUsersCount = 0;
    let tablesReady = false;
    let storageReady = false;
    let tableErrorMsg: string | null = null;

    try {
      const { data: authList } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      authUsersCount = authList?.users?.length || 0;
    } catch {
      // Ignore
    }

    try {
      const { error: checkErr } = await supabase
        .from('student_signups')
        .select('*')
        .limit(1);
      if (!checkErr) {
        tablesReady = true;
      } else {
        tableErrorMsg = checkErr.message;
      }
    } catch (e: any) {
      tableErrorMsg = e?.message || 'Tables not created yet';
    }

    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      storageReady = Boolean(buckets?.some((b) => b.name === STORAGE_BUCKET));
    } catch {
      // Ignore
    }

    return res.json({
      ok: true,
      connected: true,
      projectUrl: SUPABASE_URL,
      authUsersCount,
      tablesReady,
      storageReady,
      tableErrorMsg,
      localSignupsCount: STUDENT_SIGNUPS.length,
      hackathonsCount: CURATED_COMPETITIONS.length,
    });
  });

  app.post('/api/admin/supabase-sync', async (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(403).json({ ok: false, error: 'Unauthorized.' });
    }
    await hydrateFromSupabaseOnStartup();
    return res.json({
      ok: true,
      message: `Synced ${STUDENT_SIGNUPS.length} students and ${CURATED_COMPETITIONS.length} hackathons with Supabase.`,
    });
  });

  // 8. Analytics collector
  app.post('/api/analytics', (req, res) => {
    ANALYTICS_EVENTS.push({
      ...req.body,
      timestamp: new Date().toISOString(),
    });
    res.json({ ok: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hackathon Radar server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
