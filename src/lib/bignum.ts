// 5-row block figures for the one hero number per panel (DESIGN.md glyphs.big_digit:
// "5-row block figures for the one hero number per panel"; Principle 1 "one hero metric, BIG").
// Each glyph is 3 cols × 5 rows; glyphs are joined with a 1-col gap. bigDigits() returns exactly
// 5 strings, top→bottom, so a caller can colour them as a same-hue luminance ramp.

const HEIGHT = 5;

// 7-segment-style block digits (3×5). " " and "-" are included so padding / negative values
// (e.g. a future signed hero) render without special-casing.
const FONT: Record<string, string[]> = {
  "0": ["███", "█ █", "█ █", "█ █", "███"],
  "1": [" █ ", " █ ", " █ ", " █ ", " █ "],
  "2": ["███", "  █", "███", "█  ", "███"],
  "3": ["███", "  █", "███", "  █", "███"],
  "4": ["█ █", "█ █", "███", "  █", "  █"],
  "5": ["███", "█  ", "███", "  █", "███"],
  "6": ["███", "█  ", "███", "█ █", "███"],
  "7": ["███", "  █", "  █", "  █", "  █"],
  "8": ["███", "█ █", "███", "█ █", "███"],
  "9": ["███", "█ █", "███", "  █", "███"],
  "-": ["   ", "   ", "███", "   ", "   "],
  " ": ["   ", "   ", "   ", "   ", "   "],
};

const BLANK = FONT[" "];

// Render `s` (e.g. "88", "100", "-5") as 5 rows of 3×5 block glyphs joined by a 1-col gap.
// Unknown characters degrade to a blank glyph so the figure never throws on odd input.
export function bigDigits(s: string): string[] {
  const glyphs = [...s].map((c) => FONT[c] ?? BLANK);
  if (glyphs.length === 0) glyphs.push(BLANK);
  return Array.from({ length: HEIGHT }, (_, r) => glyphs.map((g) => g[r]).join(" "));
}
