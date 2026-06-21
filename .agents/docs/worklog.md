# machud worklog

Async review trail. One dated bullet per milestone: what changed, verify status,
anything to eyeball. Newest first.

## 2026-06-21

- **Expanded the D17 test layer to full coverage (branch `main`).** Added pure-function unit tests —
  format (`humanBytes` incl. the 1024-rollover, `pct`/`temp`/`clamp`/`padEnd`), sparkline/`brailleArea`/
  `barCells` edge cases (empty, width 0, overshoot, NaN, max 0), `bigDigits`, and color (`mix`/`ramp`
  endpoints + the n=1 guard) — plus component tests for MemoryPanel / NetworkPanel / HeaderBar (the
  wide↔narrow branch) and CoreGrid (E/P grouping vs the single-cluster fallback). 7 → **30 tests** across
  7 files; `vp test` 30/30, `pnpm verify` **PASS (90)**. Coverage: all 9 panels/views + CoreGrid + every
  pure lib (format/sparkline/bignum/color). The thin `.vue` wrappers (BigNumber/Bar/Graph/Sparkline) ride
  on the unit-tested pure libs and the panel renders, so direct tests would be redundant — layer complete.

- **Borrowed vue-tui's verification layer — `vp test` re-enabled + component render tests (D17; branch `main`).**
  Owner: study how vue-tui adds its test layer and adopt it. Shipped:
  - **Un-broke `vp test`.** Root cause: the pnpm catalog used `@latest`, resolving vite-plus-core/CLI
    **0.2.1** against vite-plus-test **0.1.24** (no 0.2.x exists) → the test bin can't load. Pinned the
    whole vite-plus toolchain to the matched **0.1.24** line in `pnpm-workspace.yaml` (vue-tui's
    structural anti-skew). `vp build` + the npx artifact still green on this line.
  - **Component tests** (`tests/panels.test.ts`, 7): render CPU/GPU/Disk/Battery/Sensors/NarrowView via
    the runtime's `renderToString` (matched 0.1.0 — `@vue-tui/testing@0.0.3` is hard-pinned to runtime
    0.0.3, so its `render()` is version-mismatched here) and assert title / headline value / degrade-to-`—`
    / narrow content.
  - **Config:** `vite.config.ts` `test` block (`defineConfig` from `vite-plus`): `FORCE_COLOR:"3"`,
    `CI:"false"`, `environment:"happy-dom"` (flips Vitest to the client transform so `@vitejs/plugin-vue`
    stops SSR-compiling SFCs — `renderToString` needs the client render fn). Added `happy-dom` devDep.
  - **Enforced + documented:** `scripts/verify.mjs` runs `vp test` as its first step (`MIN_CHECKS` 89→90);
    AGENTS/architecture/autonomy/decisions updated + new **D17**. `pnpm verify` **PASS (90)**, `vp test` **7/7**.

- **Adversarial-review defect pass #3 — converged (branch `main`).** Final sweep of the surface the
  first two passes didn't deeply cover: build/packaging config (`package.json`/`tsconfig`/`vite.config`),
  `main.ts` entry branches, **process lifecycle / terminal safety**, and **render at boundary/extreme
  widths**. **No real in-scope defects found.** Verified CLEAN with evidence: no devDependency leaks in
  the bundle (only `vue`/`chalk`/`@vue-tui/runtime` + node builtins are externalized → `npx` can't crash
  on a missing dep); **SIGINT/SIGTERM/SIGHUP all restore the alt screen** (`1049l` + cursor) via
  @vue-tui/runtime's signal-exit teardown (terminal never left corrupted); SIGWINCH doesn't crash;
  non-TTY degrades to one frame; **no render overflow at any COLUMNS 10→120** (wide fits exactly at the
  100 breakpoint, narrow handles the rest); `tsc --noEmit` clean. No code change → gate stays green (89).
  **Deferred for owner ruling (open-questions Q4/Q5):** unknown-flag/`--help` UX (product call) and the
  repo-wide oxfmt drift (26 files — aesthetic call). Truly-latent, left as-is: panel-title clip (only
  with synthetic 40–70-char model/iface names) and `clamp(NaN)` (unreachable — JSON can't carry NaN and
  collectors clamp first). **Three adversarial passes done; the well is dry on real in-scope defects → loop stopped.**

- **Adversarial-review defect pass #2 (branch `main`).** Two more reviewers (components / gate-coverage
  + borderline re-exam) + `vp check`; each finding re-verified before fixing. **Defects fixed (TDD):**
  - **battery `finishing charge` mislabeled (B1).** `\bcharging\b` matches the word "charging", not
    pmset's end-of-charge state "finishing charge" → the panel showed "not charging / on AC" while
    power flowed IN. Now `(/\bcharging\b/ || /finishing charge/) && !discharging/not-charging`; "charged"
    (full) still false. New `MACHUD_TEST_BATT_STATE` hook drives it.
  - **CpuPanel crash on empty loadAvg.** `cpu.loadAvg[0].toFixed(2)` — the lone unguarded array index;
    `loadAvg:[]` took the WHOLE UI down (violates "never crash, just degrade"). Now `(…[0] ?? 0)`.
    Latent today (`os.loadavg()`/empty.ts always give 3) but the invariant is now enforced + gated.
  - **humanBytes printed "1024 KB".** Rounding pushed values to "1024 <unit>" (= 1 of the next unit)
    instead of rolling up. Now promotes to "1.0 MB" etc.
  - **adapter Watts read the wrong dict.** `/"Watts"=/` matched `AppleRawAdapterDetails` (appears first
    in ioreg), not `AdapterDetails` — correct only by value-equality luck; comment claimed otherwise.
    Anchored to `"AdapterDetails"…"Watts"` (still reads 140 W here) + honest comment.
  - **Gate-coverage holes closed (false-green risks the audit found):** GPU/DISK/BATTERY/NET/SENSORS
    headline values were asserted only in `--json`/by title → now asserted in the rendered FRAME via
    injection; the narrow view was width-only → now asserts labeled content (`CPU 44%`/`BAT 71%` @40);
    the footer hint (`q quit · t theme`) is now pinned.
  - **Noted, not fixed:** `vp check` reports formatting drift in 26 files (repo was never oxfmt'd) —
    left untouched; a repo-wide reformat is an owner aesthetic call, not a defect, and would bury diffs.
  - `MIN_CHECKS` 82→89, `pnpm verify` **PASS (89)**.

- **Adversarial-review defect pass (branch `main`).** Ran three independent reviewers (collectors /
  render-lifecycle / docs-vs-code), each required to prove findings with `file:line` + a repro; then
  re-verified every finding myself before fixing. **Code defects fixed (TDD):**
  - **network.ts — wrong byte columns on address-less default routes.** `netstat -ibn` Link rows have
    **10** fields for VPN/`utun*`/`lo0` (no MAC/Address column) vs **11** for `en0`; the hard-coded
    `p[6]`/`p[9]` read Opkts as RX and Coll (always 0) as TX whenever the default route is a tunnel.
    Fixed by indexing from the RIGHT (Ibytes `p[len-5]`, Obytes `p[len-2]`). Added `MACHUD_TEST_NET_IFACE`
    + `MACHUD_TEST_NETSTAT` hooks; gate injects a 10-field utun row (→ 22492/19073, not 33/0) + an 11-field
    en0 regression row.
  - **network.ts — bogus rate spike on default-route change.** `prev` wasn't keyed by interface, so a
    Wi-Fi↔Ethernet/VPN switch diffed a new iface's large lifetime counters against the old baseline →
    one ~GB/s spike that also poisoned the sparkline ring. Now keyed by `iface` (rate 0 on change).
  - **cpu.ts — frozen P/E split after a transient sysctl failure.** `clusterCounts()` cached on the
    first call; a single startup `sysctl` miss froze the Intel fallback (all-P, eCount=0) for the whole
    process. Now caches ONLY a real perflevel reading; the no-split fallback is returned uncached so a
    later poll recovers. (Recovery is cross-poll → not gately; existing `NO_PERFLEVEL` test stays green.)
  - **Startup light-theme flash on dark Macs.** The theme reactive + `emptyMetrics` both default to
    light, so the live app painted ~9 light frames before the first poll resolved appearance (`--once`
    has no flash — it paints a resolved snapshot). Added `detectAppearanceSync()` (sync `defaults read`,
    test-hook-aware, light fallback); `App.vue` seeds the initial appearance with it (live path only).
    Gate: a flash-proof PTY check (system=dark → **zero** light-title frames).
  - **Doc reconciliation (separate commit):** corrected claims contradicted by the code — CONTRIBUTING's
    "no theme switcher" (→ D16), DESIGN/decisions "still Tokyo Night" (RD1 shipped Everforest, gate-pinned),
    and the sudo-only "render as `—`" claims (per D2 they're **omitted**, not dead `—` rows) across
    README / AGENTS / DESIGN / architecture.
  - `MIN_CHECKS` 79→82, `pnpm verify` **PASS (82)**.

- **Manual theme toggle — `t` cycles auto→light→dark (D16, VOUCHED; branch `main`).** Owner asked for
  one in-app theme control and vouched the design: default stays `auto` (follow macOS, D8); `t` cycles
  **auto→light→dark→auto**; the override is **ephemeral** (no file, no flag — every launch starts at
  `auto`), so D1's zero-config promise still holds. New decision **D16** — it reopens D8's "no in-app
  switch" clause (allowed by the provenance rule, owner's say-so). Corrected the now-false "no theme
  switcher" claim across README / AGENTS(CLAUDE) / DESIGN / architecture / backlog. **Impl:** pure
  cyclic `nextThemeMode()` in `theme.ts`; `themeOverride` ref in `App.vue` resolves `auto`→live system
  reading, else forces the palette; footer hint `t theme`. **TDD:** wrote 6 failing assertions first
  (5 deterministic via a new `MACHUD_TEST_THEME_PRESSES` seam that replays the real cycle through
  `--once`, using panel-title colour as the light/dark discriminator; 1 flash-proof live PTY keystroke),
  watched them RED, then implemented to GREEN. `MIN_CHECKS` 73→79, `pnpm verify` PASS (79).

- **Dropped the disk I/O sparkline (B3 reverted; branch `main`).** Owner: a sparkline that auto-scales
  (steady I/O → all-full █, looks maxed) and floats when history is sparse is misleading — and the exact
  R/W numbers already convey I/O. Fully reverted B3: removed the `io` row, the `dio` history ring
  (useMetrics + App), the `:history` prop, and the io-sparkline assertion. **GATE WEAKENED (sanctioned):**
  `MIN_CHECKS` 74→73 — the io-sparkline check removed *with its feature*, per owner ruling. `pnpm verify`
  PASS (73). DISK panel is now `%` / bar / `R W` / total — clean.

- **DISK %-full bug + drop dead fan row (branch `main`).** Owner caught both. (1) **DISK usedPct was
  wrong** — it used df's "Used" column, which on APFS counts only the `/` volume (~4%), not the shared
  container; an ~80%-full disk read **4%** (and "16.6 GB used / 70 GB free" was self-contradictory).
  Fixed: `used = total − free` (df Available), so usedPct matches Finder (~83% here). Verify now pins
  `usedPct == (total−free)/total` (±1.5). (2) **SENSORS `fan` row dropped** — fan RPM is *permanently*
  sudo-only (D2), so a forever-`— sudo` row is noise; omitted it. Verify now asserts **no `sudo`
  anywhere in the frame** (also guards the trimmed footer). Refined **D2** (owner): permanently
  sudo-only metrics are omitted, not shown as dead `—` rows. `MIN_CHECKS` 72→74, `pnpm verify` PASS.

- **Footer trimmed (branch `main`).** Owner: the `zero-sudo · machud` tail in the bottom bar is
  redundant (machud is already the top-left wordmark). Footer is now just `q quit · refresh 1s`.
  Repointed the appearance "frame renders" assertion off the footer `machud` marker to the `CPU`
  panel title (the header wordmark is `mac`+`hud` split by ANSI → not a contiguous "machud"). Same
  check strength, better marker. `pnpm verify` PASS (72).

- **Panel-seam alignment — shared 60% divider (branch `main`).** Owner spotted the panel edges didn't
  line up across the 3 tiers. Root cause: each row had a different panel count (2/3/2) AND panels sized
  to their CONTENT (DISK's long R/W + io row bloated it to ~80% of its row, skewing the seam). Fix:
  `flexBasis:0` on Panel (size by flexGrow ratio, not content) so a content-heavy panel stays in its
  column; tuned ratios for a shared **60% divider** — tier-1 CPU 3:MEM 2, tier-3 DISK 3:SENSORS 2,
  tier-2 reordered to **NET · BATTERY · GPU** (2:1:6) so GPU's graph fills the right 40% column and
  Battery stays compact (a wide-but-empty Battery was the alternative to the reorder). Right panels now
  align at col 67–68 across all rows; new verify assertion pins it (right-edge cols within 2).
  `MIN_CHECKS` 71→72, `pnpm verify` PASS (72). Note: tier-2 ratios are tuned to the current minWidths
  (vue-tui's flexBasis floors at minWidth); the inner NET|BAT seam is the unavoidable 3rd-panel line.

- **Owner review applied + B3 disk I/O sparkline (branch `redesign`).** Owner ruled the pending
  decisions: **Q2** → dark `dim` `#5c6a64`→`#7a8478` (Everforest grey0; fixed in DESIGN.md + theme.ts,
  pin holds); **B2 Bluetooth** + **B6 clock** DROPPED; **kept** the green-forward bars (the earlier
  screenshot was stale); **vouched D2 (zero-sudo) + D11 (color-tier)**. Then built **B3** (owner ruled
  ADD, overriding my drop rec): a `dio` history ring (read+write Bps) in useMetrics → a labelled `io`
  block-`Sparkline` (accent green) in the compact DISK panel. Caught + fixed a `flexGrow="1"` (string)
  Vue prop-type warning, and **added a gate assertion for no Vue warnings** (they hit stderr on a
  successful render, so the stdout frame checks were blind to them). `MIN_CHECKS` 69→71. `pnpm verify`
  PASS (71).

- **Redesign polish + records sync; autonomous runway exhausted (branch `redesign`).** Hue-confinement
  completeness: DISK R/W rate text moved off the net/warn hues to neutral `text` (bodies stay
  green/neutral per D9). Synced records to "shipped": backlog `## Now` + architecture scope status now
  state the RD0–RD5 redesign is complete; recorded the **B3** reassessment (disk sparkline doesn't fit
  the compact tier-3 → recommend drop). Skipped fixed-height proc lists as near-zero-value (a real Mac
  always has ≥3 processes, so the list never shrinks in practice). `pnpm verify` PASS (69).
  **⏸ Pausing the loop here:** the redesign + its polish are done and no unblocked autonomous item
  remains. What's left is owner-gated — **B2/B3/B6** (feature/placement calls for the opinionated
  dashboard, D1/D5), **Q2** (VOUCHED-blocked dark `dim` hex), and an owner **push** of the 13 local
  `redesign` commits.

- **RD5 — responsive (2-tier) → REDESIGN COMPLETE (branch `redesign`).** Threaded the width seam (the
  long-standing D4 catch): `main.ts` passes the `COLUMNS`-derived width as a `columns` prop to `App`,
  and `App`'s responsive `width` prefers it (`props.columns || useWindowSize().columns || 120`) — so
  the `v-if` branches on the SAME width the gate drives, not a TTY-only source. Wide (≥100) = the full
  3-tier; narrow (<100) = `NarrowView`, a single compact column (one line per module, no hero
  BigNumber/graphs — the hierarchy IS the degradation). `HeaderBar` drops its tagline+summary when
  narrow (keeps mac|hud + clock); footer compacts to `q quit`. Caught + fixed a layout bug: the `Bar`
  fragment's two Texts became separate flex children under `space-between` (gap between fill/track) —
  wrapped each narrow Bar in a `<Box>`. verify: hero present@120 / absent@40 + no-overflow@40 (seam
  proven). `MIN_CHECKS` 67→69, `pnpm verify` PASS (69). **Eyeball:** `COLUMNS=40 node dist/machud.mjs
  --once` (watch-face) and a normal-width terminal (3-tier).
  **🏁 RD0→RD5 redesign COMPLETE** — gate hardened (RD0–RD0d), Everforest palette (RD1), data-honest
  collectors (RD2), gradient/glyph components (RD3), hero density + 3-tier + stability + hue (RD4),
  responsive (RD5). 12 commits on `redesign`, not pushed (awaiting owner). Remaining: **B2/B3/B6**
  (deferred features — need owner direction on placement/whether-to-add), **Q2** (dark `dim` hex —
  VOUCHED-blocked), and **push**.

- **RD4 (part 9) — hue confinement (branch `redesign`).** Realized D9's vouched rule "green is the only
  hue across panels": moved the meter BAR bodies off the per-module hue — MEM used bar → `levelColor`
  (green→amber→red by load), DISK calm bar → accent green (escalates near-full), GPU util & BATTERY
  level bars → fixed accent green (high GPU / full battery aren't "danger", so no levelColor). Each panel
  KEEPS its module hue on title/border/hero number; only the bodies went green/neutral. verify's truecolor
  gradient assertion still passes (MEM bar now gradients in green, 12 colours). `pnpm verify` PASS (67).
  **EYEBALL — notable look change:** the dashboard is now green-forward with module colour only on
  chrome+numbers (per D9). `FORCE_COLOR=3 node dist/machud.mjs` to judge; if you prefer module-coloured
  bars, that's a D9 change — say so. **Minor follow-up:** Disk R/W text still uses net/warn hues.

- **RD4 (part 8) — GPU history graph (branch `redesign`).** Upgraded the GPU panel's 1-row Sparkline
  to the braille `Graph` (height 3 — tier-2, shorter than the hero graphs), completing the "every util
  panel shows real history" density theme (CPU/MEM/GPU). Visual change — guarded by no-overflow@120 +
  panel-render; `pnpm verify` PASS (67). **Next:** tier-3 (Disk/Sensors) compaction, remaining
  stability (fixed-height lists, right-aligned numerics), hue confinement, then RD5 (responsive).

- **RD4 (part 7) — stability: battery power row always present (branch `redesign`).** Principle-8 fix
  for the owner's "rows jump / grow taller": the BATTERY `power` row was `v-if="watts"`, so it vanished
  with no charge flow (charged on AC, no adapter watts), shrinking the panel a row each time charging
  finishes / you unplug. Now it ALWAYS renders — `±NW · NW adapter` when there's flow, else `on AC`
  (battery present) / `—` (none). TDD: inject a no-flow battery → the power row must still render; red
  (vanished) → green. `MIN_CHECKS` 66→67. `pnpm verify` PASS (67). **Next stability:** pad the
  top-process/app lists to a fixed 3 rows; right-align numeric columns (health/cycles).

- **RD4 (part 6) — 3-tier layout (branch `redesign`).** Reordered App.vue into the DESIGN hierarchy:
  tier-1 CPU+MEM (heroes), **tier-2 Network (lead) + GPU + Battery**, **tier-3 Disk + Sensors**.
  Previously tier-2 was GPU+Disk+Net and tier-3 was Battery+Sensors — now Network leads (owner-ranked
  above Battery), Battery is medium, Disk/Sensors compress to the bottom. Pure reorder (same panel-count
  per row) → no overflow; verify's no-overflow@120 + all-panels-render guard it (visual change,
  eyeballed). `pnpm verify` PASS (66). **Next:** compact tier-3 Disk/Sensors into a true one-line status
  strip; GPU history graph; then stability (fixed rows / right-aligned numeric columns).

- **RD4 (part 5) — MEM hero density: BigNumber + braille graph (branch `redesign`).** After pt4 the
  density flipped (CPU fuller than MEMORY → MEM had the empty bottom). Brought MEMORY to tier-1 parity:
  replaced the small `61%` with a **BigNumber** and the 1-row Sparkline with the tall **braille Graph**
  (the same components as CPU — Principle 6 consistency), keeping the used bar, wired/swap, and top
  apps. TDD: inject `memory.usedPct=88` + `cpu.usage=11` so only a MEM BigNumber emits the `█ █ █ █`
  88-signature; red→green. `MIN_CHECKS` 65→66. `pnpm verify` PASS (66). Tier-1 now balanced — both
  heroes lead with big number + history graph + bars + a 3-item list.
  **Eyeball / next:** graphs are data-honest (MEM fills ~59%, CPU sparse at idle — both flow live).
  Still on the RD4 list: MEM wired/compressed/app breakdown bar, GPU/DISK history, then the 3-tier
  layout + stability (fixed rows / right-aligned numeric columns).

- **RD4 (part 4) — CPU top-process list (density; branch `redesign`).** Owner feedback on the live
  frame: the CPU hero is "a big panel with little content" (Principle 8). Root cause: CPU had *less*
  content than MEMORY, so it stretched to MEMORY's height with an empty bottom. Fix — a **top-CPU-
  process list** (`cpu.topProcs` via `ps -A -o pcpu=,comm= -r`, mirroring memory.ts's top-by-RSS),
  rendered as 3 right-aligned `name … N%` rows. CpuPanel now carries BigNumber + history graph + P/E
  avg bars + per-core load grid + top processes — real, always-present, comparative data. TDD:
  `cpu.topProcs` array check + inject a distinctive name → renders; red→green. `MIN_CHECKS` 63→65.
  `pnpm verify` PASS (65). **Density now FLIPPED** — CPU is fuller than MEMORY, so MEM needs its
  matching hero/breakdown/history pass next. The CPU graph reads sparse at idle (honest area chart at
  low load; flows live). Also stamped **D15** (mac|hud wordmark VOUCHED) and removed `cool-proto.mjs`.

- **RD4 (part 3) — per-core grid coloured by load (branch `redesign`).** New `CoreGrid.vue`: one
  mini-bar per core (block glyph, height ∝ load), **coloured by `levelColor` (load), not by cluster** —
  E and P render as separate labelled groups; a single cluster (Intel) → one unlabelled row, never
  `0P+0E` (DESIGN). Replaced the old single cluster-coloured cores row in CpuPanel. TDD: inject one
  cluster of 70% cores → the grid must emit a warn-tier `▆` (`38;2;219;188;127`), which the old
  cpu-green row never did; red→green (collision-free — `▆` comes only from the grid/sparklines, and
  only the grid runs `levelColor`). `MIN_CHECKS` 62→63. `pnpm verify` PASS (63). **Follow-up:** the
  CpuPanel P/E *average* bars still render both rows on a single cluster — minor; host is Apple Silicon.

- **RD4 (part 2) — `BigNumber` hero number (branch `redesign`).** Added `src/lib/bignum.ts` (3×5
  block-figure font, 0–9 + `-`/space; `bigDigits()` joins glyphs with a 1-col gap → 5 rows) and
  `BigNumber.vue` (renders the rounded value as 5-row figures with a gentle same-hue top-bright ramp,
  solid below truecolor via the SAME D11 gate as the meters/graph, so the whole panel decides
  truecolor↔256 identically). Wired into the CPU hero, replacing the small `42%` text — the panel now
  leads with a big block number over the braille history graph (Principle 1 "one hero metric, BIG").
  TDD: verify injects `cpu.usage=88` → the two big 8s emit `█ █ █ █` (a signature no bar/braille/
  sparkline produces); red (absent) → green. `MIN_CHECKS` 61→62. `pnpm verify` PASS (62). Also removed
  the RD3-era throwaway `cool-proto.mjs` (its palette-picking job is done).
  **To eyeball:** `FORCE_COLOR=3 node dist/machud.mjs` — the CPU hero-number gradient. **Note:** tier-1
  is now lopsided (tall CPU vs short MEM) until MEM earns its hero/density — expected mid-RD4; next
  parts: per-core grid, MEM/GPU/DISK density, then the 3-tier layout + stability.

- **RD0d — real `npx` artifact gate: pack → install → exec (branch `redesign`).** verify §6 only
  inspected the local checkout, so a packaging bug that bites only the *installed* package could sail
  through green. Added verify §9: `pnpm pack` (publishes the pnpm way — resolves `catalog:`, runs
  `prepack`) on a **clean tree** (rm the bundle first) → `npm install <tgz>` into a throwaway project
  (the `npx`/consumer side) → exec the **installed** `.bin/machud --once`. Asserts the tarball carries
  `dist/machud.mjs`, the bin links, and it exits 0 + renders `CPU`. `MIN_CHECKS` 58→61.
  **TDD red:** a no-op `prepack` (→ binless tarball) turned all 3 RD0d checks RED while §6 stayed
  GREEN — proving real-artifact coverage §6 can't give (the Task-2 "clean tree packed a bin-less
  tarball" bug). Restored → **`pnpm verify` PASS (61)**.
  **Findings worth keeping:** chalk is a *transitive* dep of `@vue-tui/runtime` and npm hoists it in
  the consumer, so dropping a *direct* dep does NOT break the installed bin; and pnpm's strict
  symlinked node_modules drops a direct dep's top-level link on a deps-sync, breaking *local*
  resolution — so the binless-tarball break (not a missing-dep break) is the honest red here.
  **To eyeball / note:** the gate is now heavier (a second full build via prepack + a real `npm
  install`) and needs network on a cold npm cache — expected per the backlog's "heavier/slower",
  kept as the last functional section. Only `scripts/verify.mjs` changed (package.json restored).

- **RD4 (part 1) — braille area history graph (branch `redesign`).** New `brailleArea()`
  (2×4-subpixel area chart) + `Graph.vue` (measures its own width, vertical gradient top→bottom,
  truecolor-aware via D11). Swapped the CPU panel's 1-row Sparkline for a **tall 4-row braille graph**
  — the flowing btop-style history (the start of making the CPU hero dense, not boring, per the owner
  feedback). The `--once`/verify path has no rolling history, so App now synthesizes a **flat band at
  the current reading** (honest — no invented trend; the live app uses the real history). verify
  asserts a braille area graph renders. `pnpm verify` PASS (58). Next RD4: per-core grid, BigNumber,
  MEM/GPU graphs, then the 3-tier layout + stability + hue confinement.

- **Two-tone `mac|hud` wordmark (owner request; branch `redesign`).** The top-left logo now splits
  the word: **`mac`** in Apple aluminium/silver (`#c4c9cf` dark / `#8d939a` light) and **`hud`** in
  the brand green — highlighting the "HUD for the Mac" reading. Added a `silver` token to the palette
  (theme.ts + DESIGN.md, owner-directed extension of D9); the key-by-key theme pin now covers 18
  tokens per mode. `pnpm verify` PASS (57).

- **RD3 review fix — D11 gradient gate now matches the renderer (branch `redesign`).** The RD3
  visual review (verdict fix) caught a real major: `supportsTruecolor()` keyed off `COLORTERM`, but
  vue-tui emits 24-bit via **chalk's level** — so on kitty/wezterm/ghostty/iTerm/SSH (TERM-truecolor,
  no COLORTERM) the gradient was silently lost, and on `COLORTERM=24bit` + 256-colour TERM it banded.
  Fixed: added `chalk` as a direct dep and `supportsTruecolor() = chalk.level >= 3` — byte-for-byte
  the same signal as the renderer, so they can't diverge. Verified end-to-end: `chalk.level 3` →
  per-cell gradient (13 colours in one bar), `chalk.level 2` → solid, no 38;2 (no banding).
  Strengthened the verify gradient assertion to **per-bar** (whole-frame chrome alone passed the old
  `>8` threshold). Also hardened `barCells`/`hexToRgb` against NaN/malformed input (latent, one line
  each). `pnpm verify` PASS (57).

- **Dropped accessibility — owner ruling, VOUCHED (branch `redesign`).** Owner ruled a11y out of
  scope (D14): for a passive full-screen TUI the only realistic a11y is colour-independence, and even
  that isn't wanted. Reverted the `○◐●` status glyphs (RD3 pt1) — status is colour-only again
  (MemoryPanel, SensorsPanel, format.ts). **GATE WEAKENED:** removed the verify "● on High pressure"
  assertion and lowered `MIN_CHECKS` 58→57 — a *sanctioned* removal per the owner ruling (autonomy
  gate-rule 2). Scrubbed a11y from DESIGN.md (Principle 2, glyph token, Sensors mapping, Do's/Don'ts)
  and added **D14 [VOUCHED]**. The braille area *graph* (RD4) is KEPT — it's a drawing technique, not
  a11y (owner confirmed after we untangled the term). The `⇡/⇣` charge glyph + `—` stay (real info,
  not a11y). `pnpm verify` PASS (57).

- **RD3 (part 3) — gradient meters + D11 colour-tier fallback (branch `redesign`).** New
  `src/lib/color.ts` (hex mix / same-hue `ramp` / `supportsTruecolor`). Bar.vue now renders each
  filled cell as a **same-hue dim→accent gradient** on truecolor terminals, and degrades to the
  **solid accent** below truecolor (D11). Key finding: vue-tui decides 24-bit emission from
  `COLORTERM`, NOT the `FORCE_COLOR` level, so `supportsTruecolor()` keys off `COLORTERM` (matching
  what the renderer actually emits). verify asserts the truecolor frame has many distinct 38;2
  colours (gradient) and a 256-colour frame (COLORTERM unset) has none (clean degrade). `pnpm verify`
  PASS (58). Remaining RD3: braille area Graph.

- **RD3 (part 2) — disk earned near-full signal (branch `redesign`).** DiskPanel was hardcoded to
  the disk hue with no escalation. Now it stays calm (module hue) until near-full, then an EARNED
  signal escalates on both colour AND text: amber `NEAR FULL` ≥85%, red `FULL` ≥95% (the bar colour
  + the right-hand label both flip). verify injects 96% (RD0c hook) and asserts `FULL` renders.
  `pnpm verify` PASS (56). Remaining RD3: gradient Meter, braille Graph, D11 fallback.

- **RD3 (part 1) — status glyphs + ⚡→⇡ (branch `redesign`).** Added a `statusGlyph()` helper
  (`○` calm / `◐` elevated / `● ` alert) and wired it into MemoryPanel (pressure) and SensorsPanel
  (thermal), so status now rides a **non-hue channel** (color-blind safe, DESIGN.md Principle 2) —
  not colour alone. Replaced the last two `⚡` (BatteryPanel + HeaderBar) with `⇡`. verify now asserts
  **no `⚡` anywhere in the frame** and **`●` renders on High** pressure (injected via the RD0c hook).
  `pnpm verify` PASS (55). Remaining RD3: gradient Meter, braille Graph, BigNumber, DiskPanel
  near-full ramp, D11 colour-tier fallback.

- **RD2 review fixes (branch `redesign`).** The data-honesty review (verdict fix) found the data
  layer solid but two visible product defects: (1) the charging detector matched "disCHARGING"
  (`/charging/i` with no word boundary), so the panel showed "⚡ charging" while discharging —
  contradicting RD2's new negative `chargeWatts`; fixed to `/\bcharging\b/` + exclude discharging,
  and added a verify coherence assertion (never `charging` while `chargeWatts<0`). (2) The new watts
  were collected but never rendered; BatteryPanel now shows `power −5.9W` / `+24W · 96W adapter`.
  Also hardened two provenance tests: chargeWatts now `present`-guarded (won't false-RED on a
  battery-less Mac), and memory pressure pairs `1→Normal` with `4→High` so it can't false-pass on a
  loaded host. `pnpm verify` PASS (53). Confirmed live: panel shows "discharging" + "power −5.9W".

- **RD2 — data-honesty collectors (branch `redesign`).** Made the headline metrics true, each TDD
  (red provenance assertion → implement → green) with a collector-level test hook: **memory** reads
  the real `kern.memorystatus_vm_pressure_level` (1/2/4→Normal/Elevated/High), heuristic only as a
  fallback (`MACHUD_TEST_PRESSURE_LEVEL`); **battery** adds `adapterWatts` (AdapterDetails.Watts) +
  `chargeWatts` = V·A/1e6 with a signed-64 reinterpret of ioreg's UNSIGNED Amperage
  (`MACHUD_TEST_AMPERAGE`; live-verified -6.16 W on battery); **cpu** models one cluster on Intel
  instead of `0P+0E` (`MACHUD_TEST_NO_PERFLEVEL`); **network** drops the LAN IP (D12 — type/empty/
  collector/panel; interface name stays in the header). `pnpm verify` PASS (51 assertions).

- **RD0c — synthetic-input injection mechanism (branch `redesign`).** `collectAll()` now applies
  `MACHUD_TEST_OVERRIDE` — a JSON env deep-merged into the snapshot (sibling of
  `MACHUD_TEST_APPEARANCE`; product path untouched when unset) — so the gate can exercise states this
  host can't produce. TDD: added the verify assertion (inject `memory.pressure="High"` → red while
  unbuilt), implemented the deep-merge → green. `pnpm verify` PASS (45). RD2 will use this for the
  battery-sign / pressure-level / Intel / near-full-disk fixtures.

- **RD1 — Everforest palette landed (first visual change; branch `redesign`).** Rewrote
  `src/theme.ts` from Tokyo Night to the **Everforest** tokens (dark + light) from DESIGN.md, adding
  `bgLift` + `accent` (the brand green). verify.mjs now **pins** the dark tokens — `#2d353b` and
  `#a7c080` must appear in BOTH DESIGN.md and theme.ts — and asserts no Tokyo-Night leftovers, so the
  palette can't silently desync from the spec (autonomy rule 5). `pnpm verify` PASS (44 assertions).
  **To eyeball the green:** `node dist/machud.mjs` live, or `FORCE_COLOR=3 node dist/machud.mjs
  --once` (confirmed `--once` emits truecolor under FORCE_COLOR — useful for RD3's color-fidelity
  tests). Layout/glyphs unchanged — this is colour only; the 3-tier layout is RD4.

- **RD0b — visual-correctness harness (branch `redesign`).** Added strip-ANSI + widest-line
  measurement to verify.mjs and the assertion that holds on current code: **no overflow at the wide
  target (widest line ≤ 120)** — the wide layout fits exactly at 120 today, so this guards any future
  change from overflowing it. Reframed the backlog: the other visual assertions (no-`⚡`, FORCE_COLOR
  fallback, bar alignment, narrow-width no-overflow) are TDD-coupled to RD3/RD4/RD5 and land WITH
  those features — a monolithic "all visual assertions first" was infeasible (can't assert "no `⚡`"
  before it's removed). `pnpm verify` PASS (41 assertions; floor pinned to 41).

- **RD0 — hardened the verify gate (safety net; branch `redesign`).** Closed the three confirmed
  holes the adversarial reviews found: (a) `inRange` accepted `null` (a metric silently degrading to
  `—` passed every range check) — split into a strict `inRange` (null/NaN → red, for present-required
  metrics) and `inRangeOrNull` (GPU util / battery health stay honestly nullable); proved
  `inRange(null)=false` now vs the old `true`. (b) The build check passed on a stale bundle even when
  the build failed — now `rm`s `dist/machud.mjs` before building, so a failed build leaves it absent →
  red. (c) Added an assertion-count pin (`MIN_CHECKS=40`) so deleting/loosening a check turns the gate
  red, making autonomy.md's strengthen-only rule machine-enforced. `pnpm verify` PASS (40 assertions;
  the pin reads the pre-increment count). Also made the gate Intel-tolerant (no-P/E-split) and a build
  failure now exits with one clean red instead of a cascade.
  Filed **RD0d** for the heavier real-`npx` pack→install→exec gate (from the Task-2 review).

- **Task 2 — `npx machud` runnable (D13; branch `redesign`).** Made the package publishable and the
  bin executable: removed `private: true`, added `files`/`engines`/`keywords`/`prepublishOnly`, moved
  dev-only `@vue-tui/cli` to devDependencies (the bundle only imports `@vue-tui/runtime` + `vue`), and
  added a rollup `output.banner` shebang so `dist/machud.mjs` runs as a bin (Node strips it from
  `.mjs`, so `node dist/machud.mjs` is unaffected). New verify.mjs **packaging** section asserts the
  built bin starts with `#!/usr/bin/env node`, the package is not private, and `bin.machud` resolves —
  TDD red (2 fails) → green. `pnpm verify` **PASS**. (Publishing itself is an outward action — not
  done; the package is just *ready* to `npx`.)
  **Task-2 adversarial review caught a BLOCKER** (verdict blocking): `engines.node` was `>=20`, but
  `@vue-tui/runtime@0.1.0` requires `>=22.18.0` (it pulls `string-width@8`, whose top-level `/v`
  RegExp throws SyntaxError below Node 22.18) — so `npx machud` would crash at load on Node 20. Fixed:
  `engines.node >=22.18.0` + a verify assertion that our floor ≥ the installed runtime's floor (drift
  guard); added `prepack: vp build` (`npm pack` doesn't run `prepublishOnly`, and dist is gitignored,
  so a clean tree packed a bin-less tarball); narrowed `files` to drop a stray `dist/icons.svg`.
  Confirmed `npm pack --dry-run` → 3 clean files. `pnpm verify` PASS.

- **QA review applied + D9/D13 vouched (docs only; branch `redesign`).** Ran a consolidation-QA
  adversarial review (4 auditors + a Codex pass) over the redesign docs; it returned `fix-then-lock`
  and caught a BLOCKING miss + 2 factual errors I'd carried in. Fixed all on branch `redesign`:
  (BLOCKING) `autonomous-development-plan.md` still hardcoded the old B2→B3→B4 order — replaced with
  a pointer to backlog.md; `architecture.md` Layers/source-table now tagged SHIPPED-vs-TARGET (3-row
  grid + IP); corrected the **`useWindowSize` "constant 80"** claim in 4 files (it's reactive; the
  real seam is the gate's `COLUMNS`→`renderToString` width); corrected the **battery sign** spec —
  ioreg `Amperage` is an unsigned 64-bit int, reinterpret before the `<0` test; made RD2 acceptance
  provenance-distinguishing, broke RD0c's circular dependency, and added a gate-strength count-pin to
  RD0. **Vouched D9 (Everforest visual identity) and D13 (`npx machud` zero-install distribution)**
  with `[VOUCHED @hyf0]`, added both to the autonomy stop-list. **`pnpm verify` PASS (unchanged —
  docs only).** Next: re-run adversarial review on this fix, then RD0.

- **Design session — visual identity + redesign plan (docs only; no code change yet).**
  Settled machud's look as "**cool but refined**" (drama from FORM, calm from COLOR), palette
  **Everforest** green-forward, and wrote it up as [`/DESIGN.md`](../../DESIGN.md) — the hands-off
  aesthetic anchor (D9). Decisions this round: **sudo dropped entirely** (D2 strengthened, B5
  DROPPED — "never asks for your password" is now identity); **opinionated contribution policy**
  ([`/CONTRIBUTING.md`](../../CONTRIBUTING.md), D10); **3-tier layout** (tier-1 CPU+Memory; tier-2
  Network/GPU/Battery; tier-3 status strip) with **responsive reopened** (D4 — owner reopened,
  scoped to 2-tier, built last); **truecolor color-tier fallback** (D11); **no-IP waiver** (D12).
  Per-module spec set: real memory-pressure sysctl, live battery adapter/charge watts, per-core
  P/E (Apple-Silicon-only), network human units + no IP, status carried on `○/◐/●` glyphs
  (color-blind safe).
  Ran TWO adversarial multi-agent reviews. The second one found the conclusions were **not safe to
  lock as-is** — DESIGN.md claimed `theme.ts` mirrored Everforest (it's still Tokyo Night), still
  encoded "fixed 3-row / no responsive," and the redesign was never in the backlog; plus three
  live verify holes (`inRange(null)→true`, build-passes-on-stale-bundle, no strengthen-only). Acted
  on all of it: reconciled DESIGN.md (marked TARGET vs shipped, fixed the contradictions), and
  **restaged the backlog RD0–RD5 safety-net-first** so the loop hardens `verify.mjs` BEFORE any
  visual rewrite. Added gate-integrity rules to autonomy.md (strengthen-only, responsive must be
  render-tested, TARGET≠shipped).
  **No `src/` changed; `pnpm verify` NOT re-run (nothing to verify yet).** A throwaway truecolor
  prototype `cool-proto.mjs` was added to choose the palette (delete after RD3). **To eyeball:**
  `node cool-proto.mjs` (Everforest dark = flavor 4, light = flavor 7).

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
