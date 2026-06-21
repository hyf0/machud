// Pure-function unit tests for the gradient-meter colour helpers (D9/D11). The truecolor↔256
// degradation BEHAVIOR is covered end-to-end in scripts/verify.mjs (FORCE_COLOR 3 vs 2); here we
// pin the maths — parsing, interpolation endpoints, the same-hue ramp, and the n=1 guard.
import { test, expect } from "vite-plus/test";
import { hexToRgb, mix, ramp, supportsTruecolor } from "../src/lib/color";

const HEX = /^#[0-9a-f]{6}$/;

test("hexToRgb parses with or without a leading '#'", () => {
  expect(hexToRgb("#a7c080")).toEqual([167, 192, 128]);
  expect(hexToRgb("a7c080")).toEqual([167, 192, 128]);
});

test("mix interpolates linearly and hits both endpoints exactly", () => {
  expect(mix("#000000", "#ffffff", 0)).toBe("#000000");
  expect(mix("#000000", "#ffffff", 1)).toBe("#ffffff");
  expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
});

test("ramp is a same-hue luminance ramp ending exactly at the colour", () => {
  const r = ramp("#a7c080", 5);
  expect(r).toHaveLength(5);
  expect(r[4]).toBe("#a7c080"); // brightest step is the colour itself
  expect(r[0]).not.toBe("#a7c080"); // first step is a dimmer shade
  expect(r.every((c) => HEX.test(c))).toBe(true); // no NaN / malformed hex
});

test("ramp guards n=1 (no divide-by-zero) → just the colour", () => {
  expect(ramp("#a7c080", 1)).toEqual(["#a7c080"]);
});

test("supportsTruecolor returns a boolean gate (keyed off chalk.level)", () => {
  expect(typeof supportsTruecolor()).toBe("boolean");
});
