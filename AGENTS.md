# machud

A beautiful, zero-config terminal system monitor for macOS — a TUI reimagining of
[Stats](https://github.com/exelban/stats) (mac-stats.com), built with
[vue-tui](https://github.com/vuejs-ai/vue-tui).

**machud is opinionated — that's the whole point.** Where btop wins on deep configurability,
machud wins on *beautiful + zero-config*: there are no settings, no config files, no layout
knobs. The single curated wide-screen dashboard — Apple-Silicon-aware, following your macOS
light/dark (press `t` to override) — **is** the product. Want to tune everything yourself? Use btop. machud is the
considered default that looks right out of the box and never asks for your password.

> **Contributing:** machud is opinionated by design. Bug reports are welcome; **feature PRs
> opened without a prior, agreed-upon issue are closed directly**, and theming/feature/aesthetic
> changes are generally not accepted. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Run it

```bash
pnpm build          # bundle to dist/machud.mjs (vp build → vite/rollup)
pnpm start          # run the live dashboard (needs a real TTY)
pnpm dev            # vue-tui dev with HMR
node dist/machud.mjs --once   # render ONE real-data frame to stdout and exit
```

`--once` is the verification path: it needs no TTY, prints a single frame with live
readings, and doubles as a pipe-friendly snapshot.

## Design notes

- **Zero-sudo first.** All data comes from unprivileged commands (`sysctl`, `vm_stat`,
  `ioreg`, `pmset`, `netstat`, `df`, `ps`) + Node's `os`. Metrics that need `sudo`
  (powermetrics: precise per-cluster freq, GPU watts, fan RPM, die temps) are omitted
  (D2 — not shown as dead `—` rows), never block startup. See `.agents/docs/architecture.md`.
- **Never crash, just degrade.** `sh()` resolves "" on failure; each collector returns
  safe nulls; `collectAll()` swaps any throwing collector for its empty default.
- **Architecture.** `src/lib/collectors/*` (one file per module) → `useMetrics` poller →
  panel components. Full map in `.agents/docs/architecture.md` — read it before changing
  data sources or layout.
- **TDD by default.** For behavior changes, write or extend the failing verification
  first, watch it fail when practical, implement the smallest fix, then make the gate
  green. Because `vp test` is currently broken, `pnpm verify` is the primary test
  harness; extend `scripts/verify.mjs` for new modules, metrics, rendering guarantees,
  and terminal behavior.

> Note: `vp test` is currently broken by an upstream version skew between
> `@voidzero-dev/vite-plus-core` (0.2.1) and `@voidzero-dev/vite-plus-test` (0.1.24).
> Verify with `node dist/machud.mjs --once` until the toolchain realigns.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

## Project Context Records (PCR)

This project follows **Project Context Records (PCR)** —
methodology: https://github.com/hyf0/project-context-records. PCR keeps the
project's durable design context — the *why*, the decisions, the architecture —
so you inherit it instead of re-deriving or re-litigating what's already settled.

When working here:
- **Where they live.** Records are in `.agents/docs/` — one topic per file,
  cross-linked with relative Markdown links (`[name](./name.md)`).
- **Read first.** If a record covers the area you're touching, read it before acting.
- **Autonomous work.** For hands-off development, follow
  `.agents/docs/autonomous-development-plan.md` together with
  `.agents/docs/autonomy.md` and the ordered backlog.
- **Record as you go.** Proactively write down context worth keeping — and whenever
  a human asks you to. No required format, no fixed list of what qualifies: if it's
  true about this project, not visible in the code, and useful beyond the moment,
  it's worth a record.
- **Keep it fresh.** If your change affects a record, update it in the same change —
  a stale record is a trap, not an asset.
- **Provenance.** An unstamped line is AI-accumulated: challenge and verify it freely.
  A `[VOUCHED @handle]` stamp (on a line, or at the top of a file) means a human
  vouched for it — treat it as settled; reopen or re-verify only on new evidence, a
  changed constraint, or a human's say-so. Add a stamp only on a human's explicit
  instruction; reading past a line, or not objecting, is not a stamp.
