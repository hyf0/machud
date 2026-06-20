# machud backlog

Ordered, independently-shippable units for autonomous work. Pull from the top.
Each item has acceptance criteria = its slice of Definition of Done (see
[autonomy.md](./autonomy.md)). Update status here in the same change.

Status: `TODO` · `WIP` · `DONE` · `BLOCKED (reason)`

## Now

_(none; pick from Next top-down.)_

## Next (unblocked, pick top-down)

- **B2 — Bluetooth panel** · `TODO`
  Connected-device battery levels (Stats parity). Source: `system_profiler
  SPBluetoothDataType` (unprivileged) or `ioreg`. Follow collector→panel pattern:
  `collectors/bluetooth.ts`, `BluetoothMetric` type, `panels/BluetoothPanel.vue`,
  wire into `collectAll`/`App.vue`. Acceptance: panel renders with real or empty
  state; verify.mjs gains a "Bluetooth renders" assertion + a range assertion;
  `pnpm verify` green. Verify the `system_profiler` output format on a real Mac
  first (D6).

- **B3 — Disk I/O history sparkline** · `TODO`
  Disk panel has R/W rates but no graph. Add rx/wx history rings in useMetrics and
  a sparkline, matching CPU/GPU/Net. Acceptance: graph renders; verify green.

- **B4 — Per-core mini-grid in CPU panel** · `TODO`
  Today cores are one braille row. Consider a compact P/E grid for richer detail
  without breaking the wide layout. Primarily visual → snapshot in worklog.

## Later / needs its own decision

- **B5 — sudo "enhanced mode"** · `TODO (opt-in only, per D2)`
  Optional `--enhanced` that shells `sudo powermetrics` to light up real fan RPM,
  die temps, per-cluster freq, GPU/ANE watts. MUST stay opt-in and off by default;
  default path never prompts. Acceptance: default run still sudo-free + verify
  green; enhanced fields fill only when the flag is set.

- **B6 — Standalone Clock module** · `TODO`
  Stats has a Clock module (multi-timezone). Low priority; clock already in header.

- **B7 — Responsive layout** · `BLOCKED (deferred by D4)`
  Wide-screen only is a deliberate decision. Reopen only with @hyf0.

## Done

- **B1 — Resolve Dark-mode vs D1** · `DONE`
  Decision: support light and dark palettes, selected automatically from macOS
  system appearance, with no user-facing theme switch/config. Acceptance covered
  by appearance assertions in `pnpm verify`.

- CPU (P/E), Memory, GPU, Disk, Network, Battery, Sensors panels.
- `--once` snapshot + `--json` snapshot modes.
- Alternate-screen takeover (D7).
- `pnpm verify` gate (scripts/verify.mjs).
