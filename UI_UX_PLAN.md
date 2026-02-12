# UI/UX Improvement Plan — DJP Athlete Performance Platform

> Phased implementation roadmap organized by priority, dependencies, and complexity.
> Each phase builds on the previous one. Complete phases sequentially.

---

## Table of Contents

- [Phase 1 — Foundation & Polish](#phase-1--foundation--polish)
- [Phase 2 — Core UX Upgrades](#phase-2--core-ux-upgrades)
- [Phase 3 — Data Visualization & Insights](#phase-3--data-visualization--insights)
- [Phase 4 — Advanced Workflows](#phase-4--advanced-workflows)
- [Phase 5 — Power Features & Personalization](#phase-5--power-features--personalization)
- [Phase 6 — Collaboration & Communication](#phase-6--collaboration--communication)
- [Implementation Notes](#implementation-notes)

---

## Phase 1 — Foundation & Polish

> **Goal:** Improve consistency, loading states, and micro-interactions across every page. No new features — just make what exists feel solid and professional.
>
> **Effort:** Low | **Impact:** High | **Estimated scope:** ~20 tasks

### 1.1 Global Consistency

- [x] **Breadcrumb consistency** — Ensure every detail page has breadcrumbs for orientation
- [x] **Loading skeletons** — Use `Skeleton.tsx` consistently on every page during data fetch
- [x] **Empty states** — Design empty states with illustration + CTA for every list page ("No athletes yet — add your first one")
- [x] **Toast notifications** — Confirm every create/update/delete action with a success/error toast
- [x] **Accessibility pass** — Add `aria-labels`, focus rings, keyboard navigation to all interactive elements

### 1.2 Login Page Polish

- [x] **Password visibility toggle** (eye icon) — Standard usability pattern
- [x] **Loading state on submit** — Disable button + show spinner to prevent double-clicks
- [x] **"Remember me" checkbox** — Reduces friction for returning users
- [x] **Forgot password link** — Placeholder link that sets user expectations

### 1.3 Table & List Polish

- [x] **Avatar in athlete table rows** — Small circular avatar next to names for visual scanning
- [x] **Inline status indicators** — Color dot (green/yellow/red) next to athlete names based on risk level
- [x] **Sport icon/thumbnail** — Visual identity icons for each sport in lists
- [ ] **Athlete count badge on sports list** — Show athlete count per sport directly in the table (requires schema change)
- [ ] **Program status badges** — Active / Completed / Draft color-coded badges (requires schema change)
- [x] **Days lost counter on injuries** — Prominent display of total days lost per injury

### 1.4 Detail Page Polish

- [ ] **Recurrence flag on injuries** — Warning icon for re-injuries ("2nd hamstring strain in 6 months") (requires querying injury history)
- [x] **"Last updated" timestamp on dashboard** — Show sync time near the top for data trust

---

## Phase 2 — Core UX Upgrades

> **Goal:** Upgrade the most-used pages with meaningful layout and interaction improvements. These changes reshape how coaches interact with the platform daily.
>
> **Effort:** Medium | **Impact:** High | **Estimated scope:** ~18 tasks

### 2.1 Login Page Upgrade

- [x] **Split-screen layout** — Left: hero image/branded illustration (athlete silhouette, data viz). Right: login form. Stronger first impression.

### 2.2 Dashboard Enhancements

- [x] **Welcome banner** — "Good morning, [Name]" with today's date + summary ("3 athletes at-risk today")
- [x] **Quick actions row** — Shortcut buttons: "Log Load", "New Testing Session", "Record Injury". Reduces daily clicks by 50%+
- [x] **Sparklines in KPI cards** — Tiny inline 7-day trend charts inside each KPI card
- [ ] **Empty state design** — Onboarding prompts for new accounts: "Add your first athlete to get started" (covered by Phase 1 empty states)

### 2.3 Athletes Page Overhaul

- [x] **Card/Grid view toggle** — Grid view with athlete photo, name, sport, status badge. Coaches think visually about rosters.
- [x] **Status filter tabs** — Horizontal tabs: All | Active | Inactive. Faster than column filtering.

### 2.4 Athlete Detail Restructure

- [x] **Tabbed content area** — Replace long scroll with tabs: Overview | Load History | Testing Results | Injuries
- [x] **Comparison CTA** — "Compare with teammates" button linking to comparisons page pre-filtered

### 2.5 Sports Detail Upgrade

- [ ] **Metric grouping accordion** — Collapsible tree grouped by category with unit badges (already implemented in Phase 1)
- [ ] **"Add Metric" inline** — Add metrics directly from sport detail page without navigating away (already exists)

### 2.6 Load Monitoring Enhancements

- [x] **Weekly summary cards** — Weekly totals, averages, and trends displayed above the daily table
- [x] **Training load zones** — Visual bands: Recovery | Optimal | Overreach | Danger with current value highlighted

### 2.7 Testing Session Improvements

- [x] **Personal best indicator** — Star/badge when a trial exceeds previous best
- [x] **Visual trial entry** — Mini bar chart of Trial 1/2/3 updating as values are entered

### 2.8 Risk Page Upgrade

- [x] **Risk traffic light cards** — Athlete cards with green/yellow/red traffic light grouped by risk level
- [ ] **Risk history timeline** — Show how an athlete's risk changed over the past 30 days (requires historical data tracking)

---

## Phase 3 — Data Visualization & Insights

> **Goal:** Add signature visualizations that differentiate this platform. These are the "wow factor" features that make the product stand out.
>
> **Effort:** Medium-High | **Impact:** High | **Estimated scope:** ~14 tasks

### 3.1 Injury Body Map (Flagship Feature)

- [x] **SVG body map visualization** — Interactive human body diagram showing injury hotspots. Color intensity = frequency. Front + back view.
- [x] **Clickable body regions** — Click a region to filter the injuries table to that body part
- [x] **Body map on dashboard** — Compact version showing team-wide injury distribution

### 3.2 Load Monitoring Calendar

- [x] **Calendar heat map** — Month view, each day color-coded by load intensity (light green → dark red). GitHub contribution graph style.
- [x] **ACWR gauge widget** — Speedometer-style gauge showing athlete's current acute:chronic workload ratio on load entries

### 3.3 Analytics — Comparisons Upgrade

- [x] **Radar/Spider chart** — Multi-metric comparison (each axis = a metric). Shows athlete strengths/weaknesses at a glance.
- [x] **Percentile bands** — Box plot or violin plot showing where each athlete falls in team distribution
- [x] **Trend comparison** — Line charts showing how selected athletes' scores evolved over time (not just current snapshot)

### 3.4 Analytics — Risk Visualization

- [x] **Predictive risk score** — "Risk trajectory" arrow per athlete (improving / stable / worsening) based on recent load trends
- [x] **ACWR distribution enhancement** — Color-coded zones overlaid on existing distribution chart

### 3.5 Athlete Detail Analytics

- [x] **Return-to-play progress bar** — Visual tracker: Injury → Rehab → Cleared → Full Training (for injured athletes)
- [x] **Timeline/Activity feed** — Chronological feed: "Jan 15 — Load: RPE 7", "Jan 12 — Hamstring strain reported"

### 3.6 Settings Visualization

- [x] **Visual threshold preview** — Mock gauge/chart updating in real-time as thresholds are adjusted ("Here's what would be flagged")

---

## Phase 4 — Advanced Workflows

> **Goal:** Streamline multi-step processes and reduce repetitive work. These features save coaches significant time on daily and weekly tasks.
>
> **Effort:** High | **Impact:** Medium-High | **Estimated scope:** ~14 tasks

### 4.1 Batch Operations

- [x] **Bulk actions on athletes** — Checkbox selection + actions bar: "Assign to Program", "Change Status", "Export Selected"
- [x] **Batch load entry** — Spreadsheet-style grid for entire team: rows = athletes, columns = load fields. Enter all loads on one screen.

### 4.2 Testing Templates

- [ ] **Session template system** — Pre-configured test batteries (e.g., "Pre-Season Battery" = Vertical Jump + 40m Sprint + Yo-Yo). One-click setup.
- [x] **Session comparison** — Side-by-side view: current session vs. previous session for the same athlete
- [ ] **Normative data overlay** — Percentile rank against team/sport norms alongside raw scores

### 4.3 Injury Workflow

- [x] **Status pipeline (Kanban)** — Drag cards between columns: Active → Rehab → Monitoring → Resolved
- [ ] **Injury photos/attachments** — Upload scan images or medical documents per injury record

### 4.4 Program Management

- [x] **Progress indicator** — Progress bar showing week/phase (e.g., "Week 3 of 8")
- [x] **Calendar/schedule view** — Horizontal Gantt-style timeline for program duration
- [x] **Program templates** — "Duplicate Program" button for reusing common training structures

### 4.5 Data Export

- [x] **Global CSV/PDF export** — Export button on every table page
- [ ] **Athlete PDF report** — "Print Report" button on athlete detail generating a formatted PDF for medical staff
- [x] **Comparison snapshot export** — Save/share comparison views with coaching staff

### 4.6 Settings Expansion

- [x] **Grouped settings sections** — Accordion or sidebar tabs: General | Risk Thresholds | Notifications | Data Export | Team Management
- [x] **Reset to defaults** — Button to restore factory settings

---

## Phase 5 — Power Features & Personalization

> **Goal:** Add features for advanced users and personalization options. These make the platform feel tailored to each coach's workflow.
>
> **Effort:** High | **Impact:** Medium | **Estimated scope:** ~14 tasks

### 5.1 Theme System

- [ ] ~~**Dark/Light mode toggle**~~ — Removed (decided to keep light-only for consistency)
- [ ] ~~**Theme preference in profile**~~ — Removed with dark mode

### 5.2 Dashboard Customization

- [ ] **Draggable/reorderable widgets** — Coaches arrange dashboard charts in their preferred order
- [x] **Widget visibility toggles** — Customize button with per-widget Eye/EyeOff toggles, persisted

### 5.3 Navigation Enhancements

- [x] **Command palette (`Ctrl+K`)** — Quick search/navigation for power users: jump to any page, athlete, or action
- [x] **Mobile bottom navigation** — Fixed bottom tab bar with Dashboard | Athletes | Testing | Load | More

### 5.4 Profile & Account

- [ ] **Profile completeness bar** — "Your profile is 70% complete" to encourage filling out all fields
- [ ] **Activity log** — "Last login: 2 hours ago", "Last data sync: 15 min ago"

### 5.5 Testing Enhancements

- [x] **Stopwatch/timer integration** — Collapsible stopwatch on session detail with start/stop/lap/reset

### 5.6 Risk Customization

- [ ] **Per-athlete alert thresholds** — Custom risk thresholds per athlete instead of global-only
- [ ] **Risk alert configuration** — Choose which risk conditions trigger alerts

### 5.7 Programs

- [ ] **Drag-and-drop athlete enrollment** — Visual drag interface for adding/removing athletes from programs

### 5.8 Settings

- [ ] **Audit log** — "Threshold changed from 1.3 → 1.5 by Coach Smith on Jan 10"

### 5.9 Athlete Detail

- [ ] **Notes/Comments section** — Free-text notes per athlete ("Needs extra warm-up time", "Cleared by physio on Feb 1")

---

## Phase 6 — Collaboration & Communication

> **Goal:** Enable team-wide collaboration and external communication. These features transform the tool from single-user to team-oriented.
>
> **Effort:** High | **Impact:** Medium | **Estimated scope:** ~6 tasks

### 6.1 Notifications

- [x] **Notification preferences** — Persisted toggles for high risk, load spike, injury, and weekly digest alerts
- [x] **In-app notification center** — Enhanced dropdown with individual read/dismiss, clear all, click-to-navigate, persisted history

### 6.2 Onboarding

- [x] **First-time user onboarding tour** — 6-step spotlight tour highlighting dashboard areas, sidebar, and search. Restart in Settings.
- [x] **Contextual help tooltips** — HelpTip component on ACWR, Training Load, RPE, Load Spike across dashboard, load monitoring, analytics, and settings

### 6.3 Sharing

- [x] **Snapshot save/share** — Share button copies current dashboard URL (with filter params) to clipboard
- [x] **Scheduled reports** — Reports tab in Settings with frequency, recipients, section toggles, and live email preview

---

## Phase Summary

| Phase | Theme | Effort | Impact | Tasks |
|-------|-------|--------|--------|-------|
| **Phase 1** | Foundation & Polish | Low | High | ~20 |
| **Phase 2** | Core UX Upgrades | Medium | High | ~18 |
| **Phase 3** | Data Visualization & Insights | Medium-High | High | ~14 |
| **Phase 4** | Advanced Workflows | High | Medium-High | ~14 |
| **Phase 5** | Power Features & Personalization | High | Medium | ~14 |
| **Phase 6** | Collaboration & Communication | High | Medium | ~6 |
| | | | **Total** | **~86** |

---

## Implementation Notes

### Tech Stack Compatibility
All recommendations are achievable with the current stack: Next.js 16 + TypeScript + Tailwind v4 + Auth.js v5.

### New Dependencies to Consider

| Phase | Library | Purpose |
|-------|---------|---------|
| Phase 3 | `recharts` or `@nivo/radar` | Radar charts, calendar heatmaps |
| Phase 4 | `@dnd-kit/core` | Kanban boards, drag-and-drop |
| Phase 4 | `react-to-print` or `@react-pdf/renderer` | PDF report generation |
| Phase 5 | `cmdk` | Command palette (Ctrl+K) |
| Phase 5 | `next-themes` | Dark/light mode system |

### Key Principles
- **Each phase is shippable** — Deploy after completing any phase for immediate user value
- **Phase 1 is non-negotiable** — Polish and consistency must come before new features
- **Phases 3-6 can overlap** — Once Phase 2 is done, Phases 3-6 can be worked on in parallel if resources allow
- **Validate with users** — After Phase 2, gather coach feedback before committing to Phase 3-6 priorities

---

*Generated: February 2026*
