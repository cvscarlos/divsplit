# Settlement engine — design

> Status: approved (2026-06-14). Computes per-member balances and the fewest
> transfers needed to settle a group, accounting for prepaid amounts.

## Goal

Turn a group's transactions and prepaid balances into:

1. a per-member **balance** (owed back / owes / settled), and
2. the **fewest transfers** that settle everyone, so a 10-person trip never ends
   with one person sending money to nine others.

This is the headline feature DivSplit promised but never implemented.

## Balance model

For each member `m`:

```
balance(m) = prepaid(m) + paidBy(m) − paidFor(m)
```

- `prepaid(m)` — money the member pre-funded (from `config`/member record).
- `paidBy(m)` — Σ of the member's amounts across all transactions' `paidBy`.
- `paidFor(m)` — Σ of the member's amounts across all transactions' `paidFor`.

A positive balance means the group owes the member; negative means they owe.

### The banker (prepaid pot)

Per-transaction, `paidBy` total = `paidFor` total, so those net to zero across
members. Prepaid, however, is extra cash that may not be fully consumed, so raw
balances sum to `Σ prepaid` (a surplus), not zero — a pure peer-to-peer
settlement is then impossible.

Resolution: one member is the **banker**, who physically holds the prepaid pot
(`pot = Σ prepaid`). Their effective balance is reduced by the pot:

```
effectiveBalance(banker) = balance(banker) − pot
effectiveBalance(other)  = balance(other)
```

Now `Σ effectiveBalance = Σ balance − pot = pot − pot = 0`, so the transfers
fully settle. The banker is stored as `config.bankerId` and defaults to the
first member when unset; it is selectable on the Config page.

### Worked example

Members: Alice (prepaid 100), Bob (0), Carol (50). One $120 dinner —
paidBy: Carol 120; paidFor: Alice/Bob/Carol 40 each. Banker = Alice.

```
balance:    Alice +60, Bob −40, Carol +130     (sum +150 = pot)
effective:  Alice −90, Bob −40, Carol +130     (sum 0)
transfers:  Bob → Carol $40, Alice → Carol $90  (2 transfers)
→ Bob out 40 (=share), Carol net-in 40 (=share), Alice keeps 60 refund ✓
```

## Components

### 1. `src/utils/settlement.ts` (pure, no UI)

- `computeBalances(group: Group): MemberBalance[]`
  — `{ memberId, name, balance }` per member.
- `computeSettlement(group: Group): SettlementResult`
  — `{ balances: MemberBalance[], transfers: Transfer[], bankerId: string }`.
  - Determine banker: `group.config.bankerId` or first member.
  - Apply the banker pot adjustment to effective balances.
  - **Greedy min-cash-flow:** repeatedly take the largest creditor and largest
    debtor, transfer `min(|debtor|, creditor)`, reduce both, drop any that reach
    ~0; emit a `Transfer { fromId, toId, amount }` each step.
  - Money rounded to cents; balances within a `< 0.005` tolerance are treated as
    settled (no phantom 1¢ transfers).

Types: `MemberBalance`, `Transfer`, `SettlementResult` added to `types.ts` or
co-located in `settlement.ts`.

### 2. Banker selection (Config page)

- Add optional `bankerId?: string` to `GroupConfig` in `types.ts`.
- `Config.tsx`: a member dropdown ("Banker") writing `config.bankerId` on save.
  Defaults to the first member when unset.

### 3. "Settle up" tab + page

- Add a `settlement` section: 4th tab in `GroupHeader` (Config / Transactions /
  **Settle up** / Activity), routed via the existing `:section` param in
  `GroupPageWrapper`.
- `pages/Group/Settlement.tsx` (read-only):
  - **Balances**: each member with amount in mono and an owed/owes/settled badge.
  - **Transfers**: rows reading "**{from}** pays **{to}** `${amount}`". Empty
    state when everyone is settled.

## Testing

The repo has no test runner yet. Add **Vitest** (+ `npm test` script) and write
unit tests for `settlement.ts` first (TDD):

- the worked example above (balances + transfers),
- already-even group (no transfers),
- single payer / single ower,
- rounding residuals (amounts like 1/3 splits),
- empty group / no transactions / banker unset (defaults to first member),
- a 10-member case asserting transfer count ≤ N−1.

UI components are not unit-tested (covered by the existing manual TEST.md flow,
which will get a new "Settle up" section).

## Out of scope (future)

Multi-currency, persisted settlement history, "mark transfer as paid", and
optimal (vs. greedy) transfer minimization. Greedy min-cash-flow is near-optimal
and matches the product goal.
