# machud worklog

Async review trail. One dated bullet per milestone: what changed, verify status,
anything to eyeball. Newest first.

## 2026-06-20

- **Task 2 — `npx machud` runnable (D13; branch `redesign`).** Made the package publishable and the
  bin executable: removed `private: true`, added `files`/`engines`/`keywords`/`prepublishOnly`, moved
  dev-only `@vue-tui/cli` to devDependencies (the bundle only imports `@vue-tui/runtime` + `vue`), and
  added a rollup `output.banner` shebang so `dist/machud.mjs` runs as a bin (Node strips it from
  `.mjs`, so `node dist/machud.mjs` is unaffected). New verify.mjs **packaging** section asserts the
  built bin starts with `#!/usr/bin/env node`, the package is not private, and `bin.machud` resolves —
  TDD red (2 fails) → green. `pnpm verify` **PASS**. (Publishing itself is an outward action — not
  done; the package is just *ready* to `npx`.)

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
