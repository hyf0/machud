// Pure-function unit tests for the 5-row block-figure hero digits (BigNumber's data source).
import { test, expect } from "vite-plus/test";
import { bigDigits } from "../src/lib/bignum";

test("bigDigits always returns exactly 5 rows", () => {
  expect(bigDigits("8")).toHaveLength(5);
  expect(bigDigits("100")).toHaveLength(5);
  expect(bigDigits("-5")).toHaveLength(5);
});

test("each glyph is 3 cols wide, joined by a 1-col gap", () => {
  expect(bigDigits("8")[0]).toBe("███"); // single glyph: 3 cols, top row of '8'
  const two = bigDigits("88");
  for (const row of two) expect(row).toHaveLength(7); // 3 + 1 gap + 3
  expect(two[0]).toBe("███ ███");
});

test("unknown chars degrade to a blank glyph; empty → one blank glyph (never throws)", () => {
  const q = bigDigits("?");
  expect(q).toHaveLength(5);
  expect(q.every((r) => r === "   ")).toBe(true);
  const e = bigDigits("");
  expect(e).toHaveLength(5);
  expect(e[0]).toBe("   ");
});
