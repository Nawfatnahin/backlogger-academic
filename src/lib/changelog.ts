export type ChangeType = 'NEW' | 'IMPROVED' | 'FIXED' | 'REMOVED';

export interface ChangeEntry {
  type: ChangeType;
  description: string;
}

export interface VersionEntry {
  version: string;
  date: string;        // ISO format: "YYYY-MM-DD"
  summary: string;     // one-line description of this release
  changes: ChangeEntry[];
}

export const CHANGELOG: VersionEntry[] = [
  {
    version: "1.4.4",
    date: "2026-07-28",
    summary: "Bespoke 3D Glassmorphic Stats Icons Integration",
    changes: [
      { type: "NEW", description: "Generated and integrated custom 3D glassmorphic icon assets for Active Nodes, System Master, and Elite Subscriptions stats cards" },
    ],
  },
  {
    version: "1.4.3",
    date: "2026-07-28",
    summary: "Typography Scale Optimization & Header Cleanup",
    changes: [
      { type: "IMPROVED", description: "Expanded typography scale across the entire Admin Panel for enhanced legibility" },
      { type: "REMOVED", description: "Cleaned up top header bar by removing the redundant Online badge indicator" },
    ],
  },
  {
    version: "1.4.2",
    date: "2026-07-28",
    summary: "Spotlight Refraction & High-Agency Bento Cards",
    changes: [
      { type: "IMPROVED", description: "Added SpotlightCard component with cursor-tracking radial gradients and top-edge refraction" },
      { type: "NEW", description: "Integrated custom generated texture background asset for admin cards" },
    ],
  },
  {
    version: "1.4.1",
    date: "2026-07-28",
    summary: "Admin Panel Redesign & Slop Removal",
    changes: [
      { type: "IMPROVED", description: "Completely redesigned the Admin Panel to a formal, premium B2B SaaS aesthetic" },
      { type: "REMOVED", description: "Removed Scholar OS gimmicky widgets and 3D hover effects from the admin dashboard" },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-07-28",
    summary: "Pending Tasks Alignment & Interactive Attendance Glow Selection",
    changes: [
      { type: "FIXED", description: "Aligned Pending Tasks query on dashboard to count all active tasks (todo and in-progress) from the Task Board" },
      { type: "NEW", description: "Added persistent glowing visual feedback to selected attendance options (Present, Absent, Cancelled, Holiday) until changed" },
    ],
  },
  {
    version: "1.3",
    date: "2026-05-30",
    summary: "Multi-Semester CGPA Manager, UserBadge Mobile Layout, and Search Optimization",
    changes: [
      { type: "NEW", description: "Multi-semester tabs layout, degree progress widget, and cumulative forecasting" },
      { type: "NEW", description: "Implemented responsive UserBadge layout and mobile navigation optimizations" },
      { type: "NEW", description: "Created crawler control policy (robots.ts) to restrict data scraping" },
    ],
  },
  {
    version: "1.2",
    date: "2026-05-26",
    summary: "Attendance Logging Upgrades and Popup Optimization",
    changes: [
      { type: "NEW", description: "Added capability to log and delete extra class sessions in the Attendance Tracker" },
      { type: "FIXED", description: "Standardized theme defaults and refined Instruction Button popups" },
    ],
  },
  {
    version: "1.1",
    date: "2026-05-21",
    summary: "High-Fidelity Dark Mode and Visual Overhaul",
    changes: [
      { type: "NEW", description: "Comprehensive Dark Mode system with no-flash script" },
      { type: "NEW", description: "Bespoke, animated DarkModeToggle component" },
      { type: "IMPROVED", description: "Redesigned Semester Progress Widget and onboarding cards with 3D glassmorphism" },
      { type: "IMPROVED", description: "Surgical color refactoring and dashboard contrast restoration" },
    ],
  },
  {
    version: "1.0",
    date: "2026-05-02",
    summary: "Initial public release of Scholar Atlas",
    changes: [
      { type: "NEW", description: "Attendance Tracker with threshold warnings" },
      { type: "NEW", description: "Task Management Kanban board" },
      { type: "NEW", description: "CGPA Manager with target forecasting" },
      { type: "NEW", description: "PDF Tools: merge, split, convert" },
      { type: "NEW", description: "Semester Progress Widget on dashboard" },
      { type: "NEW", description: "About page with version history" },
    ],
  },
];
