# SPECIFICATION: RunClub Web Overhaul

**Status**: FINALIZED

## Overview
This specification details a comprehensive set of bug fixes, new features, UI/UX improvements, and performance optimizations for RunClub Web.

## Requirements

### Section 1: Bug Fixes
1. **Duplicate Run Entries**: Fix logic in `actions.ts` to prevent double inserts. Add a deduplication safeguard (reject runs with same runner + date + distance within last 30s).
2. **KM Due Display**: Fix formula to `(this week target) - (this week logged)`. Floor at 0. Never negative.
3. **Completion % Logic**: Calculate as `(total KM logged so far) / (total KM planned up to TODAY) * 100`. Cap at 100%. Apply consistently to crew cards, leaderboard, dashboard.
4. **Filter Tabs**: Ensure all tabs on the crew section work correctly.
5. **Open Dashboard Dropdown**: Ensure routing works for every runner.

### Section 2: New Members
1. **Anurag Goel**: Plan 10K, Initials AG, Status Behind.
2. **Mukesh Kandol**: Plan Half Marathon, Initials MK, Status Behind.
3. **Updates**: Crew count (15), leaderboard, dropdowns, log form, individual dashboards, footer aggregates.

### Section 3: Log A Run Form
1. **KM Input**: Allow 2 decimal places (update step, min, parsing).
2. **Duration Field**: Optional input (HH:MM or MM:SS). Auto-calculate pace if duration provided but not pace, and vice-versa.
3. **Heart Rate Field**: Optional input (min 40, max 220). Save to DB `avgHeartRate`. Display on dashboard history.
4. **Sync Buttons**: Remove Apple/Garmin. Keep Strava but disable it ("Strava (Coming Soon)").
5. **Desktop Layout**: 2-column grid. Button full-width on mobile, right-aligned on desktop.

### Section 4: Race Countdown
1. **Position**: Move to absolute top, above hero/navbar.
2. **Tuffman Toggle**: Add toggle for Joyville (Aug 23) vs Tuffman (Aug 31). Dynamic countdown update. Dark theme pill buttons.

### Section 5: Homepage Improvements
1. **Hero**: New tagline. Deep navy/forest green palette. Remove black/orange. Animated background.
2. **Personalized Dashboard**: Large greeting at top.
3. **Weekly Summary Bar**: Live strip above crew cards showing runs, km, active runners this week.
4. **Streak Counter**: "🔥 X-day streak" if runs logged on consecutive scheduled days.
5. **Rotating Footer Message**: 10 hardcoded messages rotating based on `(weekNumber % 10)`.

### Section 6: Leaderboard
1. **Toggle**: [ This Week ] vs [ Overall ].
2. **Progress Bar**: Add visual bar alongside Completion %.
3. **Styling**: Alternating row shading.
4. **Mobile**: Card-per-runner layout.

### Section 7: The Blueprint
1. **Dynamic Plans**: Pull all 3 plans dynamically from codebase (do not hardcode).
2. **Layout**: 3 columns desktop, 2+1 tablet, stacked mobile.
3. **Content**: Header (name, badge, tagline, progress bar), Table (current week highlighted, volume bar), Footer (peak week, active runners).
4. **Section Header**: "THE BLUEPRINT", 3 stat pills, updated description.

### Section 8: Change Plan Feature (Dashboard)
1. **Current Plan**: Display current plan.
2. **Plan Options**: Pull 3 plans dynamically.
3. **Confirmation Modal**: Warn about % and KM due reset.
4. **Switch Logic**: Update DB, recalculate metrics, keep existing runs.

### Section 9: Dashboard Improvements
1. **Next Run Due**: Prominent card showing next scheduled run day and distance.
2. **Personal Bests**: Longest run, fastest pace, best avg HR.
3. **Run History Toggle**: [ This Week ] vs [ All Time ].
4. **Crew Card Logic**: Ensure "X runs · Y km done" on crew cards is ALL TIME.

### Section 10 & 11: Optimizations
1. **Desktop**: Max width 1280px, centered. Grid layouts.
2. **Mobile**: No horizontal scroll, min 44px tap targets, slide-in drawer, full-width buttons.

### Section 12 & 13: Performance & Polish
1. **Performance**: Lazy loading, DB debounce, memoization, plan caching.
2. **Polish**: Dates in IST/DD MMM YYYY, dynamic footer, grammatically correct "1 run", correct plan name propagation.
