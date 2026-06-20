# machud worklog

Async review trail. One dated bullet per milestone: what changed, verify status,
anything to eyeball. Newest first.

## 2026-06-20

- **Autonomous development plan added.** Added
  `autonomous-development-plan.md` as the owner/agent handoff file: what the owner
  needs to decide, the agent operating loop, stop conditions, current execution
  order, and non-blocking decisions worth tightening later. Linked it from
  `AGENTS.md`. **Verify: PASS (38 assertions).**

- **TDD-first autonomy rule.** Captured the owner's process preference that
  autonomous work should follow TDD: add or extend failing verification first,
  implement the smallest passing change, then refactor. Because `vp test` is
  upstream-broken, `pnpm verify` / `scripts/verify.mjs` is the primary harness for
  now. Updated `AGENTS.md` and autonomy charter. **Verify: PASS (38 assertions).**

- **System-following light/dark appearance.** Resolved the dark-mode/D1 ambiguity:
  machud now supports both light and dark palettes, selected automatically from
  macOS system appearance (`defaults read -g AppleInterfaceStyle`) with no
  user-facing switch/config. Added `appearance` to the metrics snapshot, made the
  theme reactive, added an internal verify-only override for both palettes, and
  fixed the Sensors thermal color to update reactively. Updated architecture,
  decisions, backlog, and open questions. **Verify: PASS (38 assertions).** To
  eyeball: light palette contrast in a real light terminal.

- **Autonomy framework set up.** Added the machine-checked gate `pnpm verify`
  (`scripts/verify.mjs`, pure node — independent of the broken `vp test`): builds,
  asserts `--json` value ranges, asserts every panel renders in `--once`, and
  drives a PTY to confirm the D7 alternate-screen takeover. Added a `--json`
  snapshot mode to `main.ts`. Wrote charter (autonomy.md), backlog.md,
  open-questions.md. **Verify: PASS (29 assertions).** To eyeball: nothing visual
  changed this milestone.

- **Initial build.** machud first complete version — 7 panels (CPU P/E, Memory,
  GPU, Disk, Network, Battery, Sensors) on a wide-screen dashboard, zero-sudo
  collectors, alternate-screen takeover. **Verify: PASS.**
