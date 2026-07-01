# UI Design Prompt — Derivo "Obsidian Terminal" Redesign

Use this prompt with an AI image generation tool (Midjourney, DALL-E, Figma AI, etc.) to generate mockups for each page.

---

## Global Style Brief

> Design a developer tool SaaS website in a **dark monochrome brutalist-terminal** style. Pure black backgrounds (#000). Only white and gray tones — absolutely no color. Sharp square corners, no rounded elements. Typography-driven hierarchy using tight bold headlines and monospace labels. Inspired by terminal interfaces, editorial print design, and code editors. Generous negative space. 1px hairline borders in dark gray. Flat design — no gradients, no glassmorphism, no shadows, no glows. All UI elements feel etched or printed onto black paper.

---

## Page 1: Landing — Hero + Navigation

**Prompt:**

> Dark monochrome landing page for a developer CLI tool called "Derivo". Pure black (#000) background. Full-width horizontal navigation bar at top with thin bottom border — logo on left, monospace uppercase links centered, white rectangular "Get Started" button on right. Massive bold white headline reading "Your README shouldn't be 400 lines." taking up 60% of viewport width. Gray subtext below. Two CTA buttons side by side: solid white rectangle with black text, and an outlined white-border rectangle with white text. Below the hero, a thin horizontal rule separates sections. No decorations, no gradients, no rounded shapes. Stark, editorial, high contrast. Desktop 1440px wide.

---

## Page 2: Landing — CLI Terminal Demo

**Prompt:**

> Full-width terminal UI component on pure black background. Square corners, thin 1px gray border. Top bar has three small gray squares (window controls) and monospace text "derivo terminal" centered. Terminal body shows monospace text: a command prompt with "derivo setup" typed, followed by status lines showing checks with ✓ and ✗ symbols — all in white and gray only. A thin white progress bar at the bottom (60% filled) with "Environment Readiness" label in tiny monospace. No rounded corners anywhere. No colored text. No glow effects. Flat, stark, code-editor aesthetic. Desktop width.

---

## Page 3: Landing — Features Section

**Prompt:**

> Features section on pure black background. Left column: section label in tiny gray uppercase monospace "INTERACTIVE DIAGNOSTICS", large bold white headline "We don't just report errors. We fix them." Right side: vertical list of 6 feature items separated by thin horizontal rules. Each item has a large monospace number (01, 02, 03...) on the left, bold white title, and gray description text. No cards, no colored accents, no icons. One item in hover state: slightly shifted right with the number having inverted colors (white square behind black number). Clean grid layout, generous spacing. Desktop 1440px.

---

## Page 4: Landing — How It Works (Workflow)

**Prompt:**

> Vertical timeline section on black background styled like a code editor gutter. Left margin has monospace step numbers (01-06) aligned vertically. Each step has bold white title and gray description indented to the right. Steps separated by generous vertical spacing. The active step (02 "Run derivo setup") has brighter white text and a command shown in a monospace inline code block with 1px border. Inactive steps are dimmer gray. No rounded bullets — use square or dash markers. A vertical 1px line runs down the left gutter. Minimalist, terminal-inspired. Desktop width.

---

## Page 5: Landing — Pricing

**Prompt:**

> Pricing comparison section on pure black background. Two plans side by side in a table-like layout with visible thin white grid lines. Left plan: "Community" — $0 forever. Right plan: "Team" — $12/seat/mo. Feature rows listed below each with checkmarks (✓) or dashes (—). Headers are bold white, descriptions in gray monospace. CTA buttons at bottom: outlined rectangle for free plan, solid white rectangle for paid plan. No cards, no gradients, no rounded corners. Sharp grid aesthetic like a spreadsheet. Desktop 1440px.

---

## Page 6: Auth — Login Page

**Prompt:**

> Minimalist login page on pure black background. Centered narrow form (max 400px). Small white Derivo logo at top. "Welcome back" in bold white, subtitle in gray. Two OAuth buttons: outlined rectangles with Google and GitHub icons, monospace text. A divider line with "OR" in gray. Two input fields with 1px gray borders, square corners, no fill — labels above in tiny uppercase monospace gray. "Email" and "Password" inputs. Forgot password link in gray. Full-width solid white submit button with black text "Sign In". "Don't have an account? Sign up" at bottom in gray. No decorations, no side panels, no illustrations. Pure black void around the form.

---

## Page 7: Dashboard — Overview

**Prompt:**

> Developer dashboard overview on black background. Narrow sidebar (200px) on left with black background and 1px right border. Sidebar navigation: text-only items (Overview, Projects, Devices, API Keys, Activity) with the active item having a 2px white left-border indicator. Main content area: "Welcome back, John" headline at top. Below: three stat blocks in a row separated by thin vertical hairlines — large monospace numbers (subscription status, "3" active projects, "Optimal" health) with tiny uppercase gray labels. Below: recent projects as a table with columns (name, framework, status, last sync). Activity feed on right as compact single-line entries with timestamps. No cards with backgrounds, no rounded corners, no colored indicators. Everything flat white-on-black with hairline dividers.

---

## Page 8: Dashboard — Projects List

**Prompt:**

> Projects list page in a dark monochrome dashboard. Black background, narrow sidebar on left. Main area shows "Projects" headline and a table/list of project entries. Each row: project name in white, framework in gray monospace, environment tag, status indicator (just the word "synced" or "error" in white/gray text), and a timestamp. Rows separated by 1px borders. Header row with column labels in tiny uppercase monospace. A "New Project" button in top right: outlined white rectangle. Empty, clean, data-focused. No cards, no icons, no color.

---

## Page 9: Dashboard — Settings

**Prompt:**

> Account settings page in dark monochrome dashboard. Black background with sidebar. Main content has section headings in bold white with descriptive gray text below. Form fields for name, email — same square-corner 1px border inputs on black. A "Danger Zone" section at bottom with a destructive action in a bordered box with gray text. Save button: solid white rectangle. Everything sharp-edged, monospace labels, no decorations. Clinical and functional.

---

## Page 10: Mobile Responsive — Landing Hero

**Prompt:**

> Mobile version (390px width) of the dark monochrome landing page. Full-width nav bar at top with logo and hamburger menu icon (three horizontal lines). Large bold headline stacked vertically taking full width. Gray subtext. CTA buttons stacked vertically — white filled rectangle on top, outlined rectangle below. Pure black background, no decorations. Sharp typography. Below, the terminal demo component fills full width with square corners.

---

## Figma / Design System Notes

When designing in Figma:
- Use 8px grid system
- Base spacing unit: 4px
- Section vertical padding: 120px desktop, 80px mobile
- Max content width: 1120px
- Sidebar width: 200px
- Form max width: 400px
- Border width: always 1px
- Corner radius: 0px (or max 4px for inputs if needed)
- No drop shadows anywhere
- No blur effects
- Only use opacity for text hierarchy (100%, 53%, 33%, 20%)
