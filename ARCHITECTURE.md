# ARCHITECTURE.md

> Living architectural reference for **DivSplit**, written for both human developers and AI coding agents.
>
> This file describes **what you are working with** (structure, data, flow, constraints) — the **software architecture**. Anything purely **visual** (palette, typography, layout, components, motion) lives in `DESIGN.md`, not here. It also complements `.github/copilot-instructions.md` / `CLAUDE.md` (which say *how to work*).
>
> Keep this file current: update it in the same change that alters structure, the data model, routes, or a constraint. A stale architecture doc is worse than none.
>
> Project size: ~40 source files → documented at depth **L1**, with the **i18n** optional module included because it applies.

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

### 1.3 Offline-first & privacy

- **Offline-first (local-first) by design.** DivSplit is an **offline-first app**: it must run with **no internet** (trips often have none), and the browser is the primary store. Every change saves to the browser **first**; a backend then acts as a **sync layer** *after* local save (built — see §1.5), letting multiple people record on their own devices offline and reconcile when online. Fonts are self-hosted and avatars generated locally so nothing breaks offline.
- **Installable PWA.** A Workbox **service worker** (`vite-plugin-pwa`) precaches the built **app shell** (HTML/JS/CSS + fonts), so the app launches and reloads with **no network** and can be **installed** to the home screen (web manifest + maskable icons). Generated only in the production build (`dist/sw.js`, `dist/manifest.webmanifest`); `registerType: 'autoUpdate'`.
- **Privacy by default (project owner rule).** No email or personal data is required — it stays optional, to protect people's privacy. Identity is **trust-based** (opaque UUIDs, no accounts), not authenticated:
  - each **event** (group) has a secret UUID the creator shares; **anyone with the link can edit** (like a shared Google Doc).
  - a **device** gets one local id (`localStorage["divsplit_uid"]`), generated on first use via `generateId()` (`utils/identity.ts`).
  - on first open of an event link the app shows a **"Who are you?"** gate — pick an existing member or add yourself; the choice persists locally per event (`localStorage["divsplit_identity_<eventId>"]`). The creator of a new event names themselves first. Names stay editable.
  - the chosen member **attributes** every change — each recorded version stores its `author` (the acting member's name).
  - This is *trust*, not auth: real cryptographic member auth remains a **v2 concern**.

### 1.4 Version history & restore (the trust safety net)

Because there are no accounts and anyone with the link can edit, data integrity can't come from permissions — it comes from an **auditable, restorable history** (git / Google-Docs style). This is the product's core trust guarantee: if someone (by mistake or on purpose) inserts an unfair transaction or deletes an old one that favored them, the change is **logged and attributed** in History, and **any other member can restore** the fair version. Tamper-evident, not tamper-proof — and advertised on the home page as a deliberate advantage.
- every save records **one reversible delta** of the event "core" (`config` / `members` / `transactions`) via **jsondiffpatch** — **no full snapshots**, so storage stays tiny (`utils/versioning.ts`).
- the **History** tab shows the timeline of changes (consolidated Google-Docs style), attributed to the actor. Each entry (including the latest) is an **action with a Revert button** that rolls the event back to the snapshot taken right *before* that action (its `v-1` state) — so a just-made delete is undone directly from its own row. A revert is a **new forward version** (history is never destroyed), like reverting a git commit.
- **Destructive saves (delete/undo) are never consolidated** into the previous burst, so the state before a removal always survives as its own restorable point (`shouldConsolidate` in `utils/versioning.ts`).
- change lines are stored as translatable **named keys + params** (not baked text), so the log reads in the active language and stays human-readable in raw storage.
- past states are reconstructed by reverse-applying ("unpatch") deltas from the current state; history lives in a separate store (`localforage "history"`, key = eventId) so the event document stays small.
- **Restore fidelity under sync:** reconstruction is exact for a single device's linear history. After a pull rebuilds history from the server (§1.5), each delta was authored against its own device's base, so once two devices have edited concurrently a *restored intermediate* state is approximate (it may not match any single device's real history). The **current** state is always correct, and history is never destroyed — so this is a fidelity limit on time-travel, not a data-loss risk. Tightening it is part of the conflict-resolution work in §1.5.

### 1.5 Backend sync model (built — bidirectional)

The local model is **event-sourced** (append-only reversible deltas + a state folded from them), which makes it sync-ready. The backend keeps that shape so the server's data is **trustable and tamper-evident**, not just a mutable mirror.

**Offline-first ordering (the contract):** a save **always** lands in the browser first (IndexedDB), then propagates to Mongo. The app never blocks on the network. When online it syncs **both ways** continuously — push the local outbox up, pull the server's state down — so two browsers on the same event link converge.

- **Push** — every recorded version is appended to a durable IndexedDB **outbox** (`utils/sync.ts`) and flushed to `POST /api/changes` on save, on reconnect (`online`), on load, and on a 20s backstop. Nothing is lost across long offline spells.
- **Pull** — `pull(eventId)` mirrors the server's full state back down: the projection (`GET /api/event`) **and** the change log (`GET /api/changes`), rebuilding the local `group` + `history`. It runs on open, on reconnect, and on the 20s backstop. It **pushes first and skips while the outbox still holds unsynced edits for that event**, so a pull never clobbers local-first writes before they reach Mongo.
- **First open of a shared link** (no local data) pulls from the server before rendering, so the identity gate shows the event's real members.

**Two MongoDB collections (write/read gated by the API, not by Mongo):**

- **`changes`** — the **append-only source of truth**, unifying history *and* the activity log (the log lines are derived from each delta — there is no separate log collection). Insert-only: the API rejects updates/deletes. Each document references its parent(s) by hash and carries `hash = H(parentHash + payload)`, forming a **Merkle DAG (git-style), not a single linear chain** — see ordering below. Altering any past entry changes its hash and breaks every descendant that references it, so the structure is verifiable end-to-end. A unique index on the change id (`generateId()`) makes sync retries idempotent. Shape: `{ _id: changeId, eventId, parents: hash[], hash, author, ts, receivedAt, delta, summary: ChangeEntry[] }`.
- **`events`** — a **projection / cache** (read+write) folded from `changes`, for fast reads. Rebuildable at any time, so if it's ever wrong or tampered it's regenerated from the log — it is **never** the source of truth. Derived values (balances) live here as a recomputed cache only; the API never accepts a client-supplied balance.

(A `snapshots`/keyframe collection is an optional later optimisation so long histories don't replay every delta.)

**Ordering & late sync (this is why it's a DAG, not a chain).** Members are offline for *different* durations, so a change describing a *past* action can be appended *after* newer ones — order of arrival ≠ order of events. So:
- **arrival vs. event time are separate fields:** `receivedAt` (append order, server clock) vs. `ts` (when the action happened on the author's device). The activity log is **displayed sorted by `ts`**, so a late-synced past event slots into its correct chronological place even though it was inserted last. Append-only is preserved; only the view re-sorts.
- **causality comes from `parents` (the hashes the author had seen), not from timestamps** (clocks drift, can't be trusted).
- a late/offline change whose parent is **not** the current head is a **fork** (concurrent edit) — handled by the conflict policy below, not by reordering or rewriting history.

**Trust boundaries (be honest about them):** the hash DAG proves the log **was not altered after the fact** (inviolable history). It does **not** prove **who** wrote an entry — identity is self-asserted (no login), so this is tamper-evidence, not authentication. Real non-repudiation later means a per-device keypair signing each change.

**Conflicts (current policy — last-writer-wins):** today the server projection is folded from each `POST`'s full `core`, so concurrent edits to the same event resolve **last-writer-wins** at the projection. The append-only `changes` log still records *every* fork (nothing is destroyed — both edits remain in history and are restorable), but the live state is the most recently synced one. The richer **flag-`conflict`-and-let-the-user-resolve** policy (keep both / edit / delete, excluded from balances until resolved) is the documented next step, not yet built.

**Offline calculations:** balances/settlement are computed **locally** (`utils/settlement.ts`) for offline use; the server stores a `balanceCache` recomputed server-side, never trusted from the client. Surfacing locally-unconfirmed values as **provisional** in the UI is a future affordance; the header sync indicator (`SyncIndicator`) currently signals overall sync state instead.

**Hosting:** **Vercel Functions** in `api/` (serverless) — the app already deploys to Vercel and the API surface is small (append a change, fetch changes the device hasn't seen, fetch/rebuild the projection). **Mongoose** on **MongoDB Atlas** (`MONGO_URI`), with one **connection cached across warm invocations** (`api/_lib/db.ts`) — a *connection* cache, not a data cache, to avoid opening a pool per request.

---

## 2. Stack & Dependencies

**Single project at the repo root** (no npm workspaces). Node **24** (`.nvmrc`). ES modules throughout (`"type": "module"`). TypeScript (strict). The React app lives at the root (`src/`, `index.html`, `vite.config.ts`); the serverless API lives in `api/`. Both deploy as one Vercel project.

### Frontend (`src/`)
| Concern | Choice |
|---|---|
| Language | **TypeScript 6** (strict; project references) |
| Build / dev server | **Vite 8** (`@vitejs/plugin-react` 6) |
| UI | **React 19.2** + **react-dom** |
| Routing | **react-router-dom 7** |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`, CSS-first `@theme`) + **shadcn/ui** primitives |
| Icons | **lucide-react** |
| Fonts | self-hosted via **@fontsource** (sans-serif only: Hanken Grotesk / JetBrains Mono) |
| Avatars | **@dicebear/core** + **@dicebear/collection** ("thumbs"), generated **locally** (no remote API) |
| Versioning / diff | **jsondiffpatch** (reversible deltas for the version history) |
| PWA / offline shell | **vite-plugin-pwa** (Workbox service worker + web manifest) |
| i18n | **i18next** + **react-i18next** + browser language detector (EN / pt-BR, switchable in the header) |
| Local persistence | **localforage** (IndexedDB) |
| ID generation | **bson-objectid** via a single `generateId()` (`utils/id.ts`) — one scheme (24-char ObjectId hex) for every id: events, members, transactions, device id |
| Unit tests | **Vitest** |

### Backend (`api/`) — Vercel serverless functions
The sync layer (see **§1.5**): **Mongoose** models on **MongoDB Atlas** (`MONGO_URI`). Helper code lives in `api/_lib/` (the `_` prefix keeps it off Vercel's route table): `db.ts` (one connection cached across warm invocations) and `models.ts` (the append-only `Change` Merkle DAG + the `Event` projection). Route functions: `changes.ts` (GET changes-since / POST append + server-computed hash + projection upsert), `event.ts` (GET the projection), `health.ts`. Not part of the Vite build — `tsc -b` only includes `src/`; `api/` is typechecked via its own `api/tsconfig.json` (node types) and bundled separately by Vercel.

### Tooling
**ESLint 10** (flat config) + **typescript-eslint** + **Prettier**. CI (`.github/workflows/frontend.yml`) runs **lint**, **unit tests**, and **type-check + build** on the Node version from `.nvmrc`. Deployed on **Vercel** (`vercel.json`, SPA rewrite to `/index.html`).

> Note: `eslint` is pinned via a root `overrides` because `eslint-plugin-react` 7.37 doesn't yet declare ESLint 10 support; the React version is also pinned in the flat config to avoid its removed-API crash on ESLint 10.

---

## 3. Project Structure

```
divsplit/
├─ package.json          # single root project (no workspaces); deps, scripts, eslint override
├─ vercel.json           # SPA rewrite → /index.html
├─ index.html            # Vite entry
├─ vite.config.ts        # + tsconfig.*.json, vitest.config.ts, eslint.config.js, components.json
├─ src/                  # Vite + React 19 + TS SPA (all application code)
├─ public/               # static assets shipped as-is (logo, icons, demo_data.json)
├─ api/                  # Vercel serverless functions (sync backend): changes/event/health; _lib/ = db + models
├─ ARCHITECTURE.md       # this file
├─ DESIGN.md             # visual design system (palette, type, layout, components)
├─ docs/superpowers/specs # design specs (settlement, mark-as-paid, …)
└─ .github/              # CI (lint + test + build) + copilot-instructions.md
```

Scripts: `npm run dev`, `build` (`tsc -b && vite build`), `test` (`vitest run`), `typecheck`, `lint`, `format`.

---

## 4. Module Map (`src/`)

**Entry & shell**
- `renderApp.tsx` — bootstrap only; mounts `<App/>` into `#app-root` under `StrictMode`.
- `App.tsx` — composition root: imports `index.css` + fonts + i18n; `ThemeProvider → Container → AppRouter`.
- `routes/AppRouter.tsx` — `BrowserRouter`, global `Header`, route table (§5).
- `index.css` — Tailwind v4 entry: theme tokens (oklch, light/dark), fonts, base styles.

**Cross-cutting state (React Context)**
- `context/ThemeContext.tsx` — light/dark, persisted to `localStorage["divsplit_theme"]`; toggles the `.dark` class on `<html>`.
- `context/GroupContext.tsx` — loads/exposes the active group (`data`, `updateGroup(next, meta?)`, `loadDemo`) **and the trust-based identity** (`currentMemberId`, `currentMember`, `identify`, `clearIdentity`), used to attribute each save's `author`.

**Domain & data layer (`utils/`)**
- `use-api.ts` — the persistence boundary. localforage stores `groupList`, `group`, and `history`; hooks `useApiListGroups`, `useApiGetGroup`. On each save it records a version (author from the local identity), enqueues it for sync, and logs "Event created" on first persist. Also drives the background `pull` loop (open / reconnect / 20s) and seeds from the server on first open of an unseen link. *Single place that touches event storage.*
- `sync.ts` — offline-first background sync (§1.5): the durable IndexedDB **outbox** + `flush` (push), `pull` (server→local rebuild of projection + history), and the `synced | syncing | pending | offline` status store consumed by `SyncIndicator`.
- `export.ts` — `eventToTsv` (top-ups / balances / transactions sections) + `downloadTsv`; data portability so members can leave with their data.
- `versioning.ts` — version history engine (jsondiffpatch): `recordVersion`, `listVersions`, `reconstructCore` (reverse-apply), `buildRestore`. Stores one reversible delta per save in `localforage "history"`. Each save's `changes` are `ChangeEntry[]` — a **named key + params** (e.g. `TRANSFER_PAID` / `{from,to,amount}`), translated at render so history reads in the active language.
- `identity.ts` — trust-based identity: `getDeviceUid`, `get/setEventMemberId`, `getPreferredName` (all `localStorage`).
- `id.ts` — `generateId()`: the **single** id generator (ObjectId hex) for every entity, so id formats never diverge.
- `settlement.ts` — **pure** settlement engine: `computeBalances` (ΣpaidBy − ΣpaidFor), `topupTotal`, and `computeSettlement` (offset the holder by Σtop-ups → greedy min-cash-flow → fewest `transfers`). Unit-tested.
- `transaction.ts` — `getTransactionError` (form validation) + `autoSplit` (paid-by/paid-for distribution), unit-tested.
- `money.ts` — `formatMoney(value, lng)`: currency with 2 decimals and the language's separators (pt-BR → `1.234,50`). Wired as the i18next `money` formatter, so locale templates can write `{{amount, money}}`.
- `tools.ts` — `jsonParseSafe` / `jsonStringifySafe`.
- `types.ts` — shared domain types (`Group`, `Member`, `Transaction` incl. `TransactionType`, `Activity`, settlement types).

**UI**
- `components/ui/*` — shadcn primitives (`button`, `card`, `input`, `label`, `table`, `switch`, `badge`); `lib/utils.ts` exports `cn`.
- Pages (`pages/`): `HomePage` (landing + events grid), `EventsPage` (clean events list), `Group/Config`, `Group/Transaction` (hosts auto-split; color-codes paid-by vs consumed-by; blocks unbalanced saves), `Group/ListTransactions`, `Group/Settlement`, `Group/TopUp`, `Group/History` (version timeline + restore), `NotFound`.
- `components/GroupPageWrapper.tsx` — wraps a group route in `GroupProvider`, **shows the `IdentityGate` until you've picked who you are**, then dispatches `:section`, shows the empty-group prompt, mounts `Debug`.
- `components/IdentityGate.tsx` — the "Who are you?" step (pick a member / add yourself / name a new event).
- `components/ShareDialog.tsx` — copy/native-share the short private event link (`/group/:id`) with a "share only with paying members" warning.
- `components/SyncIndicator.tsx` — header cloud icon reflecting the `sync.ts` status store.
- `components/EventsGrid.tsx` — the vibrant event cards used by the landing and `EventsPage`.
- `Header` (logo + EVENTS link + sync indicator + language selector + theme toggle), `GroupHeader` (tab nav + "You: <name>" + Share), `Avatar` (DiceBear "thumbs", local), `Loading`, `Container`, `CardGroup`, `CardContainer`, `Debug`.

---

## 5. Route Structure

SPA, client-side routing only (Vercel rewrites non-asset, non-`api/` paths to `index.html`). The main dynamic route is `/group/:groupId/:section/:sectionItem?`; `GroupPageWrapper` switches on `section`.

| Path | Renders |
|---|---|
| `/` | `HomePage` (landing + events grid) |
| `/events` | `EventsPage` (clean events list) |
| `/group/:groupId` | redirect → `/group/:groupId/transactions` (short share link) |
| `/group/:groupId/config` | `GroupConfig` (name, members, top-holder) |
| `/group/:groupId/topup` | `GroupTopUp` (record a top-up) |
| `/group/:groupId/transactions[/:id\|new]` | transactions list / `GroupTransaction` |
| `/group/:groupId/settlement` | `GroupSettlement` (balances + transfers) |
| `/group/:groupId/history` | `GroupHistory` (version timeline, attributed, with per-action revert) |
| `*` | `NotFound` |

Opening any `/group/:groupId/*` path shows the **`IdentityGate`** first if this device hasn't picked a member for that event.

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
}
```

**Version history is stored separately** (not in the `Group`, to keep the document and its diffs small): `localforage "history"`, key = eventId → `EventVersion[]`, where `EventVersion = { v, ts, changes, author, delta }` (`changes` = translatable `ChangeEntry[]` of key+params) and `delta` is a reversible jsondiffpatch delta of the event core (`config`/`members`/`transactions`). See §1.4 and `utils/versioning.ts`.

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

- **Write path (offline-first):** a page builds a new group object and calls `updateGroup(next, meta?)`; `useApiGetGroup` stages it, persists **to the browser first**, **records a version** (`recordVersion` diffs prev vs next to derive the change lines, author from the local identity), enqueues it to the sync **outbox**, re-reads, then upserts the name into `groupList`. The outbox flushes to Mongo in the background (§1.5).
- **Read path:** local IndexedDB is the source for rendering. When online, a background `pull` mirrors the server's projection + history into local storage and the view re-reads; first open of an unseen link pulls before rendering.
- **Identity:** read locally per event (`utils/identity.ts`); the `IdentityGate` writes it before any contribution, so each save is attributed to the acting member.
- **Derived, not stored:** balances and the *suggested* settlement transfers are computed on read; recorded settle-ups are persisted as `type: 'transfer'` transactions. Past event states are reconstructed on demand from the delta history.
- **Demo data** from `/demo_data.json` (in `public/`).

---

## 8. Configuration & Environment

- **`VITE_SHOW_DEBUG=true`** — renders the `Debug` raw-group panel on group pages.
- **i18n:** detection order querystring `?lang=` → `localStorage["i18nLang"]` → navigator; fallback `en`. Locales `en`, `pt`.
- **Theme:** `.dark` class on `<html>`; tokens defined in `index.css` (oklch); persisted at `localStorage["divsplit_theme"]`.
- **Vite aliases:** `@`, `@components`, `@context`, `@pages`, `@utils`, `@routes`, `@locales` → `src/*` (mirrored in `tsconfig`).
- **Deploy (Vercel):** Vite auto-detected at the repo root; `npm run build` → `dist`; SPA rewrite to `/index.html`.
- **PWA:** `vite-plugin-pwa` emits `sw.js` + `manifest.webmanifest` at build; the SW precaches the shell and falls back to `index.html` for client routes. Test with `npm run build` + `vite preview` (the SW is off in `dev`).

---

## 9. Constraints & Trade-offs

- **Offline-first, intentionally.** The browser is the primary store and writes never block on the network; Mongo is a sync layer reached after local save (§1.5).
- **Multi-device, last-writer-wins.** Devices on the same event link sync both ways (§1.5). Concurrent edits resolve last-writer-wins at the server projection; the full fork is preserved in the append-only log but richer conflict resolution isn't built yet.
- **No PII.** Identity is opaque per-event UUIDs; member identification is deferred to v2.
- **Greedy settlement** (near-optimal), not provably minimal.
- **Tests cover pure logic** (settlement, validation, sync mapping) via Vitest; UI is covered by ad-hoc Playwriter/Chrome MCP QA, not component tests yet.

---

## 10. Known Tech Debt & Code Hotspots

- **`Transaction.tsx` auto-split** — complex in-place mutation + rounding; highest-risk hotspot, still untested at the component level (the pure split rules are the candidate to extract + unit-test).
- **`member.prepaid` legacy field** — kept optional only so old groups migrate to top-ups on load (`use-api` `groupStandardize`); unused by new code. Likewise `config.bankerId` → `holderId`.
- **Legacy ids in old data** — all ids are now generated by one `generateId()` (`utils/id.ts`, ObjectId hex). Events created before this may still hold old-format member ids (`"${index}_${Date.now()}"`) in storage; harmless (ids only need to be unique) and not migrated.
- **No keyframe snapshots in versioning** — reconstructing an old state replays all deltas from the current head; fine for small events, add periodic keyframes if histories get very long.
- **No component/E2E tests** — only pure-logic unit tests exist (settlement, transaction/autoSplit, versioning/describeChanges + consolidation).

---

## 11. Roadmap / Future Direction

Source: project owner. Order indicative.

1. ✅ **TypeScript migration**, dependency upgrades, **shadcn/Tailwind v4 redesign**, **CI** (lint+test+build), **settlement engine**.
2. ✅ **Mark transfers as paid** — settle-ups recorded as transfer transactions that net down balances; undoable; logged to Activity.
3. ✅ **Top-up & top-holder** — prepaid generalised to optional top-up transactions; the holder holds the pot and refunds the unused part; the banker special-case is gone.
4. ✅ **Visual design via Stitch MCP** — neon pink/green system + minimal full-screen landing, recorded in `DESIGN.md`.
5. ✅ **Trust-based identity** — device UUID + per-event "who are you?" gate attributing every change (§1.3); real cryptographic member auth still **v2**.
6. ✅ **Version history & restore** — reversible jsondiffpatch deltas, diff view, restore-as-new-version (§1.4).
7. ✅ **Backend sync layer** — offline-first browser stays primary; Mongoose/Atlas backend with bidirectional push+pull sync (§1.5). Current conflict policy is last-writer-wins at the projection; richer fork resolution (flag-`conflict`, vector clocks, per-device signing) remains the next step.

---

## 12. Security & Privacy

Offline-first app with a thin sync backend. **Privacy is a product principle** — no email/PII is collected; identity is opaque UUIDs (§1.3). The trust model is deliberate: an event's secret UUID is its only access control — **anyone with the link can read and edit** (like a shared Google Doc), which is why the Share dialog warns to share only with paying members. The server owns the tamper-evident hash chain (clients never send a hash), giving tamper-*evidence*, not authentication. Still **v2**: transport hardening beyond HTTPS, per-user authorization, per-device signing for non-repudiation, and real conflict resolution.
