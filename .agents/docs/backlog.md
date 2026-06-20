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

- **RD0b — Visual-correctness harness in `verify.mjs`** · `DONE`
  Done: strip-ANSI + widest-line measurement + the assertion that holds on current code — **no
  overflow at the wide target (widest visible line ≤ 120)**; `pnpm verify` PASS. The other visual
  assertions are TDD-**coupled** to their rewrites and land WITH them, not before (you can't assert
  "no `⚡`" before RD3 removes it, or "bars aligned" before RD4 builds them): **no-`⚡` + FORCE_COLOR
  fallback → RD3; per-panel bar alignment → RD4; no-overflow at narrow widths (40/60) → RD5.**

- **RD0c — Verify fixture / override hooks (mechanism only)** · `DONE`
  Done: `collectAll()` now applies `MACHUD_TEST_OVERRIDE` (a JSON env, deep-merged into the snapshot,
  product path unaffected when unset) — a sibling of `MACHUD_TEST_APPEARANCE`. verify exercises it:
  inject `memory.pressure="High"` → asserts it surfaces. `pnpm verify` PASS (45). RD2 uses this for the
  battery-sign / pressure / Intel / near-full-disk fixtures. (Note: metric-level override proves the
  gate can inject a STATE; to prove a collector reads the *real* sysctl, RD2 adds a collector-level
  test hook where that provenance matters.)
  The gate runs on one host in one state, so it can never see on-battery / charging / high memory
  pressure / Intel / near-full disk. Build a documented **synthetic-input injection mechanism**
  (generalize the existing `MACHUD_TEST_APPEARANCE` precedent). Acceptance (self-contained — does
  NOT depend on RD2): the mechanism exists and is exercised by ≥1 assertion that injects a value
  into a **currently-shipping** metric and asserts the frame reflects it; verify green. (The
  battery-sign / pressure-1·2·4 / Intel-single-cluster / 96%-disk-`FULL` fixtures live in **RD2/RD3**,
  where those fields exist — not here.)

- **RD0d — Real `npx` gate: pack → install → exec** · `DONE`
  Done: verify §9 packs the way a pnpm project publishes (`pnpm pack` — resolves `catalog:` + runs
  `prepack`) on a **clean tree** (`rm`s the bundle first), installs the tarball into a throwaway
  project the way `npx` does (`npm install <tgz>`), and execs the **installed** `.bin/machud --once`,
  asserting (1) the tarball carries `dist/machud.mjs`, (2) the bin links, (3) exit 0 + `CPU` renders.
  `MIN_CHECKS` 58→61. **TDD red:** a no-op `prepack` → binless tarball turned all 3 RD0d checks RED
  while the static §6 stayed GREEN (proves the real-artifact coverage §6 can't give); restored →
  `pnpm verify` PASS (61). Finding: chalk is a *transitive* dep of `@vue-tui/runtime` (npm hoists it
  in the consumer) and pnpm's strict symlinks break *local* resolution if you drop a direct dep — so
  the binless-tarball break, not a missing-dep break, is the honest red. Heaviest section (2 builds +
  a real install; needs network on a cold npm cache) → kept last.
  (From the Task-2 review.) verify's packaging section inspects the local checkout, not the published
  artifact, so an install-time crash (e.g. the engines floor) could sail through green. Add: `npm pack`
  to a temp dir, `npm install <tgz>` into a throwaway project, run `node_modules/.bin/machud --once`,
  assert exit 0 + a panel title. Also assert `dist/machud.mjs` is in the `npm pack` file list (proves
  `prepack` builds on a clean tree). Acceptance: the gate actually exercises shebang byte-0 + the +x
  bit + dependency resolution; verify green. (Heavier/slower — keep it the last verify section.)

- **RD1 — Reconcile DESIGN.md with code (theme + doc)** · `DONE`
  Done: `src/theme.ts` rewritten to the Everforest tokens (dark + light) from DESIGN.md, with
  `bgLift` + `accent` added; verify.mjs now pins the dark tokens (`#2d353b`, `#a7c080` must appear in
  BOTH DESIGN.md and theme.ts) and asserts no Tokyo-Night leftovers. `pnpm verify` PASS (44).
  Eyeball: `node dist/machud.mjs` (live) or `FORCE_COLOR=3 node dist/machud.mjs --once`.
  Rewrite `src/theme.ts` to the Everforest tokens in DESIGN.md (dark/light), and **pin the hex in
  verify.mjs** (`theme.dark.accent === '#a7c080'`, `bg === '#2d353b'`, …) so doc and code can't
  desync. D4 is already reopened in decisions. Acceptance: theme matches DESIGN.md tokens; pin
  assertions added; `pnpm verify` green; `--once` shows the Everforest palette (eyeball in worklog).

- **RD2 — Data-honesty collectors** · `DONE`
  Done: memory.ts reads the real `kern.memorystatus_vm_pressure_level`; battery.ts adds
  `adapterWatts` + `chargeWatts` with signed-64 Amperage reinterpret; cpu.ts models a single cluster
  on Intel (no `0P+0E`); network.ts drops the LAN IP (D12). Each has a collector-level test hook
  (`MACHUD_TEST_PRESSURE_LEVEL` / `MACHUD_TEST_AMPERAGE` / `MACHUD_TEST_NO_PERFLEVEL`) + a verify
  provenance assertion. `pnpm verify` PASS (51).
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

- **RD3 — Everforest visual components** · `DONE` (layout-coupled parts → RD4)
  Done: gradient `Meter` (same-hue ramp on truecolor) + **D11 colour-tier fallback** (256→solid
  accent); status `○/◐/●` glyphs (color-blind, on memory + thermal); DiskPanel earned near-full
  text+ramp (amber ≥85% / red ≥95%); replaced ALL `⚡` with `⇡` (BatteryPanel + HeaderBar). verify:
  no-`⚡` in frame, `●` on High pressure, `FULL` on 96% disk, truecolor-vs-256 fidelity. `pnpm verify`
  PASS (58). **Moved to RD4** (layout-coupled — they need the tall hero panels): `BigNumber` (5-row
  block hero number) and the braille area `Graph` (the flowing history chart needs panel height).

- **RD4 — 3-tier layout + hero visuals + DENSITY/STABILITY (wide only)** · `DONE`
  Done (pt1–pt9): braille `Graph` + `BigNumber` hero + per-core load `CoreGrid` + CPU/MEM top-process
  lists + MEM hero + **3-tier layout** (Net-lead tier-2 / Disk+Sensors tier-3) + battery power-row
  **stability** + GPU history graph + **hue confinement** (green-forward bodies; module hue only on
  title/border/hero). Owner feedback addressed inline (CPU "big box, little content" density; mac|hud
  wordmark VOUCHED → D15). `pnpm verify` PASS (67). Minor follow-ups logged: fixed-height proc lists,
  Disk R/W text hue, tier-3 one-line compaction.
  3-tier: tier-1 hero CPU + Memory; tier-2 Network (lead) + GPU + Battery; tier-3 status strip
  (Disk/Sensors/uptime/load). Build the `BigNumber` (5-row hero number) + the tall **braille area
  Graph** components here. **Owner feedback 2026-06-20 — make it interesting, not boring:**
  - **Density (Principle 8):** every hero/large panel earns its space with real dynamic data — CPU =
    BigNumber + tall history graph + **per-core grid (12 cores, P/E grouped, coloured by load)** +
    cluster avgs + top process; MEM = breakdown bar (wired/compressed/app/cache) + history + top
    procs; GPU = + history graph; DISK = + R/W I/O history. No big box with three numbers.
  - **Stability (Principle 8):** fixed row structure — optional values (BATTERY `power`, time
    remaining, dropped processes) render `—`/`on AC` in place, NEVER appear/disappear; numeric
    columns right-align to a fixed width. A data change must not reflow a panel's height or shift a
    column. (Fixes the "row suddenly grows taller" jump.)
  - **Alignment/spacing:** consistent bar→value gaps, fixed label columns, even vertical rhythm.
  - **Hue confinement:** per-module hue on title/border/hero number only; panel bodies neutral grey
    + green (greenforward).
  Must pass RD0b alignment + no-overflow at COLUMNS=120; verify green; snapshot in worklog.

- **RD5 — Responsive (2-tier), LAST** · `DONE`
  Done: width seam threaded — `COLUMNS` → `renderToString({columns})` → `App` `columns` prop → the
  responsive `width` (no longer a TTY-only source), so the gate controls the breakpoint. Wide 3-tier
  at width ≥ 100; narrow single-column watch-face below it (`NarrowView` — one compact line per module,
  no hero BigNumber/graphs); `HeaderBar` + footer compact when narrow. verify asserts hero present@120
  / absent@40 + no-overflow@40 (the seam is proven). `MIN_CHECKS` 67→69, `pnpm verify` PASS. Single
  breakpoint (D4), not a 5-breakpoint ladder.
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
