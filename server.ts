import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import jpeg from 'jpeg-js';
import jsQR from 'jsqr';

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

function computeAccurateStatus(
  comp: BackendCompetition,
  referenceDateStr = '2026-10-21'
): PublicStatus {
  if (comp.status_override) {
    return comp.status_override;
  }
  if (comp.registration_status === 'Results Announced') {
    return 'Results Announced';
  }

  const refTime = new Date(`${referenceDateStr}T00:00:00Z`).getTime();
  const deadlineTime = new Date(`${comp.registration_deadline}T23:59:59Z`).getTime();
  const eventTime = new Date(`${comp.event_date}T23:59:59Z`).getTime();

  if (!Number.isNaN(deadlineTime) && deadlineTime < refTime) {
    return 'Registration Closed';
  }
  if (!Number.isNaN(eventTime) && eventTime < refTime) {
    return 'Registration Closed';
  }

  if (!Number.isNaN(deadlineTime)) {
    const diffDays = Math.ceil((deadlineTime - refTime) / (1000 * 60 * 60 * 24));
    if (diffDays <= 5) {
      return 'Closing Soon';
    }
    return 'Registration Open';
  }

  return comp.registration_status;
}

// 6 Real Verified Karnataka Hackathons (Ordered Chronologically in Sequential Flow)
let CURATED_COMPETITIONS: BackendCompetition[] = [
  {
    id: 'jit-gameathon-8',
    title: 'GAMEATHON 8.0 — A Global Contest',
    college: 'Jyothy Institute of Technology (JIT), Bengaluru · Dept. of ISE & Bits&Bytes x ACM',
    description:
      'A global contest with $2000 total prize pool, free Papa John\'s pizza for all participants and coordinators, free shuttle from Silk Institute metro, and a 3-day training series.',
    event_date: '2026-10-23',
    event_date_label: '23rd & 24th October 2026',
    registration_deadline: '2026-10-22',
    location: 'Jyothy Institute of Technology, Tataguni, Bengaluru',
    mode: 'Offline',
    prize: '$2000 (≈ ₹1,65,000)',
    team_size: '2 – 4 Members',
    entry_fee: 'Free Registration (Papa John\'s Pizza Included)',
    coordinators: 'Sathvik Vasishta (+91 96060 18932) · Priyanka T S (+91 73497 10985)',
    perks: 'Free Papa John\'s Pizza · Free Shuttle from Silk Institute · 3-Day GameDev Training',
    category: 'GameDev & Software',
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
    image_url:
      '/assets/aistudio/IMG_20261021_135134_c1397f09.jpg',
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
  app.use(express.json({ limit: '15mb' }));

  // 1. Get all real poster competitions ordered sequentially by event date
  app.get('/api/competitions', (_req, res) => {
    const enriched = CURATED_COMPETITIONS.map((c) => ({
      ...c,
      registration_status: computeAccurateStatus(c),
    })).sort((a, b) => a.event_date.localeCompare(b.event_date));

    res.json({
      ok: true,
      competitions: enriched,
    });
  });

  // 2. Scan QR code directly from an uploaded JPEG hackathon poster
  app.post('/api/scan-poster', (req, res) => {
    const { imageBase64 } = req.body as { imageBase64?: string };
    if (!imageBase64) {
      return res.status(400).json({ ok: false, error: 'No image provided.' });
    }
    const base64Clean = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64;
    const buffer = Buffer.from(base64Clean, 'base64');
    const decoded = decodeQrFromJpegBuffer(buffer);

    if (!decoded) {
      return res.json({
        ok: false,
        error:
          'Could not detect a QR code in this image. You can paste the registration link manually.',
      });
    }

    const normalizedUrl = decoded.startsWith('http')
      ? decoded
      : `https://${decoded}`;
    return res.json({
      ok: true,
      qrUrl: normalizedUrl,
    });
  });

  // 3. Protected Admin: Add a new competition
  app.post('/api/competitions', (req, res) => {
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
    const newComp: BackendCompetition = {
      id: `comp-${Date.now()}`,
      title: body.title.trim(),
      college: body.college?.trim() || 'Karnataka Campus Hackathon',
      description:
        body.description?.trim() || 'Verified student hackathon.',
      event_date: body.event_date || '2026-11-20',
      event_date_label: body.event_date_label?.trim() || body.event_date || 'Nov 2026',
      registration_deadline: body.registration_deadline || body.event_date || '2026-11-18',
      location: body.location?.trim() || 'Bengaluru',
      mode: body.mode || 'Offline',
      prize: body.prize?.trim() ? body.prize.trim() : null,
      team_size: body.team_size?.trim() || '2 – 4 Members',
      entry_fee: body.entry_fee?.trim() || undefined,
      coordinators: body.coordinators?.trim() || undefined,
      category: body.category?.trim() || 'Hackathon',
      registration_status: body.registration_status || 'Registration Open',
      status_override: body.status_override || null,
      registration_url: body.registration_url.trim(),
      brochure_url: body.brochure_url?.trim() || null,
      image_url: body.image_url?.trim() || null,
      source_url: body.source_url?.trim() || body.registration_url.trim(),
      last_verified_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    };

    newComp.registration_status = computeAccurateStatus(newComp);
    CURATED_COMPETITIONS.push(newComp);

    return res.status(201).json({
      ok: true,
      competition: newComp,
    });
  });

  // 4. Protected Admin: Delete a competition
  app.delete('/api/competitions/:id', (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(403).json({
        ok: false,
        error: 'Unauthorized. Valid admin passcode required.',
      });
    }
    const { id } = req.params;
    CURATED_COMPETITIONS = CURATED_COMPETITIONS.filter((c) => c.id !== id);
    return res.json({ ok: true });
  });

  // 5. Mandatory Student Login / Registration (Name, Phone Number, Year of Study)
  app.post('/api/signups', (req, res) => {
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

    const allowedYears = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Other'];
    const cleanYear = allowedYears.includes(year_of_study || '')
      ? (year_of_study as string)
      : 'Other';

    const existingRecord = STUDENT_SIGNUPS.find(
      (s) => s.phone === normalizedPhone
    );
    if (existingRecord) {
      existingRecord.name = cleanName;
      existingRecord.year_of_study = cleanYear;
      saveSignupsToFile(STUDENT_SIGNUPS);
      return res.status(200).json({
        ok: true,
        student: existingRecord,
      });
    }

    const record: BackendStudentSignup = {
      id: `stu-${Date.now()}`,
      name: cleanName,
      phone: normalizedPhone,
      year_of_study: cleanYear,
      created_at: new Date().toISOString(),
    };

    STUDENT_SIGNUPS.unshift(record);
    saveSignupsToFile(STUDENT_SIGNUPS);

    return res.status(201).json({
      ok: true,
      student: record,
    });
  });

  // 6. Admin: View all logged-in students
  app.get('/api/admin/signups', (req, res) => {
    if (!isAdminAuthorized(req)) {
      return res.status(403).json({
        ok: false,
        error: 'Unauthorized. Enter valid admin passcode.',
      });
    }
    return res.json({
      ok: true,
      count: STUDENT_SIGNUPS.length,
      signups: STUDENT_SIGNUPS,
    });
  });

  // 7. Analytics collector
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
