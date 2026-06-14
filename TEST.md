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

- **Group:** `Beach Trip`
- **Members:** `Alice` (prepaid 100), `Bob` (prepaid 0), `Carol` (prepaid 50)
- **Expense:** `Dinner`, total `120`

---

## 1. Home & group creation

### TC-1.1 — Home page renders

1. Open http://localhost:5173/.
2. **Expected:** hero with the title "Split your group expenses with ease" and a
   **new group** button. Below, "Your expense management groups" lists existing
   group cards (three seeded `Grupo Teste` cards on a fresh profile). The browser
   console has no errors.

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

### TC-2.2 — Add members with prepaid amounts

1. On Config, fill the first member: name `Alice`, prepaid `100`.
2. Click **member** to add a row; fill `Bob`, prepaid `0`.
3. Click **member** again; fill `Carol`, prepaid `50`.
4. Click **Save**.
5. **Expected:** member count shows `3`; each member shows an initials avatar
   (e.g. "A", "B", "C") in a colored circle. Values persist after Save.

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

Settlement is derived (not stored). Balances use
`balance = prepaid + paidBy − paidFor`; the **banker** holds the prepaid pot, so
the net balances (shown on the page) sum to zero and match the transfers. The
pure logic is also covered by unit tests: `npm test --workspace frontend`.

### TC-7.1 — Choose the banker

1. Open a group → **Config** → set the **Banker** dropdown to a member → **Save**.
2. **Expected:** the choice persists across reload (defaults to the first member
   when never set).

### TC-7.2 — Balances and transfers (worked example)

1. Use the `Beach Trip` group (Alice 100 / Bob 0 / Carol 50, banker Alice) with
   the `Dinner` $120 expense (paid by Carol; split 40/40/40). Open **Settle up**.
2. **Expected balances (net):** Alice owes $90, Bob owes $40, Carol gets back $130.
3. **Expected transfers:** `Bob → Carol $40` and `Alice → Carol $90` (2 transfers);
   the net balances sum to zero.

### TC-7.3 — Prepaid-only refund via the banker

1. Same members, banker Alice, but **no transactions**. Open **Settle up**.
2. **Expected:** Carol gets back $50, Bob settled, Alice (banker) owes $50;
   transfer `Alice → Carol $50` (Alice returns Carol's prepaid from the pot and
   keeps her own).

### TC-7.4 — Everyone already even

1. A group where each member's contributions equal their consumption.
2. **Expected:** all rows show "settled" and the Transfers panel shows
   "Everyone is settled up — no transfers needed".

---

## 8. Routing

### TC-8.1 — Unknown route shows 404

1. Navigate to a nonsense path, e.g. `/group/abc/does-not-exist`.
2. **Expected:** the 404 page ("404 / Content not found") with a link back home.

---

## Known issues / notes

- **Silent validation on transaction save (TC-3.6):** if Date, Total, or
  Description is empty the Save is ignored without any visible message
  (`Transaction.tsx` logs to console only — there is a `TODO` for UI feedback).
- **Settlement banker model:** settle-up assumes one **banker** holds the prepaid
  pot and disburses refunds (so a banker can show as "owes" while having prepaid
  the most — that's the cash they pay out of the pot, and it matches the transfer
  lines). Transfer minimization is greedy (near-optimal), not provably minimal.
- **No favicon:** the initial page load logs one harmless `404` for the favicon.
- **Native date input:** automated tools may need to set the date field
  programmatically; manual testing with the date picker works normally.
