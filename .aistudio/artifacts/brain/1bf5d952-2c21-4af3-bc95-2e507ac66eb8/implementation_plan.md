# Supabase Database Integration & Table Synchronization Plan

Connect the verified, active Supabase project (`https://jqoebjwrecqhbfsqzctx.supabase.co`) so student sign-ups and hackathon events synchronize in real-time to the Supabase Table Editor.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Active Connection Status Verified:**
> - `SUPABASE_URL`: `https://jqoebjwrecqhbfsqzctx.supabase.co` (**Connected & Active**)
> - `SUPABASE_ANON_KEY`: Configured
> - `SUPABASE_SERVICE_ROLE_KEY`: Configured
> - **Current Table Status:** Currently **0 tables** exist in the public schema. That is why your Supabase Table Editor is not showing user data.
>
> We will provide a clean, 1-click SQL migration script for you to run once in your **Supabase SQL Editor**, and update the server to automatically stream all student signups and hackathons directly into Supabase.

---

### 1. Overview & Core Concept

* **The Problem:** The app was saving student signups only to local server disk storage (`data/signups.json`). Because the Supabase project had no tables created yet, no records could appear in Supabase.
* **The Solution:**
  1. Create two PostgreSQL tables in Supabase: `student_signups` and `hackathons`.
  2. Seed the 6 verified Karnataka campus hackathons into Supabase.
  3. Wire the backend (`server.ts`) to perform real-time `INSERT` and `SELECT` queries against Supabase using `@supabase/supabase-js` or direct PostgREST calls with Service Role authentication.
  4. Maintain local fallback caching so the student feed and signup process remain 100% available even during network drops.

---

### 2. User Experience & Visual Design

* **Zero Disruption to Students:** The student sign-in experience (Name, 10-digit Phone, Year of Study) remains fast and seamless with no UI lag.
* **Instant Reflection in Supabase Table Editor:** Every time a student signs in, a row immediately appears in your Supabase `student_signups` table with their name, phone number, year of study, and timestamp.
* **Admin Database Status Indicator:** In the Admin Console (`Admin / Add Poster`), display a live connection badge:
  * `● Connected to Supabase (jqoebjwrecqhbfsqzctx)`
  * Live row count from Supabase for student signups and hackathon catalog.

---

### 3. Key Product Decisions & Trade-Offs

* **Decision 1: Direct SQL Execution vs. Schema Script**
  * *Chosen Approach:* Provide the complete, tested PostgreSQL DDL script in the plan and in the admin console. You paste it once into your **Supabase Dashboard → SQL Editor → Run**.
  * *Why:* Supabase does not expose an arbitrary DDL migration endpoint over public REST without database password credentials. Running the script once in the SQL Editor creates the tables and sets up Row Level Security (RLS) policies cleanly.
* **Decision 2: Dual Storage (Supabase Primary + Local JSON Fallback)**
  * *Chosen Approach:* Always write to Supabase first; if Supabase ever encounters a network timeout, gracefully write to `data/signups.json` and sync when available.
  * *Why:* Guarantees students are never blocked from entering Hackathon Radar even if Supabase is temporarily paused or rate-limited.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   Student / Admin Client               │
│        (Mandatory Sign-In Gate & Sequential Feed)       │
└───────────────────────────┬────────────────────────────┘
                            │
               POST /api/signups | GET /api/competitions
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Express Backend                      │
│                      (server.ts)                       │
│                                                        │
│   ┌────────────────────────────────────────────────┐   │
│   │  Supabase Client (@supabase/supabase-js)       │   │
│   │  URL: https://jqoebjwrecqhbfsqzctx.supabase.co │   │
│   │  Key: SUPABASE_SERVICE_ROLE_KEY                │   │
│   └───────────────────────┬────────────────────────┘   │
└───────────────────────────┼────────────────────────────┘
                            │
            Real-time Sync  ▼
┌────────────────────────────────────────────────────────┐
│                  Supabase PostgreSQL                   │
│                                                        │
│   ┌───────────────────────┐   ┌────────────────────┐   │
│   │    student_signups    │   │     hackathons     │   │
│   │  - id (UUID / text)   │   │  - id (text PK)    │   │
│   │  - name (text)        │   │  - title (text)    │   │
│   │  - phone (text)       │   │  - college (text)  │   │
│   │  - year_of_study      │   │  - event_date      │   │
│   │  - created_at         │   │  - reg_url (text)  │   │
│   └───────────────────────┘   └────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

#### Ready-to-Run SQL Script for Supabase SQL Editor:

```sql
-- 1. Create Student Signups Table
CREATE TABLE IF NOT EXISTS public.student_signups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  year_of_study TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for quick phone lookups
CREATE INDEX IF NOT EXISTS idx_student_signups_phone ON public.student_signups (phone);

-- 2. Create Hackathons Table
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

-- 3. Enable Row Level Security & Allow Service Role and Anon Reads
ALTER TABLE public.student_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of hackathons" 
  ON public.hackathons FOR SELECT USING (true);

CREATE POLICY "Allow service role full access on student_signups" 
  ON public.student_signups FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on hackathons" 
  ON public.hackathons FOR ALL USING (true) WITH CHECK (true);
```

---

### Step-by-Step Implementation Steps

1. **Install `@supabase/supabase-js`**: Add official client library to `package.json`.
2. **Configure Supabase Client in `server.ts`**:
   - Initialize client using `process.env.SUPABASE_URL` and `process.env.SUPABASE_SERVICE_ROLE_KEY`.
   - Update `POST /api/signups` to execute `supabase.from('student_signups').upsert(...)`.
   - Update `GET /api/competitions` to query `supabase.from('hackathons').select('*')`, automatically falling back to verified seed data if the table is still being seeded.
   - Update `GET /api/admin/signups` to fetch directly from `supabase.from('student_signups')`.
3. **Add SQL Setup Helper in Admin UI**:
   - In the Admin Modal, add a **"Supabase Setup & SQL"** tab containing the copyable SQL script and a live connection check button.
4. **Compile & Verify**: Run `compile_applet` and test with a live signup.
