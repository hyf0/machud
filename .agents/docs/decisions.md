# machud product decisions — anti-drift anchors

These are the human owner's stated decisions, recorded to prevent drift during
self-iteration. Don't quietly drift past them; if a proposed change would cross one
of these boundaries, stop and ask first.

Vouching is per-decision: a heading carrying `[VOUCHED @hyf0]` is settled — reopen
only on new evidence, a changed constraint, or @hyf0's explicit say-so. Unstamped
decisions are AI-recorded on the owner's behalf — followed, but challengeable.

See also: [architecture.md](./architecture.md) for the *how*.

## D1. Opinionated & out-of-the-box — NOT configurable  [VOUCHED @hyf0]

machud's whole reason to exist is the opposite of btop. btop wins on deep
configurability; machud wins on **beautiful + zero-config**. A curated layout that
looks good on first launch beats any settings system.

- **Do:** pick sensible defaults, make them look great, ship them.
- **Don't:** add config files, layout customization, per-user widget arrangement,
  or a "focus/expand" interaction mode. The single curated dashboard IS the product.

## D2. Zero-sudo first, layered degradation

Open-the-box means **no password prompt on startup, ever.** Default data comes only
from unprivileged commands (`sysctl`, `vm_stat`, `ioreg`, `pmset`, `netstat`, `df`,
`ps`) + Node `os`. Anything needing `sudo` (powermetrics: precise per-cluster freq,
GPU/ANE watts, fan RPM, die temps) is shown as `—`, never blocks, never prompts.

- **Do:** keep the path sudo-free, **period.** There is **no** sudo mode — not even an
  opt-in `--enhanced` one. Never requesting a password is part of machud's identity
  (owner ruling 2026-06-20). Metrics that would need `sudo`/powermetrics (precise
  per-cluster freq, GPU/ANE watts, fan RPM, die temps, total system power) stay `—`.
- **Don't:** make the experience depend on elevated privileges, or add any code path —
  default or flagged — that shells `sudo`. A privileged helper is exactly the kind of
  fragile, security-sensitive surface this project refuses (see CONTRIBUTING.md / D1).

## D3. Never crash, just degrade

A monitor that crashes is worse than one showing `—`. `sh()` resolves `""` on
failure, each collector returns safe nulls, `collectAll()` swaps any throwing
collector for its empty default.

- **Don't:** introduce a code path where one bad reading blanks or crashes the app.

## D4. Responsive — wide curated default + one narrow fallback (REOPENED 2026-06-20 by @hyf0)

Supersedes the old "wide-screen only, responsive deferred." @hyf0 reopened this (exactly the
"reopen only with @hyf0" path the old decision reserved). machud now adapts to the terminal
**viewport size**, the same way D8 adapts to system appearance — **automatically, no config, no
switch.** Still zero-config, still one curated experience; it just fits the window. So it stays
compatible with D1.

- **Scope = TWO tiers, not five.** A wide curated default (the 3-tier hierarchy in DESIGN.md) +
  ONE narrow/watch-face single-column fallback, with a single tested breakpoint. The full
  5-breakpoint × per-panel-S/M/L ladder is rejected as a scope bomb for the hands-off loop.
- **Build it LAST**, after the visual redesign (RD5), and gate it on the verify width assertions.
- **Mind the width seam:** `useWindowSize()` is reactive — it reads `stdout.columns`, then a
  terminal-size probe, falling back to 80 only as a last resort; `App.vue` already binds it as the width. The real issue is
  that the `--once`/verify path has no TTY width, so the gate drives width via `COLUMNS` →
  `renderToString({columns})` (which `main.ts` already does). RD5 must make any responsive `v-if`
  read the **same** width the gate controls (thread `columns` as a prop), so a breakpoint asserted
  at `COLUMNS=120`/`40` is the width the code actually branches on.
- **Don't:** let the loop self-grant responsive (it was a standing-anchor conflict — this reopen
  is the owner ruling that unblocks it). Don't add breakpoints the gate can't render-test.

## D5. Scope — 9-module Stats parity as the goal, phased delivery

Target is feature parity with Stats' 9 modules, delivered in phases with quality
per module (not all-at-once-half-baked).

- **Done:** CPU (P/E split), Memory, GPU, Disk, Network, Battery, Sensors, Clock
  (in header).
- **Deferred:** Bluetooth module, a standalone Clock module.
- **Do:** when adding a deferred module, follow the existing collector→panel
  pattern (one collector file, one panel, props-only panel).

## D6. Verify with real data, not guesses

Parsers are written against **actual command output captured on a real Mac**, not
assumed formats. The live verification path is `node dist/machud.mjs --once`
(`vp test` is upstream-broken — see architecture.md).

- **Do:** before changing a collector's parsing, run the real command and read its
  output. After any change, confirm with `--once` showing plausible live values.

## D7. Take over the terminal like btop (alternate screen)  [VOUCHED @hyf0]

The live dashboard must **own the whole screen** — switch to the terminal's
alternate screen buffer on launch (clean buffer, hidden cursor, no leftover shell
prompt or scrollback), and **restore the user's terminal exactly** on quit.
Inline-below-the-prompt rendering was explicitly rejected — it looked like leftover
junk and broke the "polished, app-like" feel.

- **How:** `createApp(App).mount({ alternateScreen: true })`. Quit via
  `useApp().exit()` (clean unmount → restore), NOT `process.exit()` (skips restore).
  Ctrl+C is handled by mount's `exitOnCtrlC`; signal-exit restores on signals too.
  Auto-ignored when stdout isn't a TTY, so `--once` and piping are unaffected.
- **Don't:** go back to inline rendering, or exit a live session with a raw
  `process.exit()` that leaves the terminal in the alternate buffer / cursor hidden.
- **Verify:** capture raw bytes through a PTY (`script`) and confirm both
  `\x1b[?1049h` (enter) and `\x1b[?1049l` (exit) plus balanced cursor hide/show.

## D8. Light/dark follows macOS system appearance — still zero-config

Owner ruling on 2026-06-20: machud supports both light and dark palettes and
chooses between them by following the macOS system appearance preference.

This is compatible with D1 because it is **not** a user-facing theme setting:
there is no config file, no CLI flag, and no in-app switch. The app simply adapts
to the system preference. Verification may use an internal test override to
exercise both palettes, but that is not product surface.

Dark is the **hero** look (the cool/gradient identity glows on dark). Light is a **faithful,
lower-drama daylight mode** — gradients compress and it cannot glow, which is acceptable by
physics — but it carries the same quality bar minus glow (hero, alignment, status glyphs must
read as deliberate on the cream base). Dark-only was considered and **rejected** (it would put a
glaring black rectangle on a bright Mac desktop — worse eye strain than flat light, and would
reopen a one-day-old ruling for a pure preference).

## D9. The visual identity is Everforest, recorded in DESIGN.md  [VOUCHED @hyf0]

Owner ruling 2026-06-20. machud's look is "**cool but refined**" — striking through FORM
(truecolor gradient meters, 2×4 braille graphs, big block numbers) yet muted and low-strain
through COLOR. The palette is **Everforest** (green-forward, using Everforest's own green
`#a7c080`), chosen for proven low eye-strain; identity comes from composition + the zero-sudo
data story, not the palette.

The full spec lives in [`/DESIGN.md`](../../DESIGN.md) and is the **hands-off aesthetic anchor**
the loop optimizes against — a [VOUCHED]-level surface. Most of it is currently **TARGET** (the
code is still Tokyo Night + the old grid); the staged RD0–RD5 backlog builds toward it.

- **Do:** make `src/theme.ts` the runtime mirror of the DESIGN.md tokens, pinned in verify.mjs.
- **Don't:** drift the look, or treat unbuilt DESIGN.md prose as a passing invariant.

## D10. Opinionated contribution model

Owner ruling 2026-06-20, recorded in [`/CONTRIBUTING.md`](../../CONTRIBUTING.md). Because machud
is opinionated (D1), the contribution surface is intentionally narrow: **bug/compat reports
welcome; ideas as discussion-first issues; feature PRs opened without a prior agreed issue are
closed directly; theming / feature / aesthetic changes are generally not accepted.**

## D11. Truecolor is an enhancement, not a guarantee — color-tier fallback

The gradient identity assumes 24-bit color, but macOS's **default Terminal.app is 256-color**.
Without a fallback, same-hue ramps flatten to bands and muted hexes snap to saturated basic ANSI
(the neon the design forbids). machud must detect the terminal color level and degrade: truecolor
→ full gradients; 256 → a single **solid accent** (like light mode); 16 → muted **named** ANSI.
Judge the look through the real render path at level 2/1, not raw truecolor.

## D12. Network shows no IP address — recorded waiver

Owner ruling 2026-06-20. The NETWORK panel **drops the LAN IP** (previously shown) and shows
interface name + rates instead. Rationale: a LAN IP is low glance-value *and* machud is built to
be screenshotted/shared, so any network identifier is needless exposure. This is an **explicit,
logged waiver** of DoD rule 3 (a previously-live metric going absent), not a silent regression.

## D13. Distribution is `npx machud` — zero-install, the primary way people run it  [VOUCHED @hyf0]

Owner ruling 2026-06-20. The common usage is **`npx machud`** — run-on-the-fly, no install. That
makes the first five seconds the whole product and **hard-reinforces** the rest: zero-config (D1);
**never prompt for a password** (D2 — a `npx` tool asking for root is a trust-killer); and the
**truecolor color-tier fallback** (D11) is mandatory, because npx users are on whatever terminal
they have, including macOS's default Terminal.app (256-color).

- **Do:** keep the published package **runnable via `npx machud`** — un-`private`, a shebang on the
  bin, declared `files`/`engines`, and a **lean runtime dep tree** for fast cold start. A verify
  assertion must confirm the built bin actually launches (don't ship a package that can't run).
- **Don't:** add a required install/build step, a heavy runtime dependency, or anything that makes
  the first `npx machud` slow, broken, or privilege-prompting.

## D14. No accessibility layer — out of scope  [VOUCHED @hyf0]

Owner ruling 2026-06-20. machud does **not** pursue accessibility. For a passive, full-screen TUI
that takes over the terminal (D7), the realistic a11y surface is only **colour-independence**
(screen-reader and keyboard a11y don't apply to a non-interactive alt-screen app), and the owner
decided even that isn't worth it. So **status is conveyed by colour** (good/warn/bad) — no mandatory
non-hue glyph, no colour-blind redundant-encoding requirement.

- **Do:** use colour freely for status; a text label (e.g. disk "FULL") is fine where it reads well,
  but it's a UX choice, not an a11y obligation.
- **Don't:** add `○/◐/●`-style status glyphs, screen-reader hints, or other a11y scaffolding "to be
  safe." This is a deliberate, settled non-goal — reopen only with @hyf0.
- Note: `⇡/⇣` (charge direction) and `—` (unavailable) stay — they carry real information and replace
  a double-width emoji; they are not a11y features.
