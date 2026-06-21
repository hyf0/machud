// Pure-function unit tests for the graph primitives. These are the drawing helpers behind the
// Sparkline / Graph / Bar components; the adversarial review flagged division-by-zero and
// index-out-of-range as the risk class, so the edge cases here (empty, width 0, overshoot, NaN,
// max 0) are the point — they must clamp/guard, never throw or leak NaN.
import { test, expect } from "vite-plus/test";
import { sparkline, brailleArea, barCells } from "../src/lib/sparkline";

const BRAILLE = /^[⠀-⣿]*$/;

test("sparkline returns exactly `width` chars, left-padded, scaled to peak", () => {
  expect(sparkline([8, 8, 8, 8], 4, 8)).toBe("████"); // all at peak → full blocks
  expect(sparkline([0, 0], 4, 8)).toBe("  ▁▁"); // below peak → low block, left-padded to width
  expect(sparkline([], 5)).toHaveLength(5); // empty → all spaces, still width-wide
  expect(sparkline([5], 1, 0)).toHaveLength(1); // peak 0 guarded (no divide-by-zero)
  expect(sparkline([100], 1, 50)).toBe("█"); // overshoot clamps to full
  expect(sparkline([1, 2, 3], 0)).toBe(""); // width 0 → empty
});

test("brailleArea returns `height` rows of `width` braille cells, guarded at the edges", () => {
  const rows = brailleArea([8, 8, 8, 8, 8, 8, 8, 8], 4, 2, 8);
  expect(rows).toHaveLength(2);
  for (const r of rows) {
    expect(r).toHaveLength(4);
    expect(r).toMatch(BRAILLE);
  }
  // Edge cases: empty values still render a grid; zero width/height → no rows; no NaN/throw.
  const empty = brailleArea([], 4, 2);
  expect(empty).toHaveLength(2);
  expect(empty.every((r) => r.length === 4 && BRAILLE.test(r))).toBe(true);
  expect(brailleArea([1, 2, 3], 0, 2)).toEqual([]);
  expect(brailleArea([1, 2, 3], 4, 0)).toEqual([]);
});

test("barCells fills proportionally and clamps; total length is always `width`", () => {
  const half = barCells(50, 100, 10);
  expect(half.fill).toBe("█████");
  expect(half.rest).toBe("░░░░░");
  expect(barCells(0, 100, 10)).toEqual({ fill: "", rest: "░".repeat(10) });
  expect(barCells(200, 100, 10).fill).toBe("█".repeat(10)); // overshoot clamps to full
  expect(barCells(5, 0, 10).fill).toBe(""); // max 0 → ratio 0, no divide-by-zero
  expect(barCells(NaN, 100, 10).fill).toBe(""); // non-finite → 0
});
