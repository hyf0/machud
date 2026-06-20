# machud backlog

Ordered, independently-shippable units for autonomous work. Pull from the top.
Each item's acceptance = its slice of Definition of Done (see [autonomy.md](./autonomy.md)).
Update status here in the same change.

Status: `TODO` · `WIP` · `DONE` · `BLOCKED (reason)` · `DROPPED` · `DEFERRED`

> **The visual redesign (RD-series) is the current work**, in this order. It came out of the
> 2026-06-20 design session + adversarial review. **Safety net first:** RD0/RD0b/RD0c harden the
> gate *before* any visual rewrite, because the loop optimizes against the gate and the gate
> currently has holes. The redesign target is [`/DESIGN.md`](../../DESIGN.md) (mostly TARGET, not
> yet shipped). The old feature items (Bluetooth, disk sparkline, clock) are **deferred** so the
> loop doesn't build them against a stale visual contract.

## Now

_(pick RD0 — top of Redesign.)_

## Redesign (RD-series — do top-down; gate everything behind RD0–RD0c)

- **RD0 — Harden `verify.mjs` (the safety net)** · `DONE`
  Done: `inRange` split into strict (null/NaN → red, for present-required metrics) + `inRangeOrNull`
  (GPU util / battery health stay nullable); build now `rm`s the bundle first so a failed build can't
  pass on a stale artifact; assertion count pinned (`MIN_CHECKS=40`) so removing a check turns the gate
  red. `pnpm verify` PASS. Original hole description:
  Three confirmed holes: (a) `inRange(null)` returns `true` → a metric silently going `—` passes
  every range check; (b) the build check passes on a stale bundle even when the build FAILS;
  (c) no strengthen-only / non-null regression guard. Fix: present-required values FAIL on null
  (keep an `explicitlyNullable()` set for honest `—`); require a FRESH build (rm bundle first /
  assert mtime > start + the "built in" marker); snapshot currently-non-null metric keys and fail
  on any flip to null. **Also pin gate strength:** snapshot the assertion count (or a checksum of
  the assertion list) and fail if it drops — so a deleted/loosened check turns the gate RED, making
  the autonomy "strengthen-only" rule machine-enforced rather than prose. Acceptance: each hole has
  a test that was red before the fix; the count-pin fails when an assertion is removed; `pnpm verify` green.

- **RD0b — Visual-correctness assertions in `verify.mjs`** · `TODO`
  The gate has no visual teeth today. Add (strip-ANSI): widest visible line ≤ COLUMNS at
  COLUMNS ∈ {40,60,90,120} (this alone catches the existing wide layout overflowing ~72 at 60);
  per-panel equal bar start/end columns (alignment); **no `⚡` (or any double-width emoji) anywhere
  in the frame** — single grep on the rendered output;
  `FORCE_COLOR=1/2/3` still renders the solid-accent fallback (color fidelity). Acceptance: the
  current overflow at 60 is caught (red), then the wide layout is made to pass; verify green.

- **RD0c — Verify fixture / override hooks (mechanism only)** · `TODO`
  The gate runs on one host in one state, so it can never see on-battery / charging / high memory
  pressure / Intel / near-full disk. Build a documented **synthetic-input injection mechanism**
  (generalize the existing `MACHUD_TEST_APPEARANCE` precedent). Acceptance (self-contained — does
  NOT depend on RD2): the mechanism exists and is exercised by ≥1 assertion that injects a value
  into a **currently-shipping** metric and asserts the frame reflects it; verify green. (The
  battery-sign / pressure-1·2·4 / Intel-single-cluster / 96%-disk-`FULL` fixtures live in **RD2/RD3**,
  where those fields exist — not here.)

- **RD0d — Real `npx` gate: pack → install → exec** · `TODO`
  (From the Task-2 review.) verify's packaging section inspects the local checkout, not the published
  artifact, so an install-time crash (e.g. the engines floor) could sail through green. Add: `npm pack`
  to a temp dir, `npm install <tgz>` into a throwaway project, run `node_modules/.bin/machud --once`,
  assert exit 0 + a panel title. Also assert `dist/machud.mjs` is in the `npm pack` file list (proves
  `prepack` builds on a clean tree). Acceptance: the gate actually exercises shebang byte-0 + the +x
  bit + dependency resolution; verify green. (Heavier/slower — keep it the last verify section.)

- **RD1 — Reconcile DESIGN.md with code (theme + doc)** · `TODO`
  Rewrite `src/theme.ts` to the Everforest tokens in DESIGN.md (dark/light), and **pin the hex in
  verify.mjs** (`theme.dark.accent === '#a7c080'`, `bg === '#2d353b'`, …) so doc and code can't
  desync. D4 is already reopened in decisions. Acceptance: theme matches DESIGN.md tokens; pin
  assertions added; `pnpm verify` green; `--once` shows the Everforest palette (eyeball in worklog).

- **RD2 — Data-honesty collectors** · `TODO`
  Make the headline metrics true (D6, using RD0c's injection mechanism): real `sysctl
  kern.memorystatus_vm_pressure_level` (1→Normal/2→Elevated/4→High) in `memory.ts`;
  `adapterWatts`/`chargeWatts` in `battery.ts` + `BatteryMetric` fields — `watts = V(mV)·A(mA)/1e6`,
  and **reinterpret the unsigned 64-bit `Amperage` as signed (`a = raw>=2**63 ? raw-2**64 : raw`)
  before the sign test** (`battery.ts`'s `(-?\d+)` parse is wrong on a discharging Mac); show
  adapter watts only when `ExternalConnected` else `—`, and "charged" when `|a|≈0`. Apple-Silicon/
  Intel P/E branch in `cpu.ts` (no `0P+0E`). Drop the LAN IP in `network.ts` per D12.
  **Provenance acceptance (not just shape — the gate must distinguish TARGET from shipped):** inject
  pressure level 4 → assert `High` (un-derivable from the old usedPct heuristic); inject the
  unsigned-wraparound `18446744073709551179` → assert chargeWatts ≈ −5.5 W (not +5.5e12); assert
  `m.net` no longer carries an `ip` field. verify green.

- **RD3 — Everforest visual components** · `TODO`
  One at a time, each gated: `BigNumber` (5-row block), `Meter` (gradient + `levelColor` ramp),
  braille area `Graph`, status `○/◐/●` glyphs (the color-blind fix), DiskPanel near-full
  text+ramp, **replace ALL `⚡` with `⇡/⇣` (`BatteryPanel.vue:15` AND `HeaderBar.vue:30`)**, and the
  **D11 chalk-level fallback** (256→solid accent). Acceptance: RD0b's "no `⚡` anywhere in the frame"
  assertion passes; RD0b assertions stay green at all FORCE_COLOR levels; snapshot each in the worklog.

- **RD4 — 3-tier layout (wide only)** · `TODO`
  tier-1 hero CPU + Memory; tier-2 Network (lead) + GPU + Battery; tier-3 status strip
  (Disk/Sensors/uptime/load). Must pass RD0b alignment + no-overflow at COLUMNS=120. Acceptance:
  hierarchy matches DESIGN.md; verify green; snapshot in worklog.

- **RD5 — Responsive (2-tier), LAST** · `TODO (D4 reopened)`
  Thread the gate-controlled width (`COLUMNS` → `renderToString({columns})`, already in main.ts) as
  a prop so the responsive `v-if` branches on the SAME width verify drives (not a TTY-only source —
  `useWindowSize` is reactive but the verify path has no TTY width). Then a wide-default + one
  narrow/watch-face fallback, single breakpoint. Acceptance: RD0b asserts hero present at
  COLUMNS=120 and absent at 40 (seam proven), no overflow at any tested width; verify green. NOT a
  5-breakpoint ladder.

## Deferred (orthogonal feature work — only after the redesign)

- **B2 — Bluetooth panel** · `DEFERRED` — Stats-parity module; build after RD-series so it lands
  on the new visual contract, not the old one. (`system_profiler SPBluetoothDataType`, follow
  collector→panel pattern; verify on a real Mac per D6.)
- **B3 — Disk I/O history sparkline** · `DEFERRED` — Disk is demoted to the tier-3 strip (D9/DESIGN.md);
  reassess whether a sparkline still fits before building.
- **B6 — Standalone Clock module** · `DEFERRED` — low priority; clock already in header.

## Dropped

- **B5 — sudo "enhanced mode"** · `DROPPED (owner ruling 2026-06-20, per strengthened D2)`
  Killed. sudo risk (breaks zero-config, privileged-helper fragility, trust red flag, worst
  surface for hands-off AI dev) is not worth the extra data. powermetrics-only metrics (die temps,
  fan RPM, per-cluster freq, GPU/ANE watts, total system power) stay `—` forever.

- **B4 — Per-core mini-grid** · folded into the redesign (RD2 data + RD4 render).
- **B7 — Responsive** · superseded by **RD5** (D4 reopened).

## Done

- **B1 — Resolve Dark-mode vs D1** · `DONE` — light/dark follow macOS appearance, no switch (D8).
- CPU (P/E), Memory, GPU, Disk, Network, Battery, Sensors panels (the pre-redesign versions).
- `--once` + `--json` snapshot modes · alternate-screen takeover (D7) · `pnpm verify` gate.
- **Design session 2026-06-20:** DESIGN.md anchor written; no-sudo (D2/B5); CONTRIBUTING (D10);
  3-tier layout + responsive reopened (D4); color-tier (D11); no-IP waiver (D12); adversarial review.
