# Contributing to machud

machud is an **opinionated, zero-config** terminal system monitor. Unlike btop's deep
configurability, machud ships a single, curated dashboard meant to look good and work well
out of the box — that curated experience **is** the product (see [DESIGN.md](./DESIGN.md)
for the visual identity and [`.agents/docs/decisions.md`](./.agents/docs/decisions.md) for
the product boundaries).

Because of that, the contribution model is intentionally narrow. This isn't unfriendliness —
it's what keeps an opinionated tool coherent.

## ✅ Welcome

- **Bug reports.** Open an issue for wrong readings, crashes, rendering glitches, broken
  collectors — anything factually incorrect or that degrades when it shouldn't.
- **Compatibility reports.** Different Macs, terminals, or macOS versions behaving oddly.
- **Ideas — as discussion first.** Have a suggestion? Open an issue to discuss it **before**
  writing any code.

## ⚠️ Generally not accepted

machud is opinionated by design, so these are usually declined:

- **Configuration / theming.** No config files, no per-user layout, no palette options. The single
  curated look — including the palette — is deliberate, not an oversight. (The lone in-app control is
  `t`, an ephemeral auto→light→dark view toggle — D16; it persists nothing.)
- **New features or modules** that alter the curated dashboard, unless agreed in an issue first.
- **Aesthetic changes** (palette, layout, glyphs). The visual identity is a documented
  decision; it is not up for per-PR negotiation.

## ❌ Closed without review

- **Feature PRs opened without a prior, agreed-upon issue will be closed directly.** Not to be
  rude — unscoped feature PRs simply don't fit a curated, opinionated tool, and reviewing them
  wastes everyone's time.

If you're unsure whether something fits, **open an issue and ask first.** Thanks for
understanding what machud is trying to be.
