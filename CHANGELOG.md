# Changelog
All notable changes to Scholar Atlas are documented here.
Format: [version] — YYYY-MM-DD

## [1.4.3] — 2026-07-28

### Improved
- **Typography Scale**: Expanded font sizes and font weights across the Admin Panel for clearer readability.

### Removed
- **Top Header Status Badge**: Removed the redundant Online badge indicator from the top header bar.

---

## [1.4.2] — 2026-07-28

### Improved
- **Spotlight Cards & Refraction**: Implemented cursor-tracking SpotlightCard components with radial highlights, edge refraction borders, and custom background texture assets.

---

## [1.4.1] — 2026-07-28

### Improved
- **Admin Panel Redesign**: Completely redesigned the Admin Panel to a formal, premium B2B SaaS aesthetic, removing the gimmicky Scholar OS widgets and 3D hover effects.

---

## [1.4.0] — 2026-07-28

### Added
- **Attendance Glowing Selection State**: Implemented continuous glowing visual feedback on attendance options (Present, Absent, Cancelled, Holiday) that persists until selection changes or element disappears.

### Fixed
- **Pending Tasks Dashboard Synchronization**: Aligned the dashboard pending tasks counter query to include all non-completed task board tasks (`todo` and `in-progress`).

---

## [1.3.1] — 2026-06-16

### Improved
- **Codebase Maintenance**: Addressed TypeScript type safety warnings across server actions and React components.
- **Dependency Cleanup**: Removed unused dependencies (`@tanstack/react-query`, `react-hook-form`, `zustand`) to optimize bundle size and build times.
- **Database Migrations**: Standardized database migration files into a chronological `supabase/migrations/` structure for improved deployment reliability.
- **Documentation**: Updated the README with comprehensive deployment guidelines and environmental setup for easier contributor onboarding.

---

## [1.3] — 2026-05-30

### Added
- **Multi-Semester CGPA Manager**: Multi-semester tabs layout, degree progress widget, and cumulative forecasting.
- **AI Scraper & Search Optimization**: Configured robots.ts crawler policies to block trainers while supporting index visibility.
- **UserBadge Mobile Navigation**: Designed compact badge styling and layout for narrow viewports.

---

## [1.2] — 2026-05-26

### Added
- Dedicated **Extra Classes** logging engine in the Attendance Tracker, supporting real-time manual tracking, historical listings, and direct deletion with instant health score updates.

### Fixed
- Standardized theme defaults so that shared links or new visitors always open in light mode by default.
- Refined the Instruction Button popups in the Attendance and Task pages to present only features currently fully operational.

---

## [1.1] — 2026-05-21

### Added
- Comprehensive Dark Mode system: dynamic CSS variable-based theming.
- No-flash synchronization script for premium initial load experience.
- Bespoke, animated DarkModeToggle component in dashboard header.

### Improved
- Redesigned Semester Progress Widget and onboarding cards with 3D glassmorphism.
- Surgical color refactoring and dashboard contrast restoration.

---

## [1.0] — 2026-05-02

### Added
- Attendance Tracker: subject-wise class logging with percentage calculation and threshold warnings.
- Task Management: Kanban board with subject tagging and due dates.
- CGPA Manager: dual-engine calculator with target grade forecasting.
- PDF Tools: client-side merge, split, and convert.
- User authentication via Supabase Auth.
- Subject management with color assignment.
- About page with version history and Semester Progress Widget.
