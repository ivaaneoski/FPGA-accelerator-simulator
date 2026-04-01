# FPGA-NN Accelerator Simulator — Brand Guidelines

## Product Name
**FPGA-NN Accelerator Simulator**

Always written in full on first mention. Abbreviated form **FPGA-NN Sim** is acceptable in compact UI contexts (nav labels, tab titles, mobile headers). Never abbreviated beyond that.

### Acceptable Usage
- FPGA-NN Accelerator Simulator (full, preferred)
- FPGA-NN Sim (compact UI only)
- FPGA-NN ACCELERATOR SIMULATOR (all caps, headings only)

### Unacceptable Usage
- FPGA NN Simulator (missing hyphen)
- FPGASim (no space or hyphen)
- fpga-nn accelerator simulator (all lowercase)
- FPGA Neural Net Sim (do not expand "NN" in the abbreviated form)
- NN Accelerator (do not drop "FPGA" — it is the core identity word)

---

## Logo & App Icon Usage

### App Icon Concept
The icon uses a stylized chip grid motif — a 3×3 dot/node grid with connecting lines suggesting a neural network mapped onto silicon. The primary color is Indigo Core (`#6366f1`) on a dark background (`#0f172a`).

### Clear Space
Maintain clear space around the logo equal to the height of the "F" in "FPGA" on all four sides.

### Minimum Size
- Digital: 120px width minimum
- Favicon: 32×32px (use simplified icon mark only, no wordmark)
- Print: 1 inch / 25mm width minimum

### Logo Don'ts
- Do not stretch or distort the logo
- Do not rotate the logo
- Do not recolor outside the approved palette
- Do not add drop shadows, glows, gradients, or outlines
- Do not place the logo on busy or image-heavy backgrounds
- Do not use the light-mode wordmark on dark backgrounds or vice versa

---

## Color Palette

The palette is split into **Dark Mode (default)** and **Light Mode (override)**. Dark mode is the primary experience; always design dark-first.

---

### Dark Mode — Primary Colors

**Indigo Core** *(Primary accent — buttons, active states, key UI highlights)*
- HEX: `#6366f1`
- RGB: 99, 102, 241
- HSL: 239°, 84%, 67%
- Tailwind: `indigo-500`
- Use as: Primary buttons, active nav tab, chart LUT bars, focus rings, links

**Deep Navy** *(Page background)*
- HEX: `#0f172a`
- RGB: 15, 23, 42
- HSL: 222°, 47%, 11%
- Tailwind: `slate-900`
- Use as: App background, outermost shell

**Surface Slate** *(Card / panel background)*
- HEX: `#1e293b`
- RGB: 30, 41, 59
- HSL: 215°, 33%, 18%
- Tailwind: `slate-800`
- Use as: Cards, sidebars, modals, form backgrounds

**Border Slate** *(Dividers and borders)*
- HEX: `#334155`
- RGB: 51, 65, 85
- HSL: 215°, 25%, 27%
- Tailwind: `slate-700`
- Use as: Card borders, input borders, table dividers, separator lines

---

### Dark Mode — Text Colors

**Text Primary**
- HEX: `#f1f5f9`
- Tailwind: `slate-100`
- Use as: Headings, primary labels, table values

**Text Secondary**
- HEX: `#94a3b8`
- Tailwind: `slate-400`
- Use as: Sublabels, captions, chart axis ticks, placeholder text, secondary metadata

---

### Dark Mode — Semantic / Status Colors

**Success Green** *(Utilization safe zone, positive deltas)*
- HEX: `#22c55e`
- Tailwind: `green-500`
- Use as: Utilization < 60%, positive percentage changes, FF bars in charts

**Warning Amber** *(Utilization caution zone, BRAM bars)*
- HEX: `#f59e0b`
- Tailwind: `amber-500`
- Use as: Utilization 60–80%, BRAM bars in charts, roofline ridge marker

**Danger Red** *(Utilization critical zone, errors, memory-bound label)*
- HEX: `#ef4444`
- Tailwind: `red-500`
- Use as: Utilization > 80%, API error toasts, memory-bound layer dots in roofline chart, delete confirmations

---

### Dark Mode — Extended Chart Palette

These colors are exclusively for data visualization. Never use them for UI chrome (buttons, nav, backgrounds).

| Role | Name | HEX | Tailwind |
|---|---|---|---|
| Conv2D layer identity | Indigo | `#6366f1` | indigo-500 |
| Dense layer identity | Teal | `#14b8a6` | teal-500 |
| LUT resource bars | Indigo | `#6366f1` | indigo-500 |
| DSP resource bars | Purple | `#a855f7` | purple-500 |
| BRAM resource bars | Amber | `#f59e0b` | amber-500 |
| FF resource bars | Green | `#22c55e` | green-500 |
| Comparison config 1 | Indigo | `#6366f1` | indigo-500 |
| Comparison config 2 | Teal | `#14b8a6` | teal-500 |
| Comparison config 3 | Amber | `#f59e0b` | amber-500 |
| Roofline — compute-bound | Red | `#ef4444` | red-500 |
| Roofline — memory-bound | Indigo | `#6366f1` | indigo-500 |
| Roofline roof line | Amber | `#f59e0b` | amber-500 |
| Chart grid lines | Border Slate | `#334155` | slate-700 |
| Chart background overlay | Surface Slate | `#1e293b` | slate-800 |

---

### Light Mode — Override Colors

Light mode is applied by adding the `dark` class to `<html>` via Tailwind's `darkMode: 'class'` config. These values override dark mode tokens only.

| Token | Dark Mode | Light Mode |
|---|---|---|
| Page background | `#0f172a` | `#f8fafc` (slate-50) |
| Surface / cards | `#1e293b` | `#ffffff` |
| Border | `#334155` | `#e2e8f0` (slate-200) |
| Text primary | `#f1f5f9` | `#0f172a` (slate-900) |
| Text secondary | `#94a3b8` | `#64748b` (slate-500) |
| Primary accent | `#6366f1` | `#6366f1` *(unchanged)* |
| Success | `#22c55e` | `#16a34a` (green-600) |
| Warning | `#f59e0b` | `#d97706` (amber-600) |
| Danger | `#ef4444` | `#dc2626` (red-600) |

> **Rule:** The primary accent `#6366f1` does not change between modes. All other semantic colors may darken slightly in light mode for contrast compliance.

---

### Utilization Color Thresholds

Applied to progress bars and gauge charts based on percentage value:

| Utilization % | Color | HEX |
|---|---|---|
| 0 – 59% | Success Green | `#22c55e` |
| 60 – 79% | Warning Amber | `#f59e0b` |
| 80 – 100% | Danger Red | `#ef4444` |

---

## Typography

### Primary Typeface
**Inter** — used for all UI text, labels, values, and headings.

Fallback stack: `Inter, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif`

Import in `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet" />
```

### Secondary Typeface — Code / Monospace
**JetBrains Mono** (or `ui-monospace, 'Cascadia Code', 'Fira Code', monospace`)

Use exclusively for: formula strings, layer parameter values in tables, JSON config previews, API endpoint labels.

---

### Font Weights

| Weight | Value | Usage |
|---|---|---|
| Bold | 700 | Page headings (H1, H2), card metric values, badge labels |
| Semi-Bold | 600 | Section subheadings (H3), table column headers, button labels, nav tab text |
| Regular | 400 | Body text, form labels, tooltip content, chart axis labels |
| Light | 300 | Captions, secondary metadata, formula provenance citations — use sparingly |

---

### Type Scale

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| H1 | 32px / 2rem | 1.2 | 700 | Page titles (e.g., "Simulator", "Analytics") |
| H2 | 24px / 1.5rem | 1.2 | 700 | Section headings within a page |
| H3 | 20px / 1.25rem | 1.3 | 600 | Widget titles, panel headers, card titles |
| H4 | 18px / 1.125rem | 1.3 | 600 | Subsection labels, form group headings |
| Body | 16px / 1rem | 1.5 | 400 | General body text, form field values |
| Small | 14px / 0.875rem | 1.5 | 400 | Table cells, chart tooltips, input helper text |
| Caption | 12px / 0.75rem | 1.4 | 300 | Axis tick labels, formula citations, timestamps |
| Mono | 13px / 0.8125rem | 1.6 | 400 | Formula strings, code values, config JSON |

---

### Typography Don'ts
- Do not use font sizes below 12px in any context
- Do not use Light (300) weight for anything interactive (buttons, labels, links)
- Do not mix Inter and any serif typeface in the same view
- Do not use all-caps for body text or any text longer than 4 words
- Do not set line-height below 1.2 for any text element

---

## Spacing System

Based on a **4px base unit**. All spacing values must be multiples of 4.

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| xs | 4px | `p-1` / `gap-1` | Icon padding, tight inline spacing |
| sm | 8px | `p-2` / `gap-2` | Badge padding, compact chip spacing |
| md | 16px | `p-4` / `gap-4` | Card internal padding, form field gaps |
| lg | 24px | `p-6` / `gap-6` | Section padding, panel gutters |
| xl | 32px | `p-8` / `gap-8` | Page-level padding, large section gaps |
| 2xl | 48px | `p-12` / `gap-12` | Between major page sections |

---

## UI Components

### Buttons

**Primary Button**
- Background: Indigo Core `#6366f1`
- Text: White `#ffffff`, Semi-Bold (600), 14px
- Border Radius: 8px
- Padding: 10px 20px
- Hover: `#4f46e5` (indigo-600) — darken 10%
- Active: `#4338ca` (indigo-700)
- Disabled: `#334155` background, `#64748b` text, cursor not-allowed
- Focus ring: `2px solid #6366f1`, `2px offset`

**Secondary Button**
- Background: Transparent
- Border: 1.5px solid `#6366f1`
- Text: Indigo Core `#6366f1`, Semi-Bold (600), 14px
- Border Radius: 8px
- Padding: 10px 20px
- Hover: `rgba(99, 102, 241, 0.1)` background tint
- Active: `rgba(99, 102, 241, 0.2)` background tint

**Danger Button** *(delete, clear all actions)*
- Background: Transparent
- Border: 1.5px solid `#ef4444`
- Text: Danger Red `#ef4444`
- Hover: `rgba(239, 68, 68, 0.1)` background tint

**Icon Button** *(edit/delete on layer cards)*
- Background: Transparent
- Icon color: Text Secondary `#94a3b8`
- Hover: Icon color shifts to Text Primary `#f1f5f9`, background `rgba(255,255,255,0.05)`
- Size: 32×32px clickable area, 20px icon

---

### Cards

- Background: Surface Slate `#1e293b`
- Border: 1px solid Border Slate `#334155`
- Border Radius: 12px
- Box Shadow: `0 2px 8px rgba(0, 0, 0, 0.3)`
- Internal padding: 24px (`p-6`)
- Card title: H3 (20px, Semi-Bold), Text Primary
- Card subtitle / label: Caption (12px, Light), Text Secondary

**Metric Cards** *(Total LUTs, DSPs, BRAMs, Latency)*
- Value: 28px, Bold (700), Text Primary
- Unit label: 12px, Regular, Text Secondary
- Progress bar: full width, 6px height, Border Radius 9999px
- Progress bar track: Border Slate `#334155`
- Progress bar fill: dynamic (see Utilization Color Thresholds above)

---

### Input Fields

- Background: Deep Navy `#0f172a` (one step darker than Surface)
- Border: 1px solid Border Slate `#334155`
- Border Radius: 8px
- Text: Body (16px), Text Primary `#f1f5f9`
- Placeholder: Text Secondary `#94a3b8`
- Padding: 10px 14px
- Focus state: border color → Indigo Core `#6366f1`, `box-shadow: 0 0 0 3px rgba(99,102,241,0.2)`
- Error state: border color → Danger Red `#ef4444`, error message in Caption below field
- Disabled: background `#1e293b`, text `#64748b`, cursor not-allowed

**Select / Dropdown**
- Same styles as input fields
- Chevron icon: 16px, Text Secondary color
- Option list background: Surface Slate `#1e293b`
- Option hover: `rgba(99,102,241,0.1)` background

**Range Slider** *(Parallelism factor)*
- Track background: Border Slate `#334155`
- Track fill (left of thumb): Indigo Core `#6366f1`
- Thumb: 18px circle, Indigo Core `#6366f1`, white border 2px
- Step markers below slider: Caption size, Text Secondary
- Current value bubble above thumb: Surface Slate background, Text Primary, 10px font

---

### Badges / Tags

**Layer Type Badge — Conv2D**
- Background: `rgba(99, 102, 241, 0.15)`
- Text: `#818cf8` (indigo-400)
- Border: 1px solid `rgba(99,102,241,0.3)`
- Border Radius: 6px
- Padding: 2px 8px
- Font: 12px, Semi-Bold (600)

**Layer Type Badge — Dense**
- Background: `rgba(20, 184, 166, 0.15)`
- Text: `#2dd4bf` (teal-400)
- Border: 1px solid `rgba(20,184,166,0.3)`
- Border Radius: 6px
- Padding: 2px 8px
- Font: 12px, Semi-Bold (600)

**Roofline Badge — Compute-bound**
- Background: `rgba(239, 68, 68, 0.15)`
- Text: `#f87171` (red-400)
- Border: 1px solid `rgba(239,68,68,0.3)`

**Roofline Badge — Memory-bound**
- Background: `rgba(99, 102, 241, 0.15)`
- Text: `#818cf8` (indigo-400)
- Border: 1px solid `rgba(99,102,241,0.3)`

**Precision Badge — FP32**
- Background: `rgba(249, 115, 22, 0.15)`
- Text: `#fb923c` (orange-400)

**Precision Badge — INT8**
- Background: `rgba(99, 102, 241, 0.15)`
- Text: `#818cf8` (indigo-400)

**Precision Badge — INT4**
- Background: `rgba(168, 85, 247, 0.15)`
- Text: `#c084fc` (purple-400)

---

### Tables

- Header row background: `rgba(99,102,241,0.08)`
- Header text: Caption (12px), Semi-Bold (600), Text Secondary `#94a3b8`, uppercase letter-spacing 0.05em
- Row background (odd): transparent
- Row background (even): `rgba(255,255,255,0.02)`
- Row hover: `rgba(99,102,241,0.06)` background
- Row border: 1px solid Border Slate `#334155` (bottom only)
- Cell text: Small (14px), Regular, Text Primary
- Numeric cells: right-aligned, monospace font
- Best value in Comparison table: Text Success Green `#22c55e`, bold

---

### Modals / Dialogs

- Backdrop: `rgba(0,0,0,0.6)`, `backdrop-filter: blur(4px)`
- Modal container: Surface Slate `#1e293b`, Border Radius 16px, Border 1px `#334155`
- Max width: 540px
- Header: H3, Text Primary, border-bottom 1px `#334155`, padding 20px 24px
- Body: padding 24px
- Footer: padding 16px 24px, border-top 1px `#334155`, flex row right-aligned
- Close icon: top-right, 20px × icon, Text Secondary color

---

### Toast Notifications

- Position: bottom-right, 16px from edges
- Border Radius: 10px
- Padding: 12px 16px
- Font: Small (14px), Regular
- Min width: 240px, Max width: 380px
- Auto-dismiss: 4 seconds

**Error toast:** Background `#1e293b`, left border 3px solid `#ef4444`, icon `#ef4444`
**Success toast:** Background `#1e293b`, left border 3px solid `#22c55e`, icon `#22c55e`
**Info toast:** Background `#1e293b`, left border 3px solid `#6366f1`, icon `#6366f1`

---

### Navigation Bar

- Background: Surface Slate `#1e293b`
- Bottom border: 1px solid Border Slate `#334155`
- Height: 60px
- Tab text: Small (14px), Semi-Bold (600), Text Secondary when inactive
- Active tab: Text Primary `#f1f5f9`, bottom border 2px solid Indigo Core `#6366f1`
- Tab hover: Text Primary `#f1f5f9`
- App title: H3 (20px), Bold, Text Primary
- Header icon buttons (theme toggle, GitHub): 20px icon, Text Secondary, hover Text Primary

---

### Skeleton Loaders

- Background base: Border Slate `#334155`
- Shimmer overlay: animated gradient from `#334155` → `#475569` → `#334155`
- Animation: `shimmer 1.5s infinite linear`
- Border Radius: matches the element being replaced (8px for text, 12px for cards)

---

## Iconography

### Icon Library
**Lucide React** — use exclusively. Do not mix with other icon sets.

```bash
npm install lucide-react
```

### Standard Sizes
| Context | Size |
|---|---|
| Inline with body text | 16px |
| Standard UI icon | 20px |
| Navigation bar | 20px |
| Card header emphasis | 24px |
| Empty state illustration | 48px |

### Stroke Width
- Standard: `strokeWidth={1.5}` — used everywhere
- Emphasis: `strokeWidth={2}` — only for primary action buttons
- Never use `strokeWidth={1}` or `strokeWidth={3}`

### Color Rules
- Default icon color: Text Secondary `#94a3b8`
- Icon on primary button: White `#ffffff`
- Emphasis icon (in card header next to title): Indigo Core `#6366f1`
- Status icons: match semantic color (success → green, error → red, warning → amber)

### Icon–Label Pairing
Always pair icons with a visible text label in navigation and primary actions. Icons alone are acceptable only for compact icon buttons (edit, delete, copy) where tooltip is provided on hover.

### Icon Assignments by Feature

| Feature | Icon (Lucide name) |
|---|---|
| Add Layer | `Plus` |
| Edit Layer | `Pencil` |
| Delete Layer | `Trash2` |
| Conv2D | `Grid3x3` |
| Dense / FC | `Network` |
| Parallelism | `Zap` |
| Precision / Quantization | `Gauge` |
| Save Configuration | `Save` |
| Load Configuration | `FolderOpen` |
| Export JSON | `Download` |
| Import JSON | `Upload` |
| FPGA Target | `Cpu` |
| Latency | `Timer` |
| LUT Resource | `LayoutGrid` |
| DSP Resource | `Calculator` |
| BRAM Resource | `Database` |
| Roofline / Analytics | `TrendingUp` |
| Comparison | `GitCompare` |
| Dark Mode Toggle | `Moon` / `Sun` |
| GitHub Link | `Github` |
| Formula / Reference | `BookOpen` |
| Efficiency Score | `Award` |
| Warning / Caution | `AlertTriangle` |
| Error | `XCircle` |
| Success | `CheckCircle2` |

---

## Data Visualization Standards

### General Rules
- All charts must have tooltips on hover
- All charts must have a visible legend when more than one data series is shown
- Chart backgrounds are always transparent (no fill — inherits Surface Slate card)
- Grid lines: Border Slate `#334155`, `strokeDasharray="3 3"`
- Axis text: Caption (12px), Text Secondary `#94a3b8`
- Tooltip container: Surface Slate `#1e293b`, border 1px `#334155`, border-radius 8px, padding 10px 14px
- Tooltip label: Small (14px), Text Primary
- Tooltip values: Small (14px), Text Secondary
- Do not use 3D charts of any kind
- Do not use pie charts (use donut charts instead if proportional data is needed)

### Bar Chart (Resource Breakdown)
- Bar border radius: 4px (top corners only)
- Bar gap (between groups): 8px
- Category gap: 20%
- Animate on first load: `isAnimationActive={true}`, duration 600ms, easing ease-out

### Semicircular Gauge (Utilization)
- Implementation: Recharts `RadialBarChart`, `startAngle={180}`, `endAngle={0}`
- Track (background arc): Border Slate `#334155`
- Fill arc: dynamic color per Utilization Color Thresholds
- Corner radius: 4px on fill arc
- Center label: percentage in Bold (700), 20px; resource name in Caption below

### Radar Chart (Comparison)
- Grid: Border Slate `#334155`
- Angle axis labels: Caption (12px), Text Secondary
- Fill opacity per series: 0.15
- Stroke width: 2px
- Max 3 series simultaneously

### Scatter / Roofline Chart
- Both axes: `scale="log"`, `domain={['auto','auto']}`
- Data point radius: 6px
- Point label: Caption (11px), Text Secondary, offset 8px right
- Roof line: Amber `#f59e0b`, `strokeWidth={2}`, `strokeDasharray="6 3"`
- Axis labels: use `<Label>` component, Small (13px), Text Secondary

### Latency Waterfall (Horizontal Bar)
- Layout: `layout="vertical"` in Recharts `BarChart`
- Bar height: 28px
- Color by layer type: Conv2D → Indigo `#6366f1`, Dense → Teal `#14b8a6`
- Y-axis: layer names, Small (13px), Text Secondary
- X-axis: latency in µs, Caption (12px), Text Secondary

---

## Motion & Animation

### Principles
- Animations exist to communicate state change, not for decoration
- All transitions: ease-in-out unless specified
- Never animate layout shifts — only opacity, transform, color

### Durations
| Interaction | Duration |
|---|---|
| Button hover color change | 150ms |
| Card hover shadow lift | 200ms |
| Modal open / close | 250ms |
| Toast slide in | 300ms |
| Chart initial render | 600ms |
| Skeleton shimmer loop | 1500ms |
| Page tab transition | 200ms |

### Skeleton Shimmer CSS
```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}
```

---

## Responsive Layout

### Breakpoints

| Name | Min Width | Layout |
|---|---|---|
| Mobile | < 768px | Single column, full width |
| Tablet | 768px – 1279px | Single column, charts stack below sidebar |
| Desktop | ≥ 1280px | Two-column: 320px sidebar left, charts right |

### Layout Rules
- Sidebar (layer stack panel): fixed 320px on desktop, full width on mobile/tablet
- Chart area: fluid, fills remaining horizontal space
- Minimum app width: 360px (do not break below this)
- Page horizontal padding: 24px mobile, 32px tablet, 40px desktop
- Card grid (resource summary): 1 col mobile, 2 col tablet, 4 col desktop

### Mobile-specific Rules
- Charts remain horizontally scrollable (do not truncate or scale down)
- Parallelism slider: full width, larger thumb (24px) for touch
- Modal: full-screen on mobile (100vw × 100vh, no border radius)
- Navigation: horizontal scroll tabs, do not collapse to hamburger

---

## Tone of Voice

### Core Attributes
- **Technical but accessible**: Use correct hardware terminology (LUT, DSP, BRAM, MAC) without condescension. Link to the References page for unfamiliar terms.
- **Precise**: Always show units. Never display a bare number without context — e.g., "14,320 LUTs" not "14320".
- **Neutral on tradeoffs**: The tool presents data; it does not prescribe design choices. Avoid words like "better", "worse", "optimal" in UI labels.
- **Research-honest**: Formula estimates are approximations. Label them as such — use "estimated", "approx.", "~" where relevant.

### UI Copy Rules
- Button labels: imperative verb phrases — "Add Layer", "Run Estimate", "Save Config", "Export JSON"
- Empty state messages: explain what to do next — "Add your first layer to begin estimation." not "No layers found."
- Error messages: state what went wrong + what to do — "Estimation failed. Check that the backend is running at `VITE_API_URL`."
- Tooltips: one sentence max. Subject-first. No trailing period on tooltips under 8 words.
- Form labels: noun phrases, Title Case — "Input Channels", "Parallelism Factor", "Kernel Size"
- Table headers: noun phrases, Title Case, no units in header (put units in tooltip or footer note)
- Number formatting: use locale-aware formatting with commas for thousands — `14,320` not `14320`

### Terminology Consistency

| Correct | Never Use |
|---|---|
| LUTs | Lookup tables, Logic cells |
| DSP Blocks | DSP slices, Multipliers |
| BRAMs | Block RAMs, Memory blocks |
| Parallelism Factor | Unrolling factor, Thread count |
| Precision | Bit-width, Data type |
| Inference Latency | Prediction time, Forward pass time |
| Throughput (inf/s) | FPS, Predictions per second |
| Arithmetic Intensity | Compute density, OI ratio |
| Roofline bound | Bottleneck type |
| Configuration | Setup, Project, Session |

---

## Accessibility

### Contrast Requirements (WCAG AA minimum)
- All body text on dark backgrounds: minimum 4.5:1 contrast ratio
- Large text (≥18px bold or ≥24px regular): minimum 3:1
- Interactive elements (buttons, links): minimum 3:1 for non-text elements
- Do not rely on color alone to convey status — always pair with icon or text label

### Focus States
- All interactive elements must have a visible focus ring
- Focus ring: `outline: 2px solid #6366f1; outline-offset: 2px`
- Never use `outline: none` without a custom visible replacement

### ARIA Labels
- All icon-only buttons must have `aria-label`
- All chart containers must have `role="img"` and `aria-label` describing the chart content
- Modal dialogs: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to modal title

---

## Contact

For brand, design system, or asset questions related to the FPGA-NN Accelerator Simulator, open an issue in the project's GitHub repository with the label `design-system`.