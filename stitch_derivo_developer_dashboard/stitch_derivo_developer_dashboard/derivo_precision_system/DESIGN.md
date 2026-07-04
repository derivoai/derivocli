---
name: Derivo Precision System
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f22'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#c6c6cf'
  on-secondary: '#2f3037'
  secondary-container: '#45464e'
  on-secondary-container: '#b4b4bd'
  tertiary: '#ffffff'
  on-tertiary: '#2f3131'
  tertiary-container: '#e2e2e2'
  on-tertiary-container: '#636565'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e2e1eb'
  secondary-fixed-dim: '#c6c6cf'
  on-secondary-fixed: '#1a1b22'
  on-secondary-fixed-variant: '#45464e'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1440px
  sidebar-width: 260px
  gutter: 24px
  margin-mobile: 16px
  stack-gap: 12px
---

## Brand & Style

This design system embodies the "Derivo" ethos: high-performance technical utility. The brand personality is rooted in precision, transparency, and architectural minimalism. It targets developers and system architects who value speed and clarity over visual decoration.

The design style is **Technical Minimalism**—a hybrid of professional SaaS layouts and the functional raw aesthetic of a terminal. It utilizes a strict grayscale palette to eliminate cognitive noise, allowing the user's data and code to remain the focal point. Expect heavy use of whitespace, intentional typographic hierarchy, and subtle structural borders that define the workspace without cluttering the interface.

## Colors

The palette is strictly monochromatic to reflect a high-performance environment. 

- **Primary:** Pure White (#FFFFFF) is reserved for high-priority text, active states, and primary actions to ensure maximum contrast against the dark void.
- **Secondary/Functional Grays:** A curated scale of Zinc and Slate grays handles secondary text, inactive states, and structural lines.
- **Backgrounds:** The interface utilizes "true black" (#000000) for the primary background to reduce eye strain and save power on OLED displays, with a slightly elevated "surface" black (#09090B) for containers and sidebars.
- **Status Indicators:** While adhering to the monochrome aesthetic, critical states (Error, Success) should prioritize high-contrast patterns or semantic gray shades (White for Success, Mid-gray for Warning). If color is strictly required for safety, use desaturated, high-value versions of red and green sparingly.

## Typography

The typographic strategy balances human-readable UI with machine-accurate data.

1.  **UI Elements:** `Inter` is the workhorse for standard interface text, providing a neutral and highly legible experience for settings and navigation.
2.  **Headlines:** `Geist` provides a sharp, contemporary edge for page titles and section headers, reinforcing the "modern software" feel.
3.  **Technical Data:** `JetBrains Mono` is used exclusively for CLI commands, API keys, IDs, and any data-heavy table cells. This ensures character distinction (e.g., 0 vs O) which is critical for developer tools.
4.  **Hierarchy:** Use weight and contrast (White vs Gray) rather than size to denote importance. Use `label-caps` for table headers and sidebar category labels.

## Layout & Spacing

This design system utilizes a **Fixed-Fluid Hybrid** model optimized for wide-screen productivity.

- **Sidebar:** A persistent 260px sidebar on the left houses the primary navigation. It uses a slightly elevated surface color (#09090B) to separate it from the main workspace.
- **Grid:** The main content area follows a 12-column grid but prioritizes "Stacking" for data views. Tables should span the full width of their containers.
- **Rhythm:** A base-4 unit system drives all spacing. 12px (`stack-gap`) is the default vertical spacing between related elements; 24px (`gutter`) is the standard margin between major UI sections.
- **Responsive:** On mobile, the sidebar collapses into a bottom-sheet or a full-screen overlay triggered by a top-bar "hamburger." Content margins reduce to 16px.

## Elevation & Depth

Depth is conveyed through **Tonal Layering** and **Low-Contrast Outlines** rather than traditional shadows.

- **Base Layer:** Pure Black (#000000) for the global background.
- **Surface Layer:** Dark Gray (#09090B) for cards, sidebars, and navigation headers.
- **Borders:** All surfaces are defined by 1px solid borders (#27272A). This "wireframe" approach reinforces the technical, precise nature of the tool.
- **Interaction:** Hover states should be indicated by a shift in border brightness (from #27272A to #3F3F46) or a subtle white "glow" using a very low-opacity white shadow (e.g., `0 0 10px rgba(255, 255, 255, 0.05)`).

## Shapes

The shape language is "Soft-Geometric." 

While the system is built on a rigid grid, subtle rounding prevents the UI from feeling aggressive or dated. 
- **Standard Elements:** Buttons, inputs, and cards use a 4px (0.25rem) radius.
- **Large Containers:** Modals or large data views use an 8px (0.5rem) radius.
- **Status Pills:** Small chips for tags or IDs use a fully rounded "pill" shape to distinguish them from interactive buttons.

## Components

- **Buttons:** Primary buttons are Solid White with Black text. Secondary buttons are Ghost style (Border: #27272A, Text: White). Active/Pressed states should invert or slightly dim the primary color.
- **Data Tables:** High-density layouts with 1px horizontal dividers only. Headers use `label-caps` with a subtle gray background. Rows use monospaced fonts for technical IDs.
- **Input Fields:** Dark background (#000000), 1px border (#27272A), and Monospaced text for the input value. Focus state is a 1px White border.
- **CLI Stepper:** A specialized component for onboarding. Each step is a contained card with a "Copy to Clipboard" block using a JetBrains Mono "terminal" style (Background: #000000).
- **Navigation:** Grouped into "Main" and "Configuration." Active links are marked with a vertical 2px white line on the extreme left and high-contrast white text.
- **Chips/Tags:** Used for "Project" status or "Language" type. Use a subtle gray border and monospaced text to maintain the technical aesthetic.