-- Migration: lecture_blocks table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS lecture_blocks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id    TEXT NOT NULL,
  title       TEXT NOT NULL,
  subject     TEXT NOT NULL DEFAULT 'General',
  content     TEXT DEFAULT '',
  week_id     TEXT,          -- YYYY-WXX format, NULL = in queue (unscheduled)
  day_of_week INT,           -- 0=Monday … 4=Friday, NULL = in queue
  sort_order  INT DEFAULT 0, -- stacking order within same cell
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lecture_blocks_class_id ON lecture_blocks(class_id);
CREATE INDEX IF NOT EXISTS lecture_blocks_week_id  ON lecture_blocks(week_id);

ALTER TABLE lecture_blocks ENABLE ROW LEVEL SECURITY;

-- Allow full access (teacher service-role key bypasses RLS)
CREATE POLICY "service role full access" ON lecture_blocks
  FOR ALL USING (true);
