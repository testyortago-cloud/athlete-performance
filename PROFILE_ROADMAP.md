# Athlete Profile Page — Feature Roadmap

## Current State

The public profile (`/p/[id]`) includes:
- Hero section with avatar, risk badge, status
- 4 key stat cards (ACWR, Avg RPE, Days Lost, Injury-Free Streak)
- Performance trend chart (best/avg score by metric)
- 30-day training load chart
- Bio section with injury summary grid
- Recent activity timeline (last 6 events)

---

## Phase 1 — Athlete Self-Tracking Essentials

> **Goal:** Give athletes daily tools to log how they feel and see personal progress.

### 1.1 Daily Readiness / Wellness Check-In
- Athletes log: sleep hours, sleep quality, soreness, fatigue, mood, hydration
- Each rated 1–5 scale
- Compute a composite **Readiness Score** (weighted average, 0–100)
- Display as a prominent gauge/dial on the profile
- Color-coded: Red (0–40) → Amber (41–70) → Green (71–100)
- Show 7-day readiness trend sparkline

### 1.2 Personal Records (PRs)
- Auto-detect all-time best per metric from existing trial data
- Display as a table: Metric | PR Value | Date Achieved | Previous PR
- Highlight any PR set in the last 30 days with a badge
- Optional: show PR progression chart per metric

### 1.3 Weekly Volume Summary Card
- Sessions completed this week vs last week
- Total training load this week vs last week
- Average RPE this week vs last week
- Show percentage change with up/down arrows
- Compact card placed below the existing 4 glass stat cards

---

## Phase 2 — Visual & Analytics Upgrades

> **Goal:** Make the profile visually impressive and analytically deeper.

### 2.1 Radar / Spider Chart
- Multi-metric athlete snapshot (e.g., Speed, Strength, Endurance, Power, Agility)
- Uses latest test scores per metric, normalized to 0–100 scale
- Overlay comparison: current vs 30 days ago (ghost line)
- Placed in a new "Athlete Profile" section

### 2.2 Training Streak Calendar
- GitHub-style heatmap showing training days over last 12 weeks
- Color intensity = training load that day
- Shows current streak count and longest streak
- Placed below the training load chart

### 2.3 Progress Sparklines in Bio
- Tiny inline line charts next to each bio metric
- Shows last 30 days of trend for key stats (RPE, load, readiness)
- Gives at-a-glance direction without needing to scroll to full charts

---

## Phase 3 — Coach Intelligence Layer

> **Goal:** Give coaches actionable monitoring tools per athlete.

### 3.1 Training Load Zones
- Categorize daily load into zones: Rest / Low / Optimal / High / Danger
- Based on athlete's rolling average and standard deviation
- Display as a color-coded bar or zone chart over time
- Flag when athlete is in "Danger" zone for 2+ consecutive days

### 3.2 Week-over-Week Comparison
- Side-by-side card: This Week vs Last Week
- Metrics: total load, session count, avg RPE, avg readiness
- Percentage deltas with color coding (green = improvement, red = concern)
- Alert banner if load spike > 30% week-over-week

### 3.3 Compliance Rate
- Planned sessions (from program) vs completed sessions
- Display as a percentage with a progress ring
- Weekly and monthly compliance views
- Highlight athletes below 80% compliance

### 3.4 Injury Risk Flags
- Auto-generated alerts based on rules:
  - ACWR > 1.5 → High workload spike risk
  - Readiness score < 40 for 3+ days → Fatigue risk
  - Load increase > 30% week-over-week → Overtraining risk
  - RPE > 8 for 3+ consecutive sessions → Recovery concern
- Display as dismissible alert cards on profile
- Coach can acknowledge/dismiss flags

---

## Phase 4 — Injury & Recovery Tools

> **Goal:** Help athletes and medical staff track injury recovery visually.

### 4.1 Body Map Visualization
- Interactive body diagram (front + back view)
- Show injury locations as colored markers:
  - Red = active injury
  - Amber = recovering
  - Green = resolved
- Click a marker to see injury details (type, date, days lost, status)
- Historical view: toggle to see all past injuries overlaid

### 4.2 Return-to-Play Progress Tracker
- Per active injury: define rehab milestones
- Milestone checklist with dates (e.g., Pain-free ROM → Light Training → Full Contact → Cleared)
- Progress bar showing current phase
- Estimated return date based on typical timelines
- Medical staff can update milestones

### 4.3 Injury Timeline
- Horizontal timeline showing all injuries chronologically
- Duration bars showing time lost per injury
- Overlay with training load to visualize load → injury correlation
- Filter by body region or injury type

---

## Phase 5 — Athlete Goals & Engagement

> **Goal:** Keep athletes motivated and accountable with goal-setting tools.

### 5.1 Goal Tracker
- Athletes set target values per metric (e.g., "40-yard dash < 4.5s")
- Progress bar: current best vs target
- Deadline support (achieve by date)
- Auto-celebrate when goal is hit (confetti, badge)

### 5.2 Achievement Badges
- Auto-awarded badges for milestones:
  - "Iron Streak" — 30 consecutive training days
  - "PR Machine" — 3 PRs in one month
  - "Recovery Pro" — Readiness score > 80 for 14 days
  - "Consistent" — 90%+ compliance for a month
- Display in a badge shelf on the profile
- Shareable badge cards

### 5.3 Athlete Notes / Journal
- Athletes can log daily training notes
- Tag entries: #technique, #mindset, #nutrition, #recovery
- Searchable and filterable
- Coaches can view (read-only) and leave comments

---

## Implementation Priority

| Phase | Effort | Impact | Priority |
|-------|--------|--------|----------|
| Phase 1 — Self-Tracking | Medium | High | Do first |
| Phase 2 — Visuals | Medium | High | Do second |
| Phase 3 — Coach Tools | High | High | Do third |
| Phase 4 — Injury Tools | High | Medium | Do fourth |
| Phase 5 — Engagement | Medium | Medium | Do fifth |

---

## Tech Notes

- **Readiness data** → new Supabase table `daily_wellness` (or Airtable `Wellness` table)
- **PRs** → computed from existing `Testing Sessions` + `Trial Data`
- **Radar chart** → use Recharts `<RadarChart>` (already have Recharts installed)
- **Body map** → SVG-based component with clickable regions
- **Badges** → computed server-side, stored as JSON array on athlete record
- **Goals** → new table `athlete_goals` with target metric, value, deadline
