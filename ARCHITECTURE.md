# ARCHITECTURE.md

> Living architectural reference for **DivSplit**, written for both human developers and AI coding agents.
>
> This file describes **what you are working with** (structure, data, flow, constraints). It complements — and does not replace — `.github/copilot-instructions.md` / `CLAUDE.md` (which say *how to work*) and `DESIGN.md` (the visual design system, currently a placeholder).
>
> Keep this file current: update it in the same change that alters structure, the data model, routes, or a constraint. A stale architecture doc is worse than none.
>
> Project size: ~40 source files → documented at depth **L1**, with the **Monorepo** and **i18n** optional modules included because they apply.

---

## 1. What DivSplit Is

DivSplit is a shared-expense splitter for trips and group bills (restaurants, groceries, a rented lake-house, etc.). A few product decisions set it apart and shape the whole architecture.

### 1.1 Money in DivSplit: expenses vs. transfers

There are exactly **two kinds of money movement**, and keeping them distinct is the core domain model:

1. **Expenses** (`transactions`) — *consumption*. Each records, separately, *who actually paid* (`paidBy`) and *who should be charged* (`paidFor`); these need not match (the person with cash pays the street-food vendor, but someone else eats the food). An auto-split helper fills in the rest so nobody does mental arithmetic (§6).

2. **Transfers** — money one member hands another that is **not** an expense, but still moves their balances. This single primitive covers two product features that are conceptually the same thing:
   - **Top-up** *(optional)* — a member adds money to the pot any time (generalises the old "prepaid"). Example: ten friends rent a lake-house; the **top-holder** (organizer) collects everyone's money up front before committing. A top-up credits **only the depositing member**; the holder merely *holds* the pooled cash (no balance effect) and refunds whatever's unused at the end.
   - **Settle-up** — a debtor paying a creditor to clear the balance the app computed.

   **Rule (project owner):** top-up and settle-up are both *transfers* — "money that moves between accounts, counts toward balances, isn't an expense" — stored as transactions (§6). A top-up is a self-credit (from = to = the member; the holder is just a note); a settle-up moves between two members. Top-up is optional: a group can pay as-you-go and settle the leftover at the end with no top-ups at all.

### 1.2 Fewest-transfers settlement

The app nets everyone's balances and emits the **minimum** set of transfers, so a 10-person trip never ends with one person paying nine others. **Built** (`utils/settlement.ts`, §6).

### 1.3 Local-first & privacy

- **Local-first by design.** The app must run with **no internet** (trips often have none). All data persists in the browser. A backend/database is intentionally deferred and will act as a **sync layer** *after* local save — letting multiple people record on their own devices offline and reconcile later. Fonts are self-hosted and avatars generated locally so nothing breaks offline.
- **Privacy by default (project owner rule).** No email or personal data is required — it stays optional, to protect people's privacy. Identity is modeled with opaque UUIDs, not accounts:
  - each **event** (group) has a UUID the creator shares with members;
  - each **member** gets their own per-event UUID;
  - a member uses their UUID to record expenses **independently**, without waiting for the creator — this is what later enables multi-device offline contribution.
  - Real **member identification/auth is a v2 concern**; today there is no PII and `activities.userId` is unused.

---

## 2. Stack & Dependencies

**Monorepo** managed with **npm workspaces** (`frontend`, `backend`). Node **24** (`.nvmrc`). ES modules throughout (`"type": "module"`). The frontend is **TypeScript** (strict).

### Frontend (`frontend/`) — the only live workspace today
| Concern | Choice |
|---|---|
| Language | **TypeScript 6** (strict; project references) |
| Build / dev server | **Vite 8** (`@vitejs/plugin-react` 6) |
| UI | **React 19.2** + **react-dom** |
| Routing | **react-router-dom 7** |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`, CSS-first `@theme`) + **shadcn/ui** primitives |
| Icons | **lucide-react** |
| Fonts | self-hosted via **@fontsource** (Fraunces / Hanken Grotesk / JetBrains Mono) |
| i18n | **i18next** + **react-i18next** + browser language detector |
| Local persistence | **localforage** (IndexedDB) |
| ID generation | **bson-objectid** (Mongo-style ObjectIds) |
| Unit tests | **Vitest** |

### Backend (`backend/`)
Placeholder workspace (`package.json` is `{}`). Reserved for the future sync layer.

### Tooling
**ESLint 10** (flat config) + **typescript-eslint** + **Prettier**. CI (`.github/workflows/frontend.yml`) runs **lint**, **unit tests**, and **type-check + build** on the Node version from `.nvmrc`. Deployed on **Vercel** (`vercel.json`).

> Note: `eslint` is pinned via a root `overrides` because `eslint-plugin-react` 7.37 doesn't yet declare ESLint 10 support; the React version is also pinned in the flat config to avoid its removed-API crash on ESLint 10.

---

## 3. Monorepo Structure

```
divsplit/
├─ package.json          # root: workspaces, shared dev tooling, eslint override, scripts
├─ vercel.json           # builds frontend workspace, SPA rewrite → index.html
├─ frontend/             # Vite + React 19 + TS SPA (all current application code)
├─ backend/              # empty placeholder workspace (future sync API)
├─ ARCHITECTURE.md       # this file
├─ DESIGN.md             # visual design system (placeholder; to be built via Stitch MCP)
├─ TEST.md               # manual QA procedures per feature
├─ docs/superpowers/specs # design specs (settlement, mark-as-paid, …)
└─ .github/              # CI (lint + test + build) + copilot-instructions.md
```

Root scripts: `npm run dev`, `npm run format`, `npm run lint`. Frontend scripts add `build` (`tsc -b && vite build`), `test` (`vitest run`), `typecheck`.

---

## 4. Module Map (`frontend/src`)

**Entry & shell**
- `renderApp.tsx` — bootstrap only; mounts `<App/>` into `#app-root` under `StrictMode`.
- `App.tsx` — composition root: imports `index.css` + fonts + i18n; `ThemeProvider → Container → AppRouter`.
- `routes/AppRouter.tsx` — `BrowserRouter`, global `Header`, route table (§5).
- `index.css` — Tailwind v4 entry: theme tokens (oklch, light/dark), fonts, base styles.

**Cross-cutting state (React Context)**
- `context/ThemeContext.tsx` — light/dark, persisted to `localStorage["divsplit_theme"]`; toggles the `.dark` class on `<html>`.
- `context/GroupContext.tsx` — loads/exposes the active group (`data`, `updateGroup`, `loadDemo`).

**Domain & data layer (`utils/`)**
- `use-api.ts` — the persistence boundary. localforage stores `groupList` and `group`; hooks `useApiListGroups`, `useApiGetGroup`; `loadDemoData`; `generateId()`. *Single place that touches storage.*
- `settlement.ts` — **pure** settlement engine: `computeBalances` (ΣpaidBy − ΣpaidFor), `topupTotal`, and `computeSettlement` (offset the holder by Σtop-ups → greedy min-cash-flow → fewest `transfers`). Unit-tested.
- `transaction.ts` — `getTransactionError` (form validation), unit-tested.
- `activity-tracker.ts` — `ACTIVITY_TYPES` + pure functions appending audit entries (capped 100, newest first).
- `tools.ts` — `jsonParseSafe` / `jsonStringifySafe`.
- `types.ts` — shared domain types (`Group`, `Member`, `Transaction` incl. `TransactionType`, `Activity`, settlement types).

**UI**
- `components/ui/*` — shadcn primitives (`button`, `card`, `input`, `label`, `table`, `switch`, `badge`); `lib/utils.ts` exports `cn`.
- Pages (`pages/`): `HomePage`, `Group/Config`, `Group/Transaction` (hosts auto-split), `Group/ListTransactions`, `Group/Settlement`, `Group/Activity`, `NotFound`.
- `components/GroupPageWrapper.tsx` — wraps a group route in `GroupProvider`, dispatches `:section`, shows the empty-group prompt, mounts `Debug`.
- `Header`, `GroupHeader` (tab nav), `Avatar` (local initials), `Hr`, `Loading`, `Container`, `CardGroup`, `CardContainer`, `Debug`.

---

## 5. Route Structure

SPA, client-side routing only (Vercel rewrites all paths to `index.html`). The single dynamic route is `/group/:groupId/:section/:sectionItem?`; `GroupPageWrapper` switches on `section`.

| Path | Renders |
|---|---|
| `/` | `HomePage` (group list) |
| `/group/:groupId/config` | `GroupConfig` (name, members, top-holder) |
| `/group/:groupId/topup` | `GroupTopUp` (record a top-up) |
| `/group/:groupId/transactions[/:id\|new]` | transactions list / `GroupTransaction` |
| `/group/:groupId/settlement` | `GroupSettlement` (balances + transfers) |
| `/group/:groupId/activity` | `GroupActivity` |
| `*` | `NotFound` |

---

## 6. Data Model & Core Domain Logic

All state is one **group object** per group id, stored in IndexedDB (typed in `types.ts`).

```ts
Group = {
  config:   { name?, holderId? },          // holderId = member holding the pooled top-up cash
  members:  Member[],                       // { id, name }   (legacy optional `prepaid`, migrated away)
  transactions: Transaction[],              // { id, type?: 'expense'|'transfer'|'topup', date, description,
                                            //   total, paidBy:{memberId:amount},
                                            //   paidFor:{memberId:amount}, manuallyChanged }
  activities?: Activity[],                  // audit log (capped 100, newest first)
}
```

**Everything is a `Transaction`** (§1.1). An expense (`type` absent / `'expense'`) is consumption via the split form. A **transfer** (`type: 'transfer'`, a settle-up) moves money between two members — *sender* on `paidBy` (credit), *recipient* on `paidFor` (debit). A **top-up** (`type: 'topup'`) is a self-credit — `paidBy = {member: amount}`, empty `paidFor`. All fold into balances for free; transfers and top-ups are entered on/near the Settle up page and filtered out of the expenses list.

### Auto-split (`Transaction.tsx`)
Both `paidBy` and `paidFor` are `memberId → amount` maps. Toggling a member splits the remaining `total − sum(manually-typed)` equally across the others; rounding remainder lands on the current person so the parts reconcile to `total`. Most intricate code in the app.

### Settlement (`settlement.ts`) — **built & tested**
- `balance(m) = Σ paidBy(m) − Σ paidFor(m)` over all transactions. A **top-up** (`type: 'topup'`, `paidBy = {m: amount}`, empty `paidFor`) credits only that member. Positive = owed, negative = owes.
- **Top-holder:** `config.holderId` (default first member) holds the pooled top-up cash — **no balance effect from holding**. For the transfer computation *only*, their position is offset by `−Σ top-ups` (`topupTotal`), making effective balances sum to zero so refunds route through them.
- `computeSettlement` runs a greedy **min-cash-flow** → fewest `transfers` (≤ n−1). With no top-ups the offset is zero and it degrades to plain peer-to-peer fewest-transfers.
- **Settle-up** is a `type: 'transfer'` transaction (sender `paidBy` +, recipient `paidFor` −); recording one shrinks/clears its suggested transfer, undo deletes it.
- **Display:** the Balances panel shows each member's *raw* balance (the holder is never shown "owing") + "deposited"; the Transfers panel shows the holder doing the refunds.

---

## 7. Data Flow & Persistence

```
React UI ──updateGroup(next)──► GroupContext ──► useApiGetGroup
                                                     │
                                          localforage "group"  (key = groupId)
                                          localforage "groupList" (name index)
```

- **Write path:** a page builds a new group object (often via `activity-tracker` helpers), calls `updateGroup(next)`; `useApiGetGroup` stages it, persists, re-reads, and upserts the name into `groupList`.
- **Derived, not stored:** balances and the *suggested* settlement transfers are computed on read; recorded settle-ups are persisted as `type: 'transfer'` transactions.
- **No network.** Fully offline; demo data from `/demo_data.json`.

---

## 8. Configuration & Environment

- **`VITE_SHOW_DEBUG=true`** — renders the `Debug` raw-group panel on group pages.
- **i18n:** detection order querystring `?lang=` → `localStorage["i18nLang"]` → navigator; fallback `en`. Locales `en`, `pt`.
- **Theme:** `.dark` class on `<html>`; tokens defined in `index.css` (oklch); persisted at `localStorage["divsplit_theme"]`.
- **Vite aliases:** `@`, `@components`, `@context`, `@pages`, `@utils`, `@routes`, `@locales` → `src/*` (mirrored in `tsconfig`).
- **Deploy (Vercel):** build `npm run build --workspace frontend` → `frontend/dist`; SPA rewrite.

---

## 9. Constraints & Trade-offs

- **Local-first, intentionally.** No backend persistence today; `backend/` is an empty placeholder.
- **Single-device today.** Data lives in one browser's IndexedDB. Multi-device/multi-user **sync is a future goal** built on the UUID identity model (§1.3) + conflict resolution.
- **No PII.** Identity is opaque per-event UUIDs; member identification is deferred to v2.
- **Greedy settlement** (near-optimal), not provably minimal.
- **Tests cover pure logic** (settlement, validation) via Vitest; UI is covered by manual `TEST.md` + Chrome MCP QA, not component tests yet.

---

## 10. Known Tech Debt & Code Hotspots

- **`Transaction.tsx` auto-split** — complex in-place mutation + rounding; highest-risk hotspot, still untested at the component level (the pure split rules are the candidate to extract + unit-test).
- **`member.prepaid` legacy field** — kept optional only so old groups migrate to top-ups on load (`use-api` `groupStandardize`); unused by new code. Likewise `config.bankerId` → `holderId`.
- **Inconsistent member ids** — members use `"${index}_${Date.now()}"` while transactions/activities use ObjectId hex. Move members to UUIDs with the identity model.
- **`activities.userId` unused** — placeholder until the UUID identity model lands.
- **No component/E2E tests** — only pure-logic unit tests exist.

---

## 11. Roadmap / Future Direction

Source: project owner. Order indicative.

1. ✅ **TypeScript migration**, dependency upgrades, **shadcn/Tailwind v4 redesign**, **CI** (lint+test+build), **settlement engine**.
2. ✅ **Mark transfers as paid** — settle-ups recorded as transfer transactions that net down balances; undoable; logged to Activity.
3. ✅ **Top-up & top-holder** — prepaid generalised to optional top-up transactions; the holder holds the pot and refunds the unused part; the banker special-case is gone.
4. **Identity & privacy model** — per-event + per-member UUIDs so members contribute independently with no PII (§1.3); member identification in **v2**.
5. **Backend sync layer** — local-first stays source of truth; reconcile multi-device offline edits (needs the UUID identities + conflict resolution).
6. **Visual design via Stitch MCP** — generate fresh modern layouts, recorded in `DESIGN.md`.

---

## 12. Security & Privacy

Client-only app: no auth, no secrets, no server; data confined to browser storage. **Privacy is a product principle** — no email/PII is collected; identity is opaque UUIDs (§1.3). The security/privacy surface becomes material with the sync layer (§11), which will introduce transport security, per-user authorization, and conflict handling, and must be re-assessed here when it lands.
