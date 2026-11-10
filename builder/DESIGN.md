---
name: Filament Theme Builder
description: A calm, precise visual control room for shaping Filament themes.
colors:
  shell: "#f3f5f4"
  ink: "#20272e"
  forest: "#1f3b36"
  filament-teal: "#315b53"
  teal-wash: "#e6f2ee"
  focus-amber: "#e2a832"
  line: "#dce5e2"
  panel: "#ffffff"
typography:
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "1.45"
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "1.4"
rounded:
  sm: "0.35rem"
spacing:
  control: "0.3rem"
  compact: "0.5rem"
  section: "0.75rem"
components:
  button-primary:
    backgroundColor: "{colors.filament-teal}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: "0.25rem 0.5rem"
---

# Design System: Filament Theme Builder

## Overview

**Creative North Star: "The Filament Control Room"**

The builder is a calm and precise control room for making visual decisions. It places a focused editing surface beside a realistic preview, using layered pale surfaces and quiet borders to keep attention on the theme rather than on decoration.

The system is crisp and utilitarian. Compact controls, restrained typography, and a muted green accent make state and hierarchy legible without turning the workspace into a decorative dashboard.

**Key Characteristics:**
- Layered white work areas over a pale green-gray shell.
- Muted Filament teal for active and actionable states.
- Compact, expert-oriented controls with clear focus treatment.

## Colors

The palette is neutral and cool with a subdued green accent and a small amber focus signal.

### Primary
- **Filament Teal** (#315b53): Actionable controls, active navigation, and theme-oriented emphasis.

### Neutral
- **Control Shell** (#f3f5f4): The application frame behind the working surfaces.
- **Ink** (#20272e): Primary interface text.
- **Forest Ink** (#1f3b36): Headings and high-emphasis product text.
- **Teal Wash** (#e6f2ee): Selected navigation and active control backgrounds.
- **Focus Amber** (#e2a832): Keyboard focus indication.
- **Quiet Line** (#dce5e2): Borders and structural dividers.
- **Panel White** (#ffffff): Primary editing and preview surfaces.

**The Rare Accent Rule.** Filament teal should identify action and active state, not become a decorative fill across the whole workspace.

## Typography

**Display Font:** ui-sans-serif, system-ui, sans-serif
**Body Font:** ui-sans-serif, system-ui, sans-serif

**Character:** A compact system-first hierarchy that favors rapid scanning and unambiguous labels over expressive display typography.

### Hierarchy
- **Title** (700, 1rem, 1.2): Product and workspace headings.
- **Body** (400, 13px, 1.45): Controls, supporting copy, and editor content.
- **Label** (600, 12px, 1.4): Field labels, legends, and compact navigation.

## Layout

The primary workspace is a side-by-side editor and preview. The editor occupies a compact fixed-responsive column while the preview receives the remaining width. On small screens the preview moves above the editor, with the control surface becoming the lower scrolling region. Spacing is compact and regular, typically using 0.3rem to 0.75rem gaps.

## Elevation & Depth

Depth comes from layered surfaces and structural borders rather than shadows. The application shell is pale green-gray, the editor and preview are white, and quiet green-gray lines separate working regions.

**The Border-First Rule.** Use a clear structural divider before adding visual elevation.

## Shapes

Controls use gently compact corners around 0.35rem. Borders are visible but quiet. The form language is rectangular and practical, with rounded corners used to soften controls rather than to create pill-shaped decoration.

## Components

### Buttons
- **Shape:** Compact softened corners (0.35rem).
- **Primary:** Filament teal with white text and compact horizontal padding.
- **Hover / Focus:** Shift toward a pale teal wash on secondary controls; use a strong amber outline for keyboard focus.
- **Secondary / Ghost / Tertiary:** White or transparent surfaces with quiet green-gray borders.

### Cards / Containers
- **Corner Style:** Compact corners (0.35rem) where a container needs rounding.
- **Background:** White panels on the pale shell.
- **Shadow Strategy:** No default shadow; rely on borders and tonal layering.
- **Border:** Quiet green-gray structural lines.
- **Internal Padding:** Compact spacing, expanded only where a control group needs breathing room.

### Inputs / Fields
- **Style:** Full-width compact fields with visible borders and inherited system typography.
- **Focus:** Three-pixel amber outline with a small offset.
- **Error / Disabled:** Preserve the field's structure and communicate state through explicit color and status text rather than ornament.

### Navigation
- **Style:** Compact vertical rail or horizontal tabs. Active items use a pale teal wash, quiet border, and heavier text. Navigation remains scrollable when space is constrained.

## Do's and Don'ts

### Do:
- **Do** keep the editor and preview visibly connected through shared surfaces and border rhythm.
- **Do** use Filament teal to make active and actionable states easy to scan.
- **Do** preserve keyboard focus visibility with the amber outline.
- **Do** let responsive layout move the preview above the controls on narrow screens.

### Don't:
- **Don't** add gradients, oversized hero treatments, or ornamental dashboard cards.
- **Don't** replace clear borders with shadows as the default depth cue.
- **Don't** make the accent color compete with the editable theme preview.
