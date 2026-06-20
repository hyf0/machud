// THROWAWAY aesthetic prototype — NOT product code. Delete anytime (rm cool-proto.mjs).
// v2: refined / low-strain. 6 named, design-pedigreed palettes, muted by default,
// single-hue luminance graph ramps (no chromostereopsis), accent kept to ~10% (60-30-10).
// Best in a truecolor terminal (iTerm2 / Ghostty / Kitty / WezTerm). Run: node cool-proto.mjs

const FG = (r, g, b) => `\x1b[38;2;${r};${g};${b}m`;
const BG = (r, g, b) => `\x1b[48;2;${r};${g};${b}m`;
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

const hex = (h) => {
  h = h.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
const visLen = (s) => [...s.replace(/\x1b\[[0-9;]*m/g, "")].length;
const padVis = (s, w) => s + " ".repeat(Math.max(0, w - visLen(s)));

const FONT = {
  "0": ["████", "█  █", "█  █", "█  █", "████"],
  "1": ["  █ ", " ██ ", "  █ ", "  █ ", " ███"],
  "2": ["████", "   █", "████", "█   ", "████"],
  "3": ["████", "   █", " ███", "   █", "████"],
  "4": ["█  █", "█  █", "████", "   █", "   █"],
  "5": ["████", "█   ", "████", "   █", "████"],
  "6": ["████", "█   ", "████", "█  █", "████"],
  "7": ["████", "   █", "  █ ", " █  ", " █  "],
  "8": ["████", "█  █", "████", "█  █", "████"],
  "9": ["████", "█  █", "████", "   █", "████"],
  " ": ["    ", "    ", "    ", "    ", "    "],
};
function bigDigits(str, c1, c2) {
  const glyphs = [...str].map((ch) => FONT[ch] || FONT[" "]);
  const raw = [0, 1, 2, 3, 4].map((r) => glyphs.map((g) => g[r]).join(" "));
  const width = raw[0].length;
  return raw.map((line) => {
    let out = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      out += ch === " " ? " " : FG(...mix(c1, c2, width > 1 ? i / (width - 1) : 0)) + ch;
    }
    return out + RESET;
  });
}

function meter(pct, width, c1, c2, track) {
  const filled = Math.round(pct * width);
  let out = "";
  for (let i = 0; i < width; i++) {
    if (i < filled) out += FG(...mix(c1, c2, width > 1 ? i / (width - 1) : 0)) + "█";
    else out += FG(...track) + "─";
  }
  return out + RESET;
}

const DOT = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
];
// single-hue luminance ramp: hi (top, brighter) -> lo (bottom, dim). No hue clash.
function brailleArea(values, W, H, hi, lo) {
  const dotsW = 2 * W,
    dotsH = 4 * H;
  const samp = Array.from({ length: dotsW }, (_, x) => values[Math.floor((x / dotsW) * values.length)]);
  const cells = Array.from({ length: H }, () => Array.from({ length: W }, () => 0));
  for (let x = 0; x < dotsW; x++) {
    const v = Math.max(0, Math.min(1, samp[x]));
    const top = Math.round((1 - v) * (dotsH - 1));
    for (let y = top; y < dotsH; y++) cells[Math.floor(y / 4)][Math.floor(x / 2)] |= DOT[y % 4][x % 2];
  }
  return cells.map((row, cy) => {
    const col = mix(lo, hi, H > 1 ? (H - 1 - cy) / (H - 1) : 1);
    return FG(...col) + row.map((b) => String.fromCharCode(0x2800 | b)).join("") + RESET;
  });
}

const S = { tl: "╭", tr: "╮", bl: "╰", br: "╯", h: "─", v: "│" };

const cpu = 63,
  P = 0.71,
  E = 0.44;
const history = Array.from({ length: 80 }, (_, i) => {
  const base = 0.45 + 0.4 * Math.sin(i / 7) * Math.cos(i / 17);
  return Math.max(0.05, Math.min(0.98, base + (Math.random() - 0.5) * 0.14));
});

function panel(cfg) {
  const inner = 50;
  const bg = hex(cfg.bg),
    fr = hex(cfg.frame),
    title = hex(cfg.title),
    text = hex(cfg.text),
    dim = hex(cfg.dim);
  const aA = hex(cfg.accentA),
    aB = hex(cfg.accentB),
    good = hex(cfg.good),
    warn = hex(cfg.warn),
    bad = hex(cfg.bad);
  const track = mix(bg, fr, 0.55);

  const big = bigDigits(String(cpu), aA, aB);
  const leftW = visLen(big[0]);
  const gap = 2;
  const rightW = inner - 2 - leftW - gap;
  const right = [
    FG(...title) + "CPU" + FG(...dim) + "  ·  Apple M3 Pro",
    FG(...dim) + `${cpu}% · load 4.79 · 12c 6P+6E`,
    "",
    FG(...dim) + "thermal " + FG(...good) + "Nominal",
    "",
  ];
  const hero = [0, 1, 2, 3, 4].map((r) => padVis(big[r], leftW) + " ".repeat(gap) + padVis(right[r] + RESET, rightW));
  const graph = brailleArea(history, inner - 2, 3, hex(cfg.graphHi), hex(cfg.graphLo));

  // Aligned bar stack: every bar shares ONE label column (L) + ONE bar width (B),
  // so left edges, bar ends, and value columns all line up into clean vertical rules.
  const L = 7,
    B = 24;
  const bar = (label, lc, pct, c1, c2, suffix, sc) =>
    padVis(FG(...lc) + label, L) + meter(pct, B, c1, c2, track) + " " + FG(...sc) + suffix;
  const bars = [
    bar("P", text, P, aA, aB, "71%", dim),
    bar("E", text, E, aA, aB, "44%", dim),
    bar("⇡ BAT", good, 0.87, good, aA, "87% · 96W", dim),
    bar("DISK", bad, 0.96, warn, bad, "96% near full", bad),
  ];
  const content = [...hero, "", ...graph, "", ...bars];

  const out = [];
  const titleTxt = ` ${cfg.label} `;
  const top = S.tl + titleTxt + S.h.repeat(Math.max(0, inner - visLen(titleTxt))) + S.tr;
  const line = (s) => BG(...bg) + s + RESET;
  out.push(line(FG(...fr) + top + RESET));
  for (const c of content) out.push(line(FG(...fr) + S.v + RESET + " " + padVis(c, inner - 2) + " " + FG(...fr) + S.v + RESET));
  out.push(line(FG(...fr) + S.bl + S.h.repeat(inner) + S.br + RESET));
  return out;
}

const FLAVORS = [
  { label: "NORD", ref: "北欧冷调·统一降饱和(Nord 方法论)", style: "round",
    bg: "#2e3440", frame: "#434c5e", title: "#e5e9f0", text: "#d8dee9", dim: "#4c566a",
    accentA: "#88c0d0", accentB: "#81a1c1", good: "#a3be8c", warn: "#ebcb8b", bad: "#bf616a",
    graphHi: "#88c0d0", graphLo: "#3b4252" },
  { label: "KANAGAWA", ref: "葛饰北斋水墨·侘寂·暖灰低对比", style: "round",
    bg: "#1f1f28", frame: "#54546d", title: "#dcd7ba", text: "#c8c093", dim: "#54546d",
    accentA: "#7e9cd8", accentB: "#957fb8", good: "#98bb6c", warn: "#e6c384", bad: "#e46876",
    graphHi: "#7e9cd8", graphLo: "#363646" },
  { label: "ROSÉ PINE", ref: "muted 优雅·低对比和谐", style: "round",
    bg: "#232136", frame: "#44415a", title: "#e0def4", text: "#908caa", dim: "#44415a",
    accentA: "#9ccfd8", accentB: "#c4a7e7", good: "#3e8fb0", warn: "#f6c177", bad: "#eb6f92",
    graphHi: "#9ccfd8", graphLo: "#393552" },
  { label: "EVERFOREST", ref: "护眼暖土色·森系低对比", style: "round",
    bg: "#2d353b", frame: "#4f5b58", title: "#d3c6aa", text: "#9da9a0", dim: "#4f5b58",
    accentA: "#a7c080", accentB: "#7fbbb3", good: "#a7c080", warn: "#dbbc7f", bad: "#e67e80",
    graphHi: "#a7c080", graphLo: "#374247" },
  { label: "SOLARIZED", ref: "Schoonover·CIELAB 对称对比·专为降眼疲劳", style: "round",
    bg: "#002b36", frame: "#073642", title: "#93a1a1", text: "#839496", dim: "#586e75",
    accentA: "#268bd2", accentB: "#2aa198", good: "#859900", warn: "#b58900", bad: "#dc322f",
    graphHi: "#2aa198", graphLo: "#073642" },
  { label: "MONO", ref: "Rams『Less but better』·Tufte 最小有效差异", style: "round",
    bg: "#1c1c1f", frame: "#3a3a40", title: "#e6e6ea", text: "#b4b4bc", dim: "#5a5a64",
    accentA: "#8aa0c4", accentB: "#a6b2cc", good: "#8fae8f", warn: "#c9b079", bad: "#c47b7b",
    graphHi: "#9aa6c0", graphLo: "#34343a" },
  { label: "EVERFOREST · LIGHT", ref: "深色的姊妹版 — 同森林绿,奶油底,无法发光", style: "round",
    bg: "#fdf6e3", frame: "#bec5a8", title: "#4c5763", text: "#5c6a72", dim: "#939f91",
    accentA: "#8da101", accentB: "#35a77c", good: "#8da101", warn: "#dfa000", bad: "#f85552",
    graphHi: "#8da101", graphLo: "#c3c8a6" },
];

function swatch(cfg) {
  const sw = (h) => FG(...hex(h)) + "███" + RESET;
  return (
    "    " +
    [cfg.accentA, cfg.accentB, cfg.good, cfg.warn, cfg.bad].map(sw).join(FG(...hex(cfg.dim)) + " ") +
    FG(...hex(cfg.dim)) + "   accent · accent · ok · warn · alert" + RESET
  );
}

console.log("");
console.log(BOLD + "  machud · 6 个护眼·有出处的色板 (真彩色)" + RESET);
console.log(FG(120, 120, 130) + "  muted by default · 同色相明度渐变 · accent≈10% · 同一组数据" + RESET);
for (let i = 0; i < FLAVORS.length; i++) {
  const f = FLAVORS[i];
  console.log("");
  console.log(FG(...hex(f.accentA)) + `  ${i + 1} ─ ` + BOLD + f.label + RESET + FG(120, 120, 130) + "   " + f.ref + RESET);
  console.log(swatch(f));
  for (const ln of panel(f)) console.log("  " + ln);
}
console.log("");
console.log(FG(120, 120, 130) + "  静态帧·真版数值会缓动、图往左流 · 删除: rm cool-proto.mjs" + RESET);
console.log("");
