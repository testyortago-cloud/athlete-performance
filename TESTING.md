# DJP Athlete Performance Platform — Testing Guide

> Complete testing checklist from setup to full coverage.
> Last updated: 2026-02-12

---

## Table of Contents

1. [Environment Setup](#1-environment-setup)
2. [Airtable Schema Verification](#2-airtable-schema-verification)
3. [Seed Data](#3-seed-data)
4. [Authentication Testing](#4-authentication-testing)
5. [Dashboard Pages](#5-dashboard-pages)
6. [Athletes Module](#6-athletes-module)
7. [Sports Module](#7-sports-module)
8. [Training Programs Module](#8-training-programs-module)
9. [Testing Sessions Module](#9-testing-sessions-module)
10. [Injuries Module](#10-injuries-module)
11. [Load Monitoring Module](#11-load-monitoring-module)
12. [Analytics Module](#12-analytics-module)
13. [Settings Page](#13-settings-page)
14. [Profile Page](#14-profile-page)
15. [Public Shareable Profile](#15-public-shareable-profile)
16. [API Endpoints](#16-api-endpoints)
17. [Global UI Components](#17-global-ui-components)
18. [Responsive / Mobile Testing](#18-responsive--mobile-testing)
19. [Automated Unit Tests](#19-automated-unit-tests)
20. [Performance & Edge Cases](#20-performance--edge-cases)
21. [Known Limitations](#21-known-limitations)

---

## 1. Environment Setup

### Prerequisites

| Requirement   | Version   |
| ------------- | --------- |
| Node.js       | >= 18     |
| npm           | >= 9      |
| Airtable Base | configured |
| Supabase      | configured |

### Steps

```bash
# 1. Clone the repo
git clone <repo-url> && cd athlete-performance

# 2. Install dependencies
npm install

# 3. Create .env.local with these variables:
#    AUTH_SECRET=<random-32-char-string>
#    AUTH_URL=http://localhost:3000
#    AIRTABLE_API_KEY=<your-api-key>
#    AIRTABLE_BASE_ID=<your-base-id>
#    NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
#    NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
#    SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# 4. Seed users and sample data
npx tsx src/scripts/seed-users.ts
npx tsx src/scripts/seed.ts

# 5. Start dev server
npm run dev
# Default: http://localhost:3000
```

### Quick Smoke Test

- [ ] Dev server starts without errors
- [ ] `http://localhost:3000` redirects to `/login`
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Unit tests pass (`npm test`)

---

## 2. Airtable Schema Verification

Ensure all 11 tables exist with the correct fields.

### Users

| Field        | Type          | Required |
| ------------ | ------------- | -------- |
| Name         | Single line   | Yes      |
| Email        | Email         | Yes      |
| PasswordHash | Single line   | Yes      |
| Role         | Single select | Yes      |

**Role options:** `admin`, `coach`, `athlete`

### Athletes

| Field       | Type            | Required |
| ----------- | --------------- | -------- |
| Name        | Single line     | Yes      |
| DateOfBirth | Date            | No       |
| Sport       | Link (Sports)   | No       |
| SportName   | Rollup/Lookup   | No       |
| Program     | Link (Training_Programs) | No |
| ProgramName | Rollup/Lookup   | No       |
| Position    | Single line     | No       |
| Status      | Single select   | Yes      |
| Notes       | Long text       | No       |
| Photo       | Attachment      | No       |
| Created     | Created time    | Auto     |

**Status options:** `Active`, `Injured`, `Inactive`

### Sports

| Field       | Type        | Required |
| ----------- | ----------- | -------- |
| Name        | Single line | Yes      |
| Description | Long text   | No       |
| Created     | Created time| Auto     |

### Training_Programs

| Field         | Type        | Required |
| ------------- | ----------- | -------- |
| Name          | Single line | Yes      |
| Description   | Long text   | No       |
| StartDate     | Date        | No       |
| DurationWeeks | Number      | No       |
| Created       | Created time| Auto     |

### Metric_Categories

| Field     | Type           | Required |
| --------- | -------------- | -------- |
| Sport     | Link (Sports)  | Yes      |
| Name      | Single line    | Yes      |
| SortOrder | Number         | No       |

### Metrics

| Field           | Type                    | Required |
| --------------- | ----------------------- | -------- |
| Category        | Link (Metric_Categories)| Yes      |
| Sport           | Link (Sports)           | Yes      |
| Name            | Single line             | Yes      |
| Unit            | Single line             | No       |
| IsDerived       | Checkbox                | No       |
| Formula         | Single line             | No       |
| BestScoreMethod | Single select           | Yes      |
| TrialCount      | Number                  | Yes      |
| Created         | Created time            | Auto     |

**BestScoreMethod options:** `highest`, `lowest`

### Testing_Sessions

| Field       | Type                    | Required |
| ----------- | ----------------------- | -------- |
| Athlete     | Link (Athletes)         | Yes      |
| AthleteName | Rollup/Lookup           | No       |
| Date        | Date                    | Yes      |
| Notes       | Long text               | No       |
| CreatedBy   | Single line             | No       |
| Created     | Created time            | Auto     |

### Trial_Data

| Field        | Type                      | Required |
| ------------ | ------------------------- | -------- |
| Session      | Link (Testing_Sessions)   | Yes      |
| Metric       | Link (Metrics)            | Yes      |
| Trial_1      | Number                    | No       |
| Trial_2      | Number                    | No       |
| Trial_3      | Number                    | No       |
| BestScore    | Number                    | No       |
| AverageScore | Number                    | No       |

### Injuries

| Field        | Type            | Required |
| ------------ | --------------- | -------- |
| Athlete      | Link (Athletes) | Yes      |
| AthleteName  | Rollup/Lookup   | No       |
| Type         | Single select   | Yes      |
| Description  | Long text       | No       |
| Mechanism    | Single line     | No       |
| BodyRegion   | Single select   | Yes      |
| DateOccurred | Date            | Yes      |
| DateResolved | Date            | No       |
| DaysLost     | Number          | No       |
| Status       | Single select   | Yes      |
| Created      | Created time    | Auto     |

**Type options:** `Injury`, `Illness`
**Status options:** `Active`, `Resolved`, `Rehab`, `Monitoring`
**BodyRegion options:** `Head`, `Neck`, `Shoulder`, `Upper Back`, `Lower Back`, `Chest`, `Abdomen`, `Hip`, `Groin`, `Upper Leg`, `Knee`, `Lower Leg`, `Ankle`, `Foot`, `Upper Arm`, `Elbow`, `Forearm`, `Wrist`, `Hand`

### Daily_Load

| Field           | Type            | Required |
| --------------- | --------------- | -------- |
| Athlete         | Link (Athletes) | Yes      |
| AthleteName     | Rollup/Lookup   | No       |
| Date            | Date            | Yes      |
| RPE             | Number          | Yes      |
| DurationMinutes | Number          | Yes      |
| TrainingLoad    | Number          | Auto     |
| SessionType     | Single select   | No       |
| Created         | Created time    | Auto     |

**SessionType options:** `Training`, `Match`, `Recovery`, `Conditioning`

> **Note:** `TrainingLoad` is auto-computed as `RPE * DurationMinutes`.

### Settings

| Field    | Type        | Required |
| -------- | ----------- | -------- |
| Category | Single line | Yes      |
| Key      | Single line | Yes      |
| Value    | Single line | Yes      |

---

## 3. Seed Data

### Seed Users

```bash
npx tsx src/scripts/seed-users.ts
```

Creates default accounts:

| Email              | Password   | Role  |
| ------------------ | ---------- | ----- |
| admin@djp.com      | admin123   | admin |
| coach@djp.com      | coach123   | coach |
| athlete@djp.com    | athlete123 | athlete |

> Passwords may differ — check `src/scripts/seed-users.ts` for exact values.

### Seed Sample Data

```bash
npx tsx src/scripts/seed.ts
```

Populates Athletes, Sports, Metrics, Testing Sessions, Trial Data, Daily Loads, Injuries, and Programs with sample records.

### Purge Data

```bash
npx tsx src/scripts/purge.ts
```

Removes all records from all tables. **Use with caution.**

---

## 4. Authentication Testing

**Route:** `/login`

### Login Flow

- [ ] Page renders with email and password fields
- [ ] Empty submit shows validation errors
- [ ] Invalid email format shows error
- [ ] Wrong password shows "Invalid credentials" error
- [ ] Correct credentials redirect to `/dashboard`
- [ ] Session persists after page refresh

### Middleware Protection

- [ ] Unauthenticated visit to `/dashboard` redirects to `/login`
- [ ] Unauthenticated visit to `/athletes` redirects to `/login`
- [ ] Unauthenticated visit to `/p/<id>` works (public route)
- [ ] Unauthenticated visit to `/api/auth/*` works (auth endpoints)
- [ ] After sign-out, protected routes redirect to `/login`

### Sign Out

- [ ] Sign-out button in header works
- [ ] Session is cleared after sign-out
- [ ] Redirects to `/login`

---

## 5. Dashboard Pages

**Route:** `/dashboard`

### Main Dashboard

- [ ] Page loads without errors
- [ ] KPI cards display (Active Athletes, Active Injuries, Avg Load 7d, Sessions This Month)
- [ ] KPI values match Airtable data
- [ ] Load trend chart renders correctly
- [ ] Injury summary charts render (by body region, by type)
- [ ] Risk alerts panel shows athletes with high/moderate ACWR
- [ ] Filter bar works (date range, sport filter)
- [ ] Dashboard is responsive on mobile

---

## 6. Athletes Module

### Athletes List

**Route:** `/athletes`

- [ ] Table displays all athletes with columns: Name, Sport, Position, Status, Created
- [ ] Search by name filters results in real time
- [ ] Filter by sport works
- [ ] Filter by status (Active/Injured/Inactive) works
- [ ] Pagination works (if > 10 records)
- [ ] Column sorting works
- [ ] Click on athlete row navigates to detail page
- [ ] "Add Athlete" button opens create form
- [ ] Empty state shown when no athletes exist

### Create Athlete

- [ ] Form fields: Name, Date of Birth, Sport (dropdown), Program (dropdown), Position, Status, Photo, Notes
- [ ] Name is required — blank submit shows validation error
- [ ] Sport dropdown populates from Airtable Sports table
- [ ] Program dropdown populates from Training_Programs table
- [ ] Photo upload works (Supabase storage)
- [ ] Successful creation redirects to athlete list
- [ ] New athlete appears in Airtable

### Athlete Detail

**Route:** `/athletes/[id]`

- [ ] Hero profile card renders with avatar, name, sport, position, status
- [ ] Quick stats display (Load Entries, Test Sessions, Days Injury-Free, ACWR)
- [ ] Risk ring color matches ACWR risk level (green/amber/red)
- [ ] Risk alert banner shows for moderate/high risk athletes
- [ ] Action buttons work: Share, Compare, Edit, Export, Delete

#### Tabs

**Overview Tab:**
- [ ] Analytics cards render (ACWR, Avg RPE, Total Days Lost, Test Sessions)
- [ ] Performance trend chart renders
- [ ] Training load chart renders
- [ ] Bio sidebar shows Date of Birth, Sport, Program, Position, Status
- [ ] Injury summary shows in sidebar
- [ ] Notes section displays athlete notes
- [ ] Activity timeline shows recent events

**Load History Tab:**
- [ ] Summary strip (Sessions, Avg RPE, Total Load)
- [ ] Load entries listed with date, RPE, duration, session type
- [ ] Load magnitude bars display correctly
- [ ] Chronological order (newest first)

**Testing Tab:**
- [ ] Testing sessions listed with date badges
- [ ] Session details show trial data
- [ ] Click through to testing session detail works

**Injuries Tab:**
- [ ] Injuries listed with colored left borders (red=active, green=resolved)
- [ ] Injury details show type, body region, dates, days lost
- [ ] Click through to injury detail works

### Edit Athlete

- [ ] Edit button opens form pre-filled with current data
- [ ] Changes save correctly to Airtable
- [ ] Redirects back after save

### Delete Athlete

- [ ] Delete button shows confirmation dialog
- [ ] Confirming deletes from Airtable
- [ ] Redirects to athletes list

### Share Profile

- [ ] Share button copies public URL (`/p/<id>`) to clipboard
- [ ] Toast notification confirms copy
- [ ] Copied URL opens public profile page

---

## 7. Sports Module

### Sports List

**Route:** `/sports`

- [ ] Table displays all sports with columns: Name, Description, Created
- [ ] Search works
- [ ] Click navigates to sport detail
- [ ] "Add Sport" button works

### Sport Detail

**Route:** `/sports/[id]`

- [ ] Sport info displays correctly
- [ ] Associated metric categories listed
- [ ] Metrics within each category listed
- [ ] Can add/edit/delete metric categories
- [ ] Can add/edit/delete metrics within categories

### Create / Edit / Delete Sport

- [ ] Create form validates Name is required
- [ ] Edit form pre-fills current data
- [ ] Delete shows confirmation, removes from Airtable

### Metric Categories

- [ ] Create category with Name and SortOrder
- [ ] Edit category
- [ ] Delete category (and associated metrics)

### Metrics

- [ ] Create metric with: Name, Unit, BestScoreMethod, TrialCount, IsDerived, Formula
- [ ] BestScoreMethod dropdown: `highest` or `lowest`
- [ ] TrialCount is a number (1-3)
- [ ] Edit metric pre-fills correctly
- [ ] Delete metric works

---

## 8. Training Programs Module

### Programs List

**Route:** `/programs`

- [ ] Table lists all programs
- [ ] Search works
- [ ] Click navigates to program detail

### Program Detail

**Route:** `/programs/[id]`

- [ ] Displays Name, Description, Start Date, Duration
- [ ] Lists assigned athletes (if any)

### CRUD Operations

- [ ] Create: Name required, Description optional, StartDate optional, DurationWeeks optional
- [ ] Edit: Pre-fills correctly
- [ ] Delete: Confirmation dialog, removes from Airtable

---

## 9. Testing Sessions Module

### Testing Sessions List

**Route:** `/testing`

- [ ] Table displays sessions with: Athlete Name, Date, Notes, Created
- [ ] Search/filter works
- [ ] Click navigates to session detail
- [ ] "New Session" button navigates to `/testing/new`

### Create Testing Session

**Route:** `/testing/new`

- [ ] Select athlete (required)
- [ ] Select date (required)
- [ ] Add notes (optional)
- [ ] After creating session, redirect to session detail to enter trial data
- [ ] CreatedBy is auto-set to current user

### Testing Session Detail

**Route:** `/testing/[id]`

- [ ] Session info displays (athlete, date, notes)
- [ ] Metrics grouped by category display
- [ ] For each metric, trial input fields match TrialCount (1-3 fields)
- [ ] Entering trial values auto-computes BestScore and AverageScore
- [ ] BestScore uses correct method (highest vs lowest)
- [ ] Save trial data persists to Airtable Trial_Data table
- [ ] Can edit existing trial values
- [ ] Can delete session

### Computed Fields Verification

- [ ] BestScore (highest): `max(Trial_1, Trial_2, Trial_3)` for non-null values
- [ ] BestScore (lowest): `min(Trial_1, Trial_2, Trial_3)` for non-null values
- [ ] AverageScore: `avg(Trial_1, Trial_2, Trial_3)` for non-null values

---

## 10. Injuries Module

### Injuries List

**Route:** `/injuries`

- [ ] Table with: Athlete, Type, Body Region, Status, Date Occurred, Days Lost
- [ ] Search by athlete name works
- [ ] Filter by status (Active/Resolved/Rehab/Monitoring)
- [ ] Click navigates to injury detail

### Injury Detail

**Route:** `/injuries/[id]`

- [ ] All fields display correctly
- [ ] Days Lost is auto-computed from DateOccurred and DateResolved
- [ ] Active injuries show no DateResolved

### Create Injury

- [ ] Athlete selection (required)
- [ ] Type: Injury or Illness (required)
- [ ] Body Region dropdown with all options (required)
- [ ] DateOccurred (required)
- [ ] DateResolved (optional)
- [ ] Status: Active, Resolved, Rehab, Monitoring (required)
- [ ] Description, Mechanism (optional)
- [ ] DaysLost auto-computed on save

### Edit / Delete Injury

- [ ] Edit pre-fills all fields
- [ ] Changing DateResolved recomputes DaysLost
- [ ] Delete shows confirmation

### Computed Fields Verification

- [ ] DaysLost = `(DateResolved - DateOccurred)` in days, or `(Today - DateOccurred)` if no DateResolved
- [ ] Only computed when DateOccurred is present

---

## 11. Load Monitoring Module

### Load Monitoring List

**Route:** `/load-monitoring`

- [ ] Table with: Athlete, Date, RPE, Duration, Training Load, Session Type
- [ ] Search/filter by athlete works
- [ ] Sorted by date (newest first)
- [ ] Click navigates to detail

### Load Entry Detail

**Route:** `/load-monitoring/[id]`

- [ ] All fields display correctly
- [ ] Training Load shows computed value

### Create Load Entry

- [ ] Athlete selection (required)
- [ ] Date (required)
- [ ] RPE: 1-10 scale (required)
- [ ] Duration in minutes (required)
- [ ] Session Type: Training, Match, Recovery, Conditioning (optional)
- [ ] Training Load auto-computed on save

### Edit / Delete

- [ ] Edit pre-fills correctly
- [ ] Changing RPE or Duration recomputes Training Load
- [ ] Delete shows confirmation

### Computed Fields Verification

- [ ] TrainingLoad = `RPE * DurationMinutes`
- [ ] RPE must be 1-10
- [ ] Duration must be > 0

---

## 12. Analytics Module

### Athlete Comparisons

**Route:** `/analytics/comparisons`

- [ ] Select 2+ athletes to compare
- [ ] Select metric to compare
- [ ] Chart renders comparison data
- [ ] Rankings table shows athletes ordered by metric score
- [ ] Empty state when no data available

### Risk Assessment

**Route:** `/analytics/risk`

- [ ] Risk indicator cards for each athlete
- [ ] ACWR gauge visualization
- [ ] Risk level classification: Low (<=1.3), Moderate (>1.3-1.5), High (>1.5)
- [ ] Trajectory indicator (increasing/decreasing/stable)
- [ ] Risk alerts list
- [ ] Filtering by sport works

### ACWR Calculation Verification

- [ ] Acute Load = sum of last 7 days' training loads
- [ ] Chronic Load = average weekly training load over 28 days
- [ ] ACWR = Acute Load / Chronic Load
- [ ] Handle division by zero (0 chronic load = ACWR of 0)
- [ ] Risk thresholds configurable via Settings

---

## 13. Settings Page

**Route:** `/settings`

### Threshold Settings

- [ ] ACWR thresholds display with current values
- [ ] Default values: moderate=1.3, high=1.5
- [ ] Can edit threshold values
- [ ] Save persists to Airtable Settings table
- [ ] New thresholds reflected in risk calculations

### Report Preferences

- [ ] Report format preferences available
- [ ] Report preview section works

---

## 14. Profile Page

**Route:** `/profile`

- [ ] Displays current user info (name, email, role)
- [ ] Profile information matches Airtable Users record

---

## 15. Public Shareable Profile

**Route:** `/p/[id]`

### Access

- [ ] Accessible WITHOUT authentication
- [ ] Direct URL access works
- [ ] Invalid ID shows 404 page
- [ ] SEO metadata generates correctly (title = "Athlete Name — DJP Athlete Profile")

### Visual Design

- [ ] Fixed glassmorphic navigation bar at top
- [ ] DJP logo and Share button in nav
- [ ] Dark hero section with radial gradient glow
- [ ] Large avatar (128px) with gradient risk ring
- [ ] Athlete name in large text
- [ ] Sport, position, program displayed as meta info
- [ ] Status and risk level pill badges
- [ ] Glass morphism stat cards (ACWR, Avg RPE, Days Lost, Injury-Free)
- [ ] Curved white transition to content section

### Content Sections

- [ ] Performance Trends chart renders with data
- [ ] Training Load chart renders with data
- [ ] Bio grid displays athlete info with icons
- [ ] Injury Summary mini-stats display
- [ ] Activity timeline shows last 6 events
- [ ] Branded footer with generation timestamp

### Share Functionality

- [ ] Share button copies current URL to clipboard
- [ ] "Copied!" feedback shows briefly then reverts
- [ ] Copied URL works in new browser/incognito window

### Data Accuracy

- [ ] ACWR value matches dashboard value
- [ ] RPE average matches dashboard calculation
- [ ] Days Lost total matches injury records
- [ ] Injury-Free calculation is correct (days since last active injury)
- [ ] Performance trends match testing session data
- [ ] Load trends match daily load data

---

## 16. API Endpoints

### POST `/api/auth/[...nextauth]`

- [ ] Login with valid credentials returns session
- [ ] Login with invalid credentials returns error
- [ ] GET returns session info when authenticated

### GET `/api/athletes-search?q=<query>`

- [ ] Returns filtered athletes matching query
- [ ] Response includes `id`, `name`, `sportName`
- [ ] Empty query returns all athletes
- [ ] Requires authentication

### POST `/api/sync`

- [ ] Triggers Airtable → Supabase sync
- [ ] Returns record counts per table
- [ ] Requires admin role
- [ ] Non-admin gets 403 Forbidden

---

## 17. Global UI Components

### Sidebar Navigation

- [ ] All menu items present: Dashboard, Athletes, Sports, Programs, Testing, Injuries, Load Monitoring, Analytics (with sub-items), Settings
- [ ] Active route highlighted
- [ ] Sub-navigation expands/collapses (Analytics → Comparisons, Risk)
- [ ] Sidebar collapses on mobile
- [ ] Sidebar toggle works

### Header

- [ ] Search icon / Command Palette trigger (Ctrl+K / Cmd+K)
- [ ] User avatar and name display
- [ ] Sign-out option accessible
- [ ] Responsive on mobile

### Command Palette

- [ ] Opens with Ctrl+K / Cmd+K
- [ ] Search across routes and athletes
- [ ] Keyboard navigation (arrow keys, Enter)
- [ ] Escape closes palette
- [ ] Results link to correct pages

### Mobile Bottom Navigation

- [ ] Shows on mobile screens
- [ ] Core navigation items accessible
- [ ] Active state matches current route

### Toast Notifications

- [ ] Success toasts appear (green) for create/update/delete actions
- [ ] Error toasts appear (red) for failures
- [ ] Toasts auto-dismiss after timeout
- [ ] Multiple toasts stack correctly

### Modal Dialogs

- [ ] Confirmation modals appear for destructive actions
- [ ] Escape key closes modal
- [ ] Backdrop click closes modal
- [ ] Focus trapped within modal

### Interactive Tables

- [ ] Column headers sort on click
- [ ] Search input filters rows
- [ ] Pagination controls work
- [ ] Empty state shows when no results
- [ ] Loading skeletons show while fetching

### Onboarding Tour

- [ ] Tour triggers on first visit
- [ ] Step-by-step highlights work
- [ ] Can skip or dismiss tour
- [ ] Does not show again after completion

---

## 18. Responsive / Mobile Testing

Test at these breakpoints:

| Breakpoint | Width  | Device        |
| ---------- | ------ | ------------- |
| Mobile S   | 320px  | iPhone SE     |
| Mobile M   | 375px  | iPhone 12     |
| Mobile L   | 425px  | Large phone   |
| Tablet     | 768px  | iPad          |
| Laptop     | 1024px | Small laptop  |
| Desktop    | 1440px | Standard      |

### Global

- [ ] Sidebar collapses to hamburger menu on mobile
- [ ] Bottom navigation shows on mobile (< 768px)
- [ ] Tables scroll horizontally on small screens
- [ ] Forms are usable on mobile
- [ ] Charts resize correctly
- [ ] Text doesn't overflow containers
- [ ] Touch targets are at least 44x44px

### Public Profile (`/p/[id]`)

- [ ] Hero section stacks vertically on mobile
- [ ] Stat cards wrap to 2-column grid on tablet, 1-column on mobile
- [ ] Charts are readable on mobile
- [ ] Bio grid stacks on mobile
- [ ] Navigation bar is usable on mobile

---

## 19. Automated Unit Tests

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

### Test Files

| File                    | What it tests                                      |
| ----------------------- | -------------------------------------------------- |
| `analytics.test.ts`     | Risk levels, ACWR, load trends, injury summaries   |
| `charts.test.ts`        | Chart color constants and helpers                  |
| `computations.test.ts`  | BestScore, average, days lost, training load, RPE  |
| `services.test.ts`      | Service record mapping and Airtable mocks          |
| `validations.test.ts`   | All Zod validation schemas                         |
| `csvExport.test.ts`     | CSV generation and escaping                        |
| `settings.test.ts`      | Threshold defaults and custom thresholds           |

### Expected Results

- [ ] All tests pass (0 failures)
- [ ] No skipped tests
- [ ] Coverage meets acceptable levels

### Key Test Cases

**Analytics:**
- `computeRiskLevel(0.5)` → `'low'`
- `computeRiskLevel(1.4)` → `'moderate'`
- `computeRiskLevel(1.8)` → `'high'`
- `computeRiskLevel(0)` → `'low'`

**Computations:**
- `computeBestScore([5, 8, 3], 'highest')` → `8`
- `computeBestScore([5, 8, 3], 'lowest')` → `3`
- `computeTrainingLoad(7, 60)` → `420`
- `computeDaysLost('2024-01-01', '2024-01-10')` → `9`

**Validations:**
- Athlete: Name required, Status must be valid
- Metric: BestScoreMethod must be `highest` or `lowest`
- DailyLoad: RPE 1-10, Duration > 0
- Injury: Type must be `Injury` or `Illness`

---

## 20. Performance & Edge Cases

### Empty States

- [ ] Dashboard with no data shows appropriate empty states
- [ ] Athletes list with no athletes shows empty state
- [ ] Athlete detail with no load entries shows "No data" in charts
- [ ] Athlete detail with no testing sessions shows empty tab
- [ ] Athlete detail with no injuries shows empty tab
- [ ] Analytics comparisons with no data shows empty state
- [ ] Public profile with no data still renders cleanly

### Large Data Sets

- [ ] Athletes list with 100+ records paginates correctly
- [ ] Load monitoring with 1000+ entries handles well
- [ ] Charts render without lag with 6 months of daily data
- [ ] Tables don't freeze when sorting large datasets

### Error Handling

- [ ] Invalid athlete ID (`/athletes/invalid-id`) shows error/404
- [ ] Invalid public profile ID (`/p/invalid-id`) shows 404
- [ ] Network failure during form submit shows error toast
- [ ] Airtable rate limit (5 req/sec) is handled gracefully
- [ ] Missing linked records don't crash pages (e.g., deleted sport)
- [ ] Concurrent edits don't cause data corruption

### Boundary Values

- [ ] RPE of exactly 1 and exactly 10 are accepted
- [ ] RPE of 0 or 11 is rejected
- [ ] Duration of 0 is rejected
- [ ] Very long athlete names don't break layout
- [ ] Special characters in names (accents, apostrophes) work
- [ ] Future dates for DateOccurred work correctly
- [ ] Date ranges spanning year boundaries compute correctly

---

## 21. Known Limitations

| Limitation | Description |
| --- | --- |
| **Airtable Rate Limit** | Free tier: 5 requests/second. High traffic may hit limits. |
| **No Real-Time Updates** | Data refreshes on page navigation, not live. |
| **Single Timezone** | All dates treated as UTC; no timezone conversion. |
| **Photo Storage** | Photos stored in Supabase; requires bucket setup (`npx tsx src/scripts/create-bucket.ts`). |
| **No Offline Support** | App requires active internet connection. |
| **Public Profile SEO** | Dynamic metadata works but no OG images. |
| **Browser Support** | Modern browsers only (Chrome, Firefox, Safari, Edge). |
| **Max Trial Count** | Testing supports up to 3 trials per metric. |
| **ACWR Warm-Up** | ACWR needs 28 days of data for accurate chronic load calculation. |

---

## Quick Reference: All Routes

| Route | Auth | Description |
| --- | --- | --- |
| `/` | No | Redirects to /login or /dashboard |
| `/login` | No | Login page |
| `/dashboard` | Yes | Main dashboard with KPIs and charts |
| `/athletes` | Yes | Athletes list |
| `/athletes/[id]` | Yes | Athlete detail with tabs |
| `/sports` | Yes | Sports list |
| `/sports/[id]` | Yes | Sport detail with metrics |
| `/programs` | Yes | Training programs list |
| `/programs/[id]` | Yes | Program detail |
| `/testing` | Yes | Testing sessions list |
| `/testing/new` | Yes | Create testing session |
| `/testing/[id]` | Yes | Testing session detail / trial entry |
| `/injuries` | Yes | Injuries list |
| `/injuries/[id]` | Yes | Injury detail |
| `/load-monitoring` | Yes | Load monitoring list |
| `/load-monitoring/[id]` | Yes | Load entry detail |
| `/analytics/comparisons` | Yes | Athlete comparisons |
| `/analytics/risk` | Yes | Risk assessment |
| `/settings` | Yes | App settings |
| `/profile` | Yes | User profile |
| `/p/[id]` | **No** | Public shareable athlete profile |

---

*Generated for DJP Athlete Performance Platform v1.0*
