# machud open questions

Ambiguities parked for the owner's async ruling. Per [autonomy.md](./autonomy.md),
the agent ships the simplest reversible default and logs it here — EXCEPT questions
that touch a `[VOUCHED]` decision, which block until ruled.

Format: `Qn — question · status · default-taken (if any)`

## Open

- **Q2 — dark `dim` is a typo'd hex** · `BLOCKED (touches VOUCHED D9)` · awaiting @hyf0
  The RD1 palette review found `dim: "#5c6a64"` (dark) is not a real Everforest colour — it's a
  one-byte typo of the light fg `#5c6a72` (72→64). It lives in DESIGN.md (the [VOUCHED] D9 palette)
  and is mirrored verbatim in `theme.ts`, so it's not a desync and the pin can't catch it. Per
  DESIGN.md's own rule, changing a [VOUCHED] value needs the owner's say-so. **Recommended fix:**
  Everforest dark grey0 `#7a8478` (its labels/tracks grey). Impact: dark-mode dim text/tracks only;
  no render breakage. When ruled: fix DESIGN.md dark `dim`, then mirror to theme.ts (the pin keeps
  them in lockstep).

## Resolved

- **Q3 — accessibility support?** · `RESOLVED 2026-06-20` · ruled: **drop it**, [VOUCHED]
  Owner ruled a11y out of scope for this passive TUI. Reverted the `○◐●` status glyphs; status is
  colour-only now. Captured as [D14](./decisions.md). (The braille *graph* stays — it's a drawing
  technique, not a11y; the owner confirmed after we cleared up the term.)

- **Q1 — "支持 Dark mode" meaning** · `RESOLVED 2026-06-20`
  Owner ruling: support both light and dark palettes, selected automatically from
  macOS system appearance. No user-facing switch/config, so D1's zero-config
  product shape remains intact. Captured as [D8](./decisions.md).
