# DESIGN.md

> Living design system for **DivSplit** — the visual source of truth for both human
> designers and AI coding agents. It complements `ARCHITECTURE.md` (structure) and
> `CLAUDE.md` / `.github/copilot-instructions.md` (how to work).
>
> Derived from two approved Stitch concepts (project `DivSplit — app screens`):
> - **Light** → "Lime & Purple Edition" (`screens/3926dcdc053e40d297c243d3c1252fb4`)
> - **Dark** → "Electric Nightscape Edition" (`screens/debfcbf7384c4f4e8d7aa5e1a18b8918`)
>
> Reference screens live in the Stitch project (not committed; `.stitch/` is local). **This file defines the target
> system; it does not change any current layout.** Implementation (migrating the
> shipped tokens to these) is a separate, later step.

---

## 1. Brand & aesthetic

DivSplit is a friendly, confident, slightly electric take on a money/expense app —
**lime-forward, high-contrast, modern**. Money is the hero, so amounts are always
set in a tabular monospace. Two cohesive moods share one type system and one set of
shape/space rules; only the palette swaps:

- **Light — "Lime & Purple":** crisp lavender-white surfaces, **electric lime** as
  the primary action, **deep purple** as the expressive secondary. Optimistic, clean.
- **Dark — "Electric Nightscape":** near-black surfaces, **electric lime** primary,
  **hot pink** secondary. Nightlife, neon-on-ink.

The constant: lime is the brand. It's bright, so **lime always carries near-black
text on top** (never white).

---

## 2. Typography

| Role | Font | Usage |
|---|---|---|
| **Display** | **Sora** (600/700/800) | Headings, group names, big numbers-as-headline |
| **Body** | **Hanken Grotesk** (400/700) | UI text, labels, descriptions |
| **Mono** | **JetBrains Mono** (400/500) | All money/amounts, ids (tabular figures) |

- One type system across both themes (Sora / Hanken / JetBrains).
- Self-host via `@fontsource` (offline-first; never a CDN — see ARCHITECTURE §1.3).
- Money/amounts: always `font-mono` + `font-variant-numeric: tabular-nums`.

Suggested scale (rem): `display` 3–3.75 / `h1` 2.25 / `h2` 1.5 / `h3` 1.25 /
`body` 1 / `sm` 0.875 / `xs` 0.75.

---

## 3. Color tokens

Named by **semantic role**, with the hex for each theme and the matching shadcn CSS
variable used in `frontend/src/index.css`. Lime primary requires a **dark
foreground**; everything else follows standard contrast.

| Role / shadcn var | Light (Lime & Purple) | Dark (Electric Nightscape) |
|---|---|---|
| `background` | `#F9F8FF` lavender-white | `#0A0A0C` deep ink |
| `foreground` (on-surface) | `#1A1030` | `#FFFFFF` |
| `card` / surface | `#FFFFFF` | `#121217` |
| `card-foreground` | `#1A1030` | `#FFFFFF` |
| `muted` / surface-variant | `#E8E4F2` | `#1C1C24` |
| `muted-foreground` | `#6F6680` | `#A1A1AA` |
| `primary` (Lime) | `#C0FF00` | `#CCFF00` |
| `primary-foreground` (on lime) | `#000000` | `#0A0A0C` |
| `secondary` | `#4B0082` deep purple | `#FF2D78` hot pink |
| `secondary-foreground` | `#FFFFFF` | `#FFFFFF` |
| `accent` (hover/fill) | `#F1EEFF` | `#1C1C24` |
| `accent-foreground` | `#4B0082` | `#FFFFFF` |
| `border` / `input` (outline) | `#DCC8E0` | `#3F3F46` |
| `ring` (focus) | `#C0FF00` | `#CCFF00` |
| `destructive` (error) | `#E53E3E` | `#FF5A5A` |
| `destructive-foreground` | `#FFFFFF` | `#0A0A0C` |

Supporting accent (charts / status): tertiary cyan `#0096CC`. The lime is
intentionally near-identical across themes; the **secondary** is what shifts the mood
(purple in light, hot pink in dark).

### Settle-up semantics
- **"gets back" / positive** → primary lime pill.
- **"owes" / negative** → secondary (purple/pink), or `destructive` for emphasis.
- **"settled"** → muted-foreground, no pill.

---

## 4. Shape, space & elevation

- **Radius** (unified, modern-rounded): `sm` 0.5rem · **`DEFAULT` 0.75rem** ·
  `lg` 1.25rem · `xl` 2rem · `full` 9999px. (Cards use `lg`/`xl`, controls use
  `DEFAULT`, pills use `full`.)
- **Spacing**: 4px base — `xs` 4 · `sm` 8 · `md` 16 · `lg` 24 · `xl` 40; container
  gutter 16, page margin 20.
- **Elevation**: soft, low shadows on `card`/`surface`; the only "glow" is an
  optional lime/secondary blurred radial behind the hero. Avoid heavy drop shadows.

---

## 5. Components

- **Button** — primary = lime fill + near-black text; secondary = purple/pink;
  `outline`/`ghost` for low emphasis. Radius `DEFAULT`, semibold label.
- **Card** — `surface` bg, `border`, radius `lg`/`xl`, soft shadow, generous padding.
- **Pill / Badge** — `full` radius; lime for positive, purple/pink for negative,
  muted for neutral.
- **Input / Select** — `background` fill, `border`, radius `DEFAULT`, lime focus ring
  (`ring`). Money inputs use a `$` prefix and `font-mono`.
- **Group cards** — "ticket" feel: colored initials avatar, group name in Sora, id in
  mono, an up-right arrow affordance.
- **Money** — always mono + tabular; positive in primary, negative in secondary/destructive.

---

## 6. Iconography & motion

- **Icons:** the shipped app uses **lucide-react** (keep it). Stitch mocks use
  Material Symbols — treat those as visual reference only; map to the nearest lucide
  icon when implementing.
- **Motion:** restrained. One staggered hero reveal; hover lift on cards
  (`-translate-y-0.5`); 150–300ms color/transform transitions. No gratuitous motion.

---

## 7. Theming mechanics

- Single type/shape system; **only color tokens swap** between light and dark.
- Dark mode toggles the `.dark` class on `<html>` (already wired in
  `context/ThemeContext.tsx`); tokens live as CSS variables in
  `frontend/src/index.css` (`:root` = light, `.dark` = dark).
- Accessibility: lime (`#C0FF00` / `#CCFF00`) is low-contrast on white — **only use it
  as a fill with dark text**, never as text on a light surface. Verify AA on pills.

---

## 8. References

- Stitch project: `DivSplit — app screens` (`projects/15544037027988297275`).
- Reference screens (in the Stitch project, not committed): light "Lime & Purple",
  dark "Electric Nightscape", and the "Start the Squad" empty state.
- Current implementation tokens (to be migrated to this system) live in
  `frontend/src/index.css` — presently a warm "travel-receipt" palette, superseded by
  the above once the redesign is implemented.
