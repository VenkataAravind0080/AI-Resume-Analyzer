/*
# AI Resume Analyzer — Core Schema

## Overview
Creates the data model for a multi-user AI Resume Analyzer platform.
Users register and sign in with email/password. Each user manages their own
resumes and analysis history; no user can see another user's data.

## New Tables
1. `profiles` — per-user display profile (full name, career domain, avatar).
2. `resumes` — one row per uploaded resume (raw text + parsed structure).
3. `analyses` — one row per analysis run (resume + job description + scores).
   - `ats_score` overall 0-100.
   - `category_scores` JSONB breakdown of the 9 scoring categories.
   - `matched_skills`, `missing_skills` text arrays.
   - `semantic_similarity` 0-100.
   - `recommendations`, `interview_questions` JSONB arrays.
   - `keywords_found`, `keywords_missing` text arrays.
   - `parsed_resume` JSONB snapshot of structured extraction.

## Security
- RLS enabled on all tables.
- Owner-scoped CRUD (select/insert/update/delete) via `auth.uid() = user_id`.
- `user_id` defaults to `auth.uid()` so client inserts that omit it succeed.
- `profiles` is keyed on `auth.users.id` directly (one row per auth user).
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  career_domain text DEFAULT '',
  avatar_color text DEFAULT 'blue',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  raw_text text NOT NULL DEFAULT '',
  parsed_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id uuid REFERENCES resumes(id) ON DELETE CASCADE,
  resume_name text NOT NULL,
  job_title text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  job_description text NOT NULL,
  ats_score integer NOT NULL DEFAULT 0,
  category_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  matched_skills text[] NOT NULL DEFAULT '{}'::text[],
  missing_skills text[] NOT NULL DEFAULT '{}'::text[],
  semantic_similarity numeric(5,2) NOT NULL DEFAULT 0,
  keywords_found text[] NOT NULL DEFAULT '{}'::text[],
  keywords_missing text[] NOT NULL DEFAULT '{}'::text[],
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  interview_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  parsed_resume jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resumes_user_idx ON resumes(user_id);
CREATE INDEX IF NOT EXISTS analyses_user_idx ON analyses(user_id);
CREATE INDEX IF NOT EXISTS analyses_resume_idx ON analyses(resume_id);
CREATE INDEX IF NOT EXISTS analyses_created_idx ON analyses(user_id, created_at DESC);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- profiles: user owns the row whose id == their auth id
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- resumes: owner-scoped
DROP POLICY IF EXISTS "select_own_resumes" ON resumes;
CREATE POLICY "select_own_resumes" ON resumes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_resumes" ON resumes;
CREATE POLICY "insert_own_resumes" ON resumes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_resumes" ON resumes;
CREATE POLICY "update_own_resumes" ON resumes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_resumes" ON resumes;
CREATE POLICY "delete_own_resumes" ON resumes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- analyses: owner-scoped
DROP POLICY IF EXISTS "select_own_analyses" ON analyses;
CREATE POLICY "select_own_analyses" ON analyses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_analyses" ON analyses;
CREATE POLICY "insert_own_analyses" ON analyses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_analyses" ON analyses;
CREATE POLICY "update_own_analyses" ON analyses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_analyses" ON analyses;
CREATE POLICY "delete_own_analyses" ON analyses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Auto-create a profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
