# TEST.md — DivSplit QA Guide

Manual, reproducible test procedures for DivSplit, written so anyone can re-run a
specific check after a change. DivSplit is **local-first**: all data lives in the
browser (IndexedDB via localforage), so tests are deterministic per browser profile
and require no backend or internet.

> Terminology: a shared-expense container is an **"event"** (dinner, trip, party…) in
> all UI copy. The code/URLs still use `group`/`groupId` internally.

> Tip: each browser profile is its own dataset. To start from a clean slate, open a
> private/incognito window or clear site data for `localhost:5173`
> (DevTools → Application → Storage → "Clear site data"). Identity (who you are in an
> event) is also stored in `localStorage` — clearing site data resets it.

## Running the app

```bash
npm install
npm run dev --workspace frontend   # or: npm run dev   (from repo root)
```

Open http://localhost:5173/. To enable the raw-state debug panel on event pages:

```bash
VITE_SHOW_DEBUG=true npm run dev --workspace frontend
```

Other useful checks:

```bash
npm run lint                       # eslint (root + frontend)
npm run build --workspace frontend # tsc type-check + production build
npm run test --workspace frontend  # unit tests (settlement, versioning, …)
```

## Test data conventions

Most tests below use this event:

- **Event:** `Beach Trip`, top-holder `Alice`
- **Members:** `Alice`, `Bob`, `Carol`
- **Top-ups:** Alice `100`, Carol `50` (added via Settle up → Top up)
- **Expense:** `Dinner`, total `120`

---

## 1. Home & event creation

### TC-1.1 — Home page renders

1. Open http://localhost:5173/ on a **fresh profile** (or incognito).
2. **Expected:** a full-screen hero — a pink infinity (∞) emblem, the headline
   **"Zero Balances."** / **"Pure Intent."** (the second line a pink→green gradient),
   a subtitle, a glowing pill **CREATE AN EVENT**, and small `ENCRYPTED · REAL-TIME`
   labels. The header shows the DivSplit logo (on a dark chip), an **EVENTS** link, a
   **language selector** (EN/PT) and a **theme toggle**. No console errors.
3. Below the hero, with no events yet, an empty-state card shows
   **"No events yet — create your first one"**. After events exist they list under
   **"Your shared-expense events"** as vibrant colored cards, followed by a dashed
   **new event** tile.

### TC-1.2 — Create a new event (creator identity)

1. Click **CREATE AN EVENT** (or the dashed **new event** tile).
2. **Expected:** navigates to `/group/<new-id>/config`, but the **identity gate**
   intercepts first: **"Welcome to DivSplit / What's your name?"** with a name field.
3. Type your name → **Continue**.
4. **Expected:** the gate closes; you are now member #1, the Config page shows with the
   event eyebrow **"EVENT"**, title **"Untitled event"**, and **"You: <name> · change"**
   under it. The Activity log will contain an **"Event created"** entry (TC-6.1).

### TC-1.3 — New event appears on the home list after saving

1. From a new event (TC-1.2), set an **Event name** and click **Save**.
2. Go back to the home page (click the DivSplit logo).
3. **Expected:** the event now appears as a colored card with its name and id.
   _(Regression guard: a freshly created event must be added to the home index on
   first save, not only updated if already present.)_

### TC-1.4 — Open an existing event

1. On the home page, click any event card.
2. **Expected:** if you've already identified for it, its Config page; otherwise the
   identity gate first (TC-9.1).

---

## 2. Event config & members

### TC-2.1 — Rename event

1. Open an event → **Config** tab.
2. Change **Event name** to `Beach Trip` → **Save**.
3. **Expected:** the large event heading updates to `Beach Trip`.

### TC-2.2 — Add members and pick the top-holder

1. On Config, fill the first member `Alice`; **+ member** → `Bob`; **+ member** → `Carol`.
2. Set the **Top-holder** dropdown (defaults to the first member).
3. Click **Save**.
4. **Expected:** member count shows `3`; each shows an **auto-generated avatar**
   (DiceBear "thumbs", rendered locally); the holder choice persists. There is no
   per-member "prepaid" input — money is added later via **Top up** (see §8).

### TC-2.3 — Remove a member

1. On Config, click the trash icon next to a member row → **Save**.
2. **Expected:** the member disappears and the count decreases. The Activity log
   records a "removed" entry (see TC-6.1).

---

## 3. Transactions & the split engine (core feature)

### TC-3.1 — Open the new-transaction form

1. Open an event with members → **Transactions** tab → **Add Transaction**.
2. **Expected:** a form with Date / Total / Description, plus two cards
   **Paid by** and **Consumed by** ("Gasto por" in pt-BR), each listing every member
   with a checkbox and a `$` amount field, and a **Remaining** indicator.

### TC-3.2 — "Paid by" single payer auto-fills the total

1. Set **Total** = `120`.
2. In **Paid by**, check **Alice**.
3. **Expected:** Alice's amount becomes `120` and **Paid by → Remaining** shows `$0`.

### TC-3.3 — "Consumed by" splits evenly across selected members

1. With Total `120`, in **Consumed by** check **Alice**, **Bob**, **Carol**.
2. **Expected:** each is set to `40` and Remaining shows `$0`.
   _(General rule: the remaining amount is divided equally among selected members who
   haven't been edited by hand; any rounding remainder is absorbed by the last person
   touched so the parts always sum to the total.)_

### TC-3.4 — Manual override holds while others re-split

1. With three members selected (40/40/40), type `60` into Carol's amount.
2. **Expected:** Carol stays `60`; Alice and Bob re-split the remaining `60` to `30`
   each; Remaining stays `$0`.

### TC-3.5 — Decoupled payer vs. consumer

1. In **Paid by** select only who actually paid (e.g. Alice = 120).
2. In **Consumed by** select who should be charged (e.g. Bob + Carol = 60/60).
3. **Expected:** both sections independently reach Remaining `$0`.

### TC-3.6 — Save / edit / delete a transaction

1. Fill **Date**, **Total** (`120`), **Description** (`Dinner`), a valid split → **Save**.
   **Expected:** it appears under **Transactions** as a row: date, `Dinner`, `$120`.
   _(Date, Total and Description are all required.)_
2. Click a row, change Description/Total, **Save** → the list reflects the change.
3. Click the trash icon → confirm dialog → row removed; empty state when none remain.

---

## 4. Theme

### TC-4.1 — Toggle light/dark

1. Click the sun/moon button in the header.
2. **Expected:** the **whole layout** switches consistently — light is a clean
   **pink-white**, dark is a **blue-black** (no warm/brown cast). Pink is the primary
   accent, mint-green the secondary. No dark panel left on a light page or vice-versa.

### TC-4.2 — Theme persists across reload

1. Switch to dark, reload.
2. **Expected:** stays dark (stored at `localStorage["divsplit_theme"]`).

---

## 5. Language (i18n)

### TC-5.1 — Switch EN ↔ PT

1. Click the **language selector** (globe + "EN"/"PT") in the header.
2. **Expected:** the whole UI switches between English and Brazilian Portuguese
   (e.g. EVENTS↔EVENTOS, Config↔Configuração, Save↔Salvar, "Consumed by"↔"Gasto por").

### TC-5.2 — Language persists across reload

1. Switch to PT, reload.
2. **Expected:** stays in PT (stored at `localStorage["i18nLang"]`). Activity/version
   *messages* are stored in English (they're recorded at write time), but all UI
   chrome follows the selected language.

---

## 6. Activity log

### TC-6.1 — Changes are recorded and attributed

1. After TC-2.1 / TC-2.2 / TC-3.6, open the **Activity** tab.
2. **Expected:** a reverse-chronological list (newest first): "Event name changed …",
   "Member \"Alice\" was added to the event", "Transaction \"Dinner\" was created …",
   and an **"Event created"** entry at the bottom. Each row shows an icon and, when the
   author is known, **"<name> · <relative time>"** (see §9 identity).
3. **Empty case:** a brand-new event before any save shows "No activity yet".

---

## 7. Persistence & offline (local-first)

### TC-7.1 — Data survives a reload

1. Create `Beach Trip` with members and a transaction; reload and reopen.
2. **Expected:** name, members and transactions are all still present (and your
   identity — you're not re-prompted by the gate).

### TC-7.2 — Works offline (PWA)

1. The service worker only runs in a production build: `npm run build --workspace
   frontend` then `npm run preview --workspace frontend` (e.g. http://localhost:4173/).
   Load the page once (lets the SW precache the shell).
2. DevTools → Network → **Offline**, then **reload**.
3. **Expected:** the app still launches and works fully — the SW serves the app shell
   from cache; fonts and avatars render (bundled / generated locally). In dev mode
   (`npm run dev`) there is no SW, so an offline reload would fail.

### TC-7.2b — Installable

1. In the built/preview app, the browser offers **Install** (address bar / menu).
2. **Expected:** installs as a standalone app (DivSplit name + piggy icon, pink theme).

### TC-7.3 — Load sample data

1. Open an empty event; in "Need some data to get started?" click **Load sample data**.
2. **Expected:** populated from `frontend/demo_data.json` (members + sample transactions).

---

## 8. Settle up (balances & fewest transfers)

Settlement is derived (suggested transfers are not stored). `balance = ΣpaidBy −
ΣpaidFor`; a **top-up** credits its member; the **top-holder** holds the pooled top-up
cash and (for the transfer computation only) is offset by Σtop-ups, so refunds route
through them. Pure logic is covered by unit tests (`npm run test --workspace frontend`).

### TC-8.1 — Top up a member

1. **Settle up** → **Top up**. Choose a member, enter an amount → **Top up**.
2. **Expected:** the member's balance rises (badge "gets back", "deposited $X"), the
   top-up appears under **Top-ups**, Activity logs "{member} topped up $X". Undo removes it.

### TC-8.2 — Holder refunds the unused pot (top-ups, no expenses)

1. `Beach Trip`, holder Alice. Top up: Alice $100, Carol $50 (Bob none). No expenses.
2. **Expected:** Alice (Holder) +$100, Bob settled, Carol +$50; transfer
   `Alice → Carol $50`.

### TC-8.3 — Out-of-pocket payer is refunded by the holder

1. Top up Alice/Bob/Carol $100 each (holder Alice). Add an expense Bob paid out of
   pocket ($90, split 30/30/30).
2. **Expected:** transfers come *from Alice* (the holder).

### TC-8.4 — No top-ups → plain fewest-transfers

1. A pay-as-you-go event: one expense paid by one member, split among all, no top-ups.
2. **Expected:** ordinary debtor→creditor transfers; when even, "Everyone is settled
   up — no transfers needed".

### TC-8.5 — Mark a transfer as paid / undo

1. With a suggested transfer (`Alice → Carol $50`), click **Mark paid**.
   **Expected:** it leaves the suggested list, members move toward "settled", the
   payment appears under **Recorded payments**, Activity logs "{from} paid {to} $X". It
   does **not** appear in the Transactions (expenses) list.
2. In **Recorded payments**, click **Undo** → the payment is removed and the cleared
   transfer comes back; Activity logs "Removed payment: {from} → {to} $X".

---

## 9. Identity ("who are you?", trust-based)

No accounts/login — anyone with the event's secret link can edit, and you pick which
member you are (stored locally per event).

### TC-9.1 — Joiner picks an existing member

1. On a **fresh profile**, open an existing event's link (e.g. `/group/<id>/config`).
2. **Expected:** the **"Who are you?"** gate — a list of existing members (avatar +
   name) to pick from, plus an "I'm not listed" name field.
3. Click a member → the gate closes and the header shows **"You: <name> · change"**.

### TC-9.2 — Joiner adds themselves

1. At the gate (TC-9.1), type a new name in "I'm not listed" → **Join**.
2. **Expected:** a new member is created, you're identified as them, and Activity logs
   "Member \"<name>\" was added to the event" attributed to you.

### TC-9.3 — Attribution

1. While identified as e.g. `Ana`, make a change (rename, add expense) and **Save**.
2. **Expected:** the new **Activity** entry and the new **Version** (§10) both show
   `Ana` as the author.

### TC-9.4 — Switch identity

1. Click **change** next to "You: <name>".
2. **Expected:** the gate returns so you can pick a different member.

---

## 10. Version history & restore

Every save records one reversible delta of the event core (config/members/
transactions). Pure logic covered by unit tests (`versioning.test.ts`).

### TC-10.1 — Versions are recorded

1. Make a couple of edits (rename, add a member), saving each → open the **Versions** tab.
2. **Expected:** a newest-first timeline; each entry shows `v{n} · {author} · {time}`
   and a coarse message ("Updated event details", "Updated members"). The latest is
   labelled **Current**.

### TC-10.2 — View a diff

1. Click **Changes** on a version.
2. **Expected:** a human-readable diff of that save, e.g. `Name: "Praia" → "Praia Grande"`,
   `Added member "Bruno"`, `"Dinner": $80 → $100`.

### TC-10.3 — Restore creates a new forward version

1. Click **Restore** on an older version.
2. **Expected:** the event reverts to that state, AND a **new** version
   **"Restored to version N"** is appended as the Current head — history is never
   destroyed (older versions and their Restore links remain).

---

## 11. Routing

### TC-11.1 — Unknown route shows 404

1. Navigate to a nonsense path, e.g. `/group/abc/does-not-exist`.
2. **Expected:** the 404 page ("404 / Content not found") with a link home. (You may
   see the identity gate first if you haven't identified for `abc`.)

---

## Known issues / notes

- **Settlement holder model:** with top-ups, suggested transfers route through the
  **top-holder**; minimization is greedy (near-optimal), not provably minimal.
- **Expenses always have a payer:** pot-funding is implicit via top-ups + the holder
  refund, not a no-payer transaction.
- **Activity/version messages are English-only:** they're stored at write time, so they
  don't translate when you switch language (UI chrome does).
- **No version keyframes:** restoring replays all deltas from the head; fine for small
  events.
- **Native date input:** automated tools may need to set the date field
  programmatically; the manual date picker works normally.
- **Nav/footer placeholders:** the header **EVENTS** link goes home; footer
  Privacy/Terms are non-navigating placeholders.
