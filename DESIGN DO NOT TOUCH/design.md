# Derivo Web — Dark Monochrome Redesign

## Current State Analysis

### App Overview
Derivo is a developer tooling platform with a CLI agent that automates local environment setup (Node versions, Docker, Redis, databases, .env files). The web app consists of:

- **Landing page**: Hero, CLI demo terminal, features grid, developer workflow timeline, pricing, FAQ, CTA, footer
- **Auth pages**: Login, Register, Forgot Password, Reset Password, Verify Email, Onboarding
- **Dashboard**: Overview (stats cards, recent projects, activity feed), Projects, Devices, API Keys, Activity, Billing, Sessions, Settings

### Current Design Language
- Near-black background (#080808 / #050505)
- White text with varying opacity (white/90, white/50, white/30)
- Colored accents: emerald, rose, amber, violet, blue, cyan on feature cards
- Rounded cards (rounded-2xl) with glass-like borders (border-white/[0.06])
- Animated background: dot grid, orbital rings, floating orbs, glow blobs
- Framer Motion (motion/react) for scroll-triggered animations, hover 3D tilts
- Pill-shaped navbar with frosted-glass effect
- Inter + JetBrains Mono fonts
- Tailwind CSS v4 + shadcn/ui + Radix UI primitives
- React 19, React Router 7, Vite 6

### Tech Stack
- React 19, TypeScript, Vite 6
- Tailwind CSS v4, shadcn/ui, Radix UI
- motion (Framer Motion), lucide-react icons
- Firebase Auth, React Router v7
- Monorepo (Turborepo): apps/web, apps/api, apps/cli

---

## New Design Direction: Dark Monochrome — "Obsidian Terminal"

### Design Philosophy
Abandon the floaty glassmorphism / colored-accent approach. The new design is **brutalist-terminal meets editorial print**. Think: stark, geometric, high-contrast monochrome with deliberate negative space. No gradients, no colored glows, no rounded soft cards. Everything feels etched in light on black slate.

### Core Principles
1. **Strictly monochrome** — Only black (#000), white (#fff), and shades of neutral gray. No color whatsoever except for semantic states (error red, success green) in the dashboard.
2. **Sharp geometry** — Square corners or very slight rounding (max 4px). No pill shapes, no rounded-2xl.
3. **Grid-driven layout** — Visible grid lines, deliberate asymmetric columns, magazine-style typographic hierarchy.
4. **Motion is purposeful** — No floating orbs or ambient drift. Motion is reactive: cursor-triggered reveals, scroll-snapped section transitions, text that types or slices in.
5. **Terminal heritage** — Monospace type for data/labels. The CLI is the product — the website should feel like an extension of the terminal.

---

## Page-by-Page Design Spec

### Landing Page

#### Background
- Solid black (#000). No gradients, no blurred orbs.
- Optional: A subtle pixel-grid pattern at 2-3% opacity, or a single horizontal scan-line effect.
- A single ambient light source — a sharp white line at top center fading outward like a crack of light.

#### Navbar
- **Full-width horizontal bar** fixed at top, not floating/pill-shaped.
- Black background with a thin 1px bottom border (white at 8% opacity).
- Logo left-aligned, navigation links centered in small-caps monospace, auth buttons right-aligned.
- Active link indicated by a solid white underline (not animated spring — just instant).
- No backdrop blur, no frosted glass.

#### Hero Section
- **Oversized headline** spanning ~80% viewport width. Font: bold, tight tracking, max contrast white on black.
- Subtext in gray (#888) with generous line-height.
- CTA buttons: Primary = solid white rectangle with black text, hard edges. Secondary = outlined with 1px white border, transparent fill.
- Below the fold: a single horizontal rule dividing hero from content.

#### CLI Demo
- **Full-width terminal block** with hard square corners.
- Top bar: three small squares (not circles), window title in monospace.
- Terminal body: pure black bg, green/white monospace text. No colored badges — just prefix symbols (✓ ✗ !) in white/gray.
- Progress bar: thin horizontal line, white fill on dark track. No glow.
- Remove 3D perspective scroll effects. The terminal stays flat and static until content animates inside it.

#### Features Section
- **Two-column split**: Left column has the section heading + description. Right column is a vertical list (not a grid of cards).
- Each feature is a **row item**: left-aligned number in large monospace, title in bold, description in gray. Separated by thin horizontal rules.
- On hover: the row slides slightly right and the number inverts (white bg, black text).
- No colored accents. No card shadows or glows.

#### Developer Workflow (How It Works)
- **Vertical timeline** but reimagined as a code diff or changelog.
- Each step shown as a block with a left gutter (like line numbers in an editor): step number in monospace, content indented.
- Active step: full white text. Inactive steps: gray (#555).
- No rounded bullets. Use square markers or dashes.

#### Pricing Section
- **Side-by-side comparison table** style, not floating cards.
- White grid lines separating rows. Feature names left-aligned, checkmarks or dashes for each plan.
- Plan names at the top in bold. Price large and stark.
- CTA buttons same hard-edge rectangle style as hero.

#### Footer
- Minimal: logo, copyright, links in a single horizontal row. All monospace, all gray. One 1px top border.

---

### Auth Pages (Login / Register / etc.)

- **Centered narrow form** on pure black background.
- No decorative side panels or illustrations.
- Form container: no visible border, no background difference. Just the form floating in black space.
- Inputs: 1px white/20 border, square corners, no background fill. On focus: border goes full white.
- Labels: tiny monospace, uppercase, letter-spaced, gray.
- Submit button: full-width solid white rectangle, black text, bold.
- OAuth buttons: outlined rectangles with icon + text. Same 1px border style.
- Error messages: prefixed with a monospace "ERR" label, red text (only semantic color allowed).

---

### Dashboard

#### Layout
- **Sidebar**: Narrow (200px), black bg, 1px right border. Navigation items are text-only (no icons on default state). Active item has a white left-border indicator (2px solid white bar).
- **Top header bar**: Optional, minimal. Shows page title left, user avatar (monogram in a square) right.
- **Content area**: White-on-black cards replaced with **borderless sections** separated by horizontal rules or generous spacing.

#### Overview / Home
- Stat values displayed as **large monospace numbers** with tiny uppercase labels above.
- No card wrappers — just a grid of stat blocks separated by vertical hairline dividers.
- Recent projects: table-style list with columns (name, status, last sync). Row hover = slight bg lighten.
- Activity feed: each entry is a single line — timestamp in gray, event in white, separated by em-dashes.

#### Sub-pages (Projects, Devices, API Keys, etc.)
- Consistent table/list layouts.
- Data-heavy views use monospace for IDs, timestamps, statuses.
- Action buttons: small, outlined, square-cornered.
- Empty states: centered monospace text, no illustrations.

---

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| bg-primary | #000000 | Page background |
| bg-elevated | #0a0a0a | Elevated surfaces (modals, dropdowns) |
| bg-subtle | #111111 | Hover states, active nav items |
| border | #1a1a1a | Default borders |
| border-strong | #333333 | Emphasized borders, dividers |
| text-primary | #ffffff | Headlines, primary content |
| text-secondary | #888888 | Body text, descriptions |
| text-tertiary | #555555 | Labels, metadata, inactive items |
| text-muted | #333333 | Barely visible hints |
| accent | #ffffff | CTAs, active indicators |
| error | #ff3333 | Error states (dashboard only) |
| success | #33ff33 | Success states (dashboard only) |

---

## Typography

| Element | Font | Weight | Size | Case |
|---------|------|--------|------|------|
| Hero headline | Inter | 800 | 72-96px | Normal |
| Section headline | Inter | 700 | 40-48px | Normal |
| Body text | Inter | 400 | 16px | Normal |
| Navigation links | JetBrains Mono | 500 | 12px | Uppercase |
| Labels / metadata | JetBrains Mono | 400 | 10-11px | Uppercase |
| Terminal content | JetBrains Mono | 400 | 14px | Normal |
| Data values | JetBrains Mono | 600 | 28-36px | Normal |
| Buttons | Inter | 600 | 14px | Normal |

---

## Motion & Interaction

| Interaction | Effect |
|-------------|--------|
| Page load | Content fades in from 0 opacity, slight translateY(8px), staggered 50ms |
| Scroll sections | Snap-scroll between major sections on desktop |
| Feature row hover | Row slides right 4px, number inverts color |
| Button hover | Invert colors (white→black bg, black→white text) instantly, no transition |
| Terminal typing | Character-by-character monospace typing, cursor blink |
| Nav link hover | Instant underline appear (no spring animation) |
| Dashboard row hover | Background lightens to #111 |
| Input focus | Border snaps to full white (no gradual transition) |

---

## Component Mapping (Old → New)

| Current Component | New Approach |
|---|---|
| Floating pill navbar with glass blur | Full-width fixed bar, solid black, 1px bottom border |
| Animated background (orbs, rings, dots) | Solid black or subtle pixel grid at 2% opacity |
| Feature cards (colored gradients, 3D hover) | Flat list rows with horizontal dividers |
| CLI Demo (perspective transforms, parallax) | Static full-width terminal block |
| Pricing cards (glass, colored dots) | Comparison table with grid lines |
| Dashboard cards (rounded-2xl, gradients) | Borderless stat blocks with hairline dividers |
| Auth forms (rounded-xl inputs, shadows) | Square inputs, no background, sharp borders |
| Sidebar (rounded-lg nav items) | Text-only nav with left-bar active indicator |

---

## File Structure Changes
No structural changes to routing or pages. Only visual/CSS changes:
- Replace `index.css` theme and animations
- Rewrite all landing components (Navbar, Hero, CLIDemo, Features, DeveloperWorkflow, PricingPreview, FAQ, CTA, Footer, Background)
- Restyle auth layout and form components
- Restyle dashboard layout and shared components
- Keep all logic, hooks, and data flows intact
