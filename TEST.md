# TEST.md — DivSplit QA Guide

Manual, reproducible test procedures for DivSplit, written so anyone can re-run a
specific check after a change. DivSplit is **local-first**: all data lives in the
browser (IndexedDB via localforage), so tests are deterministic per browser profile
and require no backend or internet.

> Tip: each browser profile is its own dataset. To start from a clean slate, open a
> private/incognito window or clear site data for `localhost:5173`
> (DevTools → Application → Storage → "Clear site data").

## Running the app

```bash
npm install
npm run dev --workspace frontend   # or: npm run dev   (from repo root)
```

Open http://localhost:5173/. To enable the raw-state debug panel on group pages:

```bash
VITE_SHOW_DEBUG=true npm run dev --workspace frontend
```

Other useful checks:

```bash
npm run lint                       # eslint (root + frontend)
npm run build --workspace frontend # tsc type-check + production build
```

## Test data conventions

Most tests below use this group:

- **Group:** `Beach Trip`, top-holder `Alice`
- **Members:** `Alice`, `Bob`, `Carol`
- **Top-ups:** Alice `100`, Carol `50` (added via Settle up → Top up)
- **Expense:** `Dinner`, total `120`

---

## 1. Home & group creation

### TC-1.1 — Home page renders

1. Open http://localhost:5173/ on a **fresh profile** (or incognito).
2. **Expected:** hero with the title "Split your group expenses with ease" and a
   **new group** button. With no groups yet, an empty-state card shows
   "No groups yet — create your first one" and a **new group** button (no fake
   seeded groups). The browser console has no errors.
3. After creating groups, they list under "Your expense management groups".

### TC-1.2 — Create a new group

1. Click **new group**.
2. **Expected:** navigates to `/group/<new-id>/config` with the heading "Untitled
   group" and an empty member row.

### TC-1.3 — New group appears on the home list after saving

1. From a new group (TC-1.2), set a **Group name** and click **Save**.
2. Go back to the home page (click the DivSplit logo).
3. **Expected:** the group now appears as a card with its name and id.
   _(Regression guard: a freshly created group must be added to the home index on
   first save, not only updated if already present.)_

### TC-1.4 — Open an existing group

1. On the home page, click any group card.
2. **Expected:** navigates to that group's Config page.

---

## 2. Group config & members

### TC-2.1 — Rename group

1. Open a group → **Config** tab.
2. Change **Group name** to `Beach Trip` → **Save**.
3. **Expected:** the large group heading updates to `Beach Trip`.

### TC-2.2 — Add members and pick the top-holder

1. On Config, fill the first member `Alice`; **+ member** → `Bob`; **+ member** → `Carol`.
2. Set the **Top-holder** dropdown (defaults to the first member).
3. Click **Save**.
4. **Expected:** member count shows `3`; each shows an initials avatar; the
   holder choice persists. There is no per-member "prepaid" input — money is added
   later via **Top up** (see §7). Members carry no amounts here.

### TC-2.3 — Remove a member

1. On Config, click the trash icon next to a member row → **Save**.
2. **Expected:** the member disappears and the count decreases. The Activity log
   records a "removed" entry (see TC-4.1).

---

## 3. Transactions & the split engine (core feature)

### TC-3.1 — Open the new-transaction form

1. Open a group with members → **Transactions** tab → **Add Transaction**.
2. **Expected:** a form with Date / Total / Description, plus two cards
   **Paid by** and **Paid for**, each listing every member with a checkbox and a
   `$` amount field, and a **Remaining** indicator.

### TC-3.2 — "Paid by" single payer auto-fills the total

1. Set **Total** = `120`.
2. In **Paid by**, check **Alice**.
3. **Expected:** Alice's amount becomes `120` and **Paid by → Remaining** shows
   `$0` with a check icon.

### TC-3.3 — "Paid for" splits evenly across selected members

1. With Total `120`, in **Paid for** check **Alice**, **Bob**, **Carol**.
2. **Expected:** each is set to `40` and **Paid for → Remaining** shows `$0`.
   _(General rule: the remaining amount is divided equally among selected members
   who haven't been edited by hand; any rounding remainder is absorbed by the last
   person touched so the parts always sum to the total.)_

### TC-3.4 — Manual override holds while others re-split

1. With three members selected in **Paid for** (40/40/40), type `60` into Carol's
   amount.
2. **Expected:** Carol stays `60`; Alice and Bob re-split the remaining `60` to
   `30` each; Remaining stays `$0`.

### TC-3.5 — Decoupled payer vs. consumer

1. In **Paid by** select only the person who actually paid (e.g. Alice = 120).
2. In **Paid for** select who should be charged (e.g. Bob + Carol = 60/60).
3. **Expected:** both sections independently reach Remaining `$0`; this models
   "one person paid, different people owe".

### TC-3.6 — Save a transaction

1. Fill **Date**, **Total** (`120`), **Description** (`Dinner`), and a valid split.
2. Click **Save**.
3. **Expected:** navigates to the transaction's URL and it appears under the
   **Transactions** tab as a row: date, `Dinner`, `$120`.
   _Note: Date, Total and Description are all required — saving with any missing is
   a no-op (currently fails silently; see Known issues)._

### TC-3.7 — Edit an existing transaction

1. From the transactions list, click a row.
2. Change the Description or Total and **Save**.
3. **Expected:** the list reflects the change; the Activity log records the edit.

### TC-3.8 — Delete a transaction

1. In the transactions list, click the trash icon on a row.
2. **Expected:** a confirmation dialog ("Are you sure you want to delete …").
   Accept → the row is removed; the empty state ("No transactions found") shows
   when the list is empty. Cancel → nothing changes.

---

## 4. Activity log

### TC-4.1 — Changes are recorded

1. After doing TC-2.1 / TC-2.2 / TC-3.6, open the **Activity** tab.
2. **Expected:** a reverse-chronological list (newest first) of entries such as
   "Group name changed …", "Member \"Alice\" was added …", "Transaction \"Dinner\"
   was created for $120", each with an icon and a relative timestamp ("Just now").
3. **Expected (empty case):** a brand-new group with no changes shows the
   "No activity yet" empty state.

---

## 5. Theme

### TC-5.1 — Toggle light/dark

1. Click the sun/moon button in the header.
2. **Expected:** the whole app switches between the warm paper (light) and ink
   (dark) themes; the icon flips.

### TC-5.2 — Theme persists across reload

1. Switch to dark, then reload the page.
2. **Expected:** the app stays in dark mode (stored in `localStorage`).

---

## 6. Persistence & offline (local-first)

### TC-6.1 — Data survives a reload

1. Create `Beach Trip` with members and a transaction.
2. Reload the page and reopen the group.
3. **Expected:** group name, members, prepaid amounts and transactions are all
   still present.

### TC-6.2 — Works offline

1. With the app loaded, open DevTools → Network → set **Offline**.
2. Reload and use the app (create groups, add expenses).
3. **Expected:** everything works; fonts and avatars render (both are bundled /
   generated locally, not fetched from a CDN).

### TC-6.3 — Load sample data

1. Open an empty group; in the "Need some data to get started?" prompt click
   **Load sample data**.
2. **Expected:** the group is populated from `frontend/demo_data.json` (members
   with prepaid amounts and sample transactions).

---

## 7. Settle up (balances & fewest transfers)

Settlement is derived (suggested transfers are not stored). `balance = ΣpaidBy −
ΣpaidFor`; a **top-up** credits its member; the **top-holder** holds the pooled
top-up cash and (for the transfer computation only) is offset by Σtop-ups, so
refunds route through them. Pure logic is covered by unit tests: `npm test
--workspace frontend`.

### TC-7.1 — Top up a member

1. Open a group → **Settle up** → **Top up**. Choose a member, enter an amount,
   optionally a note → **Top up**.
2. **Expected:** back on Settle up, the member's balance rises by that amount
   (badge "gets back", "deposited $X"), the top-up appears under **Top-ups**, and
   Activity logs "{member} topped up $X". Undo removes it.

### TC-7.2 — Holder refunds the unused pot (top-ups, no expenses)

1. `Beach Trip`, holder Alice. Top up: Alice $100, Carol $50 (Bob none). No expenses.
2. **Expected:** Alice (Holder) +$100, Bob settled, Carol +$50; transfer
   `Alice → Carol $50` (Alice holds the $150 pot, refunds Carol, keeps her own).

### TC-7.3 — Out-of-pocket payer is refunded by the holder

1. Top up Alice/Bob/Carol $100 each (holder Alice). Add an expense Bob paid out of
   pocket (e.g. $90 street food, split 30/30/30).
2. **Expected:** transfers come *from Alice* (the holder) — she refunds Bob his
   leftover + the $90 he fronted, and Carol her leftover.

### TC-7.4 — No top-ups → plain fewest-transfers

1. A pay-as-you-go group: an expense paid by one member, split among all, **no
   top-ups**, no holder needed.
2. **Expected:** ordinary debtor→creditor transfers (the holder isn't special);
   when everyone's even, "Everyone is settled up — no transfers needed".

### TC-7.5 — Mark a transfer as paid

1. With a suggested transfer (e.g. `Alice → Carol $50`), click **Mark paid**.
2. **Expected:** a settle-up is recorded — the transfer leaves the suggested list,
   the involved members move toward "settled", and the payment appears under
   **Recorded payments** (`from → to · amount · date`). The Activity tab logs
   "{from} paid {to} $X". The settle-up does **not** appear in the Transactions
   (expenses) list.

### TC-7.6 — Undo a recorded payment

1. In **Recorded payments**, click **Undo** on an entry.
2. **Expected:** the payment is removed, the balance/transfer it cleared comes
   back, and Activity logs "Removed payment: {from} → {to} $X".

---

## 8. Routing

### TC-8.1 — Unknown route shows 404

1. Navigate to a nonsense path, e.g. `/group/abc/does-not-exist`.
2. **Expected:** the 404 page ("404 / Content not found") with a link back home.

---

## Known issues / notes

- **Settlement holder model:** the **top-holder** holds the pooled top-up cash and
  refunds it, so when there are top-ups the suggested transfers route through the
  holder (each other member deals only with the holder; the holder makes several).
  Transfer minimization is greedy (near-optimal), not provably minimal.
- **Expenses always have a payer:** an expense paid "from the pot" isn't modelled
  as a no-payer transaction; record who actually paid (`paidBy`). Pot-funding is
  implicit via top-ups + the holder refund.
- **Native date input:** automated tools may need to set the date field
  programmatically; manual testing with the date picker works normally.
