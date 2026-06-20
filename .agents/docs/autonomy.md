# machud autonomy charter

How an agent works on machud **hands-off**. Owner (@hyf0) chose: aggressive
latitude, minimal review, machine-checked gate. This file encodes that so work can
proceed without real-time supervision. Pair with [decisions.md](./decisions.md)
(the boundaries) and [backlog.md](./backlog.md) (the work).

## Latitude — AGGRESSIVE

Proceed autonomously on essentially everything: implement features, refactor, add
npm dependencies, and commit — without asking first. The owner reviews
asynchronously, not in the loop.

**Stop and ask ONLY when:**
- a change would cross a `[VOUCHED @hyf0]` decision in decisions.md (currently
  **D1** not-configurable, **D7** terminal takeover, **D9** Everforest visual identity,
  **D13** `npx machud` zero-install distribution, **D14** no accessibility layer, **D15** the two-tone
  `mac|hud` wordmark) — these are settled;
- an action is **outward-facing or irreversible**: `git push`, publishing,
  deleting the user's data, anything that leaves this machine/repo;
- the work genuinely can't proceed without a human ruling (a real fork in intent,
  not a guess you can make reversibly — see Open Questions).

Everything else: just do it. Local commits are authorized; push is not.

## Review — MINIMAL

Don't seek per-task sign-off. Build, self-verify, log, move on. The owner looks at
the end of a milestone or when unhappy. This makes the **verify gate the primary
safety net** — so it must stay honest and green.

## Development loop — TDD first

Behavior changes follow TDD:
1. Write or extend the failing verification first.
2. Run the focused command that should expose the failure (`pnpm verify`, or a
   narrower command when one exists) and confirm the red state when practical.
3. Implement the smallest change that makes the behavior pass.
4. Refactor only after the gate is green.
5. Record the changed test/verification surface in the worklog.

Because `vp test` is currently broken, `pnpm verify` is the primary harness. Extend
`scripts/verify.mjs` for new modules, metrics, parser invariants, render guarantees,
theme/appearance behavior, and terminal lifecycle behavior. For collectors, prefer
extracting parseable logic or adding structured assertions rather than relying only
on a happy-path frame render.

Exceptions are narrow: docs-only changes, mechanical rewrites with no behavior
change, and visual polish where no stable machine assertion is reasonable may skip
the red step. They still need explicit acceptance notes and the final gate.

## Definition of Done (every change)

A change is "done" only when ALL hold:
1. The relevant TDD/verification step was added or consciously marked not
   applicable under the exceptions above.
2. `pnpm verify` is **green** (build + data ranges + all panels + altscreen).
3. No new `—`/null for a metric that was previously live (no silent regression). **Exception:** a
   previously-live metric may be dropped only via a logged waiver recorded in decisions.md (e.g.
   **D12**, the LAN IP) and tagged `GATE WEAKENED` in the worklog — never silently.
4. Any affected PCR record (decisions / architecture / backlog) updated in the
   same change — a stale record is a trap.
5. The worklog (below) has an entry for what changed and why.

If you can't make verify green, the change is not done — fix it or revert it.
Never declare success without the gate passing (no "should work").

## The gate: `pnpm verify`

`scripts/verify.mjs` (pure node — independent of the broken `vp test`). It builds,
runs `--json` and asserts in-range values, runs `--once` and asserts every panel
renders without NaN/undefined, and drives a PTY to confirm the alternate-screen
takeover. **Extend it whenever you add a module or invariant** — a new panel must
get a "renders" assertion; a new metric must get a range assertion. The gate is
only as good as its coverage.

## Gate integrity & redesign rules (2026-06-20, from the adversarial review)

The verify gate is the ONLY safety net under minimal review, and it currently has holes. These
rules are non-negotiable for the RD-series redesign:

1. **Safety net first.** Do **not** optimize against the gate until the gate is honest. Land
   **RD0 → RD0b → RD0c** (range-null fix, fresh-build check, strengthen-only snapshot, visual
   no-overflow/alignment/color-fidelity assertions, fixture hooks) **before** any visual rewrite.
2. **Assertions are strengthen-only.** You may ADD checks freely. You must **STOP and ask** before
   deleting a check, loosening a range, or flipping a present-required value to nullable. Tag any
   deliberate loosening `GATE WEAKENED` in the worklog so it's an eyeball item, never a silent edit.
3. **Responsive must be render-tested.** verify.mjs must render at the wide and narrow breakpoints
   and assert: widest visible line ≤ COLUMNS, hero present at wide / absent at watch-face,
   alignment holds where bars render. The gate already controls width via `COLUMNS` →
   `renderToString({columns})` (main.ts); RD5 must make the responsive `v-if` read that same width
   (thread `columns` as a prop) — `useWindowSize()` is reactive in a TTY but the verify path has no
   TTY width, so the branch must read the gate-controlled width, not a live-only source. See D4.
4. **TARGET ≠ shipped.** `DESIGN.md` is mostly a TARGET; the code hasn't implemented it. A "panel
   renders" grep is NOT "matches DESIGN.md." Build toward the target via the staged backlog; never
   treat unbuilt DESIGN.md prose as a passing invariant.
5. **theme ↔ doc pin.** The DESIGN.md color tokens and `src/theme.ts` must stay identical, pinned
   by a verify assertion, so they can never silently diverge.

## Worklog & open questions (async review surface)

Because the owner reviews asynchronously, leave a trail:
- **Worklog:** append a dated bullet to `.agents/docs/worklog.md` per milestone —
  what changed, verify status, anything to eyeball.
- **Open questions:** when you hit an ambiguity, pick the **simplest reversible
  default**, ship it, and log it in [open-questions.md](./open-questions.md) for a
  later ruling. Don't block. The exception is a VOUCHED-anchor conflict (e.g. the
  live Dark-mode/D1 question) — that one must be ruled on before building, because
  the wrong default would violate a settled decision.

## Aesthetics caveat

Correctness is machine-checked; **beauty is not.** The agent can't self-judge
"有设计感." Under minimal review, make the most tasteful choice you can, capture an
`--once` snapshot in the worklog, and let the owner catch aesthetic issues at
milestone review. When a change is primarily visual and you're unsure, that's a
fair thing to flag in the worklog even if you ship it.
