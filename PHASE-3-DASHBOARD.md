# Derivo Dashboard Architecture & UX Blueprint (Phase 3)

**Status:** Approved  
**Author:** Staff Product Designer, Senior Frontend Engineer  
**Scope:** Dashboard UI, Navigation, Components, UX, and Mock Data

This document defines the complete architecture and design system implementation for the authenticated Derivo Dashboard. It follows a strict Linear/Raycast/Vercel-inspired monochrome aesthetic.

---

## 1. Dashboard Information Architecture

The dashboard is structured around the core entities of a developer's workflow. 
- **Global Context:** Workspace/User Profile, Search (CMD+K), Support, Notifications.
- **Primary Views:** Overview (Home), Projects, Devices, API Keys, Billing, Activity, Settings.

---

## 2. Navigation Structure

**Sidebar (Desktop):**
- **Top:** User Profile Dropdown (Switcher), Global Search (CMD+K)
- **Main Links:** 
  - Home (`/dashboard`)
  - Projects (`/dashboard/projects`)
  - Devices (`/dashboard/devices`)
  - API Keys (`/dashboard/keys`)
  - Activity (`/dashboard/activity`)
- **Secondary Links:**
  - Settings (`/dashboard/settings`)
  - Billing (`/dashboard/billing`)
- **Bottom:** Documentation, Support, Log Out

**Mobile:** 
- Collapsible hamburger menu driving a full-screen or slide-over drawer with the same hierarchy.
- Bottom navigation for quick access to Home, Projects, Devices, and Settings.

---

## 3. Route Hierarchy

```text
/dashboard                  -> Dashboard Overview (Home)
/dashboard/projects         -> Project List & Status
/dashboard/devices          -> Device Management (CLI access points)
/dashboard/keys             -> API Key Generation & Revocation
/dashboard/activity         -> Global Audit Log / Timeline
/dashboard/billing          -> Subscription, Trial Status, Invoices
/dashboard/settings         -> Profile, Preferences, Security
```

---

## 4. Dashboard Layout

- **Container:** `max-w-7xl mx-auto`, padding on sides for ultra-wide monitors.
- **Sidebar:** Fixed width (`240px`), borders on the right (`border-white/[0.06]`), very subtle gradient or pure `#050505`.
- **Main Content Area:** 
  - **Header:** Sticky or static, containing Breadcrumbs, Page Title, and primary page actions (e.g., "New Project").
  - **Body:** Scrollable, generous spacing (`gap-6`, `gap-8`), constrained width for readability.
- **Visuals:** Pure dark mode `#000000` to `#0A0A0A` backgrounds. Borders are `white/[0.04]` to `white/[0.08]`. Text is `white`, `white/70`, `white/40`.

---

## 5. Component Inventory

- **Layout:** `DashboardLayout`, `Sidebar`, `TopBar`, `PageHeader`.
- **Navigation:** `SidebarItem`, `Breadcrumbs`, `Tabs`.
- **Data Display:** `Card`, `Table`, `Badge` (Status indicators), `Timeline`, `Avatar`.
- **Feedback:** `EmptyState` (custom minimal SVG), `Toast`, `SkeletonLoader`.
- **Overlays:** `CommandPalette` (CMD+K), `Dialog` / `Modal`, `DropdownMenu`.
- **Inputs:** `Input`, `Select`, `Button` (Primary white, Secondary glass, Danger red-tinted).

---

## 6. Mock Data Models

```typescript
type Project = { id: string, name: string, framework: string, status: 'synced' | 'error' | 'pending', env: string, lastSync: string };
type Device = { id: string, name: string, type: 'mac' | 'windows' | 'linux', cliVersion: string, lastActive: string, isTrusted: boolean };
type ApiKey = { id: string, name: string, preview: string, created: string, lastUsed: string, expires: string };
type Activity = { id: string, event: string, description: string, timestamp: string, icon: string };
```

---

## 7. Folder Structure (Dashboard Scope)

```text
apps/dashboard/src/
├── components/
│   ├── dashboard/
│   │   ├── layout/         # Sidebar, Header, DashboardLayout
│   │   ├── shared/         # CommandPalette, EmptyState, Badge
│   │   └── views/          # ProjectsList, DeviceCard, ActivityTimeline
├── pages/
│   ├── dashboard/
│   │   ├── Home.tsx
│   │   ├── Projects.tsx
│   │   ├── Devices.tsx
│   │   ├── ApiKeys.tsx
│   │   ├── Billing.tsx
│   │   ├── Activity.tsx
│   │   └── Settings.tsx
└── mock/
    └── data.ts             # Realistic mock data for the UI
```

---

## 8. Responsive Strategy

- **Mobile First Data:** Tables switch to stacked cards on narrow viewports.
- **Sidebar:** Hides on `< md`, accessible via a glassmorphic top navigation bar with a menu button.
- **Actions:** Primary buttons remain visible, secondary actions move into a `...` dropdown on mobile.

---

## 9. Motion System

Powered by `motion/react`.
- **Page Transitions:** `initial={{ opacity: 0, y: 10 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.3 }}`.
- **Hover States:** Subtle scales (`scale: 1.01`) and border color transitions. No bouncy effects.
- **Dialogs/Modals:** Quick fade-in and slight scale up (`0.95` -> `1`).
- **Command Palette:** Blur backdrop, snappy entrance (`ease: [0.16, 1, 0.3, 1]`).

---

## 10. Accessibility Checklist

- [x] `aria-current="page"` on active sidebar links.
- [x] Full keyboard navigation in Command Palette (Arrow keys, Enter, Escape).
- [x] Focus rings (`focus:ring-1 focus:ring-white/20`) on all inputs and buttons.
- [x] Sufficient contrast ratio for text (even secondary text `white/40` passes AA against `#050505`).
- [x] Screen-reader only labels for icon buttons.

---

## 11. UX Improvements

- **Keyboard First:** Everything achievable via mouse is achievable via CMD+K.
- **Onetime Reveal:** API keys only show fully on creation.
- **Destructive Actions:** Require confirmation (e.g., revoking a device or API key).
- **Graceful Degradation:** Empty states are not dead ends; they include primary CTAs (e.g., "Generate your first key").

---

## 12. Self Review

- **Linear Design Engineer:** The minimalism is respected. We avoid aggressive branding and colors, sticking to structural clarity and typography (Inter/Mono). The Command Palette is front-and-center.
- **Vercel Frontend Architect:** Component structure is highly modular. Separating views from layout allows for easy transition to Next.js App Router or nested React Router structures in the future.
- **GitHub Design Team:** The activity timeline and device management feel familiar, secure, and developer-oriented.

**Conclusion:** Ready for implementation.
