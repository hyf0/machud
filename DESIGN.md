---
# machud DESIGN.md — the visual identity, as a hands-off anchor.
# Format inspired by google-labs-code/design.md, adapted for a terminal (TUI):
# machine-readable tokens up top, human rationale below. This file is the thing the
# autonomous loop optimizes visual choices AGAINST. It is a product decision, not a
# preference — see CONTRIBUTING.md and .agents/docs/decisions.md (D9).
#
# STATUS: most of this is TARGET, not yet shipped. The code does NOT implement it yet
# (src/theme.ts is still Tokyo Night; the layout is still the flat 3-row grid). Build
# toward this via the staged RD0–RD5 backlog. Do NOT treat an unbuilt section here as a
# passing invariant — a "panel renders" grep is not "matches DESIGN.md". Each section is
# tagged (TARGET) or (SHIPPED).
meta:
  name: machud
  mood: "cool but refined — a calm, green-forward instrument; striking, never harsh"
  basis: "Everforest — a low-strain, muted, eye-friendly scheme; green-forward, using Everforest's own green"
  appearance: "follows macOS system light/dark automatically (D8); no user theme switch"

# --- COLORS (TARGET) — the source of truth. src/theme.ts MUST be rewritten to these
#     tokens (it is still Tokyo Night today — backlog RD1); verify.mjs pins the hex so
#     doc and code can never silently desync again. ---
colors:
  dark:
    bg:      "#2d353b"   # soft black, never #000
    bg_lift: "#343f44"   # one step up = panel depth
    frame:   "#4f5b58"   # muted border
    title:   "#d3c6aa"   # warm off-white, never #fff
    text:    "#9da9a0"
    dim:     "#5c6a64"   # labels, tracks
    accent:  "#a7c080"   # PRIMARY accent — Everforest's own green
    module:
      cpu:     "#a7c080"  # green  (hero)
      mem:     "#d699b6"  # purple
      gpu:     "#7fbbb3"  # blue
      disk:    "#dbbc7f"  # yellow
      net:     "#83c092"  # aqua
      battery: "#e69875"  # orange
      sensor:  "#e67e80"  # red
    status:
      good: "#a7c080"
      warn: "#dbbc7f"
      bad:  "#e67e80"
  light:
    bg:      "#fdf6e3"
    bg_lift: "#f4f0d9"
    frame:   "#ddd8be"
    title:   "#5c6a72"
    text:    "#5c6a72"
    dim:     "#939f91"
    accent:  "#8da101"
    module:
      cpu:     "#8da101"
      mem:     "#df69ba"
      gpu:     "#3a94c5"
      disk:    "#dfa000"
      net:     "#35a77c"
      battery: "#f57d26"
      sensor:  "#f85552"
    status:
      good: "#8da101"
      warn: "#dfa000"
      bad:  "#f85552"

color_tier:                # D11 — truecolor is an ENHANCEMENT, not a guarantee
  truecolor: "full same-hue luminance gradients (24-bit)"
  ansi256:   "drop gradients to a single solid accent (degrade like light mode)"
  ansi16:    "prefer muted NAMED ansi; never let arbitrary hex snap to saturated basic colors"
  detect:    "chalk level at startup; macOS Terminal.app (the OS default) is 256-color, no truecolor"

# --- GLYPHS (a terminal's "typography": fixed-width, so the character IS the type) ---
glyphs:
  border:    "round ╭ ╮ ╰ ╯ │ ─"          # round = calm; never heavy/double as default
  bar_fill:  "█"
  bar_track: "─"                            # dim, low-contrast
  graph:     "braille ⠀-⣿ area chart, 2×4 subpixels per cell"
  big_digit: "5-row block figures for the one hero number per panel"
  spark:     "▁▂▃▄▅▆▇█"
  sep:       "·"
  charge:    "⇡ charging · ⇣ discharging"   # width-1, NOT the ⚡ emoji (double-width)
  state:     "○ normal · ◐ elevated · ● high/alert"   # non-hue status channel (color-blind safe)
  absent:    "—"                            # honest placeholder for sudo-only / unavailable

# --- SPACE & WEIGHT ---
space:
  layout:    "(TARGET) wide curated default = 3-tier hierarchy; + ONE narrow/watch-face fallback (responsive, D4 reopened). NOT the old flat 3-row grid; NOT a 5-breakpoint ladder."
  gutter:    1            # 1 cell padding inside every panel border
  panel_gap: 1
  bar_align: "within a panel, ALL bars share one label-column width + one bar width; left edges, bar ends, and value columns form clean vertical rules. Guaranteed in the WIDE layout where bars render (not at watch-face XS)."
weight:
  hierarchy: "size > position > weight > color — primary metric is BIG + top-left + accent"
  gradients: "meters & graphs use SAME-HUE luminance ramps (no complementary hue clash)"

# --- COMPONENTS ---
components:
  Panel:     { border: frame, title: title, body: bg }
  BigNumber: { color: "module accent, gentle 2-tone same-hue gradient" }
  Meter:     { fill: "module accent → warn/bad as value enters danger (levelColor)", track: dim }
  Sparkline: { ramp: "module accent luminance" }
  Graph:     { type: braille_area, ramp: "same-hue luminance, dim bottom → accent top" }
  Status:    { color: "good/warn/bad", glyph: "○/◐/● — REQUIRED, status never rides hue alone" }
---

# machud — Visual Identity

What machud should look and feel like, written down so it can be built and judged
**without re-litigating taste every time.** Correctness is machine-checked by `pnpm verify`;
this document is the anchor for the part a gate can't fully check — the *beautiful* in
"beautiful, zero-config." Changing anything here is a [VOUCHED]-level decision: ship nothing
that contradicts this file without the owner's say-so.

> **This is a TARGET.** The current code has not implemented it (theme.ts is Tokyo Night; the
> layout is the old flat 3-row grid). The loop builds toward it via the staged RD0–RD5 backlog,
> safety-net first. Until a section is shipped, do not treat its prose as a passing invariant.

## Overview — the one-line thesis

**A calm, green-forward instrument that is cool, not loud.** machud takes over the terminal
like btop, but its visual language is *refined maximalism*: rich, alive, and striking —
through gradient meters, high-resolution braille graphs, and big hero numbers — yet **muted,
low-contrast, and easy on the eyes**. Cool is the goal; harsh is the failure mode.

**Drama comes from FORM, never from saturation.** When a frame feels flat, add data density,
hierarchy, or resolution — *never* raise chroma or contrast. machud's identity is its
**composition** (hero block number + gradient meter + braille graph + P/E grid), not its
palette; Everforest is a proven low-strain base, not a brand statement.

The seven principles are the whole spec in miniature.

1. **Glanceable.** Every panel answers its core question in under a second — one hero metric,
   BIG, top-left, in a preattentive channel (size + position + accent). *(Few, "5-second rule";
   Ware, preattentive processing.)*
2. **Color = identity + state, on DIFFERENT channels.** Hue marks *which module*. **Status is
   carried by a non-hue, width-1 STATE GLYPH (`○` normal / `◐` elevated / `● ` high) + intensity
   + a text token — never by hue alone**, so it survives a mono terminal and red-green
   color-blindness (the green-forward palette makes green-vs-red the worst confusion pair, so
   redundant encoding is mandatory, not optional). *(Ware; WCAG redundant encoding.)*
3. **Cool by default, dramatic on alarm.** Baseline is already handsome (Everforest muted +
   gradient meters + braille graphs + easing on value change). Healthy = quiet. Only an
   **event** (near-full, thermal, on-battery) earns escalation: brightness, the bar bleeding to
   warn/bad, the state glyph, and — only here — motion. **Motion is alarm/transition-only, never
   a routine-state carrier** (and it is invisible to a single-frame gate, so it is not a
   load-bearing accessibility channel). *(Weiser, Calm Technology; Tufte, "smallest effective difference".)*
4. **Space by value.** Real estate ∝ worth, not democratic. **CPU and Memory get the most room
   (tier-1 hero); Network leads the medium tier; Disk and Sensors compress into a status strip.**
   *(Few.)*
5. **Small multiples + sparklines.** Per-core load is a P/E-grouped grid the eye compares at a
   glance; history is a braille area graph. Maximize data-ink; delete chartjunk. *(Tufte.)*
6. **Consistency.** Every panel's hero number lives in the same spot, same weight ramp; panels
   and bars align. Same things look the same. *(Gestalt: similarity, alignment.)*
7. **Mac-native, honest data.** Show the zero-sudo Apple-Silicon signals others can't (P/E
   cores, adapter PD wattage, memory pressure, thermal pressure). What needs `sudo` is `—`,
   never faked, never prompted. *(Tufte "show the data"; decisions D2/D3.)*

## Colors

The palette is **Everforest** — muted, low-contrast, eye-strain-conscious. The **primary accent
is Everforest's own green (`#a7c080`)**; green-forward is the identity. (A nice fit for a
vue-tui project, but the color is Everforest's, not bent to match Vue.) The `colors` tokens
above are the source of truth; **`src/theme.ts` must be rewritten to mirror them (it is still
Tokyo Night — RD1)**, and verify.mjs pins the hex so they can't silently diverge.

Rules (*Refactoring UI*, Few, Tufte's *smallest effective difference*):
- **Never pure black or pure white.** Base `#2d353b`, text warm off-white.
- **Per-module hue is confined to small ink** — the panel's title / border / hero number only.
  Panel **bodies** (bars, tracks, secondary text) stay neutral grey + the shared green accent,
  so **green is the only hue across panels** and the 7 module hues never become a rainbow. The
  "loud 10%" of 60-30-10 is this per-panel accent, nothing more.
- **Low contrast on purpose.** Use the *weakest* distinction that still reads.
- **No high-saturation complementary pairs on dark** (they vibrate — chromostereopsis). Gradients
  ramp within one hue's luminance.
- **Truecolor is an ENHANCEMENT, not a guarantee (D11).** The gradient look needs 24-bit color;
  macOS's default Terminal.app is 256-color. Detect chalk level and degrade: 256 → solid accent
  (no gradient), 16 → muted named ANSI. Never let a muted hex snap to a saturated basic color
  (the neon the Don'ts forbid). Judge "cool but refined" through the real chalk path at level 2/1,
  not the raw-truecolor prototype.
- **Light/dark follows macOS** automatically (D8); no theme switch (D1). Light is a **faithful,
  lower-drama daylight mode**: gradients compress, it cannot glow, and that is acceptable by
  physics — but hero, alignment, and status glyphs must read as **deliberate** on the cream base.
  Light is not a downgrade; it has the same quality bar minus glow.

## Glyphs & weight (the terminal's typography)

A fixed-width grid has no fonts, so the **character set and ANSI weight are the typography.**
- **Round borders** (`╭─╮`) — calm; heavy/double frames read as loud, not the default.
- **Hierarchy by size → position → weight → color.** Hero number is a 5-row block figure;
  secondary values are normal weight and `dim`.
- **Gradients are same-hue luminance ramps** — gentle, never a hue clash.
- **`⇡ / ⇣`** for charge direction (width-1; **never `⚡`**, a double-width emoji that breaks
  alignment and tofus on glyph-poor terminals). **`○ ◐ ●`** carry status. **`—`** = unavailable.

## Layout (TARGET — not yet shipped; current code is the old flat 3-row grid)

A **single curated wide layout** (D1: no config, no focus/expand) arranged as a **3-tier
hierarchy** — important up top, minor compressed below:

- **Tier 1 — hero (big, with history graph):** **CPU**, **Memory**.
- **Tier 2 — medium:** **Network** (lead — owner-ranked above battery), **GPU**, **Battery**.
  Battery is here, NOT in tier-1: its differentiation is its **data** (live PD wattage), not its
  real estate, so it keeps full watts/health while ceding hero space.
- **Tier 3 — status strip (compact, one line):** **Disk**, **Sensors**, uptime, load.

- **1-cell gutter** inside every panel; **1-cell gap** between panels.
- **Alignment is non-negotiable** (in the wide layout, where bars render): every bar in a panel
  shares **one** label-column width and **one** bar width, so left edges, bar ends, and value
  columns form clean vertical rules. Pad labels to a fixed column; never let a label's length
  decide where its bar starts. (Machine-checked by verify.mjs RD0b.)
- **Depth from value, not borders alone** — a lifted panel background (`bg_lift`) + a dim frame
  separate a panel from the field without shouting.

## Responsive (TARGET — last to build, D4 reopened by @hyf0)

**Scoped to TWO tiers**, not a 5-breakpoint ladder (that is a scope bomb for an unattended loop):
- **Wide** (default): the full 3-tier hierarchy above.
- **Narrow / watch-face:** a single-column fallback; at the smallest size, just the hero numbers
  (CPU% / MEM% / BAT%). The hierarchy IS the degradation order — the least-important tier drops
  first, hero last. *(Marcotte responsive grids; Wroblewski mobile-first; Walton content choreography.)*
- **Auto-adapt to viewport, like D8 adapts to appearance** — not user config, still zero-config (D1).
- **Width-seam caveat:** `useWindowSize()` is reactive (reads `stdout.columns`, then a
  terminal-size probe, falling back to 80 only as a last resort), and `App.vue` already binds it as the width. The catch is the
  `--once`/verify path has no TTY width, so the gate drives width via `COLUMNS` →
  `renderToString({columns})` (main.ts already does this). RD5 must make the responsive `v-if` read
  that **same** width (thread `columns` as a prop), so the breakpoint asserted at COLUMNS=40/120 is
  the one the code branches on.
- **What the gate must assert (RD0b):** widest visible line ≤ COLUMNS at each width (catches the
  existing wide layout already overflowing to ~72 at COLUMNS=60); hero present at wide / absent
  at watch-face (proves the seam works); alignment holds where bars render.

## Per-module specification (TARGET)

- **CPU — tier-1 hero.** Big glanceable % + **real-time per-core load as a P/E-grouped grid**
  (6 P + 6 E on Apple Silicon, from `os.cpus()`). **Apple-Silicon only:** detect cluster count via
  `hw.nperflevels` (Intel = 1) — `cpu.ts` today reads `hw.perflevel0/1.logicalcpu` and treats a
  missing `perflevel1` as `eCount=0`; branch on either, but on a single cluster render ONE unlabeled
  cluster — never `0P+0E` or all-P. Frequency needs `sudo` → omitted.
- **MEM — tier-1 hero.** Used % + swap, **plus the real macOS memory-pressure level** from
  `sysctl kern.memorystatus_vm_pressure_level` (1→Normal / 2→Elevated / 4→High) — the Mac-native
  truth Activity Monitor leads with. (The current usedPct heuristic is only a fallback when the
  sysctl is empty.) Top processes by RSS as support.
- **NETWORK — tier-2 lead.** Adaptive human units (B/KB/MB/GB·s); ▼ down / ▲ up rates with
  sparklines; interface name. **No IP address** — recorded waiver (D12): a LAN IP is low-value
  *and* leaks in the screenshots machud is built to be; show interface + rates instead.
- **GPU — tier-2.** Utilization % + VRAM + sparkline.
- **BATTERY — tier-2 (Mac-exclusive data highlight).** Charge % + `⇡/⇣` charge-state glyph +
  health % + cycles. The differentiator: **adapter max wattage, detected LIVE, never hardcoded**
  (`AdapterDetails.Watts`; varies by cable; show only when `ExternalConnected`, else `—`) **+
  real-time charge power** = `Voltage(mV) × Amperage(mA) / 1e6` W. **Unsigned-int trap:** ioreg
  returns `Amperage` as an **unsigned 64-bit** value, so reinterpret as signed
  (`a = raw >= 2**63 ? raw - 2**64 : raw`) **before** the sign test — only then `a < 0` =
  discharging. (`battery.ts`'s `(-?\d+)` parse does NOT handle this — **RD2** fixes it and injects
  the wraparound value e.g. `18446744073709551179` = −437 mA, via RD0c's injection mechanism, so the
  gate proves the reinterpretation.)
  When `|a| ≈ 0` while charged, show **"charged"**, not "0W". This is battery
  charge wattage, NOT total system draw (that needs `sudo` → omitted). Verify can't see
  on-battery/charging transitions on one host → fixture-tested in **RD2** (via RD0c's mechanism) + manual review of the sign path.
- **DISK — tier-3 strip.** Used % + free, compact. A **state signifier** that is *earned*:
  neutral when roomy; `levelColor`-driven bar + a `NEAR FULL`/`FULL` text token at ≥85% / ≥95%.
  (Today DiskPanel hardcodes the disk hue and wires no levelColor — RD3 fix.)
- **SENSORS — tier-3 strip.** `pmset` thermal pressure + battery pack temp. The collector's 4-state
  enum maps to the status glyph: **Nominal→`○`, Fair→`◐`, Serious/Critical→`●`** (keep the verify.mjs
  4-value enum intact). Die temps / fan RPM need `sudo` → `—`.

## Do's & Don'ts

**Do**
- Make one number the obvious hero of each panel.
- Carry status on the `○/◐/●` glyph + text, in addition to color (color-blind safe), in BOTH palettes.
- Align every bar in a panel to a shared label column + bar width (clean vertical rules).
- Use gradient meters / braille graphs that *encode data*; degrade gradients to a solid accent
  below truecolor.
- Detect adapter wattage, units, core counts, terminal color level, and viewport width **live**.
- Show `—` when data honestly isn't available zero-sudo; record an explicit waiver before
  dropping a previously-live metric (e.g. the LAN IP, D12).

**Don't**
- Don't fix "flat" with saturation or contrast — add form/data/hierarchy instead.
- Don't let status ride hue alone, or use the `⚡` emoji, or pure black/white, or complementary
  hue clashes.
- Don't spend per-module hue on panel bodies — confine it to title/border/hero number.
- Don't treat motion as a routine-state channel (alarm/transition only).
- Don't ask for `sudo`, ever — not even opt-in (D2). Don't give Disk/Sensors hero space.
- Don't ship light mode as an afterthought — it has the full quality bar minus glow.

## Methodology — what this is built on

- **Tufte**, *Visual Display* / *Envisioning Information* — data-ink, sparklines, small multiples,
  **smallest effective difference**.
- **Few**, *Information Dashboard Design* — glanceability, muted-by-default, color as scarce.
- **Ware**, *Information Visualization* — preattentive attributes; chromostereopsis; redundant encoding.
- **Wathan & Schoger**, *Refactoring UI* — no pure black/white, reduce saturation, accent sparingly.
- **Rams**, *Ten Principles* — "Less, but better"; design is unobtrusive.
- **Weiser**, *Calm Technology* — inform from the periphery; demand attention only on events.
- **Marcotte** *Responsive Web Design* / **Wroblewski** *Mobile First* / **Walton** *Content Choreography* — the responsive model.
- **Everforest / Nord / Solarized** palette methodologies — engineered low-eye-strain color.
- **60-30-10** — keep the loud 10% actually 10%.
