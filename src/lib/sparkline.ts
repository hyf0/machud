import { clamp } from "./format";

const BLOCKS = "▁▂▃▄▅▆▇█";

// Render the most recent `width` samples as a one-line block sparkline. Values
// are scaled against `max` (or the window peak when omitted). Shorter histories
// are left-padded with spaces so the graph grows in from the right.
export function sparkline(values: number[], width: number, max?: number): string {
  if (width <= 0) return "";
  const slice = values.slice(-width);
  const peak = max ?? Math.max(1, ...slice);
  const cells = slice.map((v) => {
    const t = clamp(v / (peak || 1), 0, 1);
    const idx = Math.min(BLOCKS.length - 1, Math.max(0, Math.round(t * (BLOCKS.length - 1))));
    return BLOCKS[idx];
  });
  const pad = Math.max(0, width - cells.length);
  return " ".repeat(pad) + cells.join("");
}

// Braille subpixel layout: each cell is 2 cols × 4 rows of dots. DOT[row][col] is the bit.
const DOT = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
];

// Braille (2×4 subpixel) AREA chart: `height` rows × `width` cells, filled from the bottom up to
// each sample — the flowing btop-style history graph. ~2×width samples fit, left-padded with 0s so
// it grows in from the right. Returns top→bottom rows.
export function brailleArea(values: number[], width: number, height: number, max?: number): string[] {
  if (width <= 0 || height <= 0) return [];
  const dotsW = width * 2;
  const dotsH = height * 4;
  const slice = values.slice(-dotsW);
  const peak = max ?? Math.max(1, ...slice);
  const pad = Math.max(0, dotsW - slice.length);
  const cells: number[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => 0));
  for (let x = 0; x < dotsW; x++) {
    const v = clamp((x < pad ? 0 : slice[x - pad]) / (peak || 1), 0, 1);
    const top = Math.round((1 - v) * (dotsH - 1));
    for (let y = top; y < dotsH; y++) {
      cells[Math.floor(y / 4)][Math.floor(x / 2)] |= DOT[y % 4][x % 2];
    }
  }
  return cells.map((row) => row.map((b) => String.fromCharCode(0x2800 | b)).join(""));
}

// A solid horizontal gauge: filled cells + empty cells, total `width`.
export function barCells(value: number, max: number, width: number): { fill: string; rest: string } {
  const ratio = max > 0 && Number.isFinite(value) ? clamp(value / max, 0, 1) : 0;
  const filled = Math.round(ratio * width);
  return { fill: "█".repeat(filled), rest: "░".repeat(Math.max(0, width - filled)) };
}
