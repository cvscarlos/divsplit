# DESIGN.md

> Living design system for **DivSplit** — the visual source of truth for both human
> designers and AI coding agents. It complements `ARCHITECTURE.md` (structure) and
> `CLAUDE.md` / `.github/copilot-instructions.md` (how to work).
>
> Current implementation: a **neon, pink + green** system on **cool, theme-aware
> surfaces**, with a minimal full-screen landing ("Liquid Minimal Start"). This file
> describes what the app actually ships today.

Derived from approved Stitch concepts (project `15544037027988297275`):
- Landing hero → "Liquid Minimal Start" (`node-id=15b58855a9d8456cae48a8bb5258356c`)
- Earlier neon refs → "Electric Nightscape" / "Neon Nightscape Home"

---

## 1. Brand & aesthetic

DivSplit is **modern, minimal, and a little neon**. The landing is calm and immersive
(a single statement, lots of space, soft "liquid" gradient glows); the app screens are
clean and functional. Two themes share one type/shape/motion system; **only color
tokens swap**, and the whole UI is consistent within a theme (dark = fully dark, light
= fully light — never a dark panel on a light page).

The constant: **hot pink is the brand**, with **mint-green** as the partner accent.
Money is the hero, so amounts are always tabular mono. Motion is restrained.

---

## 2. Typography

| Role | Font | Usage |
|---|---|---|
| **Sans (everything)** | **Hanken Grotesk** | Headings, body, labels — one sans family, all weights |
| **Mono** | **JetBrains Mono** | All money/amounts and ids (tabular figures) |

- **Sans-serif only** — there is no display serif. Headings use the sans family at
  heavier weights (extralight for the big hero line, bold for the accent).
- Self-hosted via `@fontsource` (offline-first; never a CDN — see ARCHITECTURE §1.3).
- Money/amounts: always `font-mono` + `font-variant-numeric: tabular-nums` (`.tnum`).
- Hero scale: line 1 `font-extralight` (~5xl/7xl); accent line `font-bold` with a
  pink→green gradient (`bg-clip-text`).

---

## 3. Color tokens

Named by **semantic role**, with the theme values (oklch) used in
`src/index.css`. Hot-pink primary takes **white** foreground in both themes.
Neutrals are intentionally **cool** (no warm/brown cast): faint pink-white in light,
blue-violet near-black in dark.

| Role / shadcn var | Light | Dark | Note |
|---|---|---|---|
| `primary` | `oklch(0.65 0.24 6)` | `oklch(0.68 0.24 6)` | hot pink `#ff2d78` |
| `primary-foreground` | `oklch(0.99 0 0)` | `oklch(0.99 0 0)` | white on pink |
| `secondary` | `oklch(0.86 0.16 178)` | `oklch(0.85 0.17 178)` | mint-green `#00ffcc` |
| `secondary-foreground` | `oklch(0.24 0.03 200)` | `oklch(0.2 0.03 200)` | dark on mint |
| `background` | `oklch(0.985 0.006 340)` | `oklch(0.15 0.018 290)` | pink-white / blue-black |
| `foreground` | `oklch(0.22 0.02 330)` | `oklch(0.93 0.01 320)` | |
| `card` | `oklch(0.998 0.003 340)` | `oklch(0.19 0.02 290)` | |
| `muted` / `muted-foreground` | `0.95 0.012 335` / `0.5 0.025 330` | `0.26 0.02 290` / `0.72 0.02 300` | |
| `accent` | `oklch(0.94 0.04 350)` | `oklch(0.3 0.06 350)` | soft pink (hover/segment) |
| `border` / `input` | `oklch(0.9 0.012 335)` | `oklch(0.32 0.02 290)` | |
| `ring` | = primary | = primary | pink focus |
| `destructive` | `oklch(0.58 0.22 27)` | `oklch(0.64 0.2 25)` | red |
| chart-2/3/4 | mint / yellow `#ffe04a` / mint | same | accent dots, group cards |

- **Gradient accent**: pink→green (`from-primary to-secondary`) on the hero accent word.
- **Group cards**: vibrant full-color tiles (mint / yellow / pink / cyan) with black
  text, chosen deterministically from the event id.

### Settle-up semantics
- "gets back" / positive → primary (pink). "owes" / negative → secondary or `destructive`.
- "settled" → muted-foreground, no pill.

### Credit vs debit (transaction split form)
- **Paid by** (money in / credit) → **emerald/green**; **Gasto por / consumed by** (money out / debit) → **amber**. The two columns are tinted so credit vs debit reads at a glance.
- An **unbalanced** split (cents unassigned) blocks save: the offending column's card gets a `destructive` border and the "Remaining" row becomes a light-red (`destructive/10`) pill. The transactions list flags an invalid row with an amber warning triangle.

---

## 4. Shape, space & elevation

- **Radius**: `sm` 0.5 · **`DEFAULT` 0.75rem** · `lg` 1 · `xl` 1.25rem · `full` 9999px.
  Pills (`full`) on the hero CTA and badges; cards use `lg`/`xl`/`2xl`.
- **Spacing**: 4px base — `xs` 4 · `sm` 8 · `md` 16 · `lg` 24 · `xl` 40.
- **Elevation**: soft shadows; the brand CTA carries a **pink glow**
  (`shadow-[…color-mix(primary)…]`) that deepens on hover. On the dark landing, the
  background uses **soft static gradient glows** (pink + mint), not flat shadows.

---

## 5. Motion

**Restrained — the app is mostly static** (an explicit product preference). The only
motion: the hero CTA lifts + its arrow rotates on hover, and standard 150–300ms color
transitions. No floating/orbital/scan-line/parallax loops (these were removed).

---

## 6. Components

- **Button** — primary = pink fill + white text; the hero CTA is a glowing `full`-radius
  pill (uppercase, tracked). `outline`/`ghost` for low emphasis.
- **Card** — `card` surface, `border`, radius `lg`/`xl`, soft shadow.
- **Avatars** — auto-generated **DiceBear "thumbs"** faces, rendered **locally/offline**
  via `@dicebear/core` + `@dicebear/collection` (no remote API). Deterministic per name.
- **Segmented tabs** (event sections) — pill group on a soft `muted`/`accent` track.
- **Money** — mono + tabular; positive pink, negative secondary/destructive.

---

## 7. Layout

- **Header** (sticky, shared): dark-chip **logo** + "DivSplit" wordmark · single
  **EVENTS** link · **language selector** (EN/PT) · **theme toggle**. The logo always
  sits on a dark rounded chip so the pink/green mark stays legible on any theme.
- **Landing** (`/`): **full-bleed, full-viewport** hero — pink ∞ emblem, "Zero
  Balances. / Pure Intent." (gradient), subtitle, glowing **CREATE AN EVENT** pill, and
  `ENCRYPTED · REAL-TIME` labels. Below: the events grid (vibrant cards + a dashed
  **"new group"** tile) and a dashed footer (© + Privacy/Terms). Inner app pages stay
  in a centered `max-w-5xl` column.
- **Favicon/logo assets**: `logo.png` (transparent, for the chip), `logo.svg` and
  `favicon.ico`/`favicon.png` on a **dark rounded background** so the mark reads in the
  browser tab.

---

## 8. Theming mechanics

- One type/shape/motion system; **color tokens swap** between light and dark.
- Dark mode toggles `.dark` on `<html>` (wired in `context/ThemeContext.tsx`); tokens
  are CSS variables in `src/index.css` (`:root` = light, `.dark` = dark).
- Accessibility: pink primary takes **white** text (verify AA on pills); the pink→green
  gradient word stays readable on both themes; keep neon as accents, not large surfaces.

---

## 9. Terminology & i18n

- A shared expense container is an **"event"** (dinner, trip, party…), not a "group",
  in all user-facing copy. Internal code identifiers may still say `group`.
- Bilingual: **English + Brazilian Portuguese**, switchable from the header language
  selector (persisted in `localStorage`).

---

## 10. References

- Stitch project: `DivSplit — app screens` (`projects/15544037027988297275`).
- Marketing copy drafts: `tmp/marketing-copy.md` (privacy + "enjoy the moment").
- Implementation tokens live in `src/index.css`.
