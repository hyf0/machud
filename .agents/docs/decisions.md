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

- **Do:** keep the default path sudo-free; if powermetrics ever lands, it's an
  explicit opt-in "enhanced mode," off by default.
- **Don't:** make the default experience depend on elevated privileges.

## D3. Never crash, just degrade

A monitor that crashes is worse than one showing `—`. `sh()` resolves `""` on
failure, each collector returns safe nulls, `collectAll()` swaps any throwing
collector for its empty default.

- **Don't:** introduce a code path where one bad reading blanks or crashes the app.

## D4. Wide-screen only — for now (responsive deferred, by choice)

Responsive reflow was explicitly cut from this version to keep it simple. The
layout targets wide terminals. This is a deliberate deferral, not an oversight.

- **Don't:** silently start adding breakpoint logic. If responsive comes back,
  it's its own scoped decision with @hyf0.

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
