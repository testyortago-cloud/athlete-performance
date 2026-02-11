# DJP Athlete — Performance & Injury Monitoring Platform — Build Prompt

## Role

You are a senior full-stack developer building a production-ready athlete performance and injury monitoring web application. You write clean, maintainable code with proper error handling, TypeScript types, and clear component architecture. You follow best practices for Next.js app router patterns and build with scalability in mind. You have deep experience building interactive, data-rich dashboards similar to Power BI.

---

## Project Summary

Build a web application that allows administrators to manage athletes, define sports-specific performance metrics, capture testing trial data across sessions, monitor injuries and training load, and visualize trends and risk indicators.

The system must be dynamic and configurable so new sports, metrics, and testing formats can be added without code changes.

**The analytics and dashboard experience should feel like Power BI.** Every chart, table, and visualization should be interactive. Users should be able to filter, drill down, cross-filter between visuals, slice data dynamically, and explore their data without needing to write queries or ask a developer. The platform is not just a reporting tool. It's an interactive intelligence layer.

---

## Tech Stack (Strict)

- **Framework:** Next.js 16 (App Router, Server Components, Server Actions)
- **Language:** TypeScript (strict mode)
- **Auth:** NextAuth.js (NOT Supabase Auth) — credential-based admin login to start, structured for future OAuth providers
- **Primary Operational Database:** Airtable (data entry, athlete records, sport configs, metric definitions)
- **Analytics Database:** Supabase PostgreSQL (complex queries, aggregations, analytics views, historical comparisons)
- **ORM/Query:** Use Supabase JS client for PostgreSQL. Use Airtable REST API or `airtable` npm package for Airtable operations.
- **Styling:** Tailwind CSS
- **Charts:** Recharts (preferred for React integration and interactivity) — all charts must support click events, tooltips, and dynamic data updates
- **Deployment-ready:** Vercel-compatible

---

## Branding

The brand is **DJP Athlete**. The logo is a white "djp" wordmark with "ATHLETE" below it on a black background. The logo file will be provided as a PNG and should be placed in the header/sidebar. The overall aesthetic is bold, clean, minimal, and premium. Think high-end sports tech, not colorful SaaS.

---

## Application Layout (Dashboard Shell)

The app uses a fixed sidebar + top header layout. This is the structural foundation for the entire application. Every authenticated page renders inside this shell.

### Layout Structure

```
+----------------------------------------------------------+
| HEADER (fixed top, full width)                           |
+----------+-----------------------------------------------+
|          |                                               |
| SIDEBAR  |  MAIN CONTENT AREA                            |
| (fixed   |  (scrollable)                                 |
|  left)   |                                               |
|          |  +------------------------------------------+  |
|          |  | Page Header (title + actions)            |  |
|          |  +------------------------------------------+  |
|          |  | Filter Bar (on analytics pages)          |  |
|          |  +------------------------------------------+  |
|          |  | KPI Cards Row (on dashboard pages)       |  |
|          |  +------------------------------------------+  |
|          |  |                                          |  |
|          |  | Charts / Tables / Content                |  |
|          |  |                                          |  |
|          |  +------------------------------------------+  |
|          |                                               |
+----------+-----------------------------------------------+
```

### Header Bar

- **Position:** Fixed to top, spans full viewport width (sits above sidebar)
- **Height:** 64px
- **Background:** `#000000` (black)
- **Left section:** DJP Athlete logo (white version) aligned to the left, sitting above the sidebar width
- **Center/Right section:**
  - Global search bar (search athletes by name, quick access) — dark input field with subtle border, white text, light gray placeholder
  - Notification bell icon (white, for alerts like load spikes, risk flags) with a small white badge count
  - User avatar/initials dropdown (white text/icon) with: profile settings, logout
- **Bottom border:** None. The black header sits flush against the content.
- **Z-index:** Sits above sidebar and content

### Left Sidebar

- **Position:** Fixed to left, below the header
- **Width:** 260px expanded, 72px collapsed (icon-only mode)
- **Height:** Full viewport height minus header (calc(100vh - 64px))
- **Background:** `#000000` (black, matching header for a seamless dark left column)
- **Text/Icons:** `#999999` (muted gray) when inactive, `#FFFFFF` (white) for active/selected item
- **Toggle:** Collapse/expand button at the bottom of the sidebar (chevron icon, muted gray)
- **Collapsed state:** Shows only icons, with tooltip on hover showing the label
- **Transition:** Smooth width transition (200-300ms ease)
- **Divider:** A subtle `#1A1A1A` or `#222222` horizontal line separating nav groups

**Navigation Items (top to bottom):**

1. **Dashboard** (grid/home icon) — Main overview dashboard
2. **Athletes** (people icon) — Athlete list and profiles
3. **Sports** (trophy or activity icon) — Sport and metric configuration
4. **Testing** (clipboard/test icon) — Performance testing sessions
5. **Injuries** (medical cross icon) — Injury monitoring and logging
6. **Load Monitoring** (bar chart or weight icon) — RPE and training load
7. **Analytics** (chart/insights icon) — Advanced analytics and comparisons

**Bottom section of sidebar (pinned to bottom):**

8. **Settings** (gear icon) — App settings, threshold configs
9. **Collapse toggle** (chevron left/right icon)

**Nav item behavior:**
- Each item has an icon + label (label hidden when collapsed)
- Hover state: text/icon brightens to white, subtle background `#111111`
- Active state: left border bar in white (3px solid `#FFFFFF`), background `#111111`, icon and text fully white
- If a section has sub-pages (e.g., Analytics > Comparisons, Analytics > Risk), show expandable sub-nav items indented below the parent. Sub-nav collapses to a flyout menu when sidebar is collapsed.

### Main Content Area

- **Position:** To the right of sidebar, below header
- **Margin:** Left margin equals sidebar width (260px or 72px), top margin equals header height (64px)
- **Background:** `#F2F2F2` (light gray) — clean contrast against the dark sidebar and white cards
- **Padding:** 24px on all sides
- **Scrolling:** Content area scrolls independently. Header and sidebar stay fixed.
- **Max content width:** Full width for dashboard pages with lots of charts.

**Page Header (inside content area, top of each page):**
- Page title (e.g., "Dashboard", "Athletes", "Injury Monitoring") — bold, black text
- Breadcrumb trail for drill-down pages (e.g., Athletes > John Smith > Performance) — gray breadcrumb links, black current page
- Right-aligned action buttons where relevant (e.g., "+ Add Athlete", "Export CSV", "New Session") — black buttons with white text

### Responsive Behavior

- **Desktop (1280px+):** Full sidebar expanded by default
- **Tablet/Medium (768px - 1279px):** Sidebar collapsed by default (icon-only), can be expanded
- **Mobile (below 768px):** Sidebar hidden, hamburger menu in header to open sidebar as an overlay with backdrop. This is an admin tool so mobile is secondary, but it should not break.

### Layout Component Structure

```
/components/layout/
  AppShell.tsx          — Main layout wrapper (combines header, sidebar, content)
  Header.tsx            — Top header bar
  Sidebar.tsx           — Left sidebar navigation
  SidebarNavItem.tsx    — Individual nav item component
  SidebarSubNav.tsx     — Expandable sub-navigation
  PageHeader.tsx        — Per-page title + breadcrumbs + actions
  ContentArea.tsx       — Scrollable content wrapper
```

The `AppShell` component wraps all authenticated pages. The sidebar collapse state should be stored in Zustand and persist across page navigations. The sidebar width should be available as a CSS variable or context value so the content area adjusts smoothly.

---

## Design System & Color Palette

The identity is black and white. Minimal. Premium. Every color has a clear purpose. The UI should feel like a high-end sports analytics tool, not a generic SaaS dashboard.

### Colors

| Token              | Value     | Usage                                                     |
| ------------------ | --------- | --------------------------------------------------------- |
| `--color-black`    | `#000000` | Header, sidebar, primary buttons, headings, primary text  |
| `--color-white`    | `#FFFFFF` | Cards, active nav text/icons, button text on black         |
| `--color-surface`  | `#F2F2F2` | Main content area background                              |
| `--color-muted`    | `#F7F7F7` | Table alternating rows, input field backgrounds            |
| `--color-border`   | `#E0E0E0` | Card borders, dividers, table borders                     |
| `--color-gray-500` | `#999999` | Secondary text, inactive sidebar icons, placeholder text  |
| `--color-gray-700` | `#444444` | Body text (slightly softer than pure black for readability)|
| `--color-dark`     | `#111111` | Sidebar hover/active background, subtle dark accents       |
| `--color-success`  | `#22C55E` | Positive trends, good performance, improvement arrows     |
| `--color-warning`  | `#F59E0B` | Warning thresholds, moderate risk, caution indicators      |
| `--color-danger`   | `#EF4444` | High risk alerts, injury flags, negative trends, declines |

### Design Rules

- **No brand accent color.** The palette is strictly black, white, and grays. The only color comes from data-driven indicators (success green, warning amber, danger red). This keeps the interface clean and lets the data be the visual focus.
- **Cards are white** sitting on the `#F2F2F2` content background. Subtle border (`#E0E0E0`) or very light box shadow (`shadow-sm`). No heavy shadows.
- **Sidebar and header are solid black.** They blend together seamlessly forming an L-shape frame around the content.
- **Buttons:** Primary buttons are black with white text. Secondary/outline buttons are white with black border and black text. Hover states darken or lighten slightly.
- **Typography:** Inter font (or system sans-serif). Headings in `#000000` bold. Body text in `#444444`. Secondary/meta text in `#999999`.
- **Tables** inside white cards with alternating row backgrounds using `#F7F7F7`.
- **Charts:** Use a monochrome-first approach. Primary data series in `#000000`. Secondary series in `#999999`. Third series in `#CCCCCC`. Use success/warning/danger colors ONLY for data that has semantic meaning (good/bad/caution). This way, when you see color in a chart, it means something.
- **Interactive states:** Hover states use `#F7F7F7` background on light surfaces, `#111111` on dark surfaces. Focus rings in black.
- **KPI trend arrows** use green (up/good) and red (down/bad). The KPI value itself is black.
- **Conditional formatting** in tables uses subtle background tints of the status colors (light green, light amber, light red) rather than full saturation.

---

## Power BI-Style Dynamic Dashboard Requirements

This is a core requirement that should influence every analytics view in the application. The goal is to make the dashboards feel alive and explorable, not static.

### Global Filter Bar

Every analytics page should have a persistent filter bar below the page header with:
- **Date range picker** (preset ranges: last 7 days, 30 days, 90 days, this season, custom range)
- **Sport selector** (dropdown, multi-select)
- **Athlete selector** (searchable dropdown, multi-select)
- **Position filter** (dynamic based on selected sport)
- All filters apply globally to every visual on the page
- Filters persist in URL query params so dashboards are shareable/bookmarkable
- A "Clear All Filters" button and visual indicator showing active filter count
- The filter bar sits inside a white card with the same styling as other content cards

### Cross-Filtering Between Visuals

- Clicking a data point in one chart should filter all other charts on the same page
- Example: clicking a bar in "Injuries by Body Region" should filter the injury timeline, days lost chart, and athlete table to show only that body region
- Example: clicking an athlete's name in a ranking table should highlight that athlete's data across all charts
- Cross-filter state should be visually indicated (dimmed non-selected data with reduced opacity, highlighted selected data at full black)
- Click again or click empty space to clear the cross-filter

### Drill-Down Capability

- Charts should support drill-down where it makes sense
- Example: a "Performance by Sport" chart can drill into "Performance by Category" then into "Performance by Metric"
- Example: "Monthly Injury Count" can drill into "Weekly" then "Daily"
- Visual breadcrumb trail showing drill-down path (e.g., All Sports > Tennis > Speed > 5m Sprint)
- Back button or breadcrumb click to navigate up

### Interactive Tables

- All data tables should support:
  - Column sorting (click header to sort asc/desc)
  - Column filtering (text search, numeric range, dropdown for categorical)
  - Pagination or virtual scrolling for large datasets
  - Row click to drill into detail view
  - Conditional formatting (color-coded cells based on thresholds — subtle background tints, not full saturation)
  - Inline sparklines where relevant (e.g., mini trend line next to an athlete's metric value, drawn in black)

### KPI Cards

- Summary KPI cards at the top of dashboard pages (total athletes, active injuries, avg training load, etc.)
- Each KPI card is a white card on the `#F2F2F2` background
- Each KPI card should show:
  - Current value (large, bold, black)
  - Trend indicator (up/down arrow — green for positive, red for negative, with percentage change)
  - Comparison period label (vs last week, vs last month) in gray text
  - Subtle icon in `#999999` representing the KPI type
  - Click to drill into detail view for that KPI
- KPI values update dynamically when filters change

### Dynamic Chart Types

The system should render the right chart type for the data context:
- **Line charts** for trends over time (performance metrics, load over time)
- **Bar charts** for comparisons (athlete vs athlete, metric rankings)
- **Stacked bar charts** for composition (injury types breakdown, load by session type)
- **Heatmaps** for matrix views (athletes x metrics performance levels)
- **Scatter plots** for correlations (load vs injury frequency)
- **Gauge/radial charts** for single-value indicators (acute:chronic ratio, risk score)
- **Area charts** for cumulative data (total days lost over time)
- All charts sit inside white cards with a card title, and must have: interactive tooltips (white tooltip with black text and subtle shadow), legend toggle (click legend item to show/hide series), smooth animations on data change, responsive sizing
- Chart color scheme: black primary, gray secondary, status colors only when data is semantic

### Slicer Controls

In addition to the global filter bar, individual dashboard sections can have local slicers:
- Metric selector (choose which metric to display in a chart)
- Time granularity toggle (daily / weekly / monthly)
- Comparison toggle (show/hide benchmark lines, averages, or targets)
- View mode toggle (absolute values vs percentage change vs z-scores)

### Dashboard State Management

- Use Zustand for dashboard filter/interaction state (sidebar collapse state, global filters, cross-filter selections)
- All filter changes should trigger efficient re-fetches (debounced, with loading indicators)
- Charts should show skeleton loaders (light gray pulsing blocks) while data is loading, not blank space
- Optimistic state updates where possible
- URL-based state so users can share or bookmark a specific dashboard view with filters applied

---

## Database Architecture

### Airtable (Operational Data)

Used for day-to-day data entry and management. Tables:

- **Athletes** — id, name, date_of_birth, sport_id, position, status (active/inactive), created_at
- **Sports** — id, name, description, created_at
- **Metric_Categories** — id, sport_id, name (e.g., "Speed", "Power", "Strength"), sort_order
- **Metrics** — id, category_id, sport_id, name (e.g., "5m Sprint", "CMJ"), unit, is_derived, formula, best_score_method (highest/lowest), trial_count (default 3), created_at
- **Testing_Sessions** — id, athlete_id, date, notes, created_by
- **Trial_Data** — id, session_id, metric_id, trial_1, trial_2, trial_3, best_score (auto-calculated), average_score (auto-calculated), created_at
- **Injuries** — id, athlete_id, type (injury/illness), description, mechanism, body_region, date_occurred, date_resolved, days_lost (auto-calculated), status (active/resolved)
- **Daily_Load** — id, athlete_id, date, rpe (1-10), duration_minutes, training_load (auto: rpe x minutes), session_type

### Supabase PostgreSQL (Analytics Layer)

Mirrors/syncs relevant data from Airtable for complex queries. Additional tables/views:

- **athlete_performance_history** — flattened view for trend queries
- **load_weekly_summary** — weekly aggregations of training load per athlete
- **training_monotony** — calculated as weekly_avg_load / weekly_std_dev
- **training_strain** — calculated as weekly_total_load x monotony
- **injury_load_correlation** — view joining injury events with preceding load data
- **performance_comparisons** — view for athlete vs athlete or position-based comparisons
- **dashboard_aggregations** — pre-computed materialized views for KPI cards and summary stats to keep dashboard loads fast

### Sync Strategy

- Airtable is the source of truth for operational data
- A sync function (API route or cron job) pushes data from Airtable to Supabase PostgreSQL on a schedule or triggered after data entry
- Analytics queries always hit Supabase
- Write operations go to Airtable first, then sync
- Materialized views in Supabase refresh on sync for fast dashboard queries

---

## Feature Breakdown

### Phase 1: Foundation

**Auth & Layout Shell**
- NextAuth.js with credentials provider (email/password for admin)
- Protected routes via middleware
- Build the full AppShell layout: black fixed header with DJP Athlete logo, black collapsible sidebar, `#F2F2F2` content area
- Sidebar navigation with all nav items (Dashboard, Athletes, Sports, Testing, Injuries, Load Monitoring, Analytics)
- Sidebar collapse/expand with smooth transition and state persistence
- Global search in header (dark input, white text, can be placeholder initially)
- Notification bell in header (white icon, placeholder with badge)
- User dropdown in header (white text, profile, logout)
- PageHeader component with title, breadcrumbs, and action button slots
- Role field in user model (admin, coach, athlete) — only admin functional now
- Set up Zustand store for: sidebar state, global filter state (ready for Phase 3)

**Athlete Management**
- CRUD for athletes
- Assign athlete to a sport
- Athlete list inside a white card with interactive table (sorting, filtering, search)
- Athlete profile page (hub for all their data, tabbed or sectioned layout)

**Sport & Metric Configuration**
- CRUD for sports
- CRUD for metric categories per sport
- CRUD for individual metrics within categories
- Configure per metric: unit, number of trials, best score method (highest/lowest), whether it's derived
- Support for derived metrics with formula definitions (e.g., COD Deficit = 505 COD time - 10m sprint time)

### Phase 2: Data Capture

**Performance Testing**
- Create a testing session for an athlete (date + notes)
- For each session, display all metrics for that athlete's sport grouped by category
- Input fields for Trial 1, Trial 2, Trial 3 per metric
- Auto-calculate best score based on metric config
- Auto-calculate average score
- Auto-calculate derived metrics
- Save all raw trial data
- View past sessions with full trial history

**Injury Monitoring**
- Log injury or illness for an athlete
- Fields: type, description, mechanism, body region, date occurred, date resolved
- Auto-calculate days lost
- Track injury status (active/resolved)
- Injury history list per athlete

**Load Monitoring**
- Daily RPE entry per athlete (1-10 scale)
- Duration in minutes
- Auto-calculate training load (RPE x duration)
- Calendar or list view of daily entries
- Weekly summaries

### Phase 3: Analytics & Intelligence (Power BI-Style)

This is where the Power BI-style interactivity becomes the star. Every view described below must implement the dynamic dashboard requirements (global filters, cross-filtering, drill-down, interactive tables, KPI cards). All charts and tables sit inside white cards on the `#F2F2F2` content background. Charts use the monochrome-first color approach.

**Main Analytics Dashboard**
- KPI cards row: total athletes, active injuries, avg team load this week, highest risk athlete
- Performance overview chart (filterable by sport, metric, time range)
- Injury overview chart (by type, body region, with drill-down to individual athletes)
- Load overview chart (team average with individual athlete overlay on click)
- Recent alerts panel (load spikes, threshold breaches)
- All visuals cross-filter each other
- Dashboard grid layout (2-3 columns of chart cards)

**Athlete Profile Dashboard**
- Performance trend line charts per metric over time (with metric slicer to switch between metrics)
- Injury timeline (visual bar showing injury periods, clickable to see details)
- Load monitoring chart (daily load, weekly totals, with time granularity toggle)
- Training monotony and strain trend lines
- Personal KPI cards (best scores, injury count, avg load, risk score)
- Date range filtering
- Export to CSV

**Advanced Calculations**
- Repeated Sprint Ability % decrement: ((total sprint time - ideal sprint time) / ideal sprint time) x 100
- Training Monotony: weekly average daily load / standard deviation of daily load
- Training Strain: weekly total load x monotony
- Percent change between testing sessions per metric
- Injury vs training load correlation display (scatter plot with clickable data points)

**Risk & Alert Logic**
- Load spike detection: flag when acute:chronic workload ratio exceeds threshold (e.g., >1.5)
- Injury risk indicator based on strain trends exceeding configurable thresholds
- Visual alerts on athlete dashboard when thresholds are breached (red-tinted card borders or backgrounds)
- Configurable threshold values per sport or globally
- Risk score gauge chart per athlete
- Risk overview table with conditional formatting (subtle green/amber/red row tints)

**Comparative Views**
- Compare 2+ athletes side by side on selected metrics (dynamic athlete selector)
- Position-based comparison (filter athletes by position within a sport)
- Ranking table: rank athletes by any metric (best score from latest session), with conditional formatting and inline sparklines
- Performance heatmap: athletes x metrics matrix with grayscale intensity (darker = better) plus red/green for above/below threshold
- Injury frequency report: which athletes have the most injuries, most days lost (bar chart with drill-down)
- Days lost analytics by body region, sport, time period (stacked bar with cross-filtering)

### Phase 4: Polish & Prep for Scale

**Optimization**
- API abstraction layer: all Airtable and Supabase calls go through service modules, not directly in components
- Proper error boundaries and loading states
- Data validation on all inputs
- Optimistic UI updates where appropriate
- Dashboard query optimization: use Supabase materialized views, proper indexing, and debounced filter updates

**Future-Proofing (Structure Only, Don't Build the UI)**
- Database schema supports athlete and coach user roles
- Row-level security policies in Supabase ready for athlete-specific data access
- Schema supports: athlete self-service RPE entry, PRS (perceived recovery status) submission, wellness tracking fields
- These features are NOT built yet, but the data model should accommodate them without migration

---

## Code Quality Standards

- All components in TypeScript with proper interfaces/types
- Separate concerns: `/lib/airtable.ts`, `/lib/supabase.ts`, `/lib/auth.ts` for service modules
- `/stores/` directory for Zustand stores (dashboardStore, sidebarStore)
- `/hooks/useDashboardFilters.ts` custom hook for managing global filter state
- `/components/layout/` for AppShell, Header, Sidebar, PageHeader, ContentArea
- `/components/charts/` for reusable chart wrapper components that handle cross-filtering, tooltips, and loading states consistently
- `/components/dashboard/` for KPI cards, filter bar, and slicer components
- `/components/tables/` for the reusable interactive table component (sorting, filtering, conditional formatting)
- Server actions for mutations where appropriate
- Client components only when interactivity is needed (most dashboard components will be client components)
- Proper loading.tsx and error.tsx files per route
- Environment variables for all API keys and secrets (provide a .env.example)
- Consistent file/folder naming conventions
- Comments on complex logic (calculations, sync functions, cross-filter logic)

---

## How to Work

1. Start with Phase 1. Get the foundation solid before moving on.
2. After each phase, summarize what was built and confirm before proceeding.
3. If you need to make an architectural decision not covered here, explain your reasoning and ask before proceeding.
4. Keep files modular. Don't put everything in one massive component.
5. When building database schemas, provide both the Airtable table structure AND the Supabase SQL schema/migration.
6. When building dashboard components, create reusable chart wrappers first, then compose dashboards from them. Don't rebuild interactivity logic for every chart.
7. The layout shell (AppShell, Header, Sidebar) should be built first in Phase 1 and be pixel-solid before moving to features.

---

## Start

Begin with Phase 1: Set up the Next.js 16 project structure, configure NextAuth.js, and build the full layout shell first (AppShell with black fixed header showing the DJP Athlete logo, black collapsible sidebar with all nav items and proper active/hover states, and the light gray content area). Get the layout looking right before moving to CRUD features. Then implement the Athlete and Sport management CRUD. Provide the Airtable table definitions and Supabase SQL schema for the foundation tables. Also set up the Zustand stores (sidebar state, filter state) and the reusable component structure so they're ready for later phases.