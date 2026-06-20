# Autonomous development plan

This is the handoff plan for letting agents develop machud without the owner
watching every step. It turns product intent into a repeatable operating loop.

Pair with:
- [decisions.md](./decisions.md) for boundaries that must not drift.
- [autonomy.md](./autonomy.md) for authority, stop conditions, and TDD rules.
- [backlog.md](./backlog.md) for the ordered work queue.
- [worklog.md](./worklog.md) for async review notes.

## What the owner needs to do

The owner should not review every implementation step. The owner only needs to
settle durable product/process questions and occasionally review milestones.

Use this checklist:

1. **Vouch the true product anchors.**
   In [decisions.md](./decisions.md), add `[VOUCHED @hyf0]` only to decisions that
   are truly settled. Agents must stop before crossing vouched decisions.

2. **Keep the backlog ordered.**
   The top unblocked item in [backlog.md](./backlog.md) is what the agent should
   pick next. Reorder the list when priority changes.

3. **Resolve only blocking questions.**
   Review [open-questions.md](./open-questions.md) when it has `BLOCKED` items.
   Non-blocking questions should not interrupt development.

4. **Review milestones asynchronously.**
   Read [worklog.md](./worklog.md) after a milestone. Focus on "To eyeball" notes,
   visual taste, and whether any shipped default should be changed.

5. **Give explicit approval for outward-facing actions.**
   Agents may work locally, but must not push, publish, delete user data, or make
   irreversible external changes without explicit owner approval.

## Agent operating loop

For each autonomous development cycle:

1. Read [decisions.md](./decisions.md), [autonomy.md](./autonomy.md), and the
   relevant architecture/PCR record.
2. Pick the top unblocked item from [backlog.md](./backlog.md).
3. Apply TDD:
   - add or extend a failing verification first;
   - run the narrowest practical check and confirm red when practical;
   - implement the smallest passing change;
   - refactor only after green.
4. Run `pnpm verify`.
5. Update affected PCR files in the same change.
6. Append a worklog entry with:
   - what changed;
   - verification status;
   - any visual/UX detail the owner should eyeball;
   - any open question created or resolved.
7. Continue to the next backlog item unless blocked by a stop condition.

## Stop conditions

Stop and ask the owner only when:

- a change would cross a `[VOUCHED @hyf0]` decision;
- the action is outward-facing or irreversible;
- the task has a real product fork where a reversible default would be dishonest;
- the verification gate cannot be made green without changing the intended scope.

Do not stop for ordinary implementation choices. Choose the smallest reversible
default, record it if it matters, and keep moving.

## Current execution plan

**The single source of work order is [backlog.md](./backlog.md) — pull from the top.** Do NOT
duplicate the list here (a pointer can't desync; a copied list can — and did).

As of the 2026-06-20 redesign the order is staged **`RD0 → RD0b → RD0c → RD1 → RD2 → RD3 → RD4
→ RD5`** — **safety-net first**: harden `verify.mjs` (RD0–RD0c) before any visual rewrite.
**B2 (Bluetooth), B3 (disk sparkline), B6 (clock) are DEFERRED, and B4 (per-core) is folded into
RD2+RD4**, until after the redesign. Do NOT start Bluetooth or any feature module against the old
visual contract — that is exactly the stale-contract trap this plan exists to prevent.

## Decisions still worth tightening

These are not current blockers, but they are good owner review targets:

- **Dependency policy:** default is "allowed when it materially reduces risk or
  complexity; avoid dependencies for simple parsing or formatting."
- **Milestone size:** default is "one backlog item per milestone, unless two items
  are tightly coupled."
- **Visual review bar:** default is "ship tasteful choices after verification, but
  flag visual changes in the worklog for async owner review."
- **Local commits:** autonomy currently allows local commits, but this workspace
  may not always be a Git repo. Agents should not assume Git is available.

## Success condition

The owner should be able to say "continue" and expect the agent to:

- choose the next unblocked backlog item;
- write verification first;
- implement without supervision;
- keep PCR current;
- leave a concise worklog trail;
- stop only for the explicit stop conditions above.
