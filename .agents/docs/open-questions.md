# machud open questions

Ambiguities parked for the owner's async ruling. Per [autonomy.md](./autonomy.md),
the agent ships the simplest reversible default and logs it here — EXCEPT questions
that touch a `[VOUCHED]` decision, which block until ruled.

Format: `Qn — question · status · default-taken (if any)`

## Open

- **Q3 — keep the color-blind a11y (status glyphs)?** · `default: KEEP` · awaiting @hyf0
  Owner is weighing whether a11y is worth it. For a passive full-screen TUI, a11y realistically =
  **colour-independence only** (screen-reader / keyboard don't apply). That's the `○◐●` status
  glyphs already shipped (RD3 pt1). Case to keep: green(good)/red(bad) is the worst red-green
  colour-blind pair (~8% of men), the glyph costs one width-1 char, survives screenshots/mono, and
  reads as a clean status-LED texture. Default taken: **keep** (built, reversible). If owner rules
  "drop", revert the `statusGlyph()` calls (trivial) and record a "no a11y" decision; if "scope to
  green/red status only", keep on memory/disk/sensors. Non-blocking.

- **Q2 — dark `dim` is a typo'd hex** · `BLOCKED (touches VOUCHED D9)` · awaiting @hyf0
  The RD1 palette review found `dim: "#5c6a64"` (dark) is not a real Everforest colour — it's a
  one-byte typo of the light fg `#5c6a72` (72→64). It lives in DESIGN.md (the [VOUCHED] D9 palette)
  and is mirrored verbatim in `theme.ts`, so it's not a desync and the pin can't catch it. Per
  DESIGN.md's own rule, changing a [VOUCHED] value needs the owner's say-so. **Recommended fix:**
  Everforest dark grey0 `#7a8478` (its labels/tracks grey). Impact: dark-mode dim text/tracks only;
  no render breakage. When ruled: fix DESIGN.md dark `dim`, then mirror to theme.ts (the pin keeps
  them in lockstep).

## Resolved

- **Q1 — "支持 Dark mode" meaning** · `RESOLVED 2026-06-20`
  Owner ruling: support both light and dark palettes, selected automatically from
  macOS system appearance. No user-facing switch/config, so D1's zero-config
  product shape remains intact. Captured as [D8](./decisions.md).
