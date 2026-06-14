# ARCHITECTURE.md

> Living architectural reference for **DivSplit**, written for both human developers and AI coding agents.
>
> This file describes **what you are working with** (structure, data, flow, constraints). It complements — and does not replace — `.github/copilot-instructions.md` / `CLAUDE.md` (which say *how to work*) and `DESIGN.md` (the visual design system, currently a placeholder).
>
> Keep this file current: update it in the same change that alters structure, the data model, routes, or a constraint. A stale architecture doc is worse than none.
>
> Project size: ~31 source files → documented at depth **L1**, with the **Monorepo** and **i18n** optional modules included because they apply.

---

## 1. What DivSplit Is

DivSplit is yet another shared-expense splitter for trips and group bills (restaurants, groceries, etc.). Two product decisions set it apart from typical splitters and shape the whole architecture:

1. **Prepaid amounts.** When you create a group, each member can carry a **prepaid balance** — money already put in, like a pre-paid card (you must have funds to spend) rather than a credit card (pay later). Settlement must net expenses against these prepaid balances.

2. **Decoupled "paid by" vs "paid for", with auto-split.** Each expense records, separately, *who actually paid* (`paidBy`) and *who should be charged* (`paidFor`). These need not match — e.g. the person with cash pays the street-food vendor, but a different person actually eats the food. When the user types an amount for one person, the remaining total auto-splits across the other selected people, so nobody does mental arithmetic.

3. **Fewest-transfers settlement (planned).** The long-term goal is to net everyone's balances and emit the *minimum* set of transfers, so a 10-person trip never ends with one person sending money to nine others. **This settlement engine is not implemented yet** — the data is captured, the computation is future work (see §9 and §11).

**Local-first by design.** The app must run with **no internet** (trips often have none). All data persists to the browser. A backend/database is intentionally deferred and will act as a **sync layer** *after* local save — allowing multiple users to record transactions offline on their own devices and reconcile later.

---

## 2. Stack & Dependencies

**Monorepo** managed with **npm workspaces** (`frontend`, `backend`). Node **24** (`.nvmrc`). ES modules throughout (`"type": "module"`).

### Frontend (`frontend/`) — the only live workspace today
| Concern | Choice |
|---|---|
| Build / dev server | **Vite 5** (`@vitejs/plugin-react`) |
| UI | **React 19** + **react-dom 19** |
| Routing | **react-router-dom 6** |
| Styling | **Tailwind CSS 3** + **daisyUI 4** + `@tailwindcss/typography` |
| i18n | **i18next** + **react-i18next** + browser language detector |
| Local persistence | **localforage** (IndexedDB) |
| ID generation | **bson-objectid** (Mongo-style ObjectIds, for an eventual DB) |
| Icons | **react-icons** |
| Prop validation | **prop-types** (runtime; no TypeScript yet) |

### Backend (`backend/`)
Placeholder workspace. `package.json` is empty (`{}`). No code yet — reserved for the future sync layer.

### Tooling
ESLint 9 (flat config) + Prettier (`.prettierrc.yml`), run from root. Deployed on **Vercel** (`vercel.json`).

> ⚠️ **Version mismatch:** `.nvmrc` pins Node **24** but `.github/workflows/frontend.yml` uses Node **20**. Align these when touching CI.

---

## 3. Monorepo Structure

```
divsplit/
├─ package.json          # root: workspaces, shared dev tooling (eslint, prettier), scripts
├─ vercel.json           # builds frontend workspace, SPA rewrite → index.html
├─ frontend/             # Vite + React 19 SPA (all current application code)
├─ backend/              # empty placeholder workspace (future sync API)
├─ ARCHITECTURE.md       # this file
├─ DESIGN.md             # visual design system (placeholder; to be built via Stitch MCP)
└─ .github/              # CI (frontend lint) + copilot-instructions.md
```

Root scripts: `npm run dev` → frontend dev server; `npm run format` → Prettier; `npm run lint` → ESLint + frontend lint.

---

## 4. Module Map (`frontend/src`)

**Entry & shell**
- `renderApp.jsx` — bootstrap only; mounts `<App/>` into `#app-root` under `React.StrictMode`. (By convention, no logic here.)
- `App.jsx` — composition root: `ThemeProvider → Container → AppRouter`; loads `App.css` and `i18n`.
- `routes/AppRouter.jsx` — `BrowserRouter`, global `Header`, and the route table (see §5).

**Cross-cutting state (React Context)**
- `context/ThemeContext.jsx` — light/dark theme, persisted to `localStorage["divsplit_theme"]`.
- `context/GroupContext.jsx` — loads and exposes the active group (`data`, `updateGroup`, `loadDemo`) for the current `:groupId`; renders `<Loading/>` while fetching.

**Data layer**
- `utils/use-api.js` — the persistence boundary. localforage instances `groupList` and `group`; hooks `useApiListGroups`, `useApiGetGroup`; `loadDemoData`; `generateId()` (ObjectId). *This is the single place that touches storage — treat it as the "API" the rest of the app talks to.*
- `utils/activity-tracker.js` — `ACTIVITY_TYPES` enum + pure functions that append audit entries to a group (capped at 100, newest first).
- `utils/tools.js` — `jsonParseSafe` / `jsonStringifySafe`.

**Pages**
- `pages/HomePage.jsx` — landing; lists groups via `CardGroup`/`CardContainer`.
- `pages/Group/Config.jsx` — edit group name + members (name, prepaid); diffs old vs new and records activities.
- `pages/Group/Transaction.jsx` — create/edit a transaction; **hosts the auto-split algorithm** (see §6).
- `pages/Group/ListTransactions.jsx` — transaction table; row links + delete (records activity).
- `pages/Group/Activity.jsx` — activity feed with relative timestamps.
- `pages/NotFound.jsx`.

**Components**
- `components/GroupPageWrapper.jsx` — wraps a group route in `GroupProvider`, dispatches the `:section` to the right page, shows the "load sample data" prompt for empty groups, and mounts `Debug`.
- `Header`, `GroupHeader`, `Avatar`, `Hr`, `Loading`, `Container`, `CardGroup`, `CardContainer`, `Debug`.

---

## 5. Route Structure

SPA, client-side routing only (Vercel rewrites all paths to `index.html`).

| Path | Renders |
|---|---|
| `/` | `HomePage` (group list) |
| `/group/:groupId/config` | `GroupConfig` |
| `/group/:groupId/transactions` | `GroupListTransactions` |
| `/group/:groupId/transactions/:sectionItem` | `GroupTransaction` (`:sectionItem` = transaction id, or `new`) |
| `/group/:groupId/activity` | `GroupActivity` |
| `*` | `NotFound` |

The single dynamic route is `/group/:groupId/:section/:sectionItem?`; `GroupPageWrapper` switches on `section` (`config` / `transactions` / `activity`).

---

## 6. Data Model & Core Domain Logic

All state is one **group object** per group id, stored in IndexedDB.

```jsonc
group = {
  config:   { name },                 // canonical group name
  members:  [ { id, name, prepaid } ],// prepaid = pre-funded balance (number)
  transactions: [ {
    id,                               // ObjectId hex
    date, createdAt | updatedAt,
    description, total,
    paidBy:  { [memberId]: amount },  // who actually paid
    paidFor: { [memberId]: amount },  // who is charged / consumed
    manuallyChanged: { [memberId]: true } // entries the user typed → exempt from auto-split
  } ],
  activities: [ {                     // audit log, newest first, capped at 100
    id, type, description, details, userId /* always null today */, timestamp
  } ]
}
```

> Demo data (`frontend/demo_data.json`) also carries a legacy `header.name`; the live UI uses `config.name`.

### The auto-split algorithm (`Transaction.jsx › handleMemberChange`)
Both `paidBy` and `paidFor` are `memberId → amount` maps and use the same logic:

1. Toggling a member on adds them at `0`; toggling off deletes them.
2. Entries the user **typed into** are recorded in the `manuallyChanged` ref and held **fixed**.
3. The **remaining** amount (`total − sum(manual)`) is split **equally** across the non-manual selected members.
4. Any rounding remainder (values are rounded to 2 decimals via `round()`) is absorbed by the current person so the sum reconciles to `total`.
5. `getRemainingValue()` surfaces `total − sum` per fieldset as live feedback.

This is the **most intricate and fragile code in the app** (it mutates the working map in place before re-setting state). Touch it carefully; it is the prime candidate for unit tests once a test setup exists.

### Not yet modeled
- **Balances & settlement.** Per-member net balance (prepaid + paidBy − paidFor) and the minimal-transfer plan are **not computed anywhere yet**. Transactions capture the raw inputs the future engine will need.

---

## 7. Data Flow & Persistence

```
React UI ──updateGroup(next)──► GroupContext ──► useApiGetGroup
                                                     │
                                          localforage "group"  (key = groupId)
                                          localforage "groupList" (name index)
```

- **Two stores:** `group` (full object keyed by `groupId`) and `groupList` (lightweight `[{id, name}]` index for the home page).
- **Write path:** a page builds a new group object (often via `activity-tracker` helpers), calls `updateGroup(next)`. `useApiGetGroup` stages it as `dataToSave`, an effect persists it, re-reads, and mirrors the name into `groupList`.
- **Demo data:** `loadDemoData` fetches `/demo_data.json` (served from `frontend/demo_data.json`) into the `group` store and registers it in `groupList`. `useApiListGroups` also seeds three placeholder groups on first run.
- **No network.** Everything is in-browser; the app works fully offline.

---

## 8. Configuration & Environment

- **`VITE_SHOW_DEBUG=true`** — renders the `Debug` panel (raw group JSON) on group pages.
- **i18n detection order:** querystring `?lang=`, `localStorage["i18nLang"]`, then browser `navigator`; fallback `en`. Locales: `en`, `pt` (`src/locales/*.json`); `load: 'languageOnly'`.
- **Theme:** persisted at `localStorage["divsplit_theme"]`; daisyUI themes `light` / `dark`.
- **Vite aliases:** `@`, `@components`, `@context`, `@pages`, `@utils`, `@routes`, `@locales` → `src/*`.
- **Deploy (Vercel):** build `npm run build --workspace frontend` → `frontend/dist`; SPA rewrite `/(.*) → /index.html`.

---

## 9. Constraints & Trade-offs

- **Local-first, intentionally.** No backend persistence today — required so trips without internet still work. The `backend/` workspace is an empty placeholder.
- **Single-device today.** Data lives in *one* browser's IndexedDB. Multi-device/multi-user **sync is a future goal**, not a current capability. Designing the sync layer will need stable identities (today `activities.userId` is always `null`) and conflict resolution.
- **No settlement engine yet.** The headline "fewest transfers" feature is unbuilt (§6, §11).
- **No tests.** No test runner is configured; the riskiest code (auto-split) is untested.
- **JavaScript + PropTypes**, not TypeScript (migration planned, §11).

---

## 10. Known Tech Debt & Code Hotspots

- **`Transaction.jsx › handleMemberChange`** — complex in-place mutation + rounding; highest-risk hotspot. Cover with tests before refactoring.
- **Inconsistent member ids** — members use `"${index}_${Date.now()}"` while groups/transactions/activities use ObjectId hex. Unify before the DB/sync layer relies on ids.
- **Node version drift** — `.nvmrc` (24) vs CI (20). See §2.
- **Mixed-language comments** (Portuguese/English) across files.
- **Unfinished UI affordances** — the home page "create group" button has no handler; `Transaction.jsx` submit has a `// TODO` for error-handling UI.
- **`activities.userId` unused** (always `null`) — placeholder for future auth/identity.

---

## 11. Roadmap / Future Direction

Captured here because it directly shapes architectural decisions (source: project owner). Order is indicative, not committed.

1. **Settlement engine** — compute per-member balances (prepaid + paidBy − paidFor) and emit the **minimum-transfer** plan.
2. **Backend sync layer** — local-first stays the source of truth; the backend reconciles multiple users' offline edits when a device regains internet (needs identities + conflict resolution).
3. **TypeScript migration** — replace PropTypes with static types (note `@types/react*` are already present).
4. **Dependency upgrades** — React and all other npm dependencies bumped to current.
5. **Visual redesign** — a fresh, distinctive look (the current UI is generic). Design system to be produced via the **Stitch MCP** and recorded in `DESIGN.md`.

---

## 12. Security

Client-only app: no auth, no secrets, no server. Data is confined to the user's browser storage. Security surface is minimal today but becomes material with the sync layer (§11) — that work will introduce authentication, transport security, and per-user authorization, and must be re-assessed here when it lands.
