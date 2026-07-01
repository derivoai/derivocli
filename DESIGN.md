# Derivo — Product Design Specification

> **Document status:** Canonical design source of truth.
> **Audience:** Product designers, design engineers, and AI design systems (Claude Design / Stitch) tasked with redesigning Derivo.
> **Scope:** This document defines *how Derivo should look and behave*. It does not redesign the product, remove functionality, or invent features. Every capability that exists today must remain possible after a redesign that conforms to this specification.
> **Source of truth:** The Derivo Product Structure Report (reverse-engineered from the live codebase). Where this document and the running code disagree on *behavior*, the code wins; where they disagree on *visual or interaction quality*, this document wins.

---

## Table of Contents

1. Product Vision
2. Design Principles
3. Information Architecture
4. Navigation System
5. Desktop Layout
6. Mobile Layout
7. Typography
8. Color System
9. Design Tokens
10. Motion
11. Component Library
12. Page Specifications
13. User Flows
14. Accessibility
15. Responsive Design
16. Future Expansion

---

## How to read this document

Each section is written to be independently actionable. A designer should be able to open Section 11 (Component Library) and build a component without reading the whole document, and a designer working on Section 12 (Page Specifications) should be able to assemble a page from components defined in Section 11 using tokens defined in Section 9.

Three conventions are used throughout:

- **Spec** — a normative requirement. If a screen violates a spec, it is wrong.
- **Rationale** — *why* the spec exists. Rationale is not optional reading; it is how a designer makes the thousand micro-decisions this document cannot enumerate.
- **Inventory** — a complete enumeration of something that already exists in the product (routes, buttons, states). Inventories are derived from the Product Structure Report and must not lose entries during a redesign.

When this document says "must," it is a hard requirement. When it says "should," it is a strong default that may be overridden with a documented reason. When it says "may," it is permission, not encouragement.

---

## 1. Product Vision

### 1.1 What Derivo is

Derivo is a developer-experience platform built around an intelligent command-line tool (`derivo`) and a web control plane (the dashboard) that share one identity and one subscription. The CLI analyzes, validates, and sets up projects, manages trusted devices and sessions, and runs an extensible plugin platform. The web app is where a developer creates an account, verifies identity, watches their workspace, manages devices and sessions, issues API keys, and handles billing. The backend is the authority: it computes entitlements, gates premium capabilities, and brokers trust between the CLI and the dashboard.

The product's center of gravity is the terminal. The web app is not a destination where developers spend their day; it is a control surface they visit deliberately — to onboard, to grant or revoke access, to rotate a key, to check why the CLI says their trial expired. This shapes every design decision in this document. The dashboard must be **fast to enter, fast to read, and fast to leave.** It must never feel like a place that wants to trap attention.

### 1.2 What Derivo should feel like

Derivo should feel like a precision instrument operated by someone who already knows what they are doing. The emotional target is **quiet confidence**: the interface is dark, dense, and composed; it does not shout, animate gratuitously, or explain things the user already understands. It rewards familiarity. The more a user works with Derivo, the faster they become, because the layout is stable, the keyboard works everywhere, and nothing moves under their cursor.

The closest reference points are Linear (keyboard-first, dense, opinionated), Stripe (trustworthy, exacting with money and security), Vercel (developer-native dark aesthetic, terminal-adjacent), and GitHub (resource management at scale). Derivo borrows Linear's speed, Stripe's seriousness about irreversible actions, Vercel's restraint, and GitHub's clarity about ownership and permissions.

What Derivo must **not** feel like: a consumer SaaS dashboard padded with illustrations and celebratory confetti; an enterprise admin console that buries every action three menus deep; or a marketing site cosplaying as an app. The product is for people who read monospace fonts for a living.

### 1.3 Target audience

**Primary persona — the individual developer (“the operator”).** Works in a terminal, uses the CLI daily, visits the dashboard occasionally. Values speed and keyboard control above all. Distrusts magic. Wants to understand exactly what a button will do before clicking it, especially when it touches credentials or money. On the free/Community plan or a Pro trial. This persona is the default; when a design decision must favor one audience, it favors this one.

**Secondary persona — the team lead / platform engineer.** Manages devices and keys for real production workloads, cares about session hygiene, audit trails, and revocation. Reads the Activity log. Will eventually be on a paid plan. Needs the security surfaces (Devices, Sessions, API Keys, Activity) to be legible and trustworthy at a glance.

**Tertiary persona — the evaluator.** Landed on the marketing site, is deciding whether to install the CLI and sign up. Needs the landing page, pricing, and signup flow to communicate competence and seriousness in seconds. The first authenticated impression (verify-email → onboarding → empty dashboard) must reinforce that decision rather than undermine it.

**Internal persona — the operator-with-elevated-rights (admin).** The backend exposes admin capabilities (grant plan, extend trial, revoke, adjust limits, temporary access). No admin UI exists today. The design system must anticipate one (see Section 16) without inventing it now.

### 1.4 Design goals

1. **Make state obvious.** A developer should understand their subscription status, which devices are trusted, which sessions are live, and which keys are active within one glance per surface. Derivo manages access and money; ambiguity here is a defect, not a nuance.
2. **Make irreversible actions feel irreversible.** Revoking a device, rotating a key, deleting a project, or deleting an account must be visually and interactionally distinct from benign actions, with consistent confirmation patterns. The product currently mixes polished dialogs with native browser prompts; the redesign must unify these.
3. **Make the keyboard a first-class citizen.** The Command Palette (⌘K) already exists. The design system must treat keyboard operation as the primary path for power users, not an accessibility afterthought.
4. **Make loading honest.** Skeletons that match final layout, error states that say what failed and offer retry, empty states that tell the user the *next action* (usually: install or use the CLI). No fake data, no permanent spinners, no layout shift.
5. **Make the system consistent enough to be invisible.** One way to confirm a destructive action. One way to show status. One way to lay out a list-with-detail. Consistency is the feature; novelty is the bug.

### 1.5 Brand personality

Derivo's voice is **terse, technical, and respectful.** It assumes intelligence. It uses monospace for anything a machine produced or will consume (IDs, fingerprints, key previews, plan identifiers, keyboard hints) and proportional type for human prose. It prefers verbs ("Revoke", "Rotate", "Log out") to vague nouns ("Manage", "Options"). It never uses exclamation points in product UI except in genuine celebration moments that already exist (e.g., "Trial Activated"), and even then sparingly.

Visually the brand is **monochrome-first**: a near-black canvas, white text at varying opacities, hairline borders, and color reserved almost entirely for *meaning* — emerald for healthy/active, amber for trial/warning/attention, red for destructive/expired/error, blue for informational/scoped. Color is a signal, not decoration. The single decorative warmth in the product is the amber used for premium/upgrade moments, which should remain the only "marketing" color inside the app.

### 1.6 Developer-first philosophy

"Developer-first" is not a tagline here; it is a set of constraints:

- **The terminal is the source of truth for doing work.** The dashboard reflects and governs; it does not duplicate the CLI's job. The web "New Project" action correctly defers creation to the CLI. The design must reinforce this division rather than fight it — when a web surface can only be populated by the CLI, its empty state must say so explicitly and offer the exact command or install path.
- **Copyable everything.** IDs, key previews, fingerprints, project identifiers, and commands must be selectable and, where they are meant to be used elsewhere, one-click copyable with clear feedback.
- **No dark patterns around money.** Upgrade prompts are honest about what is gated and why. The product currently surfaces upgrade in three places (banner, modal, billing); the design must make these consistent in message and never deceptive about trial length or price.
- **Respect for focus.** No interstitials, no nagging modals on load, no notification spam. The CLI's update notice is non-blocking by design; the web app must hold the same line.
- **Trust through transparency.** Security surfaces explain consequences in plain language ("The connected CLI will lose access and must re-register"). This copy quality is a brand asset and must be preserved and extended.

---

## 2. Design Principles

These principles are ordered. When two principles conflict, the earlier one wins. They are the tie-breakers for every decision this document does not explicitly cover.

### 2.1 Clarity over decoration

**Principle.** Every pixel must earn its place by communicating state, enabling action, or establishing hierarchy. Ornament that does none of these is removed.

**Rationale.** Derivo manages credentials, devices, sessions, and billing — domains where misreading the screen has real consequences (a developer revokes the wrong device, rotates a key in production, deletes the wrong project). Decoration competes with signal for the user's limited attention. A gradient that exists "to look nice" steals contrast budget from a status badge that needs to be read instantly. The existing product is already restrained (hairline borders, subtle glows on hover); the redesign must hold this line and resist the temptation to "warm up" security surfaces with imagery.

**Application.** Backgrounds are near-flat. Glows and gradients are permitted only as *hover affordances* (signaling interactivity) or to draw the eye to a single primary action per view (e.g., the amber glow behind the Upgrade modal). Illustrations are confined to the marketing site. Empty states use a single muted icon, never a scene.

### 2.2 Speed over complexity

**Principle.** The fastest correct path wins. Prefer fewer steps, fewer screens, and instant feedback over feature-rich flows that take longer to operate.

**Rationale.** The operator persona visits the dashboard to accomplish one thing and leave. A device revoke that takes one click + one confirm is correct; a device revoke that opens a multi-tab settings wizard is wrong even if the wizard is "more capable." Speed also means *perceived* speed: optimistic UI where safe, skeletons that appear instantly, and refetch-after-mutation that does not blank the screen.

**Application.** List-with-detail (modal/panel) instead of multi-level routing for resource details — this is already the product's pattern and it is correct for speed. Inline editing (device rename) over dedicated edit pages. Search that filters in place. The Command Palette as a teleporter between surfaces.

### 2.3 Consistency over novelty

**Principle.** There is exactly one way to do each recurring thing: confirm a destructive action, show a status, lay out a list, render an empty state, present a form in a modal. New patterns require justification and, once introduced, become the canonical pattern everywhere.

**Rationale.** Consistency compounds. When every destructive confirmation looks and behaves identically, users stop reading the chrome and start reading the *content* — which is where the risk actually lives. The current product violates this in one important place: project and account deletion use native `window.confirm`, while devices/keys/sessions use a polished `ConfirmDialog`. This inconsistency trains users to distrust the difference. The redesign must unify on one confirmation system.

**Application.** The Component Library (Section 11) is the law. A page may not invent a bespoke button, a one-off modal chrome, or a custom status pill. If a page needs something the library lacks, the library is extended (and the addition documented), not bypassed.

### 2.4 Keyboard-first

**Principle.** Every primary action reachable by mouse must be reachable by keyboard, and the most common navigation must be reachable without the mouse at all. The Command Palette is the spine of keyboard operation.

**Rationale.** The audience lives on the keyboard. A developer who can jump to API Keys, create a key, copy it, and close — all without touching the mouse — experiences Derivo as fast and respectful. Keyboard-first also improves accessibility for free, because the same focus order and shortcuts serve screen-reader and motor-impaired users.

**Application.** ⌘K opens the palette from anywhere. The palette must include *every* primary destination (the current implementation omits Sessions and Activity — the redesign must include all sidebar destinations plus high-value actions). Modals trap focus and close on Escape. Lists are arrow-navigable where practical. Every interactive element has a visible focus ring. Destructive confirmations never default-focus the destructive button.

### 2.5 Accessibility-first

**Principle.** Accessibility is a baseline requirement evaluated during design, not a remediation performed after. Contrast, focus, semantics, motion sensitivity, and touch targets are specified for every component and page.

**Rationale.** Dark, low-contrast, dense interfaces are exactly where accessibility most often fails — white text at 30–40% opacity on near-black can fall below contrast minimums; hairline borders can vanish for low-vision users; hover-only affordances exclude keyboard users. Because Derivo is intentionally dense and dark, it must be *more* disciplined about accessibility than a typical bright SaaS, not less.

**Application.** Body and interactive text meets WCAG AA contrast against its actual background (see Section 8 and 14 for the opacity floor). Focus rings are always visible and never rely on color alone. `prefers-reduced-motion` disables non-essential animation. Status is never communicated by color alone — badges pair a dot/color with a text label. Touch targets meet minimum size on mobile.

> Note: This document specifies the design intent for accessibility. Full WCAG conformance requires manual testing with assistive technologies and expert review; this specification cannot substitute for that validation.

### 2.6 Dense but readable

**Principle.** Maximize information per screen without sacrificing legibility. Density is achieved through tight-but-consistent spacing, restrained type sizes, and strong grouping — not through shrinking text below readable limits.

**Rationale.** The operator wants to see all their devices, all their keys, the whole trial state, without scrolling or drilling. But density without rhythm is noise. The product already runs small (11–13px metadata, 14px body); the redesign keeps this density but enforces a consistent vertical rhythm and grouping so the eye can parse dense surfaces quickly.

**Application.** A defined type scale (Section 7) with a hard floor on the smallest readable size. Consistent row heights in lists. Grouping via hairline dividers and section labels (the monospace uppercase micro-labels like "CONFIGURATION") rather than heavy cards. Generous *internal* padding inside interactive targets even when *external* spacing is tight.

### 2.7 Information hierarchy

**Principle.** Each view has exactly one primary thing, a small set of secondary things, and everything else is tertiary. Visual weight (size, contrast, color, position) maps directly to importance.

**Rationale.** When everything is bold, nothing is. Security and billing surfaces especially need a clear answer to "what is the most important thing on this screen?" — usually a status (active/expired/trialing) and a single primary action (upgrade, revoke, create). Hierarchy is what lets a user answer their question in one glance, which is the core promise of the dashboard.

**Application.** One primary button per view, rendered in solid white-on-black (the highest-contrast control). Page titles at the top of the scale; section headers a clear step down; metadata at the bottom in muted, often monospace, type. Status badges sit adjacent to the entity they describe and use the color system to encode severity.

### 2.8 Progressive disclosure

**Principle.** Show the minimum needed to decide and act; reveal depth on demand. Summaries in lists, full detail in panels/modals, advanced options behind explicit affordances.

**Rationale.** A device row needs name, OS, CLI version, and status — enough to identify and triage. The fingerprint, architecture, Node version, and registration timestamp matter only when the user has decided to inspect *that* device. Forcing all of it into the list destroys scannability. Disclosure also protects novices from advanced/destructive options without hiding them from experts.

**Application.** List rows show a curated summary; clicking opens a detail panel/modal with the full record and the full action set. Forms show common fields first and group advanced options. Destructive actions live inside detail views or behind a clearly-labeled affordance, never as the most prominent control in a list.

### 2.9 Stability over motion

**Principle.** The layout must be predictable. Content does not reflow under the cursor, modals do not shift the page, and loading does not collapse-then-expand. Motion communicates change; it never causes it.

**Rationale.** Power users build muscle memory around stable layouts. If the "Revoke" button moves because an async banner loaded above it, the user mis-clicks — a real hazard on destructive surfaces. Skeletons that match final dimensions prevent the jarring reflow the current product exhibits on spinner-based pages (Home, Projects, Settings) versus skeleton-based pages (Devices, Keys, Sessions, Activity).

**Application.** Reserve space for async content. Use layout-matched skeletons. Lock scroll position during refetch. Animate opacity and small transforms, not layout-affecting properties, for hover/enter/exit. See Section 10.

### 2.10 Honest, plain-language copy

**Principle.** Tell the user what happened, what will happen, and what to do next — in plain words, with consequences stated. Never show raw error codes. Never imply an action does something it does not.

**Rationale.** The product's existing security copy ("Revoking immediately removes trust. The connected CLI will lose authentication and must log in again.") is a genuine asset; it builds trust precisely because it is specific. Conversely, the Settings avatar "Save" that does not persist, and the Billing "Upgrade" that only shows a note, erode trust. Copy is a design material, and honesty is a design requirement.

**Application.** Every confirmation states the consequence and reversibility. Every error maps to a friendly title + actionable message (the `auth-errors` mapping is the model). Every empty state names the next action. Controls that are not yet functional are either removed, visibly disabled with explanation, or clearly labeled as forthcoming — never presented as working.

---

## 3. Information Architecture

Derivo's IA spans three surfaces that share identity and subscription: the **marketing site**, the **authentication system**, and the **dashboard**. A fourth surface — the **CLI** — is not visual but is deeply coupled to the web IA (it drives data into surfaces the web app only displays/governs). This section enumerates everything and defines the relationships. Nothing here may be removed in a redesign; structure may be re-grouped only with explicit rationale.

### 3.1 IA overview map

```
Derivo
├── Marketing (public, unauthenticated-first)
│   ├── / (Landing: Hero, CLI Demo, Trusted By, Features,
│   │       Developer Workflow, Pricing Preview, FAQ, CTA, Footer)
│   ├── /features        → Landing#features
│   ├── /how-it-works    → Landing#how-it-works
│   ├── /pricing         → Landing#pricing
│   ├── /docs            → (currently Landing; placeholder)
│   ├── /blog            → (currently Landing; placeholder)
│   ├── /terms           → (linked, not yet routed)
│   └── /privacy         → (linked, not yet routed)
│
├── Authentication (public + transitional)
│   ├── /login
│   ├── /register            (2 steps: name → credentials)
│   ├── /forgot-password
│   ├── /reset-password      (legacy oobCode form)
│   ├── /verify-email        (waiting room, auto-poll)
│   ├── /action              (universal Firebase email action handler)
│   ├── /cli-login           (CLI ↔ web token bridge)
│   ├── /onboarding          (name + questionnaire)
│   └── [VerifyPhone]        (component exists, not routed — see 3.6)
│
└── Dashboard (authenticated, email-verified)
    ├── /dashboard               Overview (Home)
    ├── /dashboard/projects      Projects  (alias /projects)
    │     └── ⤷ Project Detail (modal)
    ├── /dashboard/devices       Devices
    │     └── ⤷ Device Detail (panel/modal)
    ├── /dashboard/sessions      Sessions
    ├── /dashboard/keys          API Keys
    │     ├── ⤷ Create Key (modal)
    │     └── ⤷ Reveal Key (one-time modal)
    ├── /dashboard/activity      Activity
    ├── /dashboard/settings      Settings  (alias /settings)
    └── /dashboard/billing       Billing   (alias /billing)
```

### 3.2 Route inventory (complete)

**Marketing**

| Route | Purpose | Notes |
|---|---|---|
| `/` | Landing page | Renders all marketing sections |
| `/features` | Scroll to Features | Same component, hash-scroll |
| `/how-it-works` | Scroll to Workflow | Same component |
| `/pricing` | Scroll to Pricing | Same component |
| `/docs` | Docs | Currently renders Landing — placeholder, no content |
| `/blog` | Blog | Currently renders Landing — placeholder, no content |
| `/terms` | Terms of Service | Linked from Register; **route missing today** |
| `/privacy` | Privacy Policy | Linked from Register; **route missing today** |

**Authentication**

| Route | Purpose | Guard |
|---|---|---|
| `/login` | Sign in (email + Google + GitHub) | PublicAuthGuard |
| `/register` | Sign up (2-step + OAuth) | PublicAuthGuard |
| `/forgot-password` | Request reset link | PublicAuthGuard |
| `/reset-password` | Set new password (oobCode) | PublicAuthGuard |
| `/verify-email` | Post-signup verification waiting room | VerifyEmailRouteGuard |
| `/action` | Universal email-action handler | Public (opened from email) |
| `/cli-login` | CLI auth bridge (`?port=`) | Auth-aware (redirects to login) |
| `/onboarding` | Name + questionnaire | ProtectedRoute |

**Dashboard** (all behind `ProtectedRoute`: must be authenticated *and* email-verified)

| Route | Page | Alias |
|---|---|---|
| `/dashboard` | Overview | — |
| `/dashboard/projects` | Projects | `/projects` |
| `/dashboard/devices` | Devices | — |
| `/dashboard/sessions` | Sessions | — |
| `/dashboard/keys` | API Keys | — |
| `/dashboard/activity` | Activity | — |
| `/dashboard/settings` | Settings | `/settings` |
| `/dashboard/billing` | Billing | `/billing` |

### 3.3 Detail views and modals (complete)

Derivo deliberately renders resource detail as **overlays (modals/panels)**, not as routed sub-pages. This is intentional for speed (Principle 2.2). The redesign keeps overlay-based detail but must add deep-link support where it costs little (see 3.5 and Section 16).

| Overlay | Triggered from | Type | Contents / Actions |
|---|---|---|---|
| Project Detail | Projects card click | Centered modal | Name, ID (copyable), framework, env, status, last sync, created at; Delete, Close |
| Device Detail | Devices row click | Centered panel/modal | Status badge; ID, hostname, OS, arch, Node, CLI version, trusted, masked fingerprint, first registered, last seen, location; Rename (inline), Trust/Untrust, Log out, Revoke, Delete |
| Create API Key | API Keys "New Key" | Centered modal (form) | Name, environment (live/test), permission chips, tags; Cancel, Create |
| Reveal API Key | After key creation/rotation | Centered modal | One-time plaintext key, copy-once warning, Copy, Done |
| Confirm (destructive) | Devices/Keys/Sessions actions | Centered confirm modal | Title, consequence message, Cancel, Confirm (destructive styling) |
| Upgrade | Gated actions, banners | Centered modal | Premium feature list, Upgrade to Pro, Cancel |
| Command Palette | ⌘K / sidebar search | Top-anchored overlay | Search + keyboard-nav destinations |

Native browser dialogs currently used (`window.confirm` for project delete and account delete; `window.alert` for project delete errors) must be **replaced** by the unified Confirm modal and inline error patterns. This is a consistency fix (Principle 2.3), not a feature change.

### 3.4 Navigation hierarchy and grouping

The dashboard is intentionally **flat** — every page is one level deep. There are no breadcrumbs because there is no depth to trace; detail lives in overlays. The sidebar groups destinations into two bands:

- **Workspace (primary):** Overview, Projects, Devices, Sessions, API Keys, Activity.
- **Configuration (secondary):** Settings, Billing. Plus Sign Out as a terminal action.

**Spec — regrouping guidance.** The redesign *may* introduce a tighter semantic grouping to reduce the cognitive distance between related security surfaces, because Devices, Sessions, API Keys, and Activity form a coherent "access & security" cluster while Overview and Projects are "work." If regrouped, the recommended grouping is:

- **Workspace:** Overview, Projects
- **Security:** Devices, Sessions, API Keys, Activity
- **Configuration:** Settings, Billing

This is permitted (not required) and must preserve every destination. Rationale: it shortens the path between related tasks (revoke a device → check the resulting Activity event → confirm no orphaned sessions) and matches the operator's mental model of "my work" vs "who/what can access my account."

### 3.5 Relationships and data ownership

Understanding *where data comes from* is essential to designing correct empty states, loading states, and affordances. The IA reflects a strict ownership model:

- **Backend-owned, web-displayed-only:** subscription state, usage, limits, features, sessions, login history. The dashboard reads these via the API and never mutates them directly. Design implication: these surfaces are *read-and-act* (act = call an API that the backend authorizes), and their empty/error states reflect API reachability, not local data.
- **Backend-owned, web-can-mutate-via-API:** devices (trust/untrust/revoke/rename/delete), API keys (create/rotate/revoke/disable/enable), projects (create is CLI-driven; web can delete). Design implication: every mutation is an authorized API call with a loading + success/error cycle; optimistic UI is permitted only where the backend is the source of truth and refetch follows.
- **CLI-produced, web-displayed/governed:** projects, devices, sessions originate from CLI activity. Design implication: when these lists are empty, the empty state must direct the user to the CLI (install/command), because the web app *cannot* create them (projects) or they simply do not exist yet (devices/sessions).
- **Firebase-owned (client SDK):** authentication, profile name/avatar, provider linking, account deletion. Design implication: these flows show Firebase-mapped friendly errors and operate client-side.

**Cross-surface relationships that the design must make legible:**

1. **Device → CLI access.** Revoking/untrusting a device immediately changes what the CLI can do (`/api/cli/verify` checks `x-device-id`). The Devices detail must state this consequence (it does today) and the redesign must keep that copy.
2. **Subscription → gated actions.** Project creation and key creation/rotation are gated by the backend (`requireFeature`). The web reflects this with banners and the Upgrade modal. The design must keep the gate visible *before* the user attempts the action (don't let them fill a form then fail).
3. **Session refresh → forced re-login.** Refresh-token reuse triggers full session revocation. Activity surfaces `refresh_failed`/`token_revoked` events. The design must make these high-severity events visually distinct in the Activity timeline.
4. **Registration → trial.** Account registration writes the authoritative subscription (3-day trial or inherited state). Onboarding and the first dashboard view must reflect real trial state from the backend, never a fabricated local trial.

### 3.6 Known IA anomalies the design must address (without removing capability)

The Product Structure Report surfaced several anomalies. The design must resolve their *presentation* while preserving every real capability:

- **Orphaned VerifyPhone page.** A phone-OTP trial-activation flow exists as a component but is not routed; the backend `/api/trials/verify-phone` is live. The design must define the VerifyPhone page (Section 12) so that if/when it is routed, it conforms — but must not assume it is part of the default signup flow today.
- **Two trial paths.** Trial can be granted at registration (auto, 3-day) and via phone verification. The design must present trial state from a single backend-computed source (`/api/subscription`) so the UI never shows two conflicting trial truths.
- **Plan-name inconsistency.** Backend plans (free/trial/pro/enterprise) vs marketing pricing (Community $0 / Team $12) vs dashboard labels (Community / Pro Trial / Pro Plan). The design defines a single canonical label mapping (Section 8.7 and Section 12 Billing) so a given plan reads identically everywhere.
- **Trial-length inconsistency.** Marketing says "14-day"/"Start 14-day Trial" while the product grants 3 days. The design must standardize displayed trial length to the backend truth and flag the marketing copy for correction (copy is a design material; see Section 12 Landing).
- **Decorative controls.** Projects search/filter, project-card overflow menu, "Install CLI" button, and Billing "Upgrade"/"Manage Subscription" are non-functional today. The design must either specify their real behavior or specify a disabled/forthcoming treatment — never present a dead control as live (Principle 2.10).
- **No Plugins / no Admin UI.** The CLI has a full plugin platform and the backend has admin endpoints, but neither has a dashboard surface. The design must reserve IA slots and rules for these (Section 16) without inventing them now.

---

## 4. Navigation System

Navigation is the connective tissue of the dashboard and the most-used interface in the product. Because Derivo is keyboard-first and visited in short, purposeful sessions, navigation must be instant, predictable, and reachable without the mouse. This section specifies every navigation mechanism.

### 4.1 Primary sidebar (desktop)

**Spec.** A fixed, full-height left rail, 240px wide, pinned to the viewport (`position: fixed`), with its own internal scroll if content overflows. It is present on every dashboard page and is the canonical map of the product. It does not collapse on desktop (≥768px). The main content area is offset by the sidebar width.

**Structure, top to bottom:**

1. **Brand block** (64px tall, hairline bottom border): Derivo logo mark + wordmark. Clicking returns to Overview. Not a marketing link inside the app.
2. **Search trigger** (full-width button): opens the Command Palette. Shows a search icon, "Search…" placeholder text, and a `⌘K` keyboard hint rendered in monospace. This is the primary discoverability path for the palette.
3. **Workspace nav group:** Overview, Projects, Devices, Sessions, API Keys, Activity. Each item: leading icon (16px), label, full-row hit target, active/hover states.
4. **Configuration nav group:** preceded by a monospace uppercase micro-label ("CONFIGURATION"). Items: Settings, Billing. Followed by **Sign Out** as a distinct destructive-tinted action.
5. **User block** (pinned bottom, hairline top border): avatar (or initial fallback), display name, plan label, and a secondary sign-out icon button.

**Active state spec.** The active item uses an elevated surface fill (`white/[0.06]`) and full-opacity white text; inactive items use ~50% white text and reveal a subtle fill on hover with text rising to ~80%. The active indicator must not rely on color alone — the fill + text-weight contrast carries it (Principle 2.5). Overview uses an exact-match active rule (`end`) so that sub-routes do not falsely mark it active.

**Rationale for 240px.** Wide enough for icon + label + comfortable padding without truncating any current label ("API Keys", "Configuration"), narrow enough to leave a generous content column at common laptop widths (1280–1440px). A persistent labeled rail beats an icon-only collapsed rail for this audience because the destinations are visited infrequently enough that icon recognition is unreliable, and the labels double as the product's vocabulary.

**Duplicate sign-out resolution.** Today sign-out appears twice (nav action + user-block icon). The redesign keeps **one** primary Sign Out in the nav/config area and **may** keep the user-block as a hover-revealed affordance, but must not present two equally-weighted sign-out buttons (Principle 2.3). Recommended: user block opens a small menu (sign out, settings) on click; the explicit Sign Out row remains for discoverability.

### 4.2 Topbar

**Spec (desktop).** Derivo does **not** use a global top bar on desktop dashboard pages. Page identity lives in the page's own header (title + subtitle + page-level actions). This is deliberate: a top bar would duplicate the sidebar and steal vertical space from dense lists. The only persistent global chrome on desktop is the sidebar.

**Spec (mobile).** A fixed top bar (56px) appears below 768px: brand mark + wordmark on the left, hamburger toggle on the right. It is translucent with backdrop blur to preserve context while scrolling. See Section 6.

**Page header (the de-facto in-content topbar).** Every dashboard page opens with a header region containing: an H1 page title, a one-line subtitle describing the page's purpose, and right-aligned page-level actions (e.g., Refresh, primary action like "New Key"). This header is the consistent anchor users orient to. Spec details in Section 5.6 and per-page in Section 12.

### 4.3 Command Palette

**Spec.** A modal overlay anchored near the top of the viewport (~15vh), opened by `⌘K`/`Ctrl+K` from anywhere in the dashboard, or by the sidebar search trigger. It contains a single text input and a filtered, keyboard-navigable result list. It is the keyboard spine of the product (Principle 2.4).

**Behavior:**
- Opens with the input focused and query cleared; selection resets to the first item.
- Typing filters results case-insensitively by label.
- `↓`/`↑` move selection (wrapping); `Enter` activates; `Escape` closes; clicking the backdrop closes.
- Mouse hover updates selection so mouse and keyboard never disagree about the highlighted item.
- Shows an explicit "No results for '<query>'" empty state.

**Contents — Spec (must expand beyond today).** The palette currently lists Overview, Projects, Devices, API Keys, Settings, Billing — it **omits Sessions and Activity**, a consistency defect. The redesign **must** include every sidebar destination:

- Navigation: Overview, Projects, Devices, Sessions, API Keys, Activity, Settings, Billing.

It **should** additionally include high-value *actions* grouped under a separate "Actions" heading, because the palette is the fastest path for power users:

- Actions: New API Key, Refresh current page, Sign out, Go to Billing/Upgrade, Copy current resource ID (context-dependent).

Results are grouped under monospace uppercase section headings ("Navigation", "Actions"). Each row shows a leading icon, the label, and — for the selected row — a trailing arrow or `↵` hint. Action rows that are gated (e.g., New API Key when not permitted) must either be hidden or shown disabled with a reason, never silently fail.

**Rationale.** The palette is where Derivo's keyboard-first promise is kept or broken. Omitting destinations forces users back to the mouse and teaches them not to trust the palette. Adding actions turns it from a teleporter into a true command surface, matching the Linear-class expectation the audience holds.

### 4.4 Breadcrumbs

**Spec.** No breadcrumbs in the current flat IA. Detail views are overlays over their list, so the "trail" is implicit (a Device detail is always reached from Devices). Breadcrumbs are therefore omitted by design.

**Future rule (Section 16).** If a future surface introduces genuine routed depth (e.g., a routed Project Detail page with sub-tabs, or a routed Admin area), breadcrumbs become required at depth ≥2, rendered in the page header, using monospace separators and muted intermediate crumbs with a full-contrast current crumb. Until depth exists, breadcrumbs must not be added as decoration.

### 4.5 Search

There are two distinct search modalities; they must not be conflated:

1. **Global navigation search** = the Command Palette (4.3). It searches *destinations and actions*, not data.
2. **In-page resource search** = a local filter input at the top of a resource list. It filters the currently-loaded list client-side.

**In-page search spec.** Where it exists (Devices, API Keys, Activity), it is a single input with a leading search icon, placeholder naming the resource ("Search devices…", "Search keys…", "Search events…"), and it filters as the user types across the relevant fields (e.g., device name/OS/ID; key name/tags; event type/detail/deviceId). Clearing it restores the full list. It must reset pagination to page 1 on change (Activity).

**Projects search — Spec (fix required).** Projects renders a search input that does nothing today. The redesign must make it functional (filter by name/framework/env) consistent with Devices/Keys, **or** remove it. Presenting a dead search input violates Principle 2.10. Functional is strongly preferred — search is expected on a list and its absence is more surprising than its presence.

### 4.6 Secondary navigation

Within a page, secondary navigation appears as **filter tabs** (Activity: All / Auth / Security / Devices) and **segmented toggles** (API Key create: live / test environment). These are page-local controls, not global navigation, and are specified in the Component Library (Tabs, Segmented Control) and per-page (Section 12). Secondary navigation never duplicates the sidebar.

### 4.7 Context menus

**Spec.** Derivo does not use right-click OS context menus. The product's analog is the **overflow / actions affordance** — the "more" (vertical ellipsis) control on cards and the action row inside detail panels.

**Overflow menu — Spec (fix required).** The Projects card overflow (⋮) renders but opens nothing today. The redesign must make the overflow open a small menu of that card's actions (at minimum: Open details, Delete) **or** remove the affordance. A visible menu trigger that does nothing is a defect (Principle 2.10). When implemented, the overflow menu is a small popover anchored to the trigger, keyboard-navigable, dismiss-on-Escape/outside-click, with destructive items visually separated and tinted.

### 4.8 Keyboard shortcuts (canonical map)

**Spec — global:**

| Shortcut | Action | Scope |
|---|---|---|
| `⌘K` / `Ctrl+K` | Open/close Command Palette | Anywhere in dashboard |
| `Esc` | Close palette / modal / panel / menu | When an overlay is open |
| `↑` / `↓` | Move selection | Command Palette; list contexts |
| `↵` Enter | Activate selection / submit focused form | Palette, forms |

**Spec — recommended additions (the redesign should implement these to fulfill keyboard-first):**

| Shortcut | Action |
|---|---|
| `g` then `o` | Go to Overview |
| `g` then `p` | Go to Projects |
| `g` then `d` | Go to Devices |
| `g` then `s` | Go to Sessions |
| `g` then `k` | Go to API Keys |
| `g` then `a` | Go to Activity |
| `g` then `b` | Go to Billing |
| `g` then `,` | Go to Settings |
| `r` | Refresh current resource list |
| `n` | Primary create action on current page (e.g., New Key on API Keys) |
| `?` | Open keyboard-shortcut help overlay |

**Rationale.** "Go to" chords (Linear/GitHub convention) make the dashboard navigable entirely from the keyboard and are discoverable via the `?` help overlay. They are additive — they never replace clickable navigation. Shortcuts must be suppressed while a text input is focused (except `Esc`/`Enter`), and disabled when `prefers-reduced-motion` does not apply to them (shortcuts are motion-independent).

**Shortcut discoverability.** Every shortcut must be discoverable: the palette shows hints, the `?` overlay lists all shortcuts grouped by category, and tooltips on key controls show their shortcut. A shortcut that users cannot discover is not a feature.

---

## 5. Desktop Layout

This section defines the structural skeleton of every authenticated desktop screen: the grid, container widths, spacing rhythm, the sidebar/content relationship, and the canonical layouts (list, list-with-detail, form, dashboard-overview). Marketing and auth layouts are specified in Section 12.

### 5.1 The application frame

**Spec.** The dashboard is a two-zone frame:

- **Sidebar zone:** fixed, 240px, full height, left-pinned (Section 4.1).
- **Content zone:** fills the remainder, offset left by 240px, owns vertical scroll. The content zone is itself two-layered: a scroll container, and inside it a centered max-width column.

The canvas background is the darkest surface in the system (near-black, `#050505`). The sidebar shares this canvas with a hairline right border separating it from content. There is no separate header chrome on desktop; page headers live inside the content column.

**Rationale.** A fixed sidebar + scrolling content is the standard control-plane frame (Linear, Vercel, Stripe) because it keeps navigation permanently available while letting dense content scroll independently. Sharing the canvas color (rather than tinting the sidebar) keeps the interface calm and lets hairline borders, not fills, do the structural work — consistent with Clarity over decoration.

### 5.2 Content column and container widths

**Spec.** The content column is centered within the content zone with horizontal padding and a max width that varies by page type:

- **Standard list / overview pages** (Overview, Projects, Devices, Sessions, API Keys, Activity): max width **1152px** (`max-w-6xl`), horizontal page padding 24px (mobile) → 40px (desktop), generous top padding.
- **Reading / settings pages** (Settings): narrower max width **768px** (`max-w-3xl`) to keep form line-lengths comfortable and scannable.
- **Billing**: intermediate max width **896px** (`max-w-4xl`) to accommodate the two-column plan/usage layout without sprawl.

**Rationale.** Different content has different ideal measure. Forms and prose read best in a narrow column (45–75 characters per line); dense resource lists and multi-card overviews want more horizontal room. Capping width prevents lists from stretching into unreadable full-bleed rows on ultra-wide displays (Section 15). These three widths already exist in the product and are correct; the redesign formalizes them as the only three content widths.

### 5.3 Spacing system

**Spec.** All spacing derives from a 4px base unit. The canonical steps are 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 (see Section 9 for tokens). Layout rhythm:

- **Page top padding:** 24px mobile, 40px desktop.
- **Header-to-content gap:** 32px (`gap-8`) — the standard vertical gap between major page sections.
- **Intra-section gap:** 16px (`gap-4`) between rows/cards in a list.
- **Card internal padding:** 20px (`p-5`) for list cards, 24px (`p-6`) for detail/section cards.
- **Form field gap:** 16px between fields; 6px between a label and its input.
- **Inline control gap:** 8–12px between adjacent buttons/badges.

**Rationale.** A single base unit with a constrained step set is what produces the "dense but readable" rhythm (Principle 2.6). The constraint is the feature: when every gap is a multiple of 4 drawn from a small set, surfaces feel composed even at high density, and designers stop guessing. The 32px major-section gap is the heartbeat of the dashboard — it is the gap between a page header and its body, and between stacked sections within a page.

### 5.4 The grid

**Spec.** Within the content column, layouts use a 12-column conceptual grid with a 16–24px gutter, but most pages use simpler flex/auto-fit patterns:

- **Overview status cards:** 3 equal columns on desktop (`md:grid-cols-3`), collapsing to 1 on mobile.
- **Overview body:** a 3-column grid where Recent Projects spans 2 and Activity spans 1 (`lg:grid-cols-3`, projects `lg:col-span-2`).
- **Projects grid:** responsive auto-fit, 1 → 2 → 3 columns (`md:grid-cols-2 xl:grid-cols-3`).
- **Billing:** 2 columns (plan | usage) on desktop, stacking on mobile.
- **Settings:** single column of stacked sections, full content width (768px).
- **Resource lists (Devices, Sessions, Keys, Activity):** single-column stacks of full-width rows/cards (not multi-column) so each row can present a rich summary line.

**Rationale.** Multi-column grids serve *browsable* content (projects you scan visually); single-column row stacks serve *triage* content (devices/keys/sessions you read line by line and act on). Matching grid shape to task is why Projects is a card grid while Devices is a row list — and the redesign must preserve this distinction rather than homogenizing everything into one shape.

### 5.5 Sidebar and content relationship

**Spec.** The sidebar is independent of content scroll: it stays fixed while content scrolls. When content is loading, the sidebar remains fully interactive (navigation never waits on data). The content zone's scroll container is the *only* vertical scroll on the page; there are no nested scroll regions on standard pages except inside tall detail panels/modals, which get their own internal scroll with the header/footer pinned.

**Rationale.** Keeping navigation always reachable and always responsive — even mid-load — is core to "fast to enter, fast to leave." Nested scrollbars are disorienting and break keyboard scrolling; the single-scroll rule keeps the mental model simple.

### 5.6 The page header pattern

**Spec.** Every dashboard page begins with a header block:

- **Left:** H1 page title (e.g., "API Keys") and a one-line muted subtitle stating the page's purpose (e.g., "Programmatic access tokens for the Derivo API and CLI.").
- **Right:** page-level actions, right-aligned, in a horizontal cluster. Order: secondary/utility actions first (Refresh), primary action last and visually dominant (solid white button, e.g., "New Key").
- The header sits above a 32px gap before the body.
- On mobile, the header stacks: title/subtitle, then actions full-width or wrapped.

**Rationale.** A consistent header is the orientation anchor — users always know where they are and where the primary action is. Placing the primary action top-right, rendered as the single highest-contrast control, satisfies Information hierarchy (one primary thing per view) and matches platform convention so users find it without searching.

### 5.7 Canonical layouts

The dashboard is built from four repeatable layouts. Every page is an instance of one.

**A. Overview layout (dashboard home).** Header → optional full-width status banner (trial/expired) → row of summary status cards → multi-column body mixing a primary list (Recent Projects) and a secondary timeline (Activity). Used only by Overview. It is a *glanceable summary*, not a working surface; its lists are truncated (top 3 projects, top 4 activity) with "View all" links to the full pages.

**B. Resource list layout.** Header → optional gating banner → controls row (search, filters, refresh) → list/grid of resource summaries → optional pagination. Used by Projects, Devices, Sessions, API Keys, Activity. The list body swaps between four states (loading skeleton / error / empty / populated) in the *same* layout slot so the page never reflows between states (Principle 2.9).

**C. List-with-detail layout.** Resource list layout + an overlay (modal or right-aligned panel) that presents the full record and full action set for a selected item. Used by Projects (modal), Devices (panel). The overlay traps focus, scrolls internally if tall, and pins its header (title + close) and footer (actions).

**D. Settings/form layout.** Header → stacked sections, each a titled card containing related fields or controls, separated by the 32px major gap, ending with a clearly-separated Danger Zone for destructive account actions. Narrow column (768px). Used by Settings; the pattern also governs any future preferences surface.

**Spec — layout selection rule.** A new page must adopt one of these four layouts. Introducing a fifth layout requires documenting why none of the four fit and adding it to this section as canonical (Principle 2.3, Section 16).

### 5.8 Cards on desktop

**Spec.** Cards are the primary container. Three card roles:

- **Stat card** (Overview): tall, padded (20px), a label + large value + small sub-metric, optional hover-revealed link. Subtle gradient permitted only on the single "feature" stat (subscription).
- **Resource card** (Projects): clickable, padded (20px), title + monospace meta line + footer status row, hover border-lighten and faint glow, overflow affordance top-right. The whole card is the hit target for opening detail.
- **Section card** (Settings/Billing): padded (24px), a titled grouping of fields/rows, hairline border, no hover state (not clickable as a whole).

Cards use hairline borders (`white/[0.06]`) on near-flat fills (`white/[0.01]`–`white/[0.03]`). Elevation is communicated by border-lightening on hover, not by drop shadows, except for overlays which do use shadow (Section 9.5).

**Rationale.** Border-defined cards on a flat canvas keep the interface calm and let the eye group content without heavy chrome. Reserving real shadows for overlays creates a clear two-tier elevation model: in-flow content (borders) vs floating content (shadow + backdrop). This is legible and cheap to render.

### 5.9 Tables vs row-lists on desktop

**Spec.** Derivo has no dense data tables today; all tabular data is row-lists or timelines. The redesign **keeps row-lists as the default** for the current resources because each row benefits from a rich, multi-element summary (icon + name + meta + status badge + inline actions) that a strict column table would cramp.

A true **table** component is nonetheless specified (Section 11) and should be adopted *only* when a future surface needs sortable, alignable columnar data (e.g., a usage history, an audit export, or an admin user list). When a table is used, it follows the table spec: sticky header, zebra-free hairline row separators, right-aligned numerics, sortable column headers with explicit sort indicators, and the same four list-states.

**Rationale.** Choosing row-lists over tables for identity/security resources is deliberate: triage tasks read better as rich rows than as columns of truncated cells. But the system must own a real table so future columnar needs don't spawn a bespoke one (Principle 2.3).

### 5.10 Content hierarchy on a page

**Spec.** Reading order and visual weight descend predictably: page title (largest, full contrast) → section headers (medium, full contrast) → primary values/names (medium, high contrast) → supporting labels (small, ~50% contrast) → metadata (smallest, often monospace, ~40% contrast). Status badges punctuate this hierarchy with color-encoded meaning adjacent to the entity they describe. Exactly one element per view carries primary-action emphasis (solid white button).

**Rationale.** A strict, repeated weight ladder lets users parse any page using the same scan pattern, which is what makes a dense product feel effortless. The metadata-in-monospace convention signals "machine data" and visually demotes it without hiding it (Progressive disclosure).

---

## 6. Mobile Layout

Mobile is a first-class but secondary context for Derivo. The operator does most work in a terminal at a desk; mobile usage is occasional and reactive — checking trial status, revoking a device or session from a phone after losing a laptop, confirming an alert from an email. The mobile design therefore optimizes for **legibility, safe destructive actions, and quick triage**, not for heavy creation flows.

### 6.1 Breakpoints

**Spec.** The system uses these breakpoints (Tailwind-aligned, since the product is built on them):

| Token | Min width | Primary use |
|---|---|---|
| (base) | 0 | Mobile portrait |
| `sm` | 640px | Large phones / small tablets portrait |
| `md` | 768px | **Sidebar appears; mobile chrome disappears.** Tablet landscape / small laptop |
| `lg` | 1024px | Laptop; multi-column overview body |
| `xl` | 1280px | Desktop; 3-column project grid |
| `2xl` | 1536px | Large desktop / ultra-wide handling (Section 15) |

**The critical breakpoint is `md` (768px):** below it, the fixed sidebar is replaced by the mobile top bar + drawer; at and above it, the desktop frame applies. There is exactly one navigation transformation, at one breakpoint. Rationale: a single nav breakpoint is predictable and testable; multiple nav transitions create ambiguous in-between states.

### 6.2 Mobile navigation

**Spec.** Below `md`:

- A **fixed top bar** (56px) replaces the sidebar: brand mark + wordmark left, hamburger toggle right. Translucent background with backdrop blur, hairline bottom border, elevated z-index so it floats above scrolling content. Content gets top padding equal to the bar height.
- Tapping the hamburger opens a **full-screen drawer overlay** (not a partial sheet): it covers the viewport below the top bar, animates in (fade + slight downward translate), and contains the same navigation as the sidebar — search trigger, Workspace group, Configuration group, Sign Out.
- The drawer closes on navigation (route change), on toggle, and on selecting any item.
- The hamburger icon swaps to a close (X) icon while open; both states are labeled for screen readers (`aria-expanded`).

**Rationale.** A full-screen drawer (vs a slim slide-in) gives navigation items large, comfortable touch targets and removes the need to fight a cramped rail on small screens. Auto-closing on navigation matches user expectation and prevents the drawer from masking the destination. The translucent blurred top bar preserves spatial context during scroll without occupying much vertical space — scarce on phones.

### 6.3 Mobile content and cards

**Spec.**
- All multi-column grids collapse to a single column below `md`. Overview's three stat cards stack; the projects grid becomes one column; Billing's two columns stack (plan above usage).
- Page headers stack: title/subtitle first, then actions. The primary action becomes full-width (`w-full`) so it is a comfortable tap target; secondary/utility actions sit in a row above or beside it.
- Resource rows remain single-column (they already are) and keep their summary line; long metadata lines wrap rather than truncate where the information is decision-relevant.
- Detail overlays become near-full-screen sheets with internal scroll, pinned header (title + close) and pinned footer (actions). Action rows that wrap to multiple lines must keep destructive actions visually grouped and not adjacent to the close affordance.

**Rationale.** Single-column stacking is the only layout that reliably fits a phone without horizontal scroll or sub-readable text. Full-width primary buttons and full-screen detail sheets respect the larger touch target requirement (Section 14.7) and the reality that phone users act deliberately, one thing at a time.

### 6.4 Responsive rules (general)

**Spec — the redesign must obey these rules everywhere:**

1. **Never truncate decision-critical data on mobile.** Wrap instead. A device's status or a key's expiry must remain fully readable; a long secondary tag may truncate with an accessible full value.
2. **Promote the primary action.** On mobile the primary action is full-width and bottom-anchored within its header/section; on detail sheets it pins to the footer.
3. **Collapse, don't hide.** Responsive layout reflows content into one column; it must not remove actions or information available on desktop. Everything desktop can do, mobile can do (Principle: preserve functionality).
4. **Touch-first sizing.** Interactive targets meet the minimum touch size (Section 14.7). Hover-only affordances (e.g., desktop card hover-reveal links) must have an always-visible or tap-equivalent alternative on touch devices.
5. **One scroll.** The page scrolls; overlays scroll internally. No nested page scrolls.

### 6.5 Mobile-priority surfaces

**Spec.** These surfaces are most likely to be used on mobile and must be verified to work well there in the redesign:

- **Devices** and **Sessions** — emergency revocation from a phone (lost laptop scenario). Detail sheets, confirmation dialogs, and destructive actions must be flawless on touch.
- **Billing / Overview trial status** — checking "how long is left" on the go.
- **Email-action page (`/action`)** — verification and password-reset links are frequently opened on phones from email clients. This page must be fully responsive and self-contained (it already uses a minimal, dependency-light layout — preserve that).
- **Login / Verify Email** — sign-in from a new device.

Heavy creation surfaces (API Key create form) must function on mobile but are not optimized as primary mobile tasks; the form stacks vertically and remains fully usable.

---

## 7. Typography

Typography carries most of the hierarchy in a near-monochrome, border-defined interface. With color reserved for meaning and ornament removed, type size, weight, opacity, and family do the work of guiding the eye. This section defines the type system precisely.

### 7.1 Type families

**Spec.**
- **Sans (UI / prose):** Inter (variable), via `@fontsource-variable/inter`. Used for all human-readable text: titles, labels, body, button text, descriptions. Fallback stack: `Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- **Mono (machine data):** the system monospace stack (`ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`). Used for anything produced or consumed by a machine: IDs, fingerprints, key previews/plaintext, plan identifiers, keyboard hints, code/command snippets, the CLI demo, uppercase micro-labels, and numeric usage counters.

**Rationale.** The sans/mono split is the product's core typographic signal. Monospace says "this is data, not prose" — a developer instantly reads a monospace string as copyable/identifying. Using mono for micro-labels and keyboard hints reinforces the terminal-adjacent brand without resorting to decoration. Inter is chosen for its excellent legibility at small sizes and its variable weights, essential for a dense UI.

### 7.2 Heading scale

**Spec.** The type scale is restrained — Derivo has few heading levels because pages are flat. Sizes in px (rem in parentheses assuming 16px root):

| Role | Size | Weight | Tracking | Usage |
|---|---|---|---|---|
| Display (marketing only) | 48–60 (3–3.75rem) | 700 | -0.02em | Landing hero |
| H1 — page title | 24–30 (1.5–1.875rem) | 700 | -0.01em | Dashboard/auth page titles |
| H2 — section header | 14–16 (0.875–1rem) | 600 | normal | Section titles within a page |
| H3 — card/group title | 14–16 | 600 | normal | Card titles, modal titles (18/1.125rem for modals) |
| Eyebrow / micro-label | 10–11 (0.625–0.6875rem) | 600 | 0.1em, UPPERCASE | Group labels ("CONFIGURATION"), section eyebrows; **monospace** |

**Rationale.** A small set of heading roles keeps hierarchy unambiguous. The big jump from H1 (24–30px) to H2 (14–16px) is intentional: the page title dominates, and section headers are deliberately modest because the *content* (lists, values) is the focus, not the section chrome. Negative tracking on large text tightens display/H1 for a composed look; positive tracking + uppercase on micro-labels gives them a distinct "system label" texture.

### 7.3 Body, labels, and supporting text

**Spec.**

| Role | Size | Weight | Opacity (on dark) | Usage |
|---|---|---|---|---|
| Body | 14 (0.875rem) | 400–500 | 90% | Primary readable content, descriptions in cards |
| Body-strong | 14 | 600 | 90–100% | Emphasis within body, resource names |
| Label | 12 (0.75rem) | 500 | 70% | Form labels, key/value labels |
| Secondary | 12–13 | 400 | 50% | Subtitles, helper text |
| Metadata / caption | 10–11 | 400–500 | 40% | Timestamps, counts, fine print; often **monospace** |
| Button text | 12–14 | 600 | per button variant | All buttons |

**Spec — opacity floor.** Text smaller than 13px must not drop below **45% white opacity** on the standard dark surfaces, and primary body text must meet WCAG AA (Section 8/14). The current product uses 30–40% for the finest metadata; the redesign raises the floor for any text that must be *read* (timestamps, counts) to ~45–50%, reserving 30% only for purely decorative or duplicated text. Rationale: dense + dark + tiny + low-opacity is the exact recipe for failing contrast; the floor protects legibility without sacrificing the muted aesthetic.

### 7.4 Code and machine data

**Spec.** Monospace text appears in several contexts, each with a treatment:

- **Inline ID / preview** (e.g., `proj_8f3a…`, `drv_••••…`, masked fingerprint): mono, 11–12px, often on a faint inset chip (`white/[0.02]–[0.04]` fill + hairline border + small radius) to signal "copyable token." `select-all` where the whole value is meant to be copied.
- **One-time secret reveal** (full API key plaintext): mono, in a bordered block with break-all wrapping and an adjacent Copy button; accompanied by an amber warning that it won't be shown again.
- **Keyboard hints** (`⌘K`, `ESC`, `↵`): mono, 9–11px, on a subtle keycap chip (`white/[0.1]` fill, small radius), reduced opacity.
- **Command/CLI snippets** (landing CLI demo, empty-state commands): mono, in a Code Block component (Section 11) with a copy affordance and, where shown, a terminal-style frame.

**Rationale.** Distinguishing machine data from prose with monospace is the single most important typographic decision in the product. The keycap and token-chip treatments are micro-affordances that tell the user, without words, "this is a key you press" or "this is a value you copy."

### 7.5 Tables and numerics

**Spec.** In any tabular/columnar context (usage rows, future tables), numeric values use **tabular figures** (monospace or Inter's tabular-nums) and are right-aligned within their column so digits align for comparison. Usage counters render as mono (`used / limit`, with `∞` for unlimited). Currency in billing renders with consistent decimal precision and aligned decimals.

**Rationale.** Misaligned proportional digits make quantities hard to compare at a glance — unacceptable on usage and billing surfaces where the number *is* the content. Tabular figures fix this for free.

### 7.6 Line length, leading, and wrapping

**Spec.**
- **Body leading:** 1.5–1.6 for descriptions and prose; 1.4 for dense single-line labels.
- **Measure:** prose blocks (auth subtitles, empty-state descriptions, confirmation messages) capped at ~60ch via `max-w-xs/sm/md` containers so they never run edge-to-edge.
- **Truncation:** single-line truncation (`truncate`) only for non-critical, space-constrained labels (e.g., a device name in a tight row), always with the full value available on hover/focus (title attribute) or in the detail view. Decision-critical values never truncate (Section 6.4).
- **Headings** do not wrap awkwardly; page titles are short by construction.

**Rationale.** Tight measure on prose preserves readability in a wide content column; controlled truncation preserves row scannability without hiding information from the user who needs it.

### 7.7 Letter spacing and case

**Spec.**
- Negative tracking (-0.01 to -0.02em) on large/bold text (display, H1) for optical tightness.
- Default tracking on body and headings H2/H3.
- Positive tracking (0.08–0.12em) only on uppercase micro-labels.
- UPPERCASE is reserved for micro-labels/eyebrows and short status words inside small pills (e.g., "EXPIRED"). Body and button text use sentence case. Title case is avoided except in proper nouns and product names.

**Rationale.** Uppercase is a powerful but expensive signal — reserving it for tiny system labels makes those labels legible and keeps the rest of the UI calm. Sentence case in buttons ("Create key", "Log out") reads as direct and human, matching the terse, respectful voice.

### 7.8 Typographic do-nots

**Spec — prohibited:**
- No more than the defined heading roles; do not invent intermediate sizes per page.
- No italic for emphasis in UI (italics are reserved, if ever, for genuinely citational text); use weight/opacity instead.
- No center-aligned body paragraphs except in deliberately centered empty/success/auth states.
- No all-caps body text or all-caps buttons.
- No font families beyond the sans and mono stacks.

**Rationale.** Each prohibition closes a common path to inconsistency. The constraint set is what keeps a dense product coherent as it grows (Principle 2.3, Section 16).

---

## 8. Color System

Derivo is monochrome-first: a near-black canvas, white at graded opacities for text and structure, and a tightly-scoped palette of semantic accents that encode *meaning only*. This section defines every color role, the dark theme (the only theme today), and the forward-looking light theme rules.

### 8.1 Color philosophy

**Spec.** Color in Derivo is a **signal, not a surface treatment.** The interface is built from black and white (opacity-graded); the semantic palette (emerald, amber, red, blue) appears only to communicate status, severity, or category. The one exception is amber's secondary role as the "premium/upgrade" brand warmth — the only place color is used for marketing emotion inside the app, and it must stay confined to upgrade/trial moments.

**Rationale.** When color always means something, users learn to read it instantly: emerald = good/active, amber = attention/trial, red = danger/stop, blue = info/scope. If color were also decorative, this learned mapping would break and every colored element would require a second look — fatal on security/billing surfaces. Monochrome-first also makes the product feel calm, serious, and fast.

### 8.2 Neutrals — surfaces (dark theme)

**Spec.** Surfaces are near-black with white overlays creating elevation tiers. Canonical values:

| Token | Value | Role |
|---|---|---|
| `canvas` | `#050505` | App background, sidebar |
| `surface-1` | `#0a0a0a` | Raised panels, command palette, inputs (action page) |
| `surface-2` | `#0b0b0b` | Modals, detail panels, dialogs |
| `surface-overlay-01` | `white @ 1%` | Faint card fill on canvas |
| `surface-overlay-02` | `white @ 2–3%` | Card fill, hover base |
| `surface-overlay-05` | `white @ 5–6%` | Active nav, hovered control, elevated chip |
| `surface-overlay-08` | `white @ 8–10%` | Strong hover, keycap chips |

**Rationale.** Building elevation from white overlays on a single near-black base (rather than from distinct gray values) keeps the palette coherent and makes translucency/blur effects (modals, mobile top bar) blend naturally. The tiny percentage steps are what give the dense UI its layered-but-calm feel.

### 8.3 Neutrals — text & borders (dark theme)

**Spec — text opacities (white on dark):**

| Token | Opacity | Role |
|---|---|---|
| `text-primary` | 90–100% | Titles, key values, active nav |
| `text-secondary` | 70% | Labels, body emphasis |
| `text-muted` | 50% | Subtitles, helper text, inactive nav |
| `text-faint` | 40–45% | Metadata, timestamps (floor: 45% if it must be read) |
| `text-disabled` | 30% | Decorative/duplicated text only |

**Spec — borders:**

| Token | Value | Role |
|---|---|---|
| `border-subtle` | `white @ 4%` | Internal dividers, section separators |
| `border-default` | `white @ 6–8%` | Card/panel/input borders |
| `border-strong` | `white @ 10–20%` | Hover/focus border lighten, input focus |
| `border-dashed` | `white @ 10%` dashed | "Empty / not connected" slots (e.g., unlinked provider) |

**Rationale.** A graded opacity ladder for text is how a monochrome UI expresses hierarchy (Section 7). Hairline borders at 4–8% are the structural workhorses — visible enough to group, quiet enough to disappear into the calm canvas. The dashed-border convention for empty/unconnected slots is an existing, good pattern (Settings provider rows) and is canonized here.

### 8.4 Semantic accents

Each accent is defined as a triplet: a translucent **fill** (~10% of the hue), a **text/icon** color (~400-level hue), and a **border** (~20% of the hue), plus a solid **dot** for status. This mirrors the existing `StatusBadge` tone system and must be the single source for semantic color.

**Spec:**

| Accent | Meaning | Fill | Text/Icon | Border | Dot |
|---|---|---|---|---|---|
| **Emerald (success)** | Active, healthy, online, connected, synced, current session | emerald @ 10% | emerald-400 | emerald @ 20% | emerald-500 |
| **Amber (warning/trial/premium)** | Trial, grace, attention, near-limit, untrusted, premium/upgrade | amber @ 10% | amber-400/500 | amber @ 20% | amber-500 |
| **Red (danger/error/expired)** | Destructive actions, errors, expired/revoked, security alerts | red @ 10% | red-400 | red @ 20% | red-500 |
| **Blue (info/scope)** | Informational, refresh events, scopes/permissions, selected scope chips | blue @ 10% | blue-400 | blue @ 20% | blue-500 |
| **Neutral (default/gray)** | Neutral status, disabled, last-seen, generic | white @ 4% | white @ 50% | white @ 8% | white @ 40% |

**Rationale.** Codifying each accent as fill/text/border/dot guarantees that a "warning" looks identical whether it's a badge, a banner, or a progress bar near its limit. The 10/400/20 recipe produces accessible, low-glare colored elements on the dark canvas (the translucent fill never blows out; the 400-level text stays legible). The dot lets status read even where the fill is subtle and supports the "never color alone" rule (the dot pairs with a text label).

### 8.5 Accent usage map (where each color is allowed)

**Spec.**
- **Emerald:** active subscription, online device, current session badge, synced project status dot, success alerts, unlimited-usage bar.
- **Amber:** trial status, grace period, trial countdown bar, near-limit usage bar (≥80%), untrusted device, premium/upgrade modal accent + glow, mock-mode notice.
- **Red:** all destructive confirmations and destructive buttons, error states/alerts, expired/revoked status, trial-expired banner, security events (refresh_failed, token_revoked), Danger Zone, delete actions.
- **Blue:** informational notices, refresh/session-refreshed activity events, permission/scope pills, the *selected* scope chip in the key-create form, device-registered events.
- **Neutral:** everything else — default badges, disabled controls, last-seen labels, generic metadata.

**Prohibited.** No accent color used purely decoratively (e.g., a blue heading "for variety"). No mixing accents within one element. No green for "create" buttons — primary actions are white-on-black, not colored (8.6). Rationale: the moment a color appears without meaning, the whole signaling system weakens.

### 8.6 Action colors

**Spec.**
- **Primary action:** solid **white** background, **black** text, subtle white glow shadow. There is one primary per view. This is the highest-contrast control in the system and is reserved for the single most important action (Create, Upgrade, Sign In, Save, Confirm-non-destructive).
- **Secondary action:** translucent white fill (`white @ 4%`), white text (~90%), hairline border; hover lightens fill. For Cancel, Back, Refresh, and other non-primary actions.
- **Destructive action:** red triplet (red @ 10–15% fill, red-400 text, red @ 20–25% border); hover deepens fill. For Delete, Revoke, Log out, and the confirm button in destructive dialogs.
- **Ghost/tertiary:** transparent fill, muted text, hover reveals faint fill. For inline icon buttons and low-emphasis links.

**Rationale.** Using white (not a brand hue) as the primary action color is a deliberate, Vercel/Linear-class choice: on a monochrome dark canvas, white-on-black is *maximally* prominent without introducing a competing brand color, and it keeps the semantic palette free to mean status. Destructive = red is universal and must be unmistakable. The three-tier action hierarchy (primary/secondary/destructive + ghost) covers every button in the product.

### 8.7 Plan / status label color mapping

**Spec.** Because plan naming is inconsistent across the product (3.6), the design fixes a single canonical mapping of plan → label → status color:

| Backend plan/status | Canonical label | Status accent |
|---|---|---|
| `free` / community | "Community" | Neutral |
| `trial` / `trialing` (active) | "Pro Trial" | Amber |
| `trial` (expired) | "Trial Expired" | Red |
| `pro` (active) | "Pro" | Emerald |
| `enterprise` (active) | "Enterprise" | Emerald |
| grace period | "Grace period" | Amber |
| canceled / past_due / unpaid | "Inactive" | Red |

**Spec.** This label+color pair must be used identically in the sidebar user block, Overview status card, Settings subscription section, and Billing. The marketing "Team $12" plan is a marketing construct and must be reconciled with the backend plans before launch; until reconciled, in-app surfaces use the backend-derived label above, never the marketing label. Rationale: a plan that reads "Pro Trial" in one place and "trialing" in another erodes trust in a money surface (Principle 2.10).

### 8.8 Dark mode (the default and only current theme)

**Spec.** Dark is the product's identity, not a mode toggle. All tokens above are the dark theme. The redesign ships dark-only. There is no light/dark switch in scope. Rationale: the audience and brand are dark-native; a light theme is future work (8.9) and must not dilute the dark design now.

### 8.9 Light mode (future)

**Spec — rules for a future light theme (not to be built now):**
- Invert the neutral ladder: light canvas (near-white, not pure white — e.g., `#fafafa`), surfaces stepping *down* in lightness, text in graded black opacities, borders in graded black.
- Keep the **same semantic accents** but shift to higher-contrast variants on light backgrounds (e.g., emerald-600/700 text on emerald @ 8% fill) so contrast holds.
- Primary action inverts to **solid black background, white text** (the maximal-contrast control on a light canvas), preserving the "primary = max contrast, no brand hue" principle.
- All component specs (Section 11) must be theme-token-driven so a light theme is a token swap, not a redesign.

**Rationale.** Specifying the light-mode *rules* now (even without building it) ensures the component library is authored against semantic tokens rather than hard-coded dark values — the only way a light theme can ever ship without a rewrite (Section 16).

### 8.10 Contrast requirements

**Spec.** See Section 14.4 for the full accessibility treatment. In brief: body and interactive text must meet WCAG AA (4.5:1) against its *actual* background (accounting for opacity over canvas); large text and UI component boundaries meet 3:1; status is never color-only; focus rings meet 3:1 against adjacent colors. The opacity floor (Section 7.3) exists specifically to keep small text above the contrast minimum.

---

## 9. Design Tokens

Tokens are the atomic, named values from which every component and layout is composed. The redesign must implement components against these tokens (not raw values) so that theming, density adjustments, and future maintenance are possible. Token names below are canonical; concrete values reflect the existing product so the redesign stays visually continuous.

### 9.1 Spacing scale

**Spec.** Base unit = 4px. Named steps:

| Token | px | Common use |
|---|---|---|
| `space-0` | 0 | reset |
| `space-1` | 4 | icon-text gap, tightest |
| `space-2` | 8 | inline control gap, label→input |
| `space-3` | 12 | compact padding, chip padding |
| `space-4` | 16 | list gap, field gap, standard padding |
| `space-5` | 20 | list-card padding |
| `space-6` | 24 | section-card padding, page padding (mobile) |
| `space-8` | 32 | major section gap, header→body |
| `space-10` | 40 | page padding (desktop) |
| `space-12` | 48 | large vertical rhythm |
| `space-16` | 64 | hero/empty-state vertical space |

**Rationale.** A constrained set drawn from a 4px base is the foundation of the dense-but-readable rhythm (Section 5.3). Designers select from this ladder, never arbitrary values.

### 9.2 Radius scale

**Spec.**

| Token | px | Use |
|---|---|---|
| `radius-sm` | 6 | small chips, keycaps, icon buttons, inline tokens |
| `radius-md` | 8 | buttons, inputs, small controls |
| `radius-lg` | 12 | cards, list rows, banners |
| `radius-xl` | 16 | large cards, inputs (auth) |
| `radius-2xl` | 24 | modals, panels, auth card, detail overlays |
| `radius-full` | 9999 | avatars, status dots, pills, navbar pill, mobile drawer buttons |

**Rationale.** Radius encodes scale and elevation: small controls get small radii, floating overlays get large radii, pills/avatars are fully round. The generous `radius-2xl` on modals/panels is a key brand signature (soft, modern, composed) and must be consistent across all overlays. The fully-round pill on the marketing navbar and status badges is also signature and preserved.

### 9.3 Border / stroke tokens

**Spec.** Width: hairline = 1px everywhere (Derivo uses single-pixel borders exclusively; there are no heavy strokes). Colors map to Section 8.3 (`border-subtle`, `border-default`, `border-strong`, `border-dashed`). Focus uses `border-strong` + a ring (9.6). Rationale: uniform hairline weight keeps the structural language quiet; differentiation comes from opacity, not thickness.

### 9.4 Opacity tokens

**Spec.** Reusable opacity stops (applied to white on dark): `opacity-100/90/70/50/45/40/30` for text (Section 8.3); surface overlays `1/2/3/5/6/8/10%` (Section 8.2); disabled controls render at `opacity-40–50`; hover transitions move one opacity stop. Rationale: a shared opacity vocabulary is what makes the monochrome system coherent; "disabled = 40–50%" and "hover = +one stop" are universal rules.

### 9.5 Elevation & shadow tokens

**Spec.** Two-tier elevation model (Section 5.8):

| Token | Definition | Use |
|---|---|---|
| `elevation-flat` | border only, no shadow | All in-flow cards, rows, sidebar |
| `elevation-raised` | subtle inset highlight (`inset 0 1px 0 white@5–10%`) | Auth card, premium surfaces |
| `elevation-overlay` | large soft drop shadow (e.g., `0 30px 60px -15px rgba(0,0,0,.6–1)`) + backdrop | Modals, detail panels, command palette, popovers |
| `elevation-button-primary` | small white glow (`0 2–4px 12px rgba(255,255,255,.1–.15)`) | Primary white buttons |

**Rationale.** Real shadows are expensive (visually and in render cost) and are reserved for content that genuinely floats (overlays) and for the one primary button whose subtle glow signals "press me." In-flow content uses borders for elevation. The primary-button glow is an existing signature and is tokenized so it is applied consistently and only to primary actions.

### 9.6 Focus ring token

**Spec.** `focus-ring` = a 1–2px ring in white at ~20–30% opacity (or, on colored controls, a same-hue ring) with a 1–2px offset, plus a border lighten to `border-strong`. It is always visible on keyboard focus, never suppressed, and never color-only (it pairs ring + border change). On the marketing site, focus rings use `focus-visible:ring-white`. Rationale: a single, always-on, high-contrast focus token is non-negotiable for keyboard-first + accessibility (Principles 2.4, 2.5).

### 9.7 Z-index scale

**Spec.**

| Token | Value | Use |
|---|---|---|
| `z-base` | 0 | content |
| `z-sidebar` | 20 | fixed sidebar |
| `z-mobile-overlay` | 20 | mobile drawer |
| `z-mobile-topbar` | 30 | mobile top bar (above content + drawer base) |
| `z-overlay` | 50 | modals, panels, command palette, popovers, confirm dialogs |
| `z-toast` | 60 | toast/notification layer (new — Section 11.18) |

**Rationale.** A defined z-scale prevents the stacking bugs that plague overlay-heavy apps. Toasts sit above modals so confirmations of background events remain visible; the mobile top bar sits above the drawer base so the close affordance is always reachable.

### 9.8 Animation tokens

**Spec — durations:**

| Token | ms | Use |
|---|---|---|
| `duration-instant` | 100–120 | hover color/opacity, small state changes |
| `duration-fast` | 150–200 | buttons, focus, dropdowns, palette |
| `duration-base` | 200–250 | modal/panel enter-exit, page-section enter |
| `duration-slow` | 400–600 | marketing/hero, deliberate emphasis only |

**Spec — easing:**
- `ease-standard` = `cubic-bezier(0.16, 1, 0.3, 1)` (the product's signature "expo-out" — fast start, soft settle) for enters and emphasis.
- `ease-in-out` for reversible state toggles.
- `linear` only for spinners/progress.

**Spec — reduced motion:** when `prefers-reduced-motion: reduce`, all non-essential motion is disabled or reduced to a near-instant opacity change; spinners may remain but should be minimal; no transforms/parallax.

**Rationale.** Tokenizing duration + easing keeps motion consistent and purposeful (Section 10). The signature expo-out easing is a brand asset — it makes overlays feel like they "settle" rather than snap. Capping most UI motion at ≤250ms preserves the speed promise; only marketing may use slow motion.

### 9.9 Iconography tokens

**Spec.** Icon library: **Lucide** (already in use). Standard sizes: 14px (inline/button), 16px (nav/row), 20px (section/feature), 24px+ (empty-state/marketing). Stroke width consistent with Lucide defaults (~1.5–2). Icons inherit text color/opacity by default; semantic icons take the matching accent (e.g., amber Zap for premium, red AlertTriangle for danger). Rationale: a single icon family at fixed sizes keeps visual texture uniform; inheriting text opacity means icons automatically respect hierarchy.

### 9.10 Token governance

**Spec.** Components and pages reference tokens by name, never raw hex/px (except inside the token definitions themselves). Adding a token requires it to be (a) genuinely reusable, (b) named by role not value, and (c) documented here. Removing/renaming a token is a breaking change requiring an audit of usages. Rationale: tokens are the contract that makes consistency (2.3) and future theming (8.9, Section 16) mechanically possible rather than aspirational.

---

## 10. Motion

Motion in Derivo is functional. It communicates state change, spatial relationships, and continuity — it never entertains. Every animation must answer "what change is this clarifying?"; if there is no answer, the animation is removed. Motion is also the first thing disabled under `prefers-reduced-motion` (Section 14.5). The product already uses `motion/react` (Framer Motion) with a consistent expo-out easing; this section codifies when and how.

### 10.1 Motion principles

**Spec.**
1. **Motion follows causality.** An element animates *because* the user did something (opened a modal, hovered a card, navigated). Idle/ambient motion is prohibited in the app (permitted only in marketing hero/background).
2. **Animate cheap properties.** Prefer `opacity` and `transform` (translate/scale); avoid animating layout properties (width/height/top) that cause reflow and jank (Principle 2.9).
3. **Fast by default.** UI motion uses `duration-fast`/`duration-base` (150–250ms). Anything slower must justify itself.
4. **Enter expressively, exit quickly.** Enters use the signature expo-out easing for a soft settle; exits are quicker and simpler so dismissals feel responsive.
5. **Respect reduced motion.** All of the below collapses to instant/opacity-only when the user requests reduced motion.

### 10.2 Hover

**Spec.** Hover feedback is immediate (`duration-instant`, 100–120ms) and limited to: background/opacity shift (one overlay stop), border lighten (`border-default` → `border-strong`), text opacity rise (e.g., 50% → 80%), and — on resource cards — a faint gradient glow fade-in. Hover never moves layout. Buttons may add a subtle background deepen; primary buttons keep their glow static (the glow is identity, not a hover effect). Rationale: instant, non-layout hover keeps dense lists feeling alive without distracting or shifting targets.

### 10.3 Focus

**Spec.** Focus transitions are near-instant (≤120ms): the focus ring appears and the border lightens together. Focus motion is never suppressed by reduced-motion (focus visibility is essential, not decorative) — only its transition duration may shorten to 0. Rationale: keyboard users rely on focus appearing crisply; it must never lag or fade slowly.

### 10.4 Buttons

**Spec.** Press: optional 1–2% scale-down on active (`duration-instant`) for tactile feedback, returning on release. Loading: the button keeps its size, swaps label for a spinner + present-tense verb ("Saving…", "Creating…", "Signing in…"), and disables. Success (where inline): brief checkmark swap (e.g., Copy → "Copied" for ~1.5s) then revert. Rationale: size-stable loading prevents layout shift; the spinner+verb pattern (already used widely) tells the user the action is in flight and what it is.

### 10.5 Loading

**Spec.** Two loading expressions:
- **Skeletons** for list/content areas: layout-matched placeholder blocks with a subtle pulse (`animate-pulse`), occupying the final dimensions so no reflow occurs on load. This is the **preferred** loading state for resource pages.
- **Spinners** for inline/button and indeterminate waits (auth, palette actions, "Verifying session…"): a small rotating ring; minimal and centered with a short mono caption where it occupies a full region.

**Spec — fix:** pages currently using full-page spinners (Overview, Projects, Settings) should move to skeletons that match their layout to eliminate the load→content reflow (Principle 2.9). Rationale: skeletons communicate structure and prevent the jarring collapse-then-expand the spinner pages exhibit today.

### 10.6 Dialogs and panels

**Spec.** Modals/confirm dialogs/detail panels: backdrop fades in (`duration-base`, opacity 0→1) with backdrop blur; the surface enters with opacity 0→1 + scale 0.95→1 + slight upward translate, using `ease-standard`. Exit reverses, faster. Command palette enters the same way but anchored near the top. Right-aligned panels (if used for device detail) slide from the right (translate-x) + fade. Rationale: the scale+fade+settle gives overlays a clear "this floated in over your context" reading; the blurred backdrop preserves context while focusing attention.

### 10.7 Dropdowns / popovers / menus

**Spec.** Overflow menus, future popovers: fast enter (`duration-fast`) with opacity + small scale/translate originating from the trigger; exit immediate. They never animate position after opening (no drift). Rationale: anchored, fast, origin-aware motion makes menus feel attached to their trigger.

### 10.8 Sidebar and navigation

**Spec.**
- Desktop sidebar is static (no enter animation on route change — it persists). Active-item indicator may animate between items using a shared-layout transition (a sliding highlight) at `duration-fast` with a spring, as the marketing navbar already does for its active underline. This is permitted but optional; if used, it must be disabled under reduced motion.
- Route/page transitions: page content may fade/slide-up its sections on mount (`duration-base`, staggered subtly for stat cards) — this is an existing, tasteful pattern. Stagger delays are tiny (≤50ms) and capped; long staggered cascades are prohibited (they slow perceived load).
- Mobile drawer: enters with fade + downward translate (`duration-base`), exits faster.

**Rationale.** A persistent sidebar with an animated active indicator gives spatial continuity (you see *where* you moved) without re-animating the whole rail. Capped section stagger adds polish without violating the speed promise.

### 10.9 Cards

**Spec.** On mount within a list/overview, cards may fade+translate-up subtly (`duration-base`); on hover, the glow/border treatment from 10.2 applies. Marketing plan cards may use a 3D tilt on hover (existing) — this is **marketing-only** and prohibited in the app. Rationale: app cards stay calm and functional; marketing may be more expressive because its goal is persuasion, not operation.

### 10.10 Success / celebration

**Spec.** Genuine success moments (email verified, password updated, trial activated) use a contained, brief animation: an icon scale-in (spring) into a success-tinted badge, no full-screen confetti, no sound. The "Trial Activated" page's spring icon-in is the model. Rationale: the audience finds confetti patronizing; a crisp, confident success mark respects them while still marking the moment.

### 10.11 Motion inventory (what animates, where)

**Spec — complete map for the redesign to honor:**

| Surface | Motion |
|---|---|
| Command Palette | backdrop fade; surface scale+fade+translate (top-anchored); reduced-motion → opacity only |
| Confirm dialog / modals | backdrop fade+blur; surface scale 0.95→1 + fade + translate |
| Detail panel (device/project) | scale+fade (modal) or slide-from-right (panel) |
| Upgrade modal | scale+fade; amber glow is static, not animated |
| Buttons | active scale-down; loading spinner swap; copy→copied checkmark |
| Resource cards | mount fade+translate; hover glow/border |
| Stat cards (Overview) | mount fade+translate, tiny stagger |
| Sidebar active item | optional shared-layout sliding highlight |
| Mobile drawer | fade + downward translate |
| Verify-email poller | small spinner pulse during check |
| Trial/usage bars | width 0→value on mount (`ease-standard`) — one of the few permitted width animations because it *is* the data |
| Success states | icon spring scale-in |
| Marketing hero/background | ambient/parallax (marketing only) |

Note: trial/usage progress bars animate width intentionally — the motion *is* the information (filling toward a limit), which is the one justified exception to "don't animate layout."

---

## 11. Component Library

This section specifies every reusable component. The library is the law (Principle 2.3): pages compose from these components and may not invent bespoke variants. Each component spec includes its **anatomy**, **variants**, **states**, **behavior**, **accessibility**, and **rationale**. Tokens referenced come from Section 9; colors from Section 8.

Components are grouped: **Actions** (buttons, icon buttons, links), **Inputs** (text, search, select, segmented, chips, file, OTP), **Containers** (card, section card, modal, panel, popover, banner), **Data display** (badge, status badge, key-value detail, usage bar, avatar, code block, file tree, activity timeline), **Navigation** (sidebar item, tabs, pagination, command palette, breadcrumb-future), **Feedback** (toast, alert, empty state, skeleton, spinner, confirm dialog, upgrade modal).

### 11.1 Button

**Anatomy.** Optional leading icon (14px) + label (12–14px, weight 600) + optional trailing icon/spinner. Height 36px (`h-9`) standard; 40px for prominent auth/primary CTAs; 28–32px for compact contexts. Horizontal padding 12–16px. Radius `radius-md` (8px). Gap between icon and label 8px (`gap-2`).

**Variants (map to Section 8.6):**
- **Primary** — white bg, black text, `elevation-button-primary` glow. One per view.
- **Secondary** — `surface-overlay-04` fill, white@90% text, `border-default`; hover → `surface-overlay-08`.
- **Destructive** — red @ 10–15% fill, red-400 text, red border; hover deepens.
- **Ghost** — transparent, muted text, hover faint fill. For low-emphasis/inline.

**States.** Default, hover (10.2), active (scale-down 10.4), focus (visible ring 9.6), disabled (opacity 40–50%, no pointer), loading (spinner + present-tense verb, size-stable, disabled).

**Accessibility.** Real `<button>`; `type` set correctly in forms; `aria-busy` while loading; disabled communicated via `disabled` + reduced opacity (not color alone); icon-only buttons require `aria-label`/`title`; focus ring always visible; min touch target 44px on mobile (pad if visual height is smaller).

**Rationale.** A four-variant button system with one primary-per-view enforces hierarchy (2.7) and destructive distinction (2.1/2.3). Size-stable loading and visible focus serve speed and keyboard-first.

### 11.2 Icon button

**Anatomy.** Square (28–36px), single icon (14–16px), radius `radius-sm/md`, no label. Used for Refresh, row-level actions (disable/enable/rotate/revoke key), close (X), user-block sign-out, password show/hide.

**Variants.** Neutral (muted icon, hover faint fill + border) and Destructive (red icon, hover red fill). Toggle icon buttons (e.g., show/hide password, enable/disable) reflect state via icon swap.

**States & a11y.** As 11.1 plus mandatory `aria-label`/`title` (icon-only). Toggle buttons expose `aria-pressed` where they represent on/off. Rationale: icon buttons are dense and ambiguous without labels; the tooltip + aria-label keeps them usable and accessible.

### 11.3 Link

**Spec.** Inline links use white text with underline-on-hover (offset underline) for in-prose links (auth footers, terms/privacy), or muted→full-contrast hover for utility links ("View all", "View log", "Change number"). Links that navigate within the app use the router; external links open appropriately and are marked. Focus shows the ring. Rationale: consistent link affordance prevents confusion between links and buttons; "View all" style utility links are visually lighter than prose links because they are navigational shortcuts, not primary content.

### 11.4 Text input

**Anatomy.** Label (12px, 70%, above) + 6px gap + field. Field: height 36–48px depending on context (36 in dense forms, 44–48 in auth), `surface-1`/`canvas` fill, `border-default`, radius `radius-md`–`radius-xl`, 12–16px horizontal padding, placeholder at ~20–30% opacity, text at 90%. Optional leading icon (search) or trailing affordance (password toggle, inline submit).

**States.** Default, focus (`border-strong` + ring, 9.6), filled, disabled (reduced opacity, not-allowed cursor; e.g., the email field in Settings), error (red border + red helper text below), read-only (muted text, no focus ring change). Helper text and error text sit below at 11px.

**Accessibility.** Always a programmatic `<label>` associated by `id` (existing pattern uses `htmlFor`); error messages linked via `aria-describedby`; required fields marked; `autoComplete`/`autoFocus`/`inputMode` set appropriately (email, new-password, tel). Rationale: the existing inputs already pair labels and ids — the spec formalizes it and adds error association so screen readers announce validation.

### 11.5 Search input

**Spec.** A text input variant with a leading search icon, resource-specific placeholder, and filter-as-you-type behavior (Section 4.5). No submit button — filtering is live. Optional clear affordance when non-empty. On Activity, resets pagination to page 1. Rationale: live local filtering is faster than submit-based search for already-loaded lists and matches user expectation on a list page.

### 11.6 Select / dropdown

**Spec.** For choosing one of several options where segmented controls don't fit. Trigger looks like a text input with a trailing chevron; opens a popover list (radius `radius-lg`, `surface-2`, shadow `elevation-overlay`) of options; selected option marked with a check; keyboard navigable (↑/↓/Enter/Esc); closes on select/outside/Escape. Built on Radix primitives (already a dependency) for correct a11y. Rationale: a single accessible select avoids the inconsistency of native vs custom dropdowns; Radix gives focus management and ARIA for free.

### 11.7 Segmented control

**Spec.** A small group of mutually-exclusive options rendered as adjacent pill buttons; the active option uses the primary treatment (white bg/black text) and others use secondary. Used for the API Key environment toggle (live/test). Keyboard: arrow keys move, Enter selects; exposes `role="radiogroup"`/`radio` semantics. Rationale: for 2–3 options, a segmented control is faster and more visible than a select (you see all options at once), matching the existing live/test toggle.

### 11.8 Chip / toggle chip

**Spec.** Small rounded controls (`radius-sm`, 28–32px tall, mono or sans, 11–12px) used for multi-select (permission scopes in key-create) and single-select (onboarding questionnaire). Off = secondary (muted, faint fill); On = accent-filled (blue for scopes, white for onboarding selection). Toggling is instant. Groups expose appropriate ARIA (`aria-pressed` per chip; group labeled). Rationale: chips make a set of options scannable and toggleable in place — ideal for scopes and questionnaire answers where the user picks from a known set.

### 11.9 File input (avatar)

**Spec.** A "Choose Picture" button (secondary) wrapping a hidden `<input type=file>` with image accept types, plus a "Remove" button when an image exists, and helper text ("JPG, PNG, GIF or WebP. Max size 2MB."). Selecting a file shows an instant local preview (object URL). **Spec — honesty fix:** the current avatar Save does not persist the image server-side; the redesign must either (a) implement real upload so Save persists, or (b) clearly communicate that the chosen image is a local preview pending server support. A control that implies persistence without delivering it violates Principle 2.10. Validation: size and type checked client-side with inline error. Rationale: the file flow is fine; the deception around persistence is the defect to correct.

### 11.10 OTP input

**Spec.** For the (orphaned-but-specified) phone verification: a single field accepting 6 digits, monospace, letter-spaced, center-aligned, numeric-only (strips non-digits), `inputMode="numeric"`, max length 6; submit disabled until 6 digits. A "Change number" link returns to the phone step. Rationale: a clean, constrained OTP field reduces entry error; specifying it now ensures conformance if the phone-trial flow is ever routed (3.6).

### 11.11 Card (resource & stat)

**Spec.** See Section 5.8 for roles. Resource card: clickable container, `surface-overlay-02` fill, `border-default`, `radius-lg`, 20px padding, title (14–16px/600) + monospace meta line + footer status row (status dot + label + timestamp), overflow affordance top-right, hover border-lighten + faint glow. The entire card is the hit target (a real button/link for keyboard + a11y). Stat card: label + large value (24px/600) + sub-metric, optional hover-revealed deep link. Rationale: card-as-button gives keyboard users a single focusable target; the meta/footer split encodes hierarchy (name primary, meta tertiary, status punctuation).

### 11.12 Section card

**Spec.** Non-interactive titled container for grouped content (Settings sections, Billing panels): 24px padding, `border-default`, `radius-2xl` or `radius-lg`, an H2/H3 title above or within, internal dividers (`border-subtle`) between sub-rows. Used to group profile fields, connected accounts, subscription summary, usage. Rationale: section cards create the scannable "settings" rhythm and visually bound related controls without the heavy chrome of nested boxes.

### 11.13 Modal (centered dialog)

**Spec.** Centered overlay on a blurred dark backdrop (`black @ 60%` + backdrop-blur). Surface: `surface-2`, `radius-2xl`, `elevation-overlay`, max-width by content (md/lg). Structure: pinned header (title 16–18px/600 + close icon button), scrollable body (24px padding), pinned footer (action row, right-aligned: secondary then primary; destructive primary tinted red). Enter/exit motion per 10.6. Focus trapped; Escape closes; backdrop click closes (except destructive confirmations may require explicit Cancel — see 11.20). Used for: Create Key, Reveal Key, Project Detail, Upgrade, Confirm.

**Accessibility.** `role="dialog"`, `aria-modal="true"`, `aria-label`/`aria-labelledby` from the title; focus moves to the dialog on open and returns to the trigger on close; tab loops within; the page behind is inert. Rationale: a single rigorously-accessible modal shell used everywhere guarantees correct focus behavior and consistent chrome, replacing today's mix of bespoke modals and native dialogs.

### 11.14 Detail panel (drawer)

**Spec.** For rich record inspection with many fields + many actions (Device detail). Two permitted forms: (a) the centered modal shell (11.13) with a key-value body and a wrapping action footer, or (b) a right-aligned drawer (full height, 420–520px wide desktop, full-width sheet on mobile) sliding in from the right. Both pin header (entity name + status badge + close) and footer (action row), scroll the body, and trap focus. Inline rename happens in the header. **Recommendation:** adopt the right-drawer form for Device detail to give room for the full field set + 5 actions without crowding; keep Project detail as a centered modal (fewer fields/actions). Rationale: drawers suit dense inspect-and-act records and read as "a panel about the selected row," reinforcing the list-with-detail model (5.7C).

### 11.15 Popover / overflow menu

**Spec.** Small anchored surface (`surface-2`, `radius-lg`, `elevation-overlay`) opened from a trigger (e.g., card overflow ⋮, user block). Contains a vertical list of menu items (icon + label), destructive items separated by a divider and red-tinted. Keyboard navigable; closes on select/Escape/outside-click; arrow origin from trigger. **Spec — fix:** wire the Projects card overflow to a real menu (Open details, Delete) or remove the trigger (4.7). Rationale: a real, accessible menu replaces the dead overflow affordance and provides per-item actions without opening the full detail.

### 11.16 Banner / alert (inline)

**Spec.** Full-width, in-flow notice within a page (not floating). Variants by accent: info (blue), success (emerald), warning/trial (amber), error/destructive (red). Anatomy: leading icon + message + optional inline action button (e.g., "Upgrade to Pro"). Radius `radius-lg`, accent fill @ 10%, accent border @ 20%, accent text. Used for: trial-expired banner (red, Overview), non-premium banner (red, Projects), upgrade note (amber, Billing), mock-mode notice (amber). Dismissible variants store dismissal where appropriate; status banners (trial expired) are not dismissible while the condition holds. Rationale: a single banner component with accent variants replaces ad-hoc colored boxes and ensures gating/trial messaging reads consistently and is announced to assistive tech (`role="status"`/`"alert"` by severity).

### 11.17 Alert (form-level inline message)

**Spec.** A compact in-form message used for validation/result feedback (auth errors, Settings success/error). Smaller than a banner; leading icon + 12px text; emerald for success, red for error, amber for warning. Linked to the form via `aria-describedby` where it reports a submission result; uses `role="alert"` for errors so screen readers announce them. Rationale: forms need lightweight, immediate, announced feedback distinct from page-level banners.

### 11.18 Toast / notification (new — system addition)

**Spec.** Derivo currently has **no toast system**; feedback is scattered across inline alerts, native `window.alert`, and transient text. The redesign **introduces a single toast system** to provide consistent, non-blocking, ephemeral feedback for asynchronous results — without replacing inline form alerts (which stay attached to their form) or banners (which describe persistent page state).

- **Placement:** bottom-right on desktop, bottom-center full-width on mobile, at `z-toast` (above modals).
- **Anatomy:** leading status icon (accent) + message (12–13px) + optional action ("Undo", "View") + dismiss. Radius `radius-lg`, `surface-2`, `elevation-overlay`, accent left-border or icon by variant (success/error/info/warning).
- **Behavior:** auto-dismiss after 4–6s (errors persist longer or until dismissed); stack vertically with newest on top; max ~3 visible, older collapse; pause auto-dismiss on hover/focus.
- **When to use:** confirmation of background-completed mutations where the user has moved on (e.g., "Device revoked", "Key copied", "Session logged out"), and for results of actions whose surface has closed.
- **When NOT to use:** validation errors on a visible form (use inline alert 11.17), persistent page conditions (use banner 11.16), or destructive confirmation (use confirm dialog 11.20).

**Accessibility.** Toast container is an `aria-live` region (`polite` for success/info, `assertive` for errors); toasts are dismissible by keyboard; they never trap focus; action buttons are focusable. Rationale: a real toast layer gives the product a single, accessible channel for ephemeral feedback, eliminating native `alert()` (jarring, unstyled, blocking) and the inconsistent transient-text patterns. Toasts respect reduced motion (fade only).

### 11.19 Status badge

**Spec.** The canonical status pill. Anatomy: optional leading dot (solid accent) + short label (11px/500), accent fill @ 10%, accent border @ 20%, accent text, radius `radius-md`. Tones map exactly to Section 8.4: emerald/amber/red/blue/neutral. Examples: device "Online"/"Untrusted"/"Revoked"/"Last seen 3h ago"; key "active"/"disabled"/"expired"/"revoked"; session "This session"; subscription status. **Never color-only** — the text label always carries the meaning, the dot/color reinforces it. Rationale: one badge component for all status everywhere is the backbone of "make state obvious" (Goal 1) and the never-color-alone accessibility rule (2.5). The existing `StatusBadge` tone API is the model and should be preserved.

### 11.20 Confirm dialog

**Spec.** A specialized modal (11.13) for confirming actions, especially destructive ones. Anatomy: header with a leading warning icon (red `AlertTriangle` for destructive) + title (e.g., "Revoke device?"); body with a plain-language **consequence + reversibility** message (e.g., "Revoking immediately removes trust. The connected CLI will lose authentication and must log in again."); footer with Cancel (secondary) + Confirm (destructive-tinted, label = the verb: "Revoke"/"Delete"/"Log out"). Busy state shows a spinner in the confirm button and disables both. 

**Spec — universality:** this is the **only** confirmation pattern in the product. It replaces every `window.confirm`/`window.alert` (project delete, account delete, project delete errors). 

**Accessibility.** Focus moves to the dialog on open and defaults to the **Cancel** button, never the destructive confirm (prevents accidental Enter-to-destroy); Escape and backdrop click cancel; `role="dialog"`/`aria-modal`; the consequence text is the accessible description. Rationale: consistent, consequence-stating confirmation is the heart of "make irreversible actions feel irreversible" (Goal 2) and consistency (2.3). Defaulting focus to Cancel is a deliberate safety choice.

### 11.21 Upgrade modal

**Spec.** A modal (11.13) presenting the premium upsell. Anatomy: amber Zap icon in a tinted badge, title ("Upgrade to Pro"), a short honest description of what's gated and why, a bordered list of premium features (checkmarks), primary "Upgrade to Pro" (white) routing to Billing, secondary "Cancel". Amber glow accents are permitted here (the one in-app marketing-color moment, 8.1). 

**Spec — honesty:** the modal and its description must accurately reflect the *real* gating and the *real* trial length (3 days, not 14), and the Billing destination must clearly state checkout status rather than implying an immediate purchase if checkout isn't wired (Section 12 Billing). Rationale: upsell is legitimate but must never deceive (2.10); the existing modal is well-structured and is preserved with corrected copy.

### 11.22 Key-value detail row

**Spec.** For detail panels/modals: a two-part row, label (12px, 40% opacity, left, ~1/3 width) + value (12px, 90%, right, ~2/3 width). Monospace values for IDs/fingerprints with `break-all`; `select-all` on fully-copyable values; optional inline copy button for values meant to be used elsewhere. Used in Project detail and Device detail. Rationale: a consistent label/value row makes dense records scannable and machine-values copyable, reinforcing the prose/mono and copyable-everything principles.

### 11.23 Usage / progress bar

**Spec.** A horizontal track (`surface-overlay-04`, `radius-full`, ~6px tall) with a fill. Variants:
- **Usage** (Billing): fill width = used/limit; neutral (white@40%) normally, **red** at ≥80% (near-limit), emerald-tinted full-width for unlimited (with `∞` in the numeric). Label row above: name (left) + `used / limit` mono (right).
- **Trial countdown:** amber fill = remaining/total; numeric "Xd Yh" in amber.

Fill animates width on mount (`ease-standard`) — a justified layout animation because the bar *is* the data (10.11). Rationale: progress bars turn abstract quotas into instant visual judgments ("am I near the limit?"); the ≥80% red threshold pre-warns before the user hits a wall.

### 11.24 Avatar

**Spec.** Circular (`radius-full`), sizes 24/32/64px (row/sidebar/settings). Shows the user's photo if present; otherwise an initial fallback (first letter of name/email, uppercase, on a `surface-overlay-08` fill), hairline border. Rationale: a reliable initial fallback means the UI never shows a broken image; consistent sizing keeps the user block and settings coherent.

### 11.25 Code block / command snippet

**Spec.** Monospace block on `surface-1`, `border-default`, `radius-md`, padding 12px, with a copy affordance (icon button top-right or adjacent) and copy→"Copied" feedback. Variants: inline single-line command (empty-state install/CLI commands), multi-line block (CLI demo), and the one-time secret reveal block (11.4/Section 12 API Keys — with break-all and the amber warning). A terminal-framed variant (with a faux title bar) is used on the marketing CLI demo. Rationale: developers expect to copy commands/keys with one click; a single code-block component guarantees consistent copy behavior and styling wherever machine text appears.

### 11.26 File tree (new — reserved component)

**Spec.** Not present in the current web app, but the CLI's domain (project analysis, structure graph via `inspect --graph`) makes a file/structure tree a likely future dashboard surface. Reserve a tree component: indented rows with disclosure carets, folder/file icons (Lucide), monospace names, expand/collapse (click + arrow keys), selection state, and lazy/virtualized rendering for large trees. It follows list-state rules (skeleton/empty/error). Rationale: specifying the tree now (per the task's component list) ensures that when project-structure or analysis output reaches the web, it uses a consistent, accessible tree rather than a bespoke one (Section 16). Until used, it is a documented reservation, not a built component.

### 11.27 Activity timeline

**Spec.** A vertical timeline for the Activity page and the Overview activity summary. Anatomy per row: a circular typed icon node (accent by event type) connected by a vertical hairline to the next node (omit the connector on the last row); to the right, event label (14px/600) + relative timestamp (with absolute time on hover/title) + optional detail line (device id, reason) at 11–12px muted. Event-type → icon + accent mapping (existing): login (emerald, LogIn), logout (neutral), logout_all (amber, ShieldAlert), refresh (blue, RefreshCw), refresh_failed (red, ShieldAlert), device_registered (blue, MonitorSmartphone), token_revoked (red, ShieldAlert); unknown → neutral key icon with the raw type as label. Security-severity events (refresh_failed, token_revoked) read red so they stand out. Rationale: a timeline communicates *sequence* and *category* at a glance; color-coded nodes let a user spot security anomalies (red) instantly while scanning. The connector line gives temporal continuity.

### 11.28 Tabs / filter tabs

**Spec.** A horizontal row of tab buttons for in-page filtering/sectioning (Activity: All/Auth/Security/Devices). Active tab: `surface-overlay-08` fill + full-contrast text + `border-strong`; inactive: faint fill + muted text, hover raises text. Selecting a filter tab resets pagination to page 1. Keyboard: arrow keys move between tabs, Enter/Space activates; `role="tablist"`/`tab` semantics, `aria-selected`. Rationale: filter tabs are faster than a dropdown for a small, known set of filters and keep all options visible (density + speed). 

### 11.29 Pagination

**Spec.** For paged lists (Activity, 15/page). Anatomy: a status line ("Page X of Y · N events") + Previous/Next buttons (secondary; disabled at bounds with reduced opacity). For larger datasets a future numbered variant may be added, but Previous/Next is the default. Keyboard focusable; disabled state communicated to AT (`aria-disabled`). Rationale: simple prev/next suits the modest activity volume and avoids the complexity of numbered pagination until data volume justifies it.

### 11.30 Empty state

**Spec.** Centered block within the list slot: a single muted icon (24–40px, ~20% opacity), a title (14px/medium, "No API keys yet"), an optional one-line description naming the **next action**, and an optional action button or command snippet. **Spec — CLI-aware empties:** for resources that originate from the CLI (Projects, Devices, Sessions), the description must direct the user to the CLI (e.g., "Run the Derivo CLI on a machine to register it here." / "Install the Derivo CLI to create your first project.") and may include a copyable install/command snippet (11.25). **Spec — consistency:** Projects currently uses bespoke empty markup; all empties must use this component. Rationale: an empty state's job is to convert a dead-end into a next step; for CLI-owned resources, the next step is in the terminal, and saying so prevents the user from hunting for a web "create" button that cannot exist.

### 11.31 Skeleton

**Spec.** Layout-matched placeholder: rounded blocks (`surface-overlay-02` + `border-subtle`) sized and positioned to mirror the final content (e.g., list of N row-height blocks, card grid of N card-shaped blocks), with a subtle pulse. Exposed as `aria-busy`/`aria-label="Loading"`. Replaces full-page spinners on resource/overview/settings pages (10.5). Rationale: skeletons preserve layout (no reflow), communicate structure, and feel faster than spinners because the page "appears" immediately.

### 11.32 Spinner / loader

**Spec.** A small rotating ring (`border` technique or icon) at 14–32px; used in buttons (inline), in full-region waits (centered with a short mono caption like "Loading dashboard data…"/"Verifying session…"), and in the verify-email poller. Linear easing, minimal. Under reduced motion, the spinner may remain (it indicates ongoing work) but no other motion accompanies it. Rationale: spinners are right for indeterminate inline/transitional waits where a skeleton doesn't fit (auth, palette actions, polling).

### 11.33 Sidebar nav item

**Spec.** Full-row link: leading icon (16px) + label (14px/500), 12px horizontal padding, `radius-lg`, 8px vertical. Active = `surface-overlay-06` + white text; inactive = 50% text, hover faint fill + 80% text. Group micro-label (mono uppercase) precedes secondary groups. Sign Out is a destructive-tinted row. Keyboard focusable with visible ring; `aria-current="page"` on the active item. Rationale: the nav item is used dozens of times per session; its active/hover clarity and keyboard support are foundational to navigation quality.

### 11.34 Keyboard hint / keycap

**Spec.** A small monospace chip (`surface-overlay-08`/`white@10%` fill, `radius-sm`, 9–11px, reduced opacity) rendering a key or chord (`⌘K`, `ESC`, `↵`, `g p`). Used in the sidebar search trigger, palette, and the future `?` shortcut overlay. Decorative-but-informative; not focusable. Rationale: visible keycaps teach shortcuts in context, fulfilling keyboard-first discoverability (4.8).

### 11.35 Component states matrix (universal)

**Spec.** Every interactive component must define and implement: **default, hover, focus-visible, active/pressed, disabled, loading (where it triggers async), error (where it can fail validation)**. Every data-bearing list/region must define: **loading (skeleton), empty, error (with retry), populated**. A component shipped without its full state set is incomplete. Rationale: most UX defects in the current product are missing states (dead controls, full-page spinners, native error alerts); making the state matrix a hard requirement closes that gap systematically.

---

## 12. Page Specifications

Each page is specified with: **Purpose**, **Layout** (which canonical layout from 5.7), **Sections**, **Primary/Secondary actions**, the four content **states** (empty/loading/error/success), **Accessibility** notes, and **Responsive** behavior. Every action, field, and state enumerated here exists in the product today (per the Product Structure Report) and must survive the redesign. New requirements introduced by this document are marked **[Spec-new]**.

---

### 12.1 Landing

**Purpose.** Convert evaluators: communicate that Derivo is a serious, fast, developer-native platform and drive CLI install + signup. It is the only intentionally expressive surface; marketing motion and imagery are permitted here and nowhere else.

**Layout.** Bespoke marketing layout (not a dashboard layout): a floating pill **Navbar**, then a vertical sequence of full-width sections over an ambient animated **Background**, then a **Footer**. Sections, in order: Hero (+ typewriter), CLI Demo, Trusted By, Features, Developer Workflow, Pricing Preview, FAQ, CTA, Footer. Routes `/features`, `/how-it-works`, `/pricing` hash-scroll to the matching section.

**Sections.**
- **Navbar:** floating rounded pill, top-center, max ~1000px; logo + wordmark, desktop nav (Features, How it works, Pricing, Docs, Blog), auth-aware right cluster (loading skeleton → "Dashboard"/"Verify Email" if signed in, else "Sign in" + "Get Started"); mobile hamburger → drawer. Scroll state thickens/blurs the pill.
- **Hero:** display-scale headline with TypewriterText, subcopy, primary CTA (Get Started/Register) + secondary (Download CLI/Docs).
- **CLI Demo:** terminal-framed code block (11.25) showing the CLI in action.
- **Trusted By, Features, Developer Workflow:** marketing content blocks.
- **Pricing Preview:** two plan cards — Community ($0) and Team ($12/seat/mo) — with 3D hover tilt (marketing-only motion). **[Spec-new]** The trial CTA must state the **correct** trial length consistent with the backend (3 days) — the current "Start 14-day Trial" copy is inaccurate and must be corrected (3.6, 2.10).
- **FAQ:** accordion.
- **CTA, Footer:** final conversion + links (including Terms/Privacy — which must resolve to real routes, 3.6).

**Primary actions.** Get Started / Register; Download CLI; Start Trial. **Secondary.** Sign in; section nav; FAQ expand.

**States.** *Loading:* navbar auth cluster shows a skeleton pill until auth resolves (existing — keep). *Empty/Error:* n/a (static marketing). *Success:* n/a.

**Accessibility.** Navbar has labeled desktop and mobile nav landmarks; active nav item indicated (not color-only); all CTAs are real links/buttons with focus rings; the animated background and 3D tilt respect `prefers-reduced-motion` (disabled/curtailed); typewriter has an accessible static fallback. Sufficient contrast on all marketing text despite imagery (use scrims if needed).

**Responsive.** Pill navbar collapses to top bar + drawer on mobile; sections stack; pricing cards stack; hero type scales down. Ambient background must not harm scroll performance on mobile.

---

### 12.2 Login (`/login`)

**Purpose.** Authenticate an existing user via email/password or OAuth (Google, GitHub) and route them onward (dashboard or `callbackUrl`; new OAuth users → onboarding).

**Layout.** Auth layout: centered glass card (`AuthLayout`) on the marketing Background, logo link top-left, title + subtitle, content.

**Sections.** OAuth buttons (Continue with Google, Continue with GitHub) → divider ("Or continue with email") → email/password form (email; password with "Forgot password?" link) → submit → footer link to Register. Honors `?callbackUrl=`.

**Primary action.** Sign In. **Secondary.** Google, GitHub (popup → redirect fallback), Forgot password, Sign up.

**States.** *Loading:* submit and OAuth buttons show spinner + disable ("Signing in…"). *Error:* inline alert (11.17) with friendly message ("Invalid email or password."); OAuth/redirect errors mapped via `auth-errors`. *Empty:* n/a (form). *Success:* navigate away (no in-page success needed). On redirect-result mount, completes pending OAuth.

**Accessibility.** Labeled inputs (`htmlFor`), `autoComplete` (email/current-password), error alert announced (`role="alert"`), focus ring on all controls, OAuth buttons have accessible names with provider icons. Enter submits.

**Responsive.** Card is `max-w-md`, comfortable on mobile; inputs are 44–48px tall for touch; full-width buttons.

---

### 12.3 Register (`/register`)

**Purpose.** Create an account in two steps (reduce form intimidation), trigger backend account registration (abuse checks + authoritative subscription/trial) and verification email, then route to `/verify-email`. OAuth path creates account and routes new users to onboarding.

**Layout.** Auth layout with a **2-dot step indicator** (name → credentials).

**Sections.**
- **Step 1 — Name:** OAuth buttons + divider + first name (required) / last name; Continue.
- **Step 2 — Credentials:** email; password (min 8, helper "At least 8 characters."); Back + Create Account.
- Footer: link to Sign in; Terms/Privacy fine print (links must resolve — 3.6).
- On submit: Firebase create → write profile → `POST /api/account/register` → `POST /api/auth/email/send-verification` → navigate `/verify-email`.

**Primary actions.** Continue (step 1), Create Account (step 2). **Secondary.** OAuth, Back, Sign in.

**States.** *Loading:* Create Account shows spinner ("Creating account…"). *Error:* inline alert; "This email address is already in use." returns to credentials step; weak-password handled. *Success:* navigation to verify-email (the success surface is that page). 

**Accessibility.** Step indicator conveyed to AT (e.g., "Step 1 of 2"); labeled inputs with `autoComplete=new-password`; error announced; focus moves to the first field of each step on transition; back/continue keyboard reachable.

**Responsive.** Two-column name fields collapse to single column on mobile; full-width buttons; step indicator centered.

---

### 12.4 Forgot Password (`/forgot-password`)

**Purpose.** Request a password-reset link. Enumeration-safe: always shows success regardless of whether the email exists.

**Layout.** Auth layout.

**Sections.** Email field → "Send reset link"; on success, replace the form with a confirmation block (emerald check icon + "If an account exists for <email>, a reset link has been sent. Check your inbox and spam folder."). Back-to-login link.

**Primary action.** Send reset link. **Secondary.** Back to login.

**States.** *Loading:* button spinner ("Sending…"). *Success:* confirmation block (always shown, even on network failure, to avoid leaking existence). *Error:* effectively suppressed by design (enumeration-safe) — only truly fatal client errors surface; never reveal account existence. *Empty:* n/a.

**Accessibility.** Labeled email input; success block uses `role="status"`; focus moves to the confirmation heading on success; back link keyboard reachable.

**Responsive.** Standard auth card behavior.

---

### 12.5 Reset Password (`/reset-password`)

**Purpose.** Legacy reset form: set a new password using a Firebase `oobCode` from the query string. (The newer canonical reset flow is the `/action` page, 12.7; this page is preserved for compatibility.)

**Layout.** Auth layout.

**Sections.** New password + Confirm password fields; submit ("Reset Password"); back-to-login. Validates match + min length; requires a present `oobCode`.

**Primary action.** Reset Password. **Secondary.** Back to login.

**States.** *Loading:* spinner ("Resetting…"). *Error:* inline alert — mismatch, too short, expired link ("This password reset link has expired…"), invalid/used link, missing code ("Invalid or expired reset link…"). *Success:* navigate to `/login?reset=success` (login should surface a success notice on this param — **[Spec-new]** show a one-line success banner/toast on login when `reset=success`). *Empty:* n/a.

**Accessibility.** Labeled inputs (new-password autocomplete), error announced, focus management on error, keyboard submit.

**Responsive.** Standard auth card.

---

### 12.6 Verify Email (`/verify-email`)

**Purpose.** Post-signup waiting room. Tells the user to click the email link, auto-polls Firebase every 4s for verification, and redirects to `/onboarding` once verified. Allows resending the verification email (backend-generated link).

**Layout.** Auth layout.

**Sections.** Mail icon (spring-in), explanatory copy ("We sent a verification link to <email>…"), an auto-checking indicator (small spinner + "Checking verification status automatically…"), resend button, back-to-login link. Already-verified arrivals redirect immediately.

**Primary action.** Resend verification email. **Secondary.** Back to login.

**States.** *Loading:* resend button spinner ("Sending…"); the persistent poll indicator. *Success:* "Verification email resent!" (emerald) after resend; auto-redirect to onboarding on verification. *Error:* inline alert (rate-limit "Too many requests…", generic failure, or "must be signed in" if no user). *Empty:* n/a.

**Accessibility.** Poll status in an `aria-live=polite` region; resend result announced; the auto-redirect should be announced ("Email verified, redirecting…") for screen-reader users; **[Spec-new]** add an explicit "I've verified — continue" manual button as a non-polling fallback (some users distrust silent auto-redirect; also aids reduced-motion/AT users).

**Responsive.** Standard auth card; icon and copy scale comfortably.

---

### 12.7 Email Actions (`/action`)

**Purpose.** The universal, self-contained handler for every Firebase email action: `verifyEmail`, `resetPassword`, `recoverEmail`, `verifyAndChangeEmail`. Opened directly from emails (often on mobile), so it uses a minimal, dependency-light layout (`ActionLayout`/`ActionShell`) — a plain dark card, no marketing background.

**Layout.** Minimal centered card (`ActionLayout`), distinct from the marketing `AuthLayout` — deliberately lightweight for fast load from email clients.

**Sections / modes.**
- **Loading:** mode-specific message ("Verifying your email…", "Validating your reset link…", "Recovering your email…", "Updating your email…").
- **verifyEmail / verifyAndChangeEmail / recoverEmail:** apply the code → success card (title + message + "you can close this window").
- **resetPassword:** validate code → show a set-new-password form with a **password strength meter** (Too weak→Strong), show/hide toggle, confirm field; submit → success card.
- **Error:** friendly title + message (expired/invalid link, etc.); for verifyEmail errors, offer a **Resend verification email** action (backend-generated); always a "Back to sign in" link.
- **unknown mode / missing code:** "Invalid request — this link is missing required information."

**Primary actions.** Update password (reset mode); implicit auto-apply (verify/recover/change modes). **Secondary.** Resend verification (on verify errors), Back to sign in.

**States.** *Loading/Success/Error* are the page's primary modes (above). *Empty:* n/a. The strength meter provides live inline validation feedback.

**Accessibility.** Loading/success/error regions use appropriate `role`/`aria-live` (status vs alert); the password form has labeled inputs, the strength meter is described in text not color-only, show/hide toggle is a labeled icon button; focus moves to the form/heading per phase. Must be fully usable on mobile email-client in-app browsers.

**Responsive.** Single narrow card, large touch targets, no reliance on the marketing background; this is a mobile-priority surface (6.5).

---

### 12.8 CLI Login (`/cli-login`)

**Purpose.** Bridge CLI authentication: the CLI opens this page with `?port=NNNN`; if the user is signed in to the web app, it mints a Firebase ID token and redirects to the CLI's localhost callback (`http://localhost:PORT/callback?token&uid&email`). If not signed in, it redirects to `/login?callbackUrl=` and returns here after auth.

**Layout.** Standalone centered status card (not the marketing auth layout) — a focused, transitional screen.

**Sections.** A single status block with three states: authenticating, redirecting, error. Each shows an icon + title + short explanation.

**Primary action.** None user-initiated in the happy path (it is automatic). **Secondary.** Implicit redirect to login if unauthenticated.

**States.** *Authenticating:* spinner + "Authenticating CLI… Please wait while we verify your session." *Redirecting:* spinner + "Redirecting to CLI… You'll be securely redirected back to your terminal shortly." *Error:* red "!" badge + "Authentication Failed" + message (e.g., "No CLI port specified.", token failure). *Empty/Success:* success = the redirect itself.

**Accessibility.** Status changes announced via `aria-live`; error state uses `role="alert"`; spinner has an accessible label; the page should clearly tell the user they can return to their terminal. **[Spec-new]** Provide a visible manual fallback link/button if the automatic redirect doesn't fire (some browsers block programmatic navigation), e.g., "If you're not redirected, click here."

**Responsive.** Single card, fine on any width; likely opened on desktop (CLI context) but must work on mobile.

---

### 12.9 Onboarding (`/onboarding`)

**Purpose.** Capture the user's name (if missing, e.g., OAuth users) and an optional questionnaire (use case, referral source, persona), then mark onboarding complete and route to the dashboard. Non-blocking — fully skippable.

**Layout.** Auth layout; two possible steps: **name** (only if name missing) and **questions**.

**Sections.**
- **Name step:** first/last name; Continue (persists name to Firebase + Firestore).
- **Questions step:** three ChipGroups — "What will you use Derivo for?" (Personal/Startup/Enterprise/Open source/Just exploring), "Where did you hear about us?" (Search/GitHub/Twitter/Friend/Blog/Other), "What best describes you?" (Frontend/Backend/Full-stack/DevOps/Lead/Student/Other). Skip + Finish.

**Primary actions.** Continue (name), Finish (questions). **Secondary.** Skip.

**States.** *Loading:* "Setting things up…" spinner while auth/profile resolve; saving spinners on Continue/Finish. *Error:* inline alert (name save failure); questionnaire save failures are swallowed (non-critical) and the user is still routed in. *Success:* navigate to `/dashboard`. *Empty:* n/a (chips have no "empty"; all optional).

**Accessibility.** ChipGroups expose group labels and per-chip pressed state; keyboard-selectable; Skip is clearly distinct from Finish; focus moves to the first chip group / first name field appropriately; saving state announced.

**Responsive.** Name fields collapse to one column; chip groups wrap; Skip/Finish stack or sit side-by-side comfortably.

---

### 12.10 Verify Phone (orphaned — specified for conformance)

**Purpose.** Phone-OTP activation of a Pro Trial (backend `/api/trials/verify-phone`, phone-hash uniqueness). The component exists but is **not routed** today (3.6); this spec governs it *if/when* it is enabled, and ensures it conforms.

**Layout.** Auth layout; two steps: phone → OTP. A mock-mode amber banner appears when Firebase isn't configured.

**Sections.** Phone step: tel input with leading phone icon + "Send Verification Code". OTP step: 6-digit OTP input (11.10) + "Activate Pro Trial" + "Change number". Success: "Trial Activated!" with a spring check icon and auto-redirect to dashboard.

**Primary actions.** Send Verification Code; Activate Pro Trial. **Secondary.** Change number.

**States.** *Loading:* button spinners ("Sending OTP…", "Verifying…"). *Error:* inline alerts (invalid number, OTP errors, expired session). *Success:* celebratory but contained success screen → redirect. *Mock-mode:* amber banner explaining any 6 digits work.

**Accessibility.** Labeled tel/OTP inputs; reCAPTCHA container must be handled without trapping keyboard users; mock-mode banner is informational (`role="status"`); success announced.

**Responsive.** Mobile-friendly (phone entry is plausibly mobile); large OTP field; full-width buttons.

> **Spec-note.** Because two trial paths exist (registration auto-trial + phone trial), if this page is enabled the UI must still present trial status from the single backend source (`/api/subscription`) so the dashboard never shows conflicting trial truths (3.6).

---

### 12.11 Dashboard Overview (`/dashboard`)

**Purpose.** A glanceable summary of the workspace: subscription/trial status, project and environment counts, system health, recent projects, and recent activity. It is a *summary*, not a working surface — it truncates lists and links to the full pages.

**Layout.** Overview layout (5.7A): header → optional status banner → 3 stat cards → multi-column body (Recent Projects span-2 + Activity span-1).

**Sections.**
- **Header:** "Welcome back, <first name>" + subtitle; right actions: "Install CLI" + "New Project". **[Spec-new]** "Install CLI" must do something real (link to install docs / show install snippet) or be removed (it is dead today, 3.6). "New Project" opens the Upgrade modal if not premium, else is a CLI-driven no-op — **[Spec-new]** when premium, it should provide a real next step (e.g., show the `derivo init` command in a modal/snippet) rather than nothing.
- **Status banner (conditional):** red trial-expired banner with "Upgrade to Pro" when trial expired.
- **Stat cards:** (1) Subscription Status — plan label (canonical, 8.7) + status + trial countdown when trialing; hover reveals a Billing link. (2) Active Projects — count + "Across N environments". (3) Environment Health — **[Spec-new]** currently hardcoded "Optimal/All systems operational"; the redesign must either bind this to real signal or relabel it honestly (e.g., remove, or show a neutral "—" until a real health source exists). Fake health on a status card violates 2.10.
- **Recent Projects:** top 3 project rows (name, framework•env, status dot, arrow), "View all" → Projects.
- **Activity:** top 4 timeline items (11.27), "View log" → Activity.

**Primary action.** New Project (gated). **Secondary.** Install CLI, Upgrade to Pro, View all, View log, Billing link.

**States.** *Loading:* **[Spec-new]** replace the current full-page spinner with skeletons for the stat cards + lists (10.5). *Error:* a centered error block (profile/data error) with retry. *Empty:* projects empty ("Install the Derivo CLI to create your first project."), activity empty ("Activity will appear here once you start using Derivo.") — use the EmptyState component. *Success:* n/a (read-only summary).

**Accessibility.** Stat cards are readable as labeled value pairs; the trial countdown is text, not color-only; banner uses `role=status/alert`; "View all/log" are real links; hover-revealed Billing link must have a non-hover keyboard path (focusable). 

**Responsive.** Stat cards stack to 1 column; body stacks (projects above activity); header stacks with full-width primary.

---

### 12.12 Projects (`/dashboard/projects`, alias `/projects`)

**Purpose.** View connected repositories/environments (created via the CLI), inspect a project's details, and delete a project. Project *creation* is CLI-driven; the web gates/upsells it.

**Layout.** Resource list layout (5.7B) with card grid + Project Detail modal (list-with-detail, 5.7C).

**Sections.**
- **Header:** "Projects" + subtitle; primary "New Project" (gated → Upgrade modal if not premium).
- **Gating banner (conditional):** red non-premium banner ("Project creation is disabled because you do not have an active premium subscription.") + Upgrade.
- **Controls row:** search input + Filter button. **[Spec-new]** Make search functional (filter by name/framework/env) and either implement Filter (e.g., by status/env) or remove it — both are dead today (4.5, 3.6).
- **Grid:** responsive 1→2→3 project cards (11.11): name, framework•env, status dot+label, last sync, overflow ⋮ (**[Spec-new]** wire to a real menu: Open details, Delete — 4.7/11.15). Card click opens detail.
- **Project Detail modal:** read-only key-value rows (name, ID copyable, framework, env, status, last sync, created at) + footer: **Delete Project** (destructive, left) + Close. **[Spec-new]** Replace the native `window.confirm`/`window.alert` delete flow with the unified Confirm dialog (11.20) and toast/inline error (11.18/11.17).

**Primary action.** New Project (gated). **Secondary.** Search, Filter, overflow menu, open detail, Delete, Close, Upgrade.

**States.** *Loading:* **[Spec-new]** skeleton card grid (currently a full-page spinner). *Error:* ErrorState with retry (currently bespoke; use the component). *Empty:* EmptyState — "No projects yet / Install the Derivo CLI to create your first project." *Success:* on delete, the list updates (live Firestore) and a toast confirms ("Project deleted").

**Accessibility.** Cards are focusable buttons (open detail via Enter); overflow menu keyboard-navigable; modal traps focus, delete confirm defaults to Cancel; copyable ID is `select-all` with a copy button; status not color-only.

**Responsive.** Grid → 1 column; modal → near-full-screen sheet with pinned footer; Delete remains clearly separated from Close.

---

### 12.13 Devices (`/dashboard/devices`)

**Purpose.** Manage machines authorized to use the CLI: inspect, rename, trust/untrust, log out, revoke, delete. Revocation/untrust immediately affects CLI access (backend-enforced) — a high-stakes security surface.

**Layout.** Resource list layout + Device Detail panel (recommend right-drawer, 11.14).

**Sections.**
- **Header:** "Trusted Devices" + subtitle ("Devices authorized to access your workspace via the CLI.") + Refresh.
- **Search:** filter by name/OS/ID.
- **List:** device rows — icon tile + name + "OS · CLI version" + StatusBadge (Online/Untrusted/Revoked/Last seen …). Row click opens detail.
- **Device Detail panel:** status badge; key-value rows (ID, hostname, OS, arch, Node, CLI version, Trusted, masked fingerprint, first registered, last seen, Location); inline **Rename** in header; action row: Rename, Trust/Untrust, Log out, Revoke, Delete. Destructive actions (Log out/Revoke/Delete) open the Confirm dialog with consequence copy (preserve existing excellent copy).

**Primary action.** None page-level (Refresh is utility); the meaningful actions live per-device in the detail. **Secondary.** Refresh, search, per-device actions.

**States.** *Loading:* SkeletonList (existing — keep). *Error:* ErrorState + Retry (existing). *Empty:* EmptyState — "No devices registered / Run the Derivo CLI on a machine to register it here." (or "No matching devices" when searching). *Success:* after an action, the panel closes and the list refetches; **[Spec-new]** surface a toast ("Device revoked") so the result is confirmed even though the panel closed (today errors are silently "surfaced on refetch", which can look like nothing happened — fix with explicit success/error toasts, 11.18).

**Accessibility.** Rows are focusable buttons; detail panel traps focus and pins header/footer; inline rename field is labeled; destructive confirms default to Cancel and state consequences; "Location: Not available" is acceptable but should read as explicitly unavailable, not blank; masked fingerprint is mono with full value copyable if needed.

**Responsive.** Rows stack naturally; detail panel becomes a full-screen sheet; the 5-action footer wraps with destructive actions grouped and separated from non-destructive (6.3).

---

### 12.14 Sessions (`/dashboard/sessions`)

**Purpose.** View clients currently signed in (CLI/other devices) and terminate them individually or all-but-current. Backend-owned; read + revoke.

**Layout.** Resource list layout (no detail overlay needed — sessions are simple rows).

**Sections.**
- **Header:** "Active Sessions" + subtitle + Refresh + (conditional) "Log out others" (only when >1 session; destructive secondary).
- **List:** session rows — icon tile + device name/id + "This session" emerald badge for current + "Last active … · created …". Non-current rows show a per-row "Log out".

**Primary action.** "Log out others" (when applicable). **Secondary.** Refresh, per-session Log out.

**States.** *Loading:* SkeletonList. *Error:* ErrorState + Retry. *Empty:* EmptyState — "No active sessions / Sessions appear here when you sign in from the CLI or another device." *Success:* confirm dialog → refetch; **[Spec-new]** toast ("Logged out 3 other sessions").

**Accessibility.** Current session clearly marked (badge + text, never disabled-without-explanation); confirm dialog states consequence ("All other sessions will be signed out immediately and must re-authenticate."); per-row logout buttons labeled with the device they affect.

**Responsive.** Rows stack; header actions wrap; per-row Log out remains reachable (not hidden behind hover on touch).

---

### 12.15 API Keys (`/dashboard/keys`)

**Purpose.** Full lifecycle management of programmatic tokens: create, view, disable/enable, rotate, revoke. Creation/rotation are premium-gated by the backend. Plaintext is shown exactly once.

**Layout.** Resource list layout + Create modal + one-time Reveal modal + Confirm dialog.

**Sections.**
- **Header:** "API Keys" + subtitle + Refresh + primary "New Key".
- **Search:** filter by name/tags.
- **List:** key cards (11.11 variant) — name + StatusBadge (active/disabled/expired/revoked) + environment pill + monospace preview; meta row: created, last used, expires, scopes, tags; inline icon actions: Disable (if active) / Enable (if disabled), Rotate, Revoke.
- **Create modal:** name (required), environment segmented control (live/test), permission scope chips (projects:read/write, devices:read/write, billing:read), tags (comma-separated); Cancel + Create.
- **Reveal modal:** amber "copy now — won't be shown again" warning + monospace plaintext block + Copy (→ "Copied") + Done.
- **Confirm dialog:** Rotate ("A new key is issued immediately and the old one is revoked after a short grace period…") and Revoke ("Revoking permanently disables this key. Any integration using it will stop working.").

**Primary action.** New Key (gated). **Secondary.** Refresh, search, Disable/Enable, Rotate, Revoke, Copy, Done.

**States.** *Loading:* SkeletonList. *Error:* ErrorState + Retry. *Empty:* EmptyState — "No API keys yet / Create a key to authenticate programmatic access." (or "No matching keys"). *Success:* Reveal modal (creation/rotation) is the success surface; **[Spec-new]** toast for disable/enable/revoke results; gating: if not permitted, the New Key action should be disabled with an Upgrade affordance *before* opening the form (don't let the user fill the form then fail).

**Accessibility.** Create form fully labeled (name, environment radiogroup, scope chips with pressed state, tags); the one-time key block is announced and the Copy button confirms; destructive confirms default to Cancel; inline icon actions have tooltips + aria-labels; the preview is mono and clearly not the full secret.

**Responsive.** Key cards stack; meta row wraps cleanly (don't truncate expiry/status); Create/Reveal modals become sheets; environment toggle and scope chips remain tappable.

---

### 12.16 Activity (`/dashboard/activity`)

**Purpose.** Chronological log of authentication, session, and security events. Helps users (especially leads) audit access and spot anomalies (failed refresh, token revocation).

**Layout.** Resource list layout with timeline body + filter tabs + pagination.

**Sections.**
- **Header:** "Activity" + subtitle ("Authentication, session, and security events on your account.") + Refresh.
- **Controls:** search (type/detail/deviceId) + filter tabs (All / Auth / Security / Devices).
- **Timeline:** typed event rows (11.27) — icon node + label + relative time (absolute on hover) + optional detail (device id, reason). Security events (refresh_failed, token_revoked) render red.
- **Pagination:** 15/page, "Page X of Y · N events", Previous/Next.

**Primary action.** None (read-only). **Secondary.** Refresh, search, filter tabs, pagination.

**States.** *Loading:* SkeletonList (5 rows). *Error:* ErrorState + Retry. *Empty:* EmptyState — "No activity yet / Events appear as you sign in, register devices, and manage keys." (or "No matching events"). *Success:* n/a.

**Accessibility.** Timeline is a semantic list; relative timestamps have absolute values via `title`/`aria`; filter tabs are a proper tablist; security severity not color-only (icon + label + red); pagination buttons disable accessibly at bounds.

**Responsive.** Search + tabs stack; timeline reads well in one column; pagination row wraps; detail lines wrap rather than truncate.

> **[Spec-new] scope note.** Overview's activity summary implies richer activity (terminal/key/zap icons) than the auth/security-only Activity page provides. The redesign should reconcile this: either expand the event taxonomy surfaced here or align Overview's summary to the same event set so the two never imply different activity universes (3.6).

---

### 12.17 Billing (`/dashboard/billing`, alias `/billing`)

**Purpose.** Display backend-computed subscription state, usage vs limits, and (eventually) manage payment. All numbers come from the backend; the dashboard never computes entitlements.

**Layout.** Billing layout: header → optional note banner → 2-column (Plan | Usage) → Billing Portal section. Max width 896px.

**Sections.**
- **Header:** "Billing & Plans" + subtitle ("Plan, usage, and limits are computed by the backend and shown here.") + Refresh.
- **Current Plan card:** amber Zap badge + plan label (canonical, 8.7) + StatusBadge; key-value rows (Access: Premium/Restricted, Plan id, Trial ends / Renews / Grace until as applicable); trial progress bar when trialing; a plan blurb; primary CTA: "Upgrade to Pro" (disabled→"Active Subscription" for pro/enterprise). **[Spec-new]** The Upgrade CTA currently only shows a "checkout handled by provider… future phase" note. The redesign must present this honestly: either a working checkout, or a clearly-labeled "Coming soon"/"Contact us" state — never a button that looks live but only shows a note (2.10).
- **Usage & Limits card:** per-feature usage bars (Projects, Devices, API Keys, Plugins, AI Requests, Storage) with `used / limit` and `∞` for unlimited; near-limit (≥80%) bars turn red.
- **Billing Portal section:** "No payment method on file" placeholder + disabled "Manage Subscription". **[Spec-new]** Keep disabled but visibly explain why (e.g., "Available once you subscribe") rather than a dead disabled button with no context.

**Primary action.** Upgrade to Pro (honest state). **Secondary.** Refresh; Manage Subscription (disabled-with-reason).

**States.** *Loading:* SkeletonList for plan + usage. *Error:* ErrorState + Retry (per card). *Empty:* usage may be empty if backend returns none — show a neutral "No usage recorded yet." *Success:* upgrade note banner (amber) as interim feedback; when real checkout exists, route to it.

**Accessibility.** Plan label + status are text + badge (not color-only); usage bars have text values (not bar-only) and near-limit state is announced via text/color together; disabled CTAs explain their disabled reason to AT (`aria-disabled` + description).

**Responsive.** Two columns stack (Plan above Usage); progress bars full-width; CTA full-width.

---

### 12.18 Settings (`/dashboard/settings`, alias `/settings`)

**Purpose.** Manage profile (name, avatar), view subscription, manage connected auth providers, and delete the account. Mostly Firebase-client operations.

**Layout.** Settings/form layout (5.7D): stacked section cards, narrow column (768px), ending with a Danger Zone.

**Sections.**
- **Alerts:** success/error inline alerts (11.17) at top.
- **Profile:** avatar (Choose Picture / Remove + helper text), full name (editable), email (read-only/disabled), Save Changes. **[Spec-new]** Resolve the avatar persistence dishonesty (11.9): implement real upload or clearly mark the image as a local-only preview pending server support.
- **Subscription & Plan:** read-only Current Plan (canonical label), Status, Trial Expiration. Must match Billing exactly (8.7).
- **Connected Accounts:** Email/Password status; GitHub connect/disconnect; Google connect/disconnect (Firebase link/unlink popups). Unlinking the only provider is blocked with an explanatory message.
- **Danger Zone:** Delete Account — destructive, with a clear warning; **[Spec-new]** replace native `window.confirm` with the Confirm dialog (11.20), and handle `requires-recent-login` with a clear re-auth instruction (existing copy is good — keep it in the dialog/inline alert).

**Primary actions.** Save Changes (profile); Delete Account (Danger Zone). **Secondary.** Choose/Remove picture; Connect/Disconnect providers.

**States.** *Loading:* **[Spec-new]** skeleton sections (currently a full-page spinner). *Success:* inline success alert ("Profile updated successfully.", "Successfully linked GitHub account.") and/or toast. *Error:* inline error alert (provider conflicts "already linked to another Derivo user", unlink-last-provider block, delete `requires-recent-login`). *Empty:* n/a.

**Accessibility.** All fields labeled; disabled email explained; provider rows convey connected/disconnected state in text + dashed-border styling (not color-only); Danger Zone visually and semantically separated; delete confirm defaults to Cancel; per-action loading states announced.

**Responsive.** Single column already; section cards stack; Danger Zone row stacks (description above destructive button) so the destructive action isn't accidentally adjacent to other controls.

---

## 13. User Flows

This section traces every significant flow end-to-end, including branch points, error paths, and the states each step renders. Flows reference pages (Section 12) and components (Section 11). A redesign must keep every step possible; it may improve transitions and feedback but must not remove a branch.

### 13.1 Signup (email/password)

1. **Register · Step 1 (name).** User enters first/last name → Continue. *Validation:* first name required (inline alert if empty).
2. **Register · Step 2 (credentials).** Email + password (≥8) → Create Account (loading: "Creating account…").
3. **Account creation (Firebase).** On success, Firebase user is created and display name set.
4. **Backend registration.** `POST /api/account/register` runs abuse checks (email fingerprint + IP limit) and writes the **authoritative** subscription (3-day trial, or inherited state for a returning email). *Branch:* if blocked (403 `registration_blocked`) or rate-limited (429), surface a friendly inline alert and stop. *Branch:* `email-already-in-use` → return to credentials step with message.
5. **Verification email.** `POST /api/auth/email/send-verification` sends a backend-generated link (rewritten to the action page).
6. **Verify Email page.** Navigate to `/verify-email`; the page auto-polls every 4s and offers Resend. **[Spec-new]** also offers a manual "I've verified — continue."
7. **Email link.** User opens the link → `/action?mode=verifyEmail` → success card.
8. **Verified.** Poller (or guard) detects verification → route to `/onboarding`.
9. **Onboarding.** Name (if missing) + optional questionnaire → Finish/Skip → `/dashboard`.
10. **Dashboard.** Real trial state from backend renders (Pro Trial, countdown).

**Design requirements.** Each async hop shows a size-stable loading state; every error maps to a friendly message; the trial shown at step 10 is the backend truth, never a fabricated local trial (3.6).

### 13.2 Signup (OAuth — Google/GitHub)

1. **Register or Login.** User clicks Continue with Google/GitHub → popup (fallback to redirect if popup blocked).
2. **Provider auth.** On return, `getAdditionalUserInfo().isNewUser` decides the branch.
3. **New user.** Backend `POST /api/account/register` records the email fingerprint + creates the subscription → route to `/onboarding` (which collects name if the provider didn't supply one).
4. **Existing user.** Route to `/dashboard` (or `callbackUrl`).

**Design requirements.** The popup→redirect fallback must not leave the button stuck in loading on failure (current risk); on redirect, the redirect-result handler completes the flow on mount. OAuth buttons show provider icons + accessible names.

### 13.3 Login

1. **Login page.** Email/password → Sign In (loading) **or** OAuth.
2. **Success.** Navigate to `callbackUrl` (default `/dashboard`); new OAuth users → onboarding.
3. **Branches.** Invalid credentials → "Invalid email or password." (inline). Unverified email (if reached) → guards route to `/verify-email`. `reset=success` query (arriving from a completed reset) → **[Spec-new]** show a success banner/toast.

**Design requirements.** Guards (`PublicAuthGuard`) bounce already-verified users to the dashboard; loading state covers the auth round-trip; errors never expose raw Firebase codes.

### 13.4 Email verification

1. **Entry.** From signup (auto-sent) or a Resend action.
2. **Waiting room (`/verify-email`).** Auto-poll + Resend + manual-continue fallback.
3. **Link click (`/action?mode=verifyEmail`).** Apply code → success card; on error (expired/invalid) → friendly error + Resend.
4. **Resolution.** Verified → onboarding/dashboard via guards.

**Design requirements.** The action page is mobile-priority (opened from email on phones) and must be self-contained and fast; auto-redirect is announced for AT.

### 13.5 Password reset

1. **Forgot Password.** Enter email → Send reset link → enumeration-safe success block (always shown).
2. **Backend.** `POST /api/auth/email/send-password-reset` (always 200; swallows existence).
3. **Email link.** Opens `/action?mode=resetPassword` → code validated → set-new-password form with strength meter.
4. **Submit.** `confirmPasswordReset` → success card. *Legacy branch:* `/reset-password?oobCode=` form → `/login?reset=success`.
5. **Login.** Sign in with the new password; **[Spec-new]** success notice on `reset=success`.

**Design requirements.** Never reveal whether an account exists; strength meter gives live feedback; expired/invalid links show friendly errors with a path to request a new link.

### 13.6 CLI sync / login bridge

1. **CLI initiates.** `derivo login` opens the browser to `/cli-login?port=NNNN`.
2. **Auth check.** If not signed in → redirect to `/login?callbackUrl=/cli-login?port=NNNN`; after auth, return.
3. **Token mint.** Page mints a Firebase ID token (status: authenticating → redirecting).
4. **Redirect to CLI.** Navigate to `http://localhost:PORT/callback?token&uid&email`; the CLI's local server completes login, creates a session, registers the device.
5. **Branches.** Missing port / token failure → error state with message; **[Spec-new]** manual fallback link if auto-redirect is blocked.
6. **Downstream.** CLI device appears in **Devices**; session appears in **Sessions**; a `device_registered` event appears in **Activity**.

**Design requirements.** The page is transitional and status-driven; it must reassure the user they can return to the terminal and make the CLI↔web relationship legible (the resulting device/session/activity entries close the loop).

### 13.7 Create / inspect / delete a project

1. **Creation (CLI).** `derivo init` (premium-gated by backend `requireFeature('projects')`) creates the project in Firestore; it appears live in **Projects** and **Overview**.
2. **Web "New Project".** Opens Upgrade modal if not premium; if premium, **[Spec-new]** shows the `derivo init` command/next step (creation stays CLI-driven by design).
3. **Inspect.** Click a project card → Project Detail modal (read-only fields, copyable ID).
4. **Delete.** From detail → **[Spec-new]** Confirm dialog (replacing native confirm) → Firestore delete → list updates live + success toast. *Error:* inline/toast error (replacing `window.alert`).

**Design requirements.** Empty state directs to the CLI; gating is visible before action; deletion uses the unified destructive pattern.

### 13.8 Device management

1. **Register (CLI).** Device registered via CLI (fingerprint + plan device-limit enforced server-side).
2. **List/inspect.** Devices page → row → detail panel (full record).
3. **Rename.** Inline in the detail header → save → refetch.
4. **Trust/Untrust.** Toggles trust (untrust immediately affects CLI access).
5. **Revoke / Delete / Log out.** Confirm dialog with consequence copy → API call → refetch + **[Spec-new]** success toast.
6. **Loop.** Resulting events show in **Activity**; revocation enforced at the CLI via `/api/cli/verify`.

**Design requirements.** This is a high-stakes surface — consequences stated, confirms default to Cancel, results explicitly confirmed (no silent "surfaced on refetch").

### 13.9 Session management

1. **Sessions appear** when signing in from CLI/other devices.
2. **Logout one.** Per-row Log out → Confirm → revoke → refetch + toast.
3. **Logout others.** "Log out others" (when >1) → Confirm ("All other sessions… must re-authenticate.") → `logout-all` except current → refetch + toast.
4. **Security branch.** Refresh-token reuse triggers backend revocation of all sessions; the user is forced to re-login; Activity logs `token_revoked`/`refresh_failed` (red).

**Design requirements.** Current session unmistakably marked; destructive copy explicit; security events visually distinct in Activity.

### 13.10 API key lifecycle

1. **Create.** New Key (gated) → Create modal (name, env, scopes, tags) → backend creates → **Reveal modal** shows plaintext **once** → Copy → Done.
2. **Manage.** Disable/Enable inline; Rotate (Confirm → new key issued + old revoked after grace → Reveal modal for the new key); Revoke (Confirm → permanent).
3. **Branches.** Not permitted → New Key disabled with Upgrade affordance (don't open the form to fail). Copy failure → inline/toast.

**Design requirements.** The one-time reveal is the critical UX moment — the warning is prominent, copy is one click with feedback, and dismissing is deliberate (Done). Rotation clearly communicates the grace window.

### 13.11 Billing / trial / upgrade

1. **Trial start.** Granted at registration (3-day) or via phone verify (if enabled). Status visible in Overview/Settings/Billing — single backend source.
2. **Trial countdown.** Amber bar + "Xd Yh" in Overview and Billing.
3. **Expiry.** Trial-expired red banner (Overview/Projects); gated actions blocked; Upgrade modal/CTAs.
4. **Upgrade.** Upgrade to Pro → Billing → **[Spec-new]** honest checkout state (working checkout or clearly-labeled forthcoming), never a dead button.
5. **Active paid.** Billing shows "Active Subscription" (CTA disabled); usage bars reflect higher/unlimited limits.

**Design requirements.** Plan labels canonical and identical everywhere (8.7); trial length consistent with backend (3 days); no deceptive upgrade affordances (2.10).

### 13.12 Account deletion

1. **Settings · Danger Zone.** Delete Account → **[Spec-new]** Confirm dialog (replacing native confirm) with explicit irreversibility warning.
2. **Execute.** Delete Firestore user doc → delete Firebase auth user → sign out → redirect to `/`.
3. **Branch.** `requires-recent-login` → clear instruction to sign out, sign back in, and retry (inline alert/dialog).

**Design requirements.** Highest-severity destructive flow — consequence-stating confirm, default focus on Cancel, graceful re-auth handling.

### 13.13 Onboarding

1. **Entry.** After first verification or new OAuth signup.
2. **Name step (conditional).** Captured if missing.
3. **Questions step.** Optional chips → Finish or Skip.
4. **Completion.** Writes `onboardingCompleted`; route to dashboard. Returning users with completed onboarding skip straight to dashboard.

**Design requirements.** Non-blocking; never traps the user; questionnaire failures never block entry.

---

## 14. Accessibility

Accessibility is a design-time requirement (Principle 2.5), not a post-hoc audit. Because Derivo is dark, dense, and keyboard-centric, it must be *more* disciplined than a typical bright SaaS. This section is normative for every component and page.

> **Validation caveat.** This document specifies design intent. Full WCAG 2.2 AA conformance can only be confirmed through manual testing with assistive technologies (screen readers, switch devices, magnifiers) and expert review. Nothing here substitutes for that testing.

### 14.1 Standards target

**Spec.** Target **WCAG 2.2 Level AA** for all product surfaces (app, auth, marketing). Where AAA is cheap to achieve (e.g., contrast on key text), prefer it. The email-action page and auth flows — frequently used under stress (lost access, password reset) — get extra scrutiny.

### 14.2 Keyboard navigation

**Spec.**
- Every interactive element is reachable and operable by keyboard in a logical tab order matching visual order.
- The Command Palette (⌘K) provides keyboard access to all destinations + key actions (4.3), and the `?` overlay documents all shortcuts (4.8).
- Modals/panels/menus trap focus while open, restore focus to the trigger on close, and close on Escape.
- Lists with selection (palette, future tables) are arrow-navigable.
- No keyboard trap anywhere except intentional modal focus-trapping (which always has an Escape exit).
- Shortcuts are suppressed while typing in inputs (except Escape/Enter).
- Skip-to-content link provided at the top of each page for screen-reader/keyboard users to bypass the sidebar.

**Rationale.** Keyboard-first is both a power-user feature and the foundation of accessibility; doing it well serves both audiences with one implementation.

### 14.3 Focus management

**Spec.**
- A **visible focus indicator** on every focusable element (the `focus-ring` token, 9.6) — always shown on keyboard focus, never removed, never color-only (ring + border change).
- On overlay open, focus moves into the overlay (to the first field, or to the Cancel button for destructive confirms — never the destructive action, 11.20).
- On overlay close, focus returns to the triggering control.
- Route changes move focus to the page heading (or a focus target) so screen-reader users are oriented.
- Focus order never jumps unexpectedly; dynamically inserted content (banners, alerts) does not steal focus unless it is a modal.

**Rationale.** Predictable, visible focus is the difference between a usable and unusable keyboard/AT experience; defaulting destructive dialogs to Cancel prevents catastrophic Enter-key mistakes.

### 14.4 Color & contrast

**Spec.**
- **Text contrast:** body and interactive text ≥ 4.5:1 against its *actual* composited background (white-opacity over the near-black canvas must be computed, not assumed). Large text (≥18.66px bold / 24px regular) ≥ 3:1.
- **Opacity floor (7.3):** any text that must be read does not drop below ~45% white opacity; 30% is reserved for decorative/duplicated text. Designers must verify computed contrast, since a 40% white on `#050505` may fail.
- **Non-text contrast:** UI component boundaries, icons conveying meaning, and focus indicators ≥ 3:1 against adjacent colors.
- **Never color-alone:** status uses dot **and** text label (StatusBadge); near-limit usage uses red **and** the numeric; security events use icon + label + color; form errors use icon + text, not just red.
- Semantic accents are chosen (8.4) to maintain contrast on the dark canvas; the future light theme (8.9) must re-verify all contrasts.

**Rationale.** Dark + dense + low-opacity is the single most common contrast-failure pattern; the opacity floor and computed-contrast requirement exist specifically to prevent it.

### 14.5 Reduced motion

**Spec.** When `prefers-reduced-motion: reduce`:
- Disable non-essential motion: modal scale/translate (use opacity only), card mount transitions, staggered entrances, sidebar sliding highlight, marketing parallax/3D tilt, typewriter (show final text), usage-bar fill animation (set to final width instantly).
- Keep essential indicators: spinners may remain (they signal ongoing work) but minimal; focus indication is unaffected.
- No flow depends on motion to be understood; auto-redirects are announced textually, not implied by animation.

**Rationale.** Motion-sensitive users experience vestibular discomfort from scale/translate/parallax; honoring the OS preference is both an accessibility requirement and a respect signal to the audience.

### 14.6 ARIA & semantics

**Spec.**
- Use native semantic elements first (`button`, `a`, `nav`, `main`, `header`, `ul/li`, `dialog`); add ARIA only to fill gaps.
- Landmarks: the sidebar is a labeled `nav`; the content zone is `main`; the mobile drawer is a labeled `nav`; marketing has labeled nav landmarks.
- Dialogs: `role="dialog"` + `aria-modal` + `aria-labelledby` (title) / `aria-describedby` (consequence text).
- Live regions: toasts (`aria-live` polite/assertive), poll status (polite), form errors (`role="alert"`), enumeration-safe success blocks (status).
- Tabs: `role="tablist"/"tab"/"tabpanel"` with `aria-selected`.
- Nav active item: `aria-current="page"`.
- Icon-only controls: `aria-label`/`title`.
- Inputs: programmatic labels, `aria-describedby` for help/errors, `aria-invalid` on error, `aria-required` where required.
- Status badges expose their label as text (already text); decorative dots are `aria-hidden`.

**Rationale.** Semantics-first keeps the implementation robust and gives AT users the structure sighted users get visually; ARIA is the patch, not the foundation.

### 14.7 Touch targets & pointer

**Spec.**
- Minimum touch target **44×44px** on touch devices; visually smaller controls (icon buttons, chips) get padding/hit-area expansion to meet it.
- Adequate spacing between adjacent touch targets to prevent mis-taps (especially destructive actions in detail footers — keep destructive items separated, 6.3).
- Hover-only affordances (desktop card hover links) have an always-visible or tap-equivalent path on touch (6.4).
- No reliance on precise pointer gestures; all actions achievable with a single tap/click.

**Rationale.** The mobile-priority surfaces (emergency device/session revocation, email actions) are exactly where mis-taps are costly; generous targets and spacing prevent errors under stress.

### 14.8 Screen reader experience

**Spec.**
- Page titles are unique and descriptive; document title updates per route.
- Reading order matches visual order; the skip link bypasses nav.
- Dynamic results (loading→loaded, action success/failure) are announced via live regions or focus moves, not left silent.
- Data relationships (label↔value detail rows, key↔status) are programmatically associated.
- Decorative imagery/dots/icons are hidden from AT; meaningful icons have text equivalents.
- The CLI bridge and email-action outcomes are announced clearly (success/error), since these are high-stakes and often the only thing on screen.

**Rationale.** A dense control plane is only accessible if state changes are announced; silent async updates are invisible to screen-reader users and erode trust in security/billing surfaces.

### 14.9 Forms & errors (accessibility specifics)

**Spec.** Errors are announced (`role="alert"`/`aria-live=assertive`), associated to fields (`aria-describedby`, `aria-invalid`), and never communicated by red border alone (icon + text). Required fields are marked. Validation messages are specific and actionable (mirroring the friendly `auth-errors` mapping). Submit buttons reflect `aria-busy` during async. Rationale: forms are where accessibility most directly affects task completion; specific, announced, associated errors let everyone recover.

---

## 15. Responsive Design

Derivo must be excellent from a phone in a pocket to an ultra-wide monitor. The breakpoints (6.1) define the structural transitions; this section defines behavior per device class and the rules that keep all classes consistent.

### 15.1 Device classes & intent

| Class | Width | Primary intent | Frame |
|---|---|---|---|
| **Mobile** | <640px | Triage, emergency revoke, check status, email actions | Top bar + drawer; single column; full-width primary; sheet overlays |
| **Large phone / small tablet** | 640–767px | Same as mobile, more breathing room | Same as mobile; some 2-up groupings allowed (e.g., name fields) |
| **Tablet / small laptop** | 768–1023px | Light work + management; sidebar appears | Desktop frame; sidebar; 1–2 column grids |
| **Laptop** | 1024–1279px | Primary work surface | Desktop frame; multi-column overview body; 2-col project grid |
| **Desktop** | 1280–1535px | Primary work surface, full density | Desktop frame; 3-col project grid; full layouts |
| **Ultra-wide** | ≥1536px | Same content, capped width | Desktop frame; content column **capped** (5.2); centered |

### 15.2 The sidebar transition (the one nav breakpoint)

**Spec.** At `md` (768px): below it, sidebar → mobile top bar + full-screen drawer (6.2); at/above it, fixed 240px sidebar. There is exactly one nav transformation. The content column's max width and the three width tiers (1152/896/768) apply above `md`; below, content is full-width with page padding.

### 15.3 Grid reflow rules

**Spec.**
- 3-col → 1-col (Overview stat cards) at `md`.
- Overview body 3-col (2+1) → stacked at `lg`/`md`.
- Projects grid 3→2→1 at `xl`/`md`/base.
- Billing 2-col → stacked at `md`.
- Settings is single-column at all widths (narrow column above `md`, full-width below).
- Resource lists (Devices/Sessions/Keys/Activity) are single-column at all widths (rich rows), only the surrounding chrome (controls, header) reflows.

**Rationale.** Reflow follows content type (5.4): browsable grids collapse columns; triage row-lists stay single-column everywhere because rows already carry full summaries.

### 15.4 Overlays across widths

**Spec.** Centered modals (≤lg content) stay centered with comfortable margins on desktop and become near-full-screen sheets below `md` with pinned header/footer and internal scroll. The device detail right-drawer is a side panel on desktop and a full-screen sheet on mobile. Command palette stays top-anchored but widens to near-full-width on mobile. Confirm dialogs are centered everywhere (small enough). Rationale: overlays must never overflow small viewports or hide their actions; the sheet pattern guarantees the footer actions remain reachable.

### 15.5 Ultra-wide handling

**Spec.** Above `2xl` (1536px), content does **not** stretch edge-to-edge: the content column remains capped at its tier width (1152/896/768) and is centered, leaving symmetric empty gutters. The sidebar stays 240px. Optionally, very wide viewports may increase outer page padding but must not widen the content column. Rationale: unbounded line lengths and row widths destroy scannability and look unfinished; capping + centering keeps the dense UI composed on large displays (a common failure mode for dashboards).

### 15.6 Responsive consistency rules (non-negotiable)

**Spec.** Restating 6.4 as cross-cutting law:
1. Every desktop capability exists on mobile (collapse, don't remove).
2. Decision-critical data never truncates on small screens (wrap instead).
3. Primary action is promoted (full-width / footer-pinned) on mobile.
4. Touch targets meet 44px and destructive actions stay separated.
5. One page scroll; overlays scroll internally.
6. Hover-only affordances have tap/keyboard equivalents.

**Rationale.** These rules prevent the two classic responsive failures — hiding functionality on mobile, and shipping desktop hover affordances that touch users can't reach. They make "responsive" mean *reflowed*, not *reduced*.

---

## 16. Future Expansion

This design system must absorb growth without fracturing. Derivo already implies surfaces that don't yet have UI (a plugin platform, admin capabilities, project analysis output, docs/blog). This section defines the rules for adding pages, components, and patterns so that the product at version 10 feels designed by the same hand as version 1.

### 16.1 Rules for adding a new page

**Spec.** A new page must:
1. **Adopt a canonical layout** (5.7: Overview, Resource list, List-with-detail, or Settings/form). If none fit, the new layout is added to Section 5.7 *as canonical* (with rationale) before the page ships — it does not become a one-off.
2. **Use the page header pattern** (5.6): H1 title + one-line purpose subtitle + right-aligned actions (utility first, one primary last).
3. **Define all four content states** (loading skeleton / empty / error+retry / populated) using the shared components (11.30–11.32), in the *same layout slot* so the page never reflows between states.
4. **Use only library components** (Section 11) and **tokens** (Section 9). Net-new UI extends the library (documented) rather than inventing local styles.
5. **Pick the correct content width tier** (5.2: 1152 / 896 / 768).
6. **Register in navigation** appropriately (sidebar group + Command Palette + a `g`-chord shortcut, 4.8) — a destination not in the palette is a defect (4.3).
7. **Specify responsive behavior** per Section 15 and accessibility per Section 14 *before* build.

**Rationale.** These seven gates are what keep a growing product coherent; they convert "consistency" from a hope into a checklist.

### 16.2 Rules for adding a component

**Spec.** Before adding a component, confirm no existing component (with a variant) covers the need. A new component must define its full state matrix (11.35), be token-driven (no hard-coded values), include accessibility (roles, focus, labels, contrast), specify motion (with reduced-motion behavior), and be documented in Section 11. Variants are preferred over new components; a new component is justified only when the interaction model genuinely differs. Rationale: component sprawl is how design systems die; the bar for "new component" must be high.

### 16.3 Maintaining consistency as the product grows

**Spec.**
- **One pattern per problem.** There is one confirm dialog, one status badge, one empty state, one toast, one list-with-detail model. New surfaces reuse them. Introducing a second way to solve a solved problem requires deprecating the first.
- **Canonical labels.** Plan names, status words, and event labels come from the single mappings (8.7, 11.27); a concept reads identically everywhere.
- **Copy discipline.** Consequence-stating, plain-language, code-free error copy (2.10) is mandatory for new flows; reuse the `auth-errors`-style mapping approach for any new error domain.
- **Token-first.** New colors/spacing/motion are added as tokens, named by role, or not used.
- **Honesty gate.** No new control ships dead or deceptive (2.10); it is functional, disabled-with-reason, or absent.

**Rationale.** Consistency compounds only if enforced at the moment of addition; retrofitting consistency later is far more expensive.

### 16.4 Anticipated surfaces (reserve, don't build now)

These are *reserved* IA slots and design directions, not features to invent now. When they are built, they follow the rules above.

**Plugins (dashboard surface for the CLI plugin platform).** The CLI has a full plugin system (loader, sandbox, registry, runtime, builtins: docker/express/nextjs/react) and plans reference a `plugins` limit, but there is no web UI. Reserved IA: a "Plugins" destination under the Security/Workspace grouping, using the Resource list layout — plugin cards/rows (name, version, enabled/disabled status badge, source), a detail panel (manifest, permissions, health from `plugin doctor`), and enable/disable/reload actions mirroring the CLI. Empty state directs to the CLI. Until built, the slot stays empty; the limit is shown only in Billing usage.

**Admin (operator-with-elevated-rights).** The backend exposes admin endpoints (grant plan, extend trial, revoke, adjust limits, temporary access) with no UI. Reserved IA: a separate, clearly-bounded Admin area (its own route prefix, e.g., `/admin`, gated by the admin role), introducing the **first genuinely routed depth** in the product — which is where breadcrumbs (4.4) and possibly the Table component (5.9/11) become required. Admin surfaces must be visually distinct enough that an operator never confuses an admin action (acting on *other* users) with a self-service action. This is high-risk territory; every admin mutation uses the Confirm dialog with explicit target identification and is audited.

**Project analysis / structure output.** The CLI `inspect`/`validate` produce rich structure, dependency, and risk data (and a `--graph` tree). If surfaced on the web, a routed Project Detail page (replacing or augmenting the current modal) would host tabs for overview, structure (File Tree, 11.26), dependencies (Table), and validation results. This introduces routed depth → breadcrumbs + deep-linking. Reserve the File Tree and Table components for this.

**Docs / Blog.** Currently placeholder routes rendering the landing page. When built, they are marketing/content surfaces (not dashboard layouts) with their own content layout; they must not be left as dead routes pretending to be pages (2.10) — until built, the nav should route to real (even if minimal) content or the nav items should be hidden.

**Terms / Privacy.** Linked from Register but unrouted (3.6). These must resolve to real legal pages before the links ship; a legal link that 404s is both a UX and compliance problem.

**Toasts & shortcut help.** The toast system (11.18) and the `?` shortcut overlay (4.8) are net-new system additions this document mandates; they are foundational, not future — build them as part of the redesign.

**Light theme.** Future (8.9). The component library must be authored token-first now so the theme is a token swap later. Do not build the toggle now; do enforce token discipline so it remains possible.

### 16.5 Deprecation & change management

**Spec.** When a pattern is replaced (e.g., native `window.confirm` → Confirm dialog; full-page spinner → skeleton; bespoke empty markup → EmptyState component), the old pattern is removed everywhere in the same effort, not left to coexist. Token renames trigger a usage audit. Page-layout changes that introduce routed depth trigger the breadcrumb requirement. Every change is reflected back into this document so it remains the single source of truth. Rationale: a design system is only authoritative if it is kept current; drift between the doc and the product reintroduces exactly the inconsistencies this document exists to prevent.

### 16.6 Open reconciliations the redesign must close

These known inconsistencies (from the Product Structure Report, 3.6) must be resolved as part of any redesign and then reflected here:

1. **Plan naming & price** — reconcile backend plans (free/trial/pro/enterprise) with marketing (Community/Team $12) into one canonical set (8.7).
2. **Trial length** — standardize to the backend truth (3 days); correct the marketing "14-day" copy.
3. **Two trial paths** — present trial state from one backend source regardless of how the trial was granted.
4. **Dead controls** — Projects search/filter, project-card overflow, Install CLI, Billing Upgrade/Manage — make functional, disabled-with-reason, or removed.
5. **Native dialogs** — replace `window.confirm`/`window.alert` with the Confirm dialog and toasts/inline alerts.
6. **Full-page spinners** — replace with layout-matched skeletons on Overview, Projects, Settings.
7. **Command Palette gaps** — add Sessions, Activity, and key actions.
8. **Duplicate sign-out** — resolve to one primary sign-out.
9. **Avatar persistence** — implement real upload or label as local-only preview.
10. **Fake "Environment Health"** — bind to real signal or relabel honestly.
11. **Orphaned VerifyPhone / unused RootLandingGuard** — route/conform or remove.
12. **Unrouted Terms/Privacy and placeholder Docs/Blog** — resolve to real content or hide.

**Rationale.** Each item is a place where the product currently violates a principle in this document (mostly 2.3 Consistency and 2.10 Honesty). Closing them is the minimum bar for a redesign to be considered conformant.

---

## Appendix A — Page ↔ Layout ↔ State quick reference

| Page | Layout (5.7) | Width tier | Loading | Empty | Detail overlay |
|---|---|---|---|---|---|
| Overview | A Overview | 1152 | Skeleton (was spinner) | Per-list empties | — |
| Projects | B/C List+detail | 1152 | Skeleton grid | EmptyState (→CLI) | Modal |
| Devices | B/C List+detail | 1152 | SkeletonList | EmptyState (→CLI) | Drawer (rec.) |
| Sessions | B List | 1152 | SkeletonList | EmptyState | — |
| API Keys | B + modals | 1152 | SkeletonList | EmptyState | Create + Reveal modals |
| Activity | B List + timeline | 1152 | SkeletonList | EmptyState | — |
| Billing | Billing 2-col | 896 | SkeletonList | Neutral "no usage" | — |
| Settings | D Form | 768 | Skeleton (was spinner) | — | Confirm dialog (delete) |
| Auth pages | Auth card | md | Button spinners | — | — |
| Action | Minimal card | narrow | Mode loading | — | — |

## Appendix B — Accent ↔ meaning quick reference

| Accent | Means | Examples |
|---|---|---|
| Emerald | active/healthy/online/current | active sub, online device, current session, synced |
| Amber | trial/grace/attention/premium | trial badge+countdown, near-limit, untrusted, upgrade |
| Red | destructive/error/expired/security | delete/revoke, errors, expired/revoked, token_revoked |
| Blue | info/scope | refresh events, scopes, selected scope chip, device_registered |
| Neutral | default/disabled/generic | default badges, last-seen, metadata |

## Appendix C — Primary action per page (one each)

Overview: New Project · Projects: New Project · Devices: (per-device, no page primary) · Sessions: Log out others · API Keys: New Key · Activity: (read-only) · Billing: Upgrade to Pro · Settings: Save Changes / Delete Account (Danger) · Login: Sign In · Register: Continue/Create Account · Forgot: Send reset link · Reset/Action: Update password · Verify Email: Resend · Onboarding: Finish.

---

*End of DESIGN.md. This document is the canonical design source of truth for Derivo. Keep it current: any change to patterns, tokens, or pages must be reflected here (16.5).*
