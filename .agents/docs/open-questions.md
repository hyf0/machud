# machud open questions

Ambiguities parked for the owner's async ruling. Per [autonomy.md](./autonomy.md),
the agent ships the simplest reversible default and logs it here — EXCEPT questions
that touch a `[VOUCHED]` decision, which block until ruled.

Format: `Qn — question · status · default-taken (if any)`

## Open

_(none — all resolved.)_

## Resolved

- **Q2 — dark `dim` is a typo'd hex** · `RESOLVED 2026-06-21` · ruled: **`#7a8478`**
  Owner ruled the fix. Dark `dim` was `#5c6a64` — a one-byte typo of the light fg `#5c6a72` (72→64),
  not a real Everforest colour. Changed to Everforest dark grey0 **`#7a8478`** in DESIGN.md + `theme.ts`
  (the verify pin keeps them in lockstep). Dark-mode labels/tracks only; no render breakage.

- **Q3 — accessibility support?** · `RESOLVED 2026-06-20` · ruled: **drop it**, [VOUCHED]
  Owner ruled a11y out of scope for this passive TUI. Reverted the `○◐●` status glyphs; status is
  colour-only now. Captured as [D14](./decisions.md). (The braille *graph* stays — it's a drawing
  technique, not a11y; the owner confirmed after we cleared up the term.)

- **Q1 — "支持 Dark mode" meaning** · `RESOLVED 2026-06-20`
  Owner ruling: support both light and dark palettes, selected automatically from
  macOS system appearance. No user-facing switch/config, so D1's zero-config
  product shape remains intact. Captured as [D8](./decisions.md).
