-- ============================================
-- DJP Athlete — Supabase Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Core tables (synced from Airtable, using Airtable record IDs as PKs)

CREATE TABLE sports (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE athletes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date_of_birth DATE,
  sport_id TEXT REFERENCES sports(id) ON DELETE SET NULL,
  position TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE metric_categories (
  id TEXT PRIMARY KEY,
  sport_id TEXT REFERENCES sports(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE metrics (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES metric_categories(id) ON DELETE CASCADE,
  sport_id TEXT REFERENCES sports(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT,
  is_derived BOOLEAN DEFAULT FALSE,
  formula TEXT,
  best_score_method TEXT DEFAULT 'highest' CHECK (best_score_method IN ('highest', 'lowest')),
  trial_count INTEGER DEFAULT 3,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE testing_sessions (
  id TEXT PRIMARY KEY,
  athlete_id TEXT REFERENCES athletes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT,
  created_by TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trial_data (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES testing_sessions(id) ON DELETE CASCADE,
  metric_id TEXT REFERENCES metrics(id) ON DELETE CASCADE,
  trial_1 NUMERIC,
  trial_2 NUMERIC,
  trial_3 NUMERIC,
  best_score NUMERIC,
  average_score NUMERIC,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE injuries (
  id TEXT PRIMARY KEY,
  athlete_id TEXT REFERENCES athletes(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('injury', 'illness')),
  description TEXT,
  mechanism TEXT,
  body_region TEXT,
  date_occurred DATE,
  date_resolved DATE,
  days_lost INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_load (
  id TEXT PRIMARY KEY,
  athlete_id TEXT REFERENCES athletes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  rpe INTEGER CHECK (rpe BETWEEN 1 AND 10),
  duration_minutes INTEGER,
  training_load NUMERIC,
  session_type TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'coach', 'athlete')),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sync_log (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  records_synced INTEGER NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_athletes_sport ON athletes(sport_id);
CREATE INDEX idx_athletes_status ON athletes(status);
CREATE INDEX idx_metric_categories_sport ON metric_categories(sport_id);
CREATE INDEX idx_metrics_category ON metrics(category_id);
CREATE INDEX idx_metrics_sport ON metrics(sport_id);
CREATE INDEX idx_testing_sessions_athlete ON testing_sessions(athlete_id);
CREATE INDEX idx_testing_sessions_date ON testing_sessions(date);
CREATE INDEX idx_trial_data_session ON trial_data(session_id);
CREATE INDEX idx_trial_data_metric ON trial_data(metric_id);
CREATE INDEX idx_injuries_athlete ON injuries(athlete_id);
CREATE INDEX idx_injuries_status ON injuries(status);
CREATE INDEX idx_daily_load_athlete ON daily_load(athlete_id);
CREATE INDEX idx_daily_load_date ON daily_load(date);
CREATE INDEX idx_daily_load_athlete_date ON daily_load(athlete_id, date);
CREATE INDEX idx_sync_log_table ON sync_log(table_name);

-- ============================================
-- Analytics Views (used in Phase 3)
-- ============================================

CREATE VIEW athlete_performance_history AS
SELECT
  td.id AS trial_data_id,
  a.id AS athlete_id,
  a.name AS athlete_name,
  a.position,
  s.id AS sport_id,
  s.name AS sport_name,
  mc.id AS category_id,
  mc.name AS category_name,
  m.id AS metric_id,
  m.name AS metric_name,
  m.unit,
  m.best_score_method,
  ts.id AS session_id,
  ts.date AS session_date,
  td.trial_1,
  td.trial_2,
  td.trial_3,
  td.best_score,
  td.average_score
FROM trial_data td
JOIN testing_sessions ts ON td.session_id = ts.id
JOIN athletes a ON ts.athlete_id = a.id
JOIN metrics m ON td.metric_id = m.id
JOIN metric_categories mc ON m.category_id = mc.id
JOIN sports s ON m.sport_id = s.id;

CREATE VIEW load_weekly_summary AS
SELECT
  athlete_id,
  DATE_TRUNC('week', date)::DATE AS week_start,
  COUNT(*) AS sessions,
  ROUND(AVG(training_load)::NUMERIC, 1) AS avg_daily_load,
  ROUND(SUM(training_load)::NUMERIC, 1) AS total_load,
  ROUND(STDDEV(training_load)::NUMERIC, 2) AS load_stddev,
  CASE
    WHEN STDDEV(training_load) > 0
    THEN ROUND((AVG(training_load) / STDDEV(training_load))::NUMERIC, 2)
    ELSE 0
  END AS monotony,
  CASE
    WHEN STDDEV(training_load) > 0
    THEN ROUND((SUM(training_load) * (AVG(training_load) / STDDEV(training_load)))::NUMERIC, 1)
    ELSE 0
  END AS strain
FROM daily_load
GROUP BY athlete_id, DATE_TRUNC('week', date);
