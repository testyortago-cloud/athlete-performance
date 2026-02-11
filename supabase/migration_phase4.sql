-- ============================================
-- DJP Athlete — Phase 4 Migration
-- Run this in Supabase SQL Editor AFTER migration.sql
-- ============================================

-- ============================================
-- 1. Schema Changes (must come before RLS policies that reference new columns)
-- ============================================

-- Add coach_id to athletes (nullable FK to users)
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS coach_id TEXT REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_athletes_coach ON athletes(coach_id);

-- ============================================
-- 2. Row-Level Security (RLS)
-- ============================================

-- Enable RLS on all core tables
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE testing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE injuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_load ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- Admin: full access to all tables
CREATE POLICY admin_full_access_sports ON sports FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'admin'));
CREATE POLICY admin_full_access_athletes ON athletes FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'admin'));
CREATE POLICY admin_full_access_metric_categories ON metric_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'admin'));
CREATE POLICY admin_full_access_metrics ON metrics FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'admin'));
CREATE POLICY admin_full_access_testing_sessions ON testing_sessions FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'admin'));
CREATE POLICY admin_full_access_trial_data ON trial_data FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'admin'));
CREATE POLICY admin_full_access_injuries ON injuries FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'admin'));
CREATE POLICY admin_full_access_daily_load ON daily_load FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'admin'));
CREATE POLICY admin_full_access_users ON users FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'admin'));
CREATE POLICY admin_full_access_sync_log ON sync_log FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'admin'));

-- Coach: read all, write only their athletes' data
CREATE POLICY coach_read_sports ON sports FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'coach'));
CREATE POLICY coach_read_athletes ON athletes FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'coach'));
CREATE POLICY coach_write_athletes ON athletes FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'coach')
    AND coach_id = auth.uid()::TEXT);
CREATE POLICY coach_read_metric_categories ON metric_categories FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'coach'));
CREATE POLICY coach_read_metrics ON metrics FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'coach'));
CREATE POLICY coach_read_testing_sessions ON testing_sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'coach'));
CREATE POLICY coach_write_testing_sessions ON testing_sessions FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'coach')
    AND athlete_id IN (SELECT id FROM athletes WHERE coach_id = auth.uid()::TEXT));
CREATE POLICY coach_read_trial_data ON trial_data FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'coach'));
CREATE POLICY coach_read_injuries ON injuries FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'coach'));
CREATE POLICY coach_write_injuries ON injuries FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'coach')
    AND athlete_id IN (SELECT id FROM athletes WHERE coach_id = auth.uid()::TEXT));
CREATE POLICY coach_read_daily_load ON daily_load FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'coach'));
CREATE POLICY coach_write_daily_load ON daily_load FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'coach')
    AND athlete_id IN (SELECT id FROM athletes WHERE coach_id = auth.uid()::TEXT));

-- Athlete: read only their own data
CREATE POLICY athlete_read_sports ON sports FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'athlete'));
CREATE POLICY athlete_read_own ON athletes FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'athlete')
    AND id = auth.uid()::TEXT);
CREATE POLICY athlete_read_own_sessions ON testing_sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'athlete')
    AND athlete_id = auth.uid()::TEXT);
CREATE POLICY athlete_read_own_trial_data ON trial_data FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'athlete')
    AND session_id IN (SELECT id FROM testing_sessions WHERE athlete_id = auth.uid()::TEXT));
CREATE POLICY athlete_read_own_injuries ON injuries FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'athlete')
    AND athlete_id = auth.uid()::TEXT);
CREATE POLICY athlete_read_own_load ON daily_load FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'athlete')
    AND athlete_id = auth.uid()::TEXT);

-- ============================================
-- 3. Materialized View — Dashboard KPI Summary
-- ============================================

CREATE MATERIALIZED VIEW dashboard_kpi_summary AS
SELECT
  (SELECT COUNT(*) FROM athletes WHERE status = 'active') AS active_athletes,
  (SELECT COUNT(*) FROM injuries WHERE status = 'active') AS active_injuries,
  (SELECT COALESCE(ROUND(AVG(training_load)::NUMERIC, 0), 0)
   FROM daily_load
   WHERE date >= CURRENT_DATE - INTERVAL '7 days') AS avg_load_7d,
  (SELECT COUNT(*) FROM testing_sessions
   WHERE date >= DATE_TRUNC('month', CURRENT_DATE)) AS sessions_this_month;

CREATE INDEX idx_dashboard_kpi_summary ON dashboard_kpi_summary (active_athletes);

-- Function to refresh dashboard views
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW dashboard_kpi_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Future-proofing Schema Additions
-- ============================================

-- Wellness entries table (direct Supabase, not synced from Airtable)
CREATE TABLE IF NOT EXISTS wellness_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sleep_hours NUMERIC(3,1),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  muscle_soreness INTEGER CHECK (muscle_soreness BETWEEN 1 AND 5),
  fatigue INTEGER CHECK (fatigue BETWEEN 1 AND 5),
  stress INTEGER CHECK (stress BETWEEN 1 AND 5),
  mood INTEGER CHECK (mood BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, date)
);

CREATE INDEX IF NOT EXISTS idx_wellness_athlete ON wellness_entries(athlete_id);
CREATE INDEX IF NOT EXISTS idx_wellness_date ON wellness_entries(date);
CREATE INDEX IF NOT EXISTS idx_wellness_athlete_date ON wellness_entries(athlete_id, date);

-- Perceived recovery table
CREATE TABLE IF NOT EXISTS perceived_recovery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  prs_score INTEGER CHECK (prs_score BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, date)
);

CREATE INDEX IF NOT EXISTS idx_perceived_recovery_athlete ON perceived_recovery(athlete_id);
CREATE INDEX IF NOT EXISTS idx_perceived_recovery_date ON perceived_recovery(date);

-- RLS for new tables
ALTER TABLE wellness_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE perceived_recovery ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_full_access_wellness ON wellness_entries FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'admin'));
CREATE POLICY coach_read_wellness ON wellness_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'coach'));
CREATE POLICY athlete_own_wellness ON wellness_entries FOR ALL
  USING (athlete_id = auth.uid()::TEXT);

CREATE POLICY admin_full_access_recovery ON perceived_recovery FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'admin'));
CREATE POLICY coach_read_recovery ON perceived_recovery FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'coach'));
CREATE POLICY athlete_own_recovery ON perceived_recovery FOR ALL
  USING (athlete_id = auth.uid()::TEXT);

-- Settings table (for storing app config in Supabase as well)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, key)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_full_access_settings ON settings FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::TEXT AND role = 'admin'));

-- ============================================
-- 5. Analytical Views
-- ============================================

-- Injury-load correlation: joins each injury with the athlete's load data
-- in the 28 days preceding the injury, plus ACWR at the time of injury.
CREATE OR REPLACE VIEW injury_load_correlation AS
SELECT
  i.id AS injury_id,
  i.athlete_id,
  a.name AS athlete_name,
  i.type AS injury_type,
  i.body_region,
  i.date_occurred,
  i.date_resolved,
  i.days_lost,
  i.status AS injury_status,
  -- Acute load: 7 days before injury
  COALESCE((
    SELECT ROUND(SUM(dl.training_load)::NUMERIC, 1)
    FROM daily_load dl
    WHERE dl.athlete_id = i.athlete_id
      AND dl.date BETWEEN (i.date_occurred - INTERVAL '7 days') AND i.date_occurred
  ), 0) AS acute_load_at_injury,
  -- Chronic load: avg weekly load over 28 days before injury
  COALESCE((
    SELECT ROUND((SUM(dl.training_load) / 4)::NUMERIC, 1)
    FROM daily_load dl
    WHERE dl.athlete_id = i.athlete_id
      AND dl.date BETWEEN (i.date_occurred - INTERVAL '28 days') AND i.date_occurred
  ), 0) AS chronic_load_at_injury,
  -- ACWR at time of injury
  CASE
    WHEN COALESCE((
      SELECT SUM(dl.training_load) / 4
      FROM daily_load dl
      WHERE dl.athlete_id = i.athlete_id
        AND dl.date BETWEEN (i.date_occurred - INTERVAL '28 days') AND i.date_occurred
    ), 0) > 0
    THEN ROUND((
      COALESCE((
        SELECT SUM(dl.training_load)
        FROM daily_load dl
        WHERE dl.athlete_id = i.athlete_id
          AND dl.date BETWEEN (i.date_occurred - INTERVAL '7 days') AND i.date_occurred
      ), 0)
      /
      (
        SELECT SUM(dl.training_load) / 4
        FROM daily_load dl
        WHERE dl.athlete_id = i.athlete_id
          AND dl.date BETWEEN (i.date_occurred - INTERVAL '28 days') AND i.date_occurred
      )
    )::NUMERIC, 2)
    ELSE 0
  END AS acwr_at_injury,
  -- Average RPE in week before injury
  (
    SELECT ROUND(AVG(dl.rpe)::NUMERIC, 1)
    FROM daily_load dl
    WHERE dl.athlete_id = i.athlete_id
      AND dl.date BETWEEN (i.date_occurred - INTERVAL '7 days') AND i.date_occurred
  ) AS avg_rpe_before_injury
FROM injuries i
JOIN athletes a ON i.athlete_id = a.id;

-- Performance comparisons: per-athlete best scores for each metric,
-- with rank within sport for cross-athlete comparison.
CREATE OR REPLACE VIEW performance_comparisons AS
SELECT
  a.id AS athlete_id,
  a.name AS athlete_name,
  a.position,
  s.id AS sport_id,
  s.name AS sport_name,
  m.id AS metric_id,
  m.name AS metric_name,
  m.unit,
  m.best_score_method,
  best.best_score,
  best.avg_score,
  best.latest_session_date,
  RANK() OVER (
    PARTITION BY m.id
    ORDER BY
      CASE WHEN m.best_score_method = 'highest' THEN best.best_score ELSE NULL END DESC NULLS LAST,
      CASE WHEN m.best_score_method = 'lowest'  THEN best.best_score ELSE NULL END ASC  NULLS LAST
  ) AS rank_in_metric
FROM athletes a
JOIN sports s ON a.sport_id = s.id
JOIN LATERAL (
  SELECT
    td.metric_id,
    CASE
      WHEN m2.best_score_method = 'highest' THEN MAX(td.best_score)
      ELSE MIN(td.best_score)
    END AS best_score,
    ROUND(AVG(td.best_score)::NUMERIC, 2) AS avg_score,
    MAX(ts.date) AS latest_session_date
  FROM trial_data td
  JOIN testing_sessions ts ON td.session_id = ts.id
  JOIN metrics m2 ON td.metric_id = m2.id
  WHERE ts.athlete_id = a.id
    AND m2.sport_id = a.sport_id
    AND td.best_score IS NOT NULL
  GROUP BY td.metric_id, m2.best_score_method
) best ON TRUE
JOIN metrics m ON best.metric_id = m.id
WHERE a.status = 'active';
