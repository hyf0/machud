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

// A solid horizontal gauge: filled cells + empty cells, total `width`.
export function barCells(value: number, max: number, width: number): { fill: string; rest: string } {
  const ratio = max > 0 && Number.isFinite(value) ? clamp(value / max, 0, 1) : 0;
  const filled = Math.round(ratio * width);
  return { fill: "█".repeat(filled), rest: "░".repeat(Math.max(0, width - filled)) };
}
