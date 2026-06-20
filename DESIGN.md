# DESIGN.md

> Living design system for **DivSplit** — the visual source of truth for both human
> designers and AI coding agents. It complements `ARCHITECTURE.md` (structure) and
> `CLAUDE.md` / `.github/copilot-instructions.md` (how to work).
>
> Merged from two approved Stitch concepts (project `15544037027988297275`):
> - **Light** → "Candy — Joyful Pop" (`node-id=3926dcdc053e40d297c243d3c1252fb4`)
> - **Dark** → "Neon Tokyo — Electric Nightscape" (`node-id=71d4421de67344f0a0461f60c4b3dfc2`)
>
> One type system, one shape system, one motion language — **only the color tokens
> and the elevation treatment swap between themes.** This file defines the target
> system; migrating the shipped tokens to it is a separate, later step.

---

## 1. Brand & aesthetic

DivSplit is **playful, vibrant, and a little electric** — money made fun, not corporate.
The two moods are siblings, not strangers: both are **hot-pink-forward**, saturated, and
high-energy. Only the room changes.

- **Light — "Candy / Joyful Pop":** warm pink-white surfaces, saturated candy colors,
  pill shapes, soft **colorful tinted shadows**, bouncy microinteractions. Daytime, delightful.
- **Dark — "Neon Tokyo / Electric Nightscape":** near-black blue-tinted surfaces, **neon
  accents that glow**, no flat shadows. Nightlife, cyberpunk, immersive.

The constant: **hot pink is the brand.** It reads as primary in both themes and always
carries **white text** on top. Money is the hero, so amounts are always set in tabular mono.

---

## 2. Typography

| Role | Font | Usage |
|---|---|---|
| **Display** | **Sora** (600/700/800) | Headings, group names, big numbers-as-headline |
| **Body / Labels** | **DM Sans** (400/500/700) | UI text, labels, descriptions — rounded, friendly |
| **Mono** | **JetBrains Mono** (400/500) | All money/amounts, ids (tabular figures) |

- One type system across both themes (Sora / DM Sans / JetBrains Mono).
- Self-host via `@fontsource` (offline-first; never a CDN — see ARCHITECTURE §1.3).
- **Body base 16px** with generous line-height for the friendly feel; bold weight for
  headings, medium for labels.
- Money/amounts: always `font-mono` + `font-variant-numeric: tabular-nums`.

Suggested scale (rem): `display` 3–3.75 / `h1` 2.25 / `h2` 1.5 / `h3` 1.25 /
`body` 1 / `sm` 0.875 / `xs` 0.75.

---

## 3. Color tokens

Named by **semantic role**, with the hex for each theme and the matching shadcn CSS
variable used in `frontend/src/index.css`. Hot-pink primary takes **white foreground** in
both themes. Light uses all three accents freely; dark restricts to **max 2 neon accents
per view** with neutral text doing the rest.

| Role / shadcn var | Light (Candy) | Dark (Neon Tokyo) |
|---|---|---|
| `background` | `#FEF7FF` pink-white | `#0A0A12` blue-black |
| `foreground` (on-surface) | `#1F1326` | `#ECECF4` |
| `card` / surface | `#FFFFFF` | `#13131F` |
| `card-foreground` | `#1F1326` | `#ECECF4` |
| `muted` / surface-variant | `#F6E9F6` | `#1B1B2A` |
| `muted-foreground` | `#7A6A80` | `#9A9AB5` |
| `primary` (hot pink) | `#E040A0` | `#FF2D78` |
| `primary-foreground` (on pink) | `#FFFFFF` | `#FFFFFF` |
| `secondary` | `#7C52AA` purple | `#00FFCC` cyan |
| `secondary-foreground` | `#FFFFFF` | `#0A0A12` |
| `tertiary` / `accent` | `#0096CC` sky blue | `#FFE04A` neon yellow |
| `accent-foreground` | `#FFFFFF` | `#0A0A12` |
| `border` / `input` | `#EAD6EA` | `#2A2A40` |
| `ring` (focus) | `#E040A0` | `#FF2D78` |
| `destructive` (error) | `#E53E3E` | `#FF5A5A` |
| `destructive-foreground` | `#FFFFFF` | `#0A0A12` |

- **Light** is expressive: pink primary, purple secondary, sky-blue tertiary, used freely
  but with purpose — nothing washed out.
- **Dark**: neon colors are **accents only**, never large surfaces. Surface hierarchy comes
  from opacity/lightness (darkest base → lighter containers), not borders.
- The logo (coral/cyan split-piggy) sits on its own white rounded chip, so it reads on
  either theme regardless of palette.

### Settle-up semantics
- **"gets back" / positive** → primary (hot pink) pill.
- **"owes" / negative** → secondary (purple in light, cyan in dark), or `destructive` for emphasis.
- **"settled"** → muted-foreground, no pill.

---

## 4. Shape, space & elevation

**Shape (shared, rounded everywhere — no sharp corners):**
- **Radius:** `sm` 0.5rem · **`DEFAULT` 0.75rem** · `lg` 1rem · `xl` 1.25rem · `full` 9999px.
- **Pills** (`full`) on buttons and badges/tags. **Cards** use `lg`/`xl` (16–20px).
- **Inputs** use `full` (rounded) in light; in dark they drop the fill for a bottom neon border.

**Spacing:** 4px base — `xs` 4 · `sm` 8 · `md` 16 · `lg` 24 · `xl` 40; container gutter 16,
page margin 20.

**Elevation — the one thing that swaps with the theme:**
- **Light (tinted shadows):** soft, *colorful* shadows tinted to the element's own color at
  15–20% opacity. e.g. a pink button → `box-shadow: 0 4px 16px rgba(224,64,160,0.2)`. No glow.
- **Dark (neon glow):** **no flat shadows.** Use inner/outer glows with a neon tint, diffused
  (12–20px blur), never harsh:
  - text: `text-shadow: 0 0 8px currentColor` on accent text
  - button hover: `box-shadow: 0 0 16px rgba(255,45,120,0.4)`
  - card/border: `1px solid rgba(255,45,120,0.5)` + `inset 0 0 12px rgba(255,45,120,0.1)`
- Optional dark background detail: subtle scan-line / grid texture via CSS gradients.

---

## 5. Components

- **Button** — **pill** (`full`), solid hot-pink fill + white text. Light: tinted shadow,
  hover = slight `scale(1.03)` + deeper shadow. Dark: dark fill + neon border + text glow on
  hover (no solid-neon fill at rest). `outline`/`ghost` for low emphasis.
- **Card** — `surface` bg, radius `lg`/`xl`. Light: white fill + tinted shadow, hover = lift.
  Dark: `surface_container` with a thin neon border at ~30% opacity, glow on hover.
- **Pill / Badge / Tag** — `full` radius, bold text. Light: pastel fill (`primary` at low
  opacity). Dark: neon border, neutral fill.
- **Input / Select** — radius `full`. Light: light fill + **pink focus ring**. Dark: dark
  fill, **bottom neon border**, glow on focus.
- **Group cards** — "ticket" feel: colored initials avatar, group name in Sora, id in mono,
  an up-right arrow affordance.
- **Money** — always mono + tabular; positive in primary (pink), negative in secondary/destructive.

---

## 6. Iconography & motion

- **Icons:** the shipped app uses **lucide-react** (keep it). Stitch mocks use Material
  Symbols — treat those as visual reference only; map to the nearest lucide icon.
- **Motion — bouncy & playful, never stiff:** spring-like / `ease-out` curves; hover
  `scale(1.03)` on interactive surfaces, lift on cards. 150–300ms transitions.
- **Glows and shadows animate on interaction, not at rest** — a card sits calm and lights up
  (glow in dark, deeper tinted shadow in light) only on hover/focus.

---

## 7. Theming mechanics

- Single type/shape/motion system; **color tokens and elevation treatment swap** between
  light and dark.
- Dark mode toggles the `.dark` class on `<html>` (already wired in
  `context/ThemeContext.tsx`); tokens live as CSS variables in `frontend/src/index.css`
  (`:root` = light, `.dark` = dark). Elevation is theme-conditional (tinted shadow vs glow).
- Accessibility:
  - Hot-pink primary takes **white text** in both themes (verify AA on pills/buttons).
  - **Dark:** max 2 neon accents per view; neon never on light surfaces; keep neutral text
    primary so glows stay accents.
  - **Light:** embrace saturation/contrast, but verify accent-on-white text hits AA
    (sky-blue/purple text on white may need a darker shade for small text).

---

## 8. References

- Stitch project: `DivSplit — app screens` (`projects/15544037027988297275`).
- Approved concepts (in the Stitch project, not committed):
  - Light — "Candy / Joyful Pop" (`node-id=3926dcdc053e40d297c243d3c1252fb4`).
  - Dark — "Neon Tokyo / Electric Nightscape" (`node-id=71d4421de67344f0a0461f60c4b3dfc2`).
- Current implementation tokens (to be migrated to this system) live in
  `frontend/src/index.css` — presently a warm "travel-receipt" palette, superseded by the
  above once the redesign is implemented.
