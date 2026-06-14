# Mark transfers as paid — design

> Status: approved (2026-06-14). Lets users record settle-up transfers as paid so
> the suggested-transfers list reflects what has actually been settled.
>
> **Revision (during implementation):** instead of a separate `payments[]` array,
> a settle-up is stored as a **`Transaction` of `type: 'transfer'`** (project-owner
> rule: "a transfer is just a transaction"). Sender → `paidBy` (credit), recipient
> → `paidFor` (debit), so it folds into `computeBalances` with no new settlement
> code and no `Payment` type. Everything below about balance effects still holds;
> just read "payment" as "transfer transaction". Transfers are filtered out of the
> expenses list and managed on the Settle up page.

## Goal

On the Settle up page, suggested transfers are derived from balances and have no
stable identity. Let a user mark a transfer paid in a way that:

- survives recomputation when expenses or members change,
- keeps the suggested-transfers list correct (paid transfers drop out),
- is undoable, and leaves a record of what was paid.

## Model: record a payment

Marking "Bob pays Carol $40" appends a **payment** that feeds back into balances —
the same approach as Splitwise's "settle up". Payments are settlement money
movements, kept **separate from expenses** (the Transactions list stays
expenses-only).

```ts
interface Payment {
	id: string;
	fromId: string;
	toId: string;
	amount: number;
	date: string | Date;
}
// Group gains: payments?: Payment[]
```

### Settlement integration (`settlement.ts`)

`computeBalances` folds payments into each member's balance after the
prepaid/paidBy/paidFor sum:

```
for each payment p:
	balance(p.fromId) += p.amount   // paying reduces the payer's outstanding debt
	balance(p.toId)   -= p.amount   // receiving reduces the payee's credit
```

The banker pot adjustment and greedy min-cash-flow are unchanged, so the
suggested `transfers` automatically shrink or disappear as payments are recorded,
and `netBalances` stay consistent. No new identity/flag plumbing is needed.

## Recording and undo

- **Mark paid:** each suggested transfer row gets a button that appends a
  `Payment` (`fromId`, `toId`, `amount`, `date = now`, generated `id`) to
  `group.payments` via `updateGroup`.
- **Undo:** a **Recorded payments** section lists payments (`from → to · amount ·
  date`), each with a delete button that removes it from `group.payments`.
- **Activity:** both actions append an Activity entry. Add
  `PAYMENT_RECORDED` and `PAYMENT_REMOVED` to `ACTIVITY_TYPES`, with
  `trackPaymentRecorded` / `trackPaymentRemoved` helpers, so settle-ups show in
  the Activity tab and respect the existing 100-entry cap.

## UI (Settle up page)

- Each transfer row: existing "**X** pays **Y** `$Z`" plus a **Mark paid** button
  (check icon).
- Below the transfers, a **Recorded payments** card/list (only shown when there
  are payments) with per-row **Undo**.
- The existing "Everyone is settled up" empty state still applies once balances
  net out (whether via real evenness or recorded payments).

## Testing

- **Unit (TDD, `settlement.test.ts`):** payments adjust balances in the right
  direction; recording the suggested transfers as payments drives all balances to
  settled (no remaining transfers); a partial payment reduces but doesn't clear.
- **Activity:** `activity-tracker` payment helpers covered by a focused test.
- **Live QA (Chrome MCP):** record a suggested payment → it leaves the list and
  Activity logs it → undo it → it returns. Confirmed as an end user.

## Out of scope (future)

Partial/custom payment amounts, a "mark all paid" bulk action, editing a recorded
payment (delete + re-add instead), and multi-currency.
