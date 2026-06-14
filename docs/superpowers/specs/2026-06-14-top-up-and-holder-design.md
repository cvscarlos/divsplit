# Top-up & top-holder — design

> Status: draft for review (2026-06-14). Replaces the static `prepaid` number and
> the "banker" with a **top-up** transaction and a **top-holder**. Builds on the
> already-shipped model where settle-ups are `type: 'transfer'` transactions.

## Optionality

Top-up is **optional**. The app fully supports the simple flow — pay transactions
as you go and settle the leftover at the end, with no top-ups at all. Top-up is a
**special feature** for groups whose organiser needs to collect money up front
before committing (e.g. booking the lake-house). When no one tops up, settlement
is plain fewest-transfers among members (see §Settlement).

## Concepts

- **Top-up** — a member adds money to the shared pot, **any time** (generalises
  "prepaid", which was top-up-at-creation only). It credits **only that member's**
  balance (`+`), like topping up your own bank account. It is its own transaction
  kind (`type: 'topup'`): `paidBy = { [member]: amount }`, `paidFor = {}` — money
  in, no consumption.
- **Top-holder** — the member who physically holds the pooled top-up cash
  (`config.holderId`, normally the organiser; defaults to the first member). A
  **holder, not an owner**: holding the pot does **not** change their own balance.

## Balances

```
balance(m) = Σ paidBy(m) − Σ paidFor(m)        // over expenses + transfers + top-ups
```

- Top-up → `+`. Out-of-pocket payment (`paidBy` on an expense, e.g. John's cash
  street-food) → `+`. Your share of expenses (`paidFor`) → `−`.
- **positive = you get money back; negative = you owe.** No member is shown
  "owing the pot" just for being the holder.
- Per member the balance screen also shows **deposited** (Σ their top-ups) so the
  holder can see how much each person put in.

## Settlement (holder-hub)

The top-holder holds `Σ top-ups` in cash. For the transfer computation only, the
holder's position is offset by `−Σ top-ups` (they owe the pot back). This makes
balances sum to zero, and the existing greedy **min-cash-flow** then routes money
correctly: members who owe pay the holder, and the holder refunds members who are
owed (unused top-ups **+** any out-of-pocket they fronted).

- With top-ups present, this naturally makes the **holder the hub** — each other
  member makes ~one transfer, the holder makes several (the real-life flow:
  "organiser refunds everyone their unused money").
- With **no** top-ups (`Σ = 0`, e.g. a plain restaurant bill), the offset is zero,
  the holder isn't special, and it degrades to ordinary **fewest-transfers** among
  members. One algorithm covers both.

**Display rule:** the **Balances** panel shows each member's *own* balance (holder
**not** offset, so never shown "owing the pot") + a "Holder · holds $X" note on the
holder. The **Transfers** panel shows the actual suggested payments (computed with
the offset), which is where the holder appears refunding/collecting. The two
intentionally differ for the holder, because they're distributing pooled money,
not their own.

## UI changes

- **Config:** remove the per-member **Prepaid** input and the **Banker** dropdown.
  Add a **Top-holder** dropdown (relabelled `holderId`).
- **Top-up entry:** a simple screen/dialog (member + amount + optional note of who
  they handed cash to) that appends a `type: 'topup'` transaction. Reachable from
  the group (e.g. a "Top up" button on Settle up / Transactions).
- **Settle up:** balances show "deposited / net"; the holder is badged; transfers
  and the existing **Mark paid** + **Recorded payments** stay.
- Top-ups (like transfers) are **filtered out of the expenses list**; they show in
  Activity (`TOPUP_RECORDED`).

## Data / migration

- Add `'topup'` to `TransactionType`. Add `config.holderId` (replaces `bankerId`).
- **Remove `member.prepaid`.** Pre-production, so existing groups carrying
  `prepaid` are migrated on load: for each member with `prepaid > 0`, synthesise a
  `topup` transaction crediting them (held by the holder), then drop the field.

## Testing

- Unit (TDD): top-up credits only the topper; holder-hub settlement (members ↔
  holder); no-top-up groups fall back to fewest-transfers; out-of-pocket payer
  (John) is refunded by the holder; "deposited" totals.
- Live Chrome MCP QA: add top-ups, see balances + holder, run settle up, mark paid.

## Out of scope

Partial top-up withdrawals, multi-holder, multi-currency, editing a top-up
(delete + re-add).
