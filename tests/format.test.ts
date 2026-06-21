// Pure-function unit tests for the formatters — fast, exact, no rendering. The render layer
// (tests/panels.test.ts) exercises these through the panels; here we pin the formatting rules
// themselves (units, precision, the rounding-rollover fix, honest "—" degradation).
import { test, expect } from "vite-plus/test";
import { clamp, humanBytes, pct, temp, padEnd } from "../src/lib/format";

test("clamp bounds to [lo,hi] (default 0..100)", () => {
  expect(clamp(50)).toBe(50);
  expect(clamp(-5)).toBe(0);
  expect(clamp(150)).toBe(100);
  expect(clamp(5, 0, 10)).toBe(5);
  expect(clamp(20, 0, 10)).toBe(10);
});

test("humanBytes picks the unit and precision (decimal < 100, integer ≥ 100)", () => {
  expect(humanBytes(0)).toBe("0 B");
  expect(humanBytes(512)).toBe("512 B");
  expect(humanBytes(1024)).toBe("1.0 KB");
  expect(humanBytes(1536)).toBe("1.5 KB");
  expect(humanBytes(150 * 1024)).toBe("150 KB"); // ≥ 100 → no decimal
  expect(humanBytes(1024 * 1024)).toBe("1.0 MB");
  expect(humanBytes(16 * 1024 ** 3)).toBe("16.0 GB");
});

test("humanBytes rolls a rounding boundary up to the next unit (never '1024 KB')", () => {
  expect(humanBytes(1048575)).toBe("1.0 MB"); // 1023.999… KB rounds to 1024 → roll to MB
  expect(humanBytes(1073741823)).toBe("1.0 GB");
  expect(humanBytes(1048575)).not.toContain("1024");
});

test("humanBytes appends /s and degrades to — on null / negative / non-finite", () => {
  expect(humanBytes(2048, true)).toBe("2.0 KB/s");
  expect(humanBytes(null)).toBe("—");
  expect(humanBytes(-1)).toBe("—");
  expect(humanBytes(Infinity)).toBe("—");
  expect(humanBytes(NaN)).toBe("—");
});

test("pct and temp round and degrade honestly", () => {
  expect(pct(42.6)).toBe("43%");
  expect(pct(0)).toBe("0%");
  expect(pct(null)).toBe("—");
  expect(pct(Infinity)).toBe("—");
  expect(temp(55.4)).toBe("55°C");
  expect(temp(null)).toBe("—");
});

test("padEnd pads to width and truncates when longer", () => {
  expect(padEnd("ab", 5)).toBe("ab   ");
  expect(padEnd("abcdef", 3)).toBe("abc");
  expect(padEnd("xyz", 3)).toBe("xyz");
});
