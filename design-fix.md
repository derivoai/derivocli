# Derivo Dashboard — Design Fix Report

> **Status:** Audit only. Nothing has been changed. This document is the plan.
> **Scope:** The authenticated dashboard (`/dashboard` and its 8 sub-pages) plus the shared dashboard shell and components.
> **Date:** 2026-07-04
> **Method:** Live visual inspection of the running app at `http://localhost:3000/dashboard` via Browser MCP (logged-in session), plus parallel source-code review of every dashboard page and shared component, cross-referenced against `DESIGN.md` (canonical spec) and `DESIGN DO NOT TOUCH/ui-design-prompt.md` (visual language).

---

## How to read this document

- **Section 1** — the three confirmed, user-visible bugs (fix these first).
- **Section 2** — the biggest *systemic* problem: plan/subscription state is inconsistent across the whole app. Root cause included.
- **Section 3** — design-system consistency gaps (pages that don't use the shared components).
- **Section 4** — accessibility gaps.
- **Section 5** — design tokens / hardcoded values.
- **Section 6** — per-page findings tables (the full detail).
- **Section 7** — what's already good (don't touch).
- **Section 8** — prioritized fix roadmap (P0 → P2).
- **Section 9** — file reference index.

**Severity legend**

| Level | Meaning |
|-------|---------|
| 🔴 Critical | User-visible broken state, data looks wrong, or a trust/safety issue |
| 🟠 High | Clear inconsistency or misleading UI a user will notice |
| 🟡 Medium | Off-spec but not obviously broken; erodes polish/consistency |
| ⚪ Low | Nice-to-have refinement |

---

## 1. Confirmed visual bugs (seen in the live app)

### 1.1 🔴 Settings avatar — initials overflow the circle
**Where:** `apps/web/src/pages/dashboard/Settings.tsx` (avatar fallback block, ~line 300).
**What I saw:** The fallback avatar renders the user's name/initials as text, and the text (`AMan SHukla`) spills outside the round frame instead of showing a single clipped initial.
**Root cause:** The fallback `<div>` is `w-16 h-16 rounded-full … flex items-center justify-center` but has **no `overflow-hidden`**, and it renders `profile?.name?.charAt(0) || currentUser?.email?.charAt(0)`. When `profile.name` is briefly the full string (or the glyph is wide), it overflows the 64px circle. The `<img>` branch clips with `object-cover`; the fallback branch does not clip at all.
**Fix (describe only):** Add `overflow-hidden` + `leading-none` to the fallback container; force a single uppercase char (`.slice(0,1)`); mirror sizing/clipping between the `<img>` and fallback branches.

### 1.2 🔴 Billing "AI Requests 0 / 0" renders a full RED (danger) bar
**Where:** `apps/web/src/pages/dashboard/Billing.tsx` → `UsageRow` (~line 223).
**What I saw:** On the Billing page, "AI Requests 0 / 0" shows a **completely filled red bar**, implying the user has maxed out and is in a danger state — when in reality the feature simply has a zero allotment.
**Root cause:** The percentage guard is backwards:
```ts
const pct = unlimited ? 0 : Math.min(100, limit === 0 ? 100 : (used / limit) * 100);
const near = !unlimited && pct >= 80;   // → true when limit===0
// bar color: near ? 'bg-red-500' : 'bg-white/40'
```
When `limit === 0`, `pct` is hard-coded to `100`, so `near` is true → red, full bar.
**Fix (describe only):** Treat `limit === 0` as "not applicable": render 0% (or a neutral/disabled bar) with a "—" / "Not included" label. Only compute a real percentage when `limit > 0`. Never map an empty allotment to the danger color.

### 1.3 🟠 Divide-by-zero danger color also masks a color-semantics problem
Red is currently the **only** semantic color on usage bars (normal = `bg-white/40`, near/over = `bg-red-500`). There's no "healthy/plenty" state and no distinct "warning (80–99%)" vs "over limit (≥100%)". Per `DESIGN.md` §8, red must mean *danger only*.
**Fix (describe only):** neutral/white for normal, amber for 80–99%, red only at ≥100% (true danger), and never for a 0-limit row.

---

## 2. 🔴 SYSTEMIC: subscription/plan state is inconsistent everywhere

This is the most important finding. **In a single session, the same account shows three different plan names and two different statuses depending on which surface you look at.**

**What I observed page-by-page (same user, same session):**

| Surface | Plan shown | Status shown |
|---------|-----------|--------------|
| Sidebar badge (Overview) | **Pro Trial** | — |
| Sidebar badge (Projects, Devices, Activity) | **Community** | — |
| Sidebar badge (Sessions, Settings, Billing) | **Pro Trial** | — |
| Overview body | Community Plan | Expired |
| Settings → Subscription & Plan | Community Plan | Expired |
| Billing → Current Subscription | **Free** | Expired |

So the free tier is variously called **"Community"**, **"Community Plan"**, and **"Free"**, and the sidebar badge literally **flip-flops between "Pro Trial" and "Community" as you navigate** — which directly violates `DESIGN.md` Goal 1.4.1 ("Make state obvious") and Principle 2.3 (consistency).

### Root cause (confirmed in source)

`apps/web/src/hooks/useUserProfile.tsx` has **three independent async writers** of `profile.role`, plus divergent defaults, plus a badge that reads a *different* field than the page bodies:

1. **Loading flash (no guard).** `DashboardLayout.tsx` (~line 76) computes the badge from `profile?.role` with a `'Community'` fallback and **no loading state** — so it paints "Community" before data resolves, then flips.
2. **Three racing sources of truth.** In `useUserProfile.tsx`:
   - the `users` doc `onSnapshot` sets `role` verbatim from Firestore;
   - the `subscriptions` doc `onSnapshot` recomputes `deriveRole()` **and writes the role back to the users doc** (which re-triggers the first listener → flip-flop);
   - `fetchProfileAndSubscription()` also sets a derived role.
   Last writer wins nondeterministically → the badge changes per navigation/refetch.
3. **Divergent defaults.** The Firestore-success path defaults a missing subscription to `plan: 'community'`; the **permission-denied / offline fallback** (~line 158) defaults to `role: 'pro_trial'` and *fabricates a 3-day trial*. So whether a read throws `permission-denied` decides if you see "Community" or "Pro Trial."
4. **Badge vs body read different fields.** Sidebar reads `profile.role`; page bodies read `subscription.plan` / `planId` directly (`Home.tsx` ~L86, `Settings.tsx` ~L374, `Billing.tsx` ~L187). They disagree within one render.
5. **Terminology split.** "Free" (Billing) vs "Community Plan" (Home/Settings) vs "Community" (sidebar); trial shown as "Pro Trial" / "Trial" / "Trial Expired" inconsistently.

### Fix (describe only)
- **Single source of truth.** Derive plan/status/label once (e.g. a `usePlan()` selector over the authoritative subscription) and have *every* surface — sidebar badge, Overview, Settings, Billing — read from it. Stop writing `role` back to Firestore from a snapshot listener.
- **One canonical label map.** e.g. `free → "Community"`, `pro_trial → "Pro Trial"`, `pro → "Pro"`, `enterprise → "Enterprise"`. Remove the hard-coded `'Community Plan'` in Settings and the `'Free'` blurb in Billing; both read the shared label.
- **Loading guard on the badge.** Render a skeleton/neutral chip until `loading` is false so it never flashes a wrong plan.
- **Consistent defaults.** The offline/permission-denied fallback must not fabricate a Pro trial; default to the same "Community" state the online path uses.

---

## 3. Design-system consistency gaps

The dashboard already ships a solid shared kit — `PageHeader`, `StatusBadge`, `EmptyState`, `ErrorState`, `SkeletonList`, `RefreshButton`, `ConfirmDialog`. **Devices, Sessions, API Keys, and Activity use it well. Home, Projects, and Settings largely bypass it.** That divergence is the bulk of the "these pages feel different" problem.

| ID | Sev | Issue | Pages affected | DESIGN.md ref | Fix (describe only) |
|----|-----|-------|----------------|---------------|---------------------|
| DS-1 | 🟠 | **Spinners instead of skeletons** for loading → full-layout pop-in / CLS | Home, Projects, Settings | 2.9 Stability, 11 Loading | Replace centered `Loader2` with layout-matched skeletons (as Devices/Sessions/ApiKeys do). |
| DS-2 | 🟠 | **Native `window.confirm()` / `alert()`** for destructive actions | Settings (Delete Account), Projects (delete) | 2.3 Consistency | Route through the themed `ConfirmDialog` with `destructive` styling (as ApiKeys revoke/rotate). |
| DS-3 | 🟡 | **Hand-rolled `<header>`** instead of shared `PageHeader` (also `text-2xl` vs responsive `md:text-3xl`, `text-white/50` vs `/55`) | Home, Projects, Devices, Sessions, Settings, Billing | 7 Typography, 11 | Adopt `PageHeader` everywhere (it has an `actions` slot for Refresh/CTA). |
| DS-4 | 🟡 | **Inline status dot+label** instead of shared `StatusBadge` | Home, Projects | 11, 14 | Use `StatusBadge`. (Note: text label is present, so not a color-only a11y failure — this is a consistency issue.) |
| DS-5 | 🟡 | **Hand-rolled empty/error states** (Projects uses a raw inline `<svg>`) | Home, Projects | 11 | Use shared `EmptyState` / `ErrorState`; Home's error state also lacks a retry. |
| DS-6 | 🟠 | **Two white primary buttons on screen at once** ("New Project" + "Upgrade to Pro") | Home, Projects | 11 Hierarchy (one primary per view) | Demote the banner "Upgrade" CTA to a secondary/outline style. |
| DS-7 | 🟠 | **Dead / misleading affordances** — `MoreVertical` button with no handler (Projects); "Recent Projects" rows have hover/arrow styling but aren't links (Home) | Home, Projects | 11 Affordances | Wire them up or remove the interactive styling. |
| DS-8 | 🟡 | **IDs not truly copyable** — Projects uses `select-all` only; Devices ID & Sessions deviceId have no copy button | Projects, Devices, Sessions | 1.6 Copyable everything | Add a shared copy-to-clipboard control with "copied" feedback (ApiKeys reveal-modal is the reference). |
| DS-9 | 🟡 | **Card recipe drift** — Projects cards use gradient + hover glow + drop shadow; Devices/Sessions use flat hairline cards; border opacity varies (`white/[0.08]` vs `/[0.06]`), fills vary (`/[0.02]` vs `/[0.01]`) | Home, Projects vs Devices/Sessions | 9 Tokens, 11 | Standardize one card recipe (single fill, one hairline opacity, no decorative glow). |
| DS-10 | 🟡 | **Command Palette missing destinations** — omits **Sessions** and **Activity** (spec requires all sidebar destinations); duplicates the sidebar nav list (drift source); uses the Activity icon for "Overview" | CommandPalette | 2.4 Keyboard-first, 3.4 | Generate palette items from the same nav config the sidebar uses; include every destination + high-value actions. |
| DS-11 | 🟡 | **"Subscription & Plan" duplicated** in Settings and Billing, with different labels/values | Settings, Billing | 2.3 Consistency | Keep the authoritative plan panel in Billing; in Settings, either link to Billing or render the *same* shared summary component. |

---

## 4. Accessibility gaps (DESIGN.md §14)

| ID | Sev | Issue | Where | Fix (describe only) |
|----|-----|-------|-------|---------------------|
| A11Y-1 | 🟠 | **No visible `focus-visible` rings** on most interactive controls — palette input uses `outline-none`; Settings buttons (Choose Picture / Remove / Connect / Save / Delete) rely on default outline only | CommandPalette, Settings, most pages | Add a consistent `focus-visible:ring` token to all buttons, links, and the file-input label. Never rely on color alone. |
| A11Y-2 | 🟠 | **Modals lack focus trap / Escape / focus restore** and palette rows are non-semantic `<div>`s | CommandPalette, ApiKeys `Modal`, ConfirmDialog (verify) | Trap focus, close on Escape, restore focus to trigger; use `role="dialog"`/`aria-modal`; make palette rows real buttons/options with arrow-key nav. |
| A11Y-3 | 🟡 | **No `prefers-reduced-motion` handling** — Billing trial bar animates width; Home stat cards run an entrance stagger on every mount | Billing, Home | Gate non-essential motion behind `prefers-reduced-motion`. |
| A11Y-4 | 🟡 | **Low-contrast text** — `text-white/40` (and disabled email at `/40` on `#050505`) likely fails WCAG AA | Settings, several | Raise informational/disabled text to ≥ `/55`; validate against actual background. (Full WCAG conformance needs manual AT testing.) |

---

## 5. Design tokens / hardcoded values (DESIGN.md §8–9)

| ID | Sev | Issue | Examples | Fix (describe only) |
|----|-----|-------|----------|---------------------|
| TOK-1 | 🟡 | **Literal surface hexes** outside the token scale | `bg-[#050505]` (Settings inputs), `bg-[#0a0a0a]` (Home), `bg-[#0b0b0b]` (ApiKeys `Modal`) | Define named surface tokens (canvas / raised / overlay) and reference them. |
| TOK-2 | 🟡 | **Hairline border opacity drift** — at least five values in use (`white/[0.04]`–`/[0.10]`) | across pages | Pick 1–2 canonical hairline tokens and apply consistently. |
| TOK-3 | ⚪ | **Ad-hoc shadows** | `shadow-[0_2px_8px_rgba(255,255,255,0.15)]`, banner shadows (Projects) | Move elevation into named tokens. |
| TOK-4 | ⚪ | **Chromatic accents in a monochrome-first system** — verify each color still maps to *meaning* (status), not decoration | Billing, ApiKeys scope chips (`blue`) | Confirm every color encodes state per §1.5; demote decorative color. |

---

## 6. Per-page findings (full detail)

### 6.1 Overview (`Home.tsx`)
- 🔴 Plan/status inconsistency (see §2).
- 🟠 DS-1 spinner loading → CLS. DS-6 double primary buttons. DS-7 fake-interactive "Recent Projects" rows.
- 🟡 DS-3 hand-rolled header. DS-4 inline status. DS-5 hand-rolled empty/error (no retry). DS-9 border/card drift. TOK-1 `#0a0a0a`.
- ⚪ Activity empty state names no next action; stat-card entrance animation on every mount (A11Y-3).

### 6.2 Projects (`Projects.tsx`)
- 🟠 DS-1 spinner loading. DS-2 native `confirm()` + `alert()` for delete. DS-6 double primary. DS-7 dead `MoreVertical` menu button.
- 🟡 DS-3 header. DS-4 inline status. DS-5 raw inline `<svg>` empty state. DS-8 IDs only `select-all`. DS-9 gradient/glow cards diverge from the flat card standard. TOK-1/TOK-3 literals.
- ⚪ Correctly gates project creation behind subscription (good), but the gate message + Upgrade button compound the double-primary issue.

### 6.3 Devices (`Devices.tsx`)
- ✅ Uses PageHeader-style header, `StatusBadge`, `SkeletonList`, `EmptyState`, `ErrorState`, `ConfirmDialog`.
- 🟡 DS-8 Device ID in detail panel not copyable. DS-3 header still hand-rolled (uses `text-2xl`). TOK-1 modal `#0a0a0a`/`#0b0b0b`.
- ⚪ DS-1-adjacent: `SkeletonList` rows are generic `h-16`, not shaped to the real row (icon + 2 lines + trailing badge) → minor residual shift.

### 6.4 Sessions (`Sessions.tsx`)
- ✅ Uses shared states + `StatusBadge` + `ConfirmDialog`.
- 🟡 DS-8 `deviceId` plain text (not copyable). DS-3 header. Empty-state copy is passive ("Sessions appear here…") — should name an action (e.g. "Run `derivo login`…").
- ⚪ "Log out others" button appears only when `sessions.length > 1`, shifting the header after load (reserve the slot).

### 6.5 API Keys (`ApiKeys.tsx`)
- ✅ **Reference implementation.** Skeletons, `StatusBadge`, `EmptyState`/`ErrorState`, `ConfirmDialog`, one-time reveal modal with copy feedback. Good destructive-action copy.
- 🟡 Local `Modal` uses literal `#0b0b0b` (TOK-1) and lacks focus trap/Escape (A11Y-2). Scope chips use blue accent (TOK-4 — verify it's "informational/scoped" per §8, which it is, so likely fine).

### 6.6 Activity (`Activity.tsx`)
- ✅ Uses `PageHeader`, shared states, sensible per-type icon+tone map, pagination, filters.
- 🟡 Security events (`refresh_failed`, `token_revoked`) are red-toned (good) but not *visually elevated* as high-severity per §3.5.3 — consider stronger treatment. Empty-state copy could name a next action.

### 6.7 Settings (`Settings.tsx`)
- 🔴 1.1 avatar overflow. 🔴 §2 plan label ("Community Plan" hard-coded).
- 🟠 **Honesty (2.10):** "Save Changes" shows a local avatar *preview* and reports "Profile updated successfully," but the chosen avatar file is **never uploaded** — on save it keeps the existing remote URL and reverts on reload. Either implement upload or disable/relabel the control and don't show a persisted-looking preview.
- 🟠 DS-2 Delete Account uses `window.confirm`. A11Y-1 inconsistent focus rings. DS-1 spinner load. DS-11 duplicate subscription panel.
- 🟡 A11Y-4 disabled email `text-white/40` low contrast. TOK-1 `#050505` inputs.

### 6.8 Billing (`Billing.tsx`)
- 🔴 1.2 the 0/0 red bar. 🔴 §2 "Free" label diverges from "Community".
- 🟡 1.3 progress-bar color semantics. StatusBadge label is the raw backend string (`trialing`, `grace`) rendered verbatim/lowercase — map to human labels. A11Y-3 trial bar motion.
- ⚪ No empty state if `usage.data.usage` is `{}` (renders an empty column silently).

### 6.9 Dashboard shell (`DashboardLayout.tsx`, `CommandPalette.tsx`)
- 🔴 Badge computation + loading flash (see §2, items 1 & 4).
- 🟡 DS-10 palette missing Sessions/Activity + drift + wrong Overview icon. A11Y-1/2 palette input & rows.

---

## 7. What's already good (leave alone)

- **API Keys, Devices, Sessions, Activity** correctly consume the shared component kit — use them as the pattern for fixing Home/Projects/Settings.
- **`StatusBadge`** is well-built: always pairs tone color with a text label (+ optional dot) → satisfies "never color alone."
- **Security copy** (e.g. key revoke/rotate consequences) is specific and trustworthy — preserve it.
- **Empty-state intent** on CLI-driven surfaces already points at the CLI (`derivo setup`, etc.) — keep that, just standardize the component.
- **The dark, restrained aesthetic** matches the brand. No visual redesign needed — this is a consistency + correctness pass.

---

## 8. Prioritized fix roadmap

### P0 — correctness / trust (do first)
1. ✅ **FIXED** — §2 Unify subscription state. Added `getPlanLabel(subscription)` to `lib/subscription.ts` as the single source of truth. `DashboardLayout` badge + `Settings` body now both derive the label from the authoritative `subscription` doc (not the race-prone `profile.role`), with a loading-guard skeleton on the badge. *Verified via Browser MCP: badge reads "Community" consistently across Overview, Projects, Billing, Settings — no more flip-flop.*
2. ✅ **FIXED** — §1.1 Settings avatar overflow. Added `avatarError` state + `<img onError>` fallback to initials, and `overflow-hidden leading-none` on the fallback circle so a stray glyph/alt text can never spill outside the frame.
3. ✅ **FIXED** — §1.2 Billing 0/0 red bar (+ §1.3 bar color semantics). `UsageRow` now treats `limit === 0` as N/A (neutral `bg-white/10`, shows `/ —`), uses amber for 80–99%, and red only at ≥100%. *Verified via Browser MCP: "AI Requests 0 / —" now renders a neutral empty bar.*
4. ⏳ **OPEN** — §6.7 Settings avatar "save" honesty (upload or relabel). Not addressed in this pass; the preview/save flow still keeps the existing remote URL. Deferred (requires storage upload wiring — larger scope than a P0 bug fix).

### P1 — consistency (high user-visible impact)
5. DS-2 Replace native confirms with `ConfirmDialog` (Settings, Projects).
6. DS-1 Skeletons instead of spinners (Home, Projects, Settings).
7. DS-6 One primary button per view (Home, Projects).
8. DS-7 Remove/So wire dead affordances (Projects menu, Home rows).
9. DS-3 Adopt `PageHeader` everywhere.

### P2 — polish / tokens / a11y
10. DS-4/5/8/9 shared StatusBadge/EmptyState/ErrorState, copyable IDs, one card recipe.
11. DS-10/11 Command palette destinations; de-duplicate subscription panel.
12. A11Y-1..4 focus rings, modal focus trap/Escape, reduced-motion, contrast.
13. TOK-1..4 tokenize surfaces, borders, shadows; audit chromatic accents.

---

## 9. File reference index

| Area | File |
|------|------|
| Subscription source of truth | `apps/web/src/hooks/useUserProfile.tsx`, `apps/web/src/lib/subscription.ts` |
| Dashboard shell + badge | `apps/web/src/components/dashboard/layout/DashboardLayout.tsx` |
| Command palette | `apps/web/src/components/dashboard/shared/CommandPalette.tsx` |
| Shared kit | `.../shared/PageHeader.tsx`, `States.tsx` (EmptyState/ErrorState/SkeletonList/RefreshButton), `StatusBadge.tsx`, `ConfirmDialog.tsx`, `UpgradeModal.tsx` |
| Pages | `apps/web/src/pages/dashboard/{Home,Projects,Devices,Sessions,ApiKeys,Activity,Settings,Billing}.tsx` |
| Reference implementations (good) | `ApiKeys.tsx`, `Devices.tsx`, `Sessions.tsx`, `Activity.tsx` |

---

*End of audit. No source files were modified. Ready to implement on your go-ahead — recommend starting with P0.*
