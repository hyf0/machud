#!/usr/bin/env node
// machud verification gate — the machine-checkable safety net for autonomous work.
//
// `vp test` is broken by an upstream version skew, so this standalone script (pure
// node, no vp/vitest) is the authoritative "did I break anything" check. It MUST
// pass before any change is considered done. It:
//   1. builds the bundle,
//   2. asserts the --json snapshot has structurally sound, in-range live values,
//   3. asserts the --once frame renders every panel with no NaN/undefined,
//   4. asserts the live app enters the alternate screen buffer (via a PTY).
//
// Run: pnpm verify   (exits non-zero on the first failure)

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const pexec = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = join(root, "dist", "machud.mjs");

// Strengthen-only floor (autonomy.md gate rule 2): you may ADD assertions (raise this);
// you must STOP-and-ask before removing one. A dropped count turns the gate RED.
const MIN_CHECKS = 89;

let failures = 0;
let total = 0;
const ok = (msg) => console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
const fail = (msg) => {
  failures++;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
};
const check = (cond, msg) => {
  total++;
  return cond ? ok(msg) : fail(msg);
};

async function run(cmd, args, opts = {}) {
  try {
    const { stdout } = await pexec(cmd, args, { cwd: root, maxBuffer: 16 << 20, ...opts });
    return stdout;
  } catch (e) {
    return (e.stdout ?? "") + (e.stderr ?? "");
  }
}

// Like run(), but surfaces the process exit code (run() swallows it) — for asserting
// a spawned binary exits 0. Returns { code, out } with stdout+stderr combined.
async function runExit(cmd, args, opts = {}) {
  try {
    const { stdout, stderr } = await pexec(cmd, args, { maxBuffer: 16 << 20, ...opts });
    return { code: 0, out: (stdout ?? "") + (stderr ?? "") };
  } catch (e) {
    return { code: typeof e.code === "number" ? e.code : 1, out: (e.stdout ?? "") + (e.stderr ?? "") };
  }
}

console.log("\nmachud verify\n");

// ── 1. Build ───────────────────────────────────────────────────────────────
console.log("build");
// Delete the bundle first: if the build FAILS, the bundle stays absent and this
// check goes red — instead of silently passing on a stale artifact.
const { rm } = await import("node:fs/promises");
await rm(bundle, { force: true });
await run("pnpm", ["build"]);
const built = await fileExists(bundle);
check(built, "bundle builds fresh (no stale-pass)");
if (!built) {
  // Build failed → no bundle. Stop here with ONE clear red instead of a cascade of
  // downstream failures (json-parse, every panel, the count pin) that bury the cause.
  console.log("\n\x1b[31mverify: FAIL — build produced no dist/machud.mjs (see build output above)\x1b[0m\n");
  process.exit(1);
}

// ── 2. JSON snapshot: structural + range invariants ─────────────────────────
console.log("\ndata (--json)");
let m = null;
try {
  m = JSON.parse(await run("node", [bundle, "--json"]));
  ok("--json emits valid JSON");
} catch {
  fail("--json emits valid JSON");
}

if (m) {
  const isNum = (v, lo, hi) => typeof v === "number" && !Number.isNaN(v) && v >= lo && v <= hi;
  // present-REQUIRED: null/NaN FAILS (a silently-degraded metric must turn the gate red).
  const inRange = (v, lo, hi) => isNum(v, lo, hi);
  // honestly-nullable (e.g. no GPU util / no battery on this Mac): null is allowed.
  const inRangeOrNull = (v, lo, hi) => v == null || isNum(v, lo, hi);

  // CPU
  check(Array.isArray(m.cpu.cores) && m.cpu.cores.length > 0, "cpu has cores");
  check(
    m.cpu.pCount + m.cpu.eCount === m.cpu.cores.length || (m.cpu.pCount === 0 && m.cpu.eCount === 0),
    "cpu P+E counts match core list (or no P/E split — Intel single cluster)",
  );
  check(inRange(m.cpu.usage, 0, 100), "cpu usage in 0–100");
  check(m.cpu.cores.every((c) => inRange(c.usage, 0, 100)), "every core usage in 0–100");
  check(typeof m.cpu.model === "string" && m.cpu.model.length > 0, "cpu model present");
  check(Array.isArray(m.cpu.topProcs), "cpu exposes a topProcs list");

  // Memory
  check(m.memory.total > 0, "memory total > 0");
  check(inRange(m.memory.usedPct, 0, 100), "memory usedPct in 0–100");
  check(["Normal", "Elevated", "High"].includes(m.memory.pressure), "memory pressure valid");

  // GPU / Disk / Net
  check(inRangeOrNull(m.gpu.usage, 0, 100), "gpu usage null or 0–100");
  check(m.disk.total > 0 && inRange(m.disk.usedPct, 0, 100), "disk total>0 and usedPct in range");
  check(
    m.disk.total > 0 && Math.abs(m.disk.usedPct - ((m.disk.total - m.disk.free) / m.disk.total) * 100) < 1.5,
    "disk usedPct = (total−free)/total (APFS-correct, not df's misleading per-volume Used)",
  );
  check(m.net.rxBps >= 0 && m.net.txBps >= 0, "net rates non-negative");
  check(!("ip" in m.net), "net carries no ip field (D12 privacy/screenshot waiver)");

  // Battery / Sensors
  check(inRange(m.battery.pct, 0, 100), "battery pct in 0–100");
  check(inRangeOrNull(m.battery.healthPct, 0, 100), "battery health null or 0–100");
  check(inRangeOrNull(m.battery.adapterWatts, 0, 300), "battery adapterWatts null or 0–300");
  check(inRangeOrNull(m.battery.chargeWatts, -200, 200), "battery chargeWatts null or -200–200");
  check(
    !(typeof m.battery.chargeWatts === "number" && m.battery.chargeWatts < 0 && m.battery.charging),
    "battery: never 'charging' while discharging (chargeWatts<0)",
  );
  check(
    ["Nominal", "Fair", "Serious", "Critical"].includes(m.sensors.thermalPressure),
    "thermal pressure valid",
  );
  check(["light", "dark"].includes(m.appearance.mode), "appearance mode valid");

  // No corrupt values anywhere in the tree.
  const blob = JSON.stringify(m);
  check(!/null,"ts":0/.test(blob) && m.ts > 0, "snapshot timestamp set");
  check(!blob.includes("NaN"), "no NaN in snapshot");
}

// ── 3. Rendered frame: all panels, no corruption ────────────────────────────
console.log("\nrender (--once)");
const frame = await run("node", [bundle, "--once"], { env: { ...process.env, COLUMNS: "120" } });
for (const title of ["CPU", "MEMORY", "GPU", "DISK", "NETWORK", "BATTERY", "SENSORS"]) {
  check(frame.includes(title), `panel "${title}" renders`);
}
check(/\d\d:\d\d:\d\d/.test(frame), "header clock renders (HH:MM:SS)");
check(!/NaN|undefined/.test(frame), "frame has no NaN/undefined");
// Zero-sudo identity: the UI never shows the word "sudo" — no dead "— sudo" rows for permanently
// sudo-only metrics (fan RPM etc.); they're omitted (D2 display ruling). Also catches the old footer.
check(!frame.includes("sudo"), "no 'sudo' shown anywhere in the frame (D2 — omit dead sudo-only rows)");
// Visual-correctness harness (RD0b): no rendered line may exceed the wide target.
// Feature-coupled visual assertions (alignment, no-⚡, narrow widths, FORCE_COLOR
// fallback) land WITH their features in RD3/RD4/RD5 — see backlog.
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");
const widest = Math.max(0, ...frame.split("\n").map((l) => [...stripAnsi(l)].length));
check(widest <= 120, `no overflow at wide target (widest line ${widest} ≤ 120)`);
// Responsive seam (RD5/D4): the layout branches on the gate-controlled width (COLUMNS →
// renderToString → columns prop), not a TTY-only source. At a watch-face width the hero is ABSENT
// (no BigNumber/graphs — they need room) and nothing overflows; at 120 the hero IS present (the
// BigNumber injection test in §8). Together they prove the breakpoint the code branches on.
const f40 = await run("node", [bundle, "--once"], { env: { ...process.env, COLUMNS: "40" } });
const widest40 = Math.max(0, ...f40.split("\n").map((l) => [...stripAnsi(l)].length));
check(widest40 <= 40, `no overflow at narrow width (widest line ${widest40} ≤ 40)`);
const f40hero = await run("node", [bundle, "--once"], {
  env: { ...process.env, COLUMNS: "40", MACHUD_TEST_OVERRIDE: JSON.stringify({ cpu: { usage: 88 } }) },
});
check(!f40hero.includes("█ █ █ █"), "narrow layout drops the BigNumber hero (responsive seam works)");
check(!frame.includes("⚡"), "no ⚡ emoji in the frame (charge state uses ⇡/⇣)");
check(/[⠁-⣿]/.test(frame), "braille area history graph renders (filled braille)");
// No Vue render warnings (invalid prop types, etc.). They go to stderr on a SUCCESSFUL render, so the
// stdout frame checks above can't see them — capture both streams via runExit.
const rWarn = await runExit("node", [bundle, "--once"], { cwd: root, env: { ...process.env, COLUMNS: "120" } });
check(!rWarn.out.includes("[Vue warn]"), "no Vue render warnings (clean stderr)");
// Panel-seam alignment: the major vertical divider must line up across the 3 tiers. Per tier's
// border-top row, take the RIGHT panel's left corner (last ╭); they must align within a couple cols.
{
  const corners = stripAnsi(frame)
    .split("\n")
    .filter((l) => l.includes("╭"))
    .map((l) => {
      const cs = [...l].flatMap((c, j) => (c === "╭" ? [j] : []));
      return cs[cs.length - 1];
    });
  const aligned = corners.length >= 3 && Math.max(...corners) - Math.min(...corners) <= 2;
  check(aligned, `panel seams align across tiers (right-edge cols ${corners.join("/")})`);
}

// ── 4. Appearance modes ────────────────────────────────────────────────────
console.log("\nappearance");
// Internal test hook: lets the gate exercise both palettes without changing the
// host macOS appearance. The product path still follows the system preference.
for (const mode of ["light", "dark"]) {
  const env = { ...process.env, COLUMNS: "120", MACHUD_TEST_APPEARANCE: mode };
  let themed = null;
  try {
    themed = JSON.parse(await run("node", [bundle, "--json"], { env }));
    ok(`${mode} mode emits valid JSON`);
  } catch {
    fail(`${mode} mode emits valid JSON`);
  }
  check(themed?.appearance?.mode === mode, `${mode} mode selected`);

  const themedFrame = await run("node", [bundle, "--once"], { env });
  check(themedFrame.includes("CPU"), `${mode} mode frame renders`);
  check(!/NaN|undefined/.test(themedFrame), `${mode} mode frame has no NaN/undefined`);
}

// ── 5. Alternate screen takeover (D7) via a PTY ─────────────────────────────
console.log("\nalternate screen (D7)");
// macOS `script` allocates a PTY so stdout.isTTY is true and altscreen engages.
// Feed 'q' after mount so the app quits cleanly and restores the screen.
const raw = join(root, "dist", ".verify-pty.raw");
await run("sh", [
  "-c",
  `( sleep 2.5; printf 'q' ) | COLUMNS=120 LINES=45 script -q ${raw} node ${bundle} >/dev/null 2>&1 || true`,
]);
const pty = await run("sh", ["-c", `cat -v ${raw} 2>/dev/null; rm -f ${raw}`]);
check(pty.includes("1049h"), "enters alternate screen (1049h)");
check(pty.includes("1049l"), "restores on quit (1049l)");
check(pty.includes("macOS system monitor"), "dashboard renders inside alt screen");

// ── 5b. Manual theme toggle: `t` cycles auto→light→dark (D16) ────────────────
// D16 (owner-vouched): the default stays `auto` (follow macOS appearance); `t`
// cycles auto→light→dark→auto. The override is ephemeral (nothing is persisted)
// and wins over the system appearance while set. MACHUD_TEST_THEME_PRESSES applies
// the REAL cycle N times from `auto`, so `--once` can exercise the exact key-press
// contract deterministically. The panel TITLE colour is a clean light/dark
// discriminator (flat, never a gradient endpoint), so it never cross-contaminates.
console.log("\ntheme toggle (D16)");
const DARK_TITLE = "38;2;211;198;170"; // theme.dark.title  #d3c6aa
const LIGHT_TITLE = "38;2;92;106;114"; // theme.light.title #5c6a72
const toggleFrame = (presses, sysMode) =>
  run("node", [bundle, "--once"], {
    env: { ...process.env, FORCE_COLOR: "3", COLUMNS: "120", MACHUD_TEST_APPEARANCE: sysMode, MACHUD_TEST_THEME_PRESSES: String(presses) },
  });
{
  const f0 = await toggleFrame(0, "dark");
  check(f0.includes(DARK_TITLE) && !f0.includes(LIGHT_TITLE), "0 presses = auto: follows a dark system (dark palette)");

  const f1 = await toggleFrame(1, "dark");
  check(f1.includes(LIGHT_TITLE) && !f1.includes(DARK_TITLE), "press 1: auto→light overrides a dark system");

  const f2 = await toggleFrame(2, "light");
  check(f2.includes(DARK_TITLE) && !f2.includes(LIGHT_TITLE), "press 2: auto→light→dark overrides a light system");

  const f3d = await toggleFrame(3, "dark");
  check(f3d.includes(DARK_TITLE) && !f3d.includes(LIGHT_TITLE), "press 3: cycle wraps to auto (dark system→dark)");

  const f3l = await toggleFrame(3, "light");
  check(f3l.includes(LIGHT_TITLE) && !f3l.includes(DARK_TITLE), "press 3: cycle wraps to auto (light system→light)");
}
// Real keystroke through a PTY proves the `t` key is wired (not just the env seam).
// System=light, so the startup flash AND every auto frame are light — a DARK title
// can therefore only appear if `t` actually cycled auto→light→dark. Flash-proof.
{
  const tRaw = join(root, "dist", ".verify-toggle.raw");
  await run("sh", [
    "-c",
    `( sleep 2.5; printf 't'; sleep 0.3; printf 't'; sleep 1.3; printf 'q' ) | COLUMNS=120 LINES=45 FORCE_COLOR=3 MACHUD_TEST_APPEARANCE=light script -q ${tRaw} node ${bundle} >/dev/null 2>&1 || true`,
  ]);
  const toggled = await run("sh", ["-c", `cat -v ${tRaw} 2>/dev/null; rm -f ${tRaw}`]);
  check(toggled.includes(DARK_TITLE), "live `t`×2 cycles auto→light→dark (PTY keystroke wired)");
}
// Startup theme: no light-palette FLASH before the first poll on a dark-mode Mac. App seeds the
// initial appearance synchronously (detectAppearanceSync) so the FIRST paint is already dark; the
// async poll lands ~100 ms later — too late to set the initial theme. RED before the fix: the theme
// reactive + emptyMetrics both default to light, so ~9 light frames paint before the poll flips.
{
  const flashRaw = join(root, "dist", ".verify-flash.raw");
  await run("sh", [
    "-c",
    `( sleep 2.5; printf 'q' ) | COLUMNS=120 LINES=45 FORCE_COLOR=3 MACHUD_TEST_APPEARANCE=dark script -q ${flashRaw} node ${bundle} >/dev/null 2>&1 || true`,
  ]);
  const flash = await run("sh", ["-c", `cat -v ${flashRaw} 2>/dev/null; rm -f ${flashRaw}`]);
  check(flash.includes(DARK_TITLE) && !flash.includes(LIGHT_TITLE), "no light-palette flash at startup on a dark system");
}

// ── 6. Packaging: `npx machud` must be runnable (D13) ───────────────────────
console.log("\npackaging (npx, D13)");
{
  const { readFile } = await import("node:fs/promises");
  const binFirstLine = (await readFile(bundle, "utf8")).split("\n", 1)[0];
  check(binFirstLine === "#!/usr/bin/env node", "built bin starts with a node shebang");
  let pkg = {};
  try {
    pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  } catch {
    /* leave pkg empty → assertions below fail */
  }
  check(pkg.private !== true, "package is publishable (not private)");
  check(
    typeof pkg.bin?.machud === "string" && (await fileExists(join(root, pkg.bin.machud))),
    "bin.machud resolves to a built file",
  );
  // engines.node must NOT understate the runtime's floor — a too-low floor lets npm
  // install onto a Node that crashes at module load (@vue-tui/runtime pulls string-width@8,
  // whose top-level /v RegExp throws SyntaxError below Node 22.18 / V8 12).
  const floor = (r) => (r || "").match(/(\d+)\.(\d+)\.(\d+)/)?.slice(1).map(Number) ?? [0, 0, 0];
  const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  let rtEng = "";
  try {
    rtEng = JSON.parse(await readFile(join(root, "node_modules/@vue-tui/runtime/package.json"), "utf8")).engines?.node ?? "";
  } catch {
    /* runtime not resolvable → assertion fails loudly */
  }
  check(
    rtEng !== "" && cmp(floor(pkg.engines?.node), floor(rtEng)) >= 0,
    `engines.node (${pkg.engines?.node}) >= @vue-tui/runtime floor (${rtEng})`,
  );
}

// ── 7. Theme ↔ DESIGN.md (RD1) ──────────────────────────────────────────────
console.log("\ntheme ↔ DESIGN.md");
{
  const { readFile } = await import("node:fs/promises");
  const designMd = await readFile(join(root, "DESIGN.md"), "utf8");
  const themeSrc = await readFile(join(root, "src", "theme.ts"), "utf8");
  // DESIGN.md is the source of truth (D9); theme.ts must mirror it token-for-token so the
  // palette can never silently desync from the spec (autonomy.md gate rule 5). Parse both
  // into {key: hex} maps per mode (normalizing bg_lift/bgLift) and compare KEY-BY-KEY — a
  // bare includes() can't catch a hex on the wrong key.
  const hexMap = (text) => {
    const map = {};
    for (const mm of text.matchAll(/([a-zA-Z_]+)\s*:\s*"(#[0-9a-fA-F]{6})"/g)) {
      map[mm[1].replace(/_/g, "").toLowerCase()] = mm[2].toLowerCase();
    }
    return map;
  };
  const sliceBetween = (text, start, end) => {
    const i = text.indexOf(start);
    if (i < 0) return "";
    const j = text.indexOf(end, i + start.length);
    return text.slice(i, j < 0 ? undefined : j);
  };
  for (const mode of ["dark", "light"]) {
    const dMap = hexMap(sliceBetween(designMd, `\n  ${mode}:`, mode === "dark" ? "\n  light:" : "\ncolor_tier:"));
    const tMap = hexMap(sliceBetween(themeSrc, `${mode}: {`, "},"));
    const tKeys = Object.keys(tMap);
    const bad = tKeys.find((k) => dMap[k] !== tMap[k]);
    check(
      tKeys.length >= 17 && !bad,
      bad
        ? `theme.ts ${mode}.${bad}=${tMap[bad]} ≠ DESIGN.md ${dMap[bad] ?? "(absent)"}`
        : `theme.ts ${mode} mirrors all ${tKeys.length} DESIGN.md tokens`,
    );
  }
  check(!/#1a1b26|#7aa2f7/i.test(themeSrc), "theme.ts has no leftover Tokyo Night tokens");
}

// ── 8. Test-injection mechanism (RD0c) ──────────────────────────────────────
// Generalizes the MACHUD_TEST_APPEARANCE hook: a JSON env override deep-merged into the
// snapshot, so the gate can exercise states this host can't produce (RD2 uses it for
// on-battery watts / high memory pressure / Intel / near-full disk). Not a product surface.
console.log("\ntest injection (RD0c)");
{
  const env = { ...process.env, MACHUD_TEST_OVERRIDE: JSON.stringify({ memory: { pressure: "High" } }) };
  let injected = null;
  try {
    injected = JSON.parse(await run("node", [bundle, "--json"], { env }));
  } catch {
    /* parse fail → assertion fails */
  }
  check(injected?.memory?.pressure === "High", "MACHUD_TEST_OVERRIDE deep-merges a synthetic value into the snapshot");
}
// Provenance (RD2): prove memory.ts reads the REAL kern.memorystatus_vm_pressure_level (1/2/4),
// not the usedPct heuristic. 4→High discriminates on an idle host; 1→Normal discriminates on a
// LOADED host (heuristic would give Elevated/High there) — together they cover any host state.
for (const [lvl, want] of [
  ["4", "High"],
  ["1", "Normal"],
]) {
  const env = { ...process.env, MACHUD_TEST_PRESSURE_LEVEL: lvl };
  let j = null;
  try {
    j = JSON.parse(await run("node", [bundle, "--json"], { env }));
  } catch {
    /* parse fail → assertion fails */
  }
  check(j?.memory?.pressure === want, `memory pressure from the real sysctl level (${lvl} → ${want})`);
}
{
  // Provenance (RD2): ioreg Amperage is UNSIGNED 64-bit. Inject the discharge wraparound and
  // require chargeWatts < 0 — without the signed reinterpret it would be a huge POSITIVE number.
  const env = { ...process.env, MACHUD_TEST_AMPERAGE: "18446744073709551179" };
  let j = null;
  try {
    j = JSON.parse(await run("node", [bundle, "--json"], { env }));
  } catch {
    /* parse fail → assertion fails */
  }
  check(
    j?.battery?.present === false ||
      (typeof j?.battery?.chargeWatts === "number" && j.battery.chargeWatts < 0),
    "battery chargeWatts handles unsigned-Amperage wraparound (→ negative on discharge, or no battery)",
  );
}
{
  // Provenance (RD2): on a single-cluster / Intel Mac (no perflevel sysctls) cpu must model
  // ONE cluster, never 0P+0E. Force the no-perflevel path; require pCount==cores, eCount==0.
  const env = { ...process.env, MACHUD_TEST_NO_PERFLEVEL: "1" };
  let j = null;
  try {
    j = JSON.parse(await run("node", [bundle, "--json"], { env }));
  } catch {
    /* parse fail → assertion fails */
  }
  check(
    j?.cpu?.eCount === 0 && j?.cpu?.pCount === j?.cpu?.cores?.length && j.cpu.pCount > 0,
    "cpu models a single cluster when no P/E split (Intel — never 0P+0E)",
  );
}
{
  // Provenance: network.ts parses `netstat -ibn` byte columns by indexing from the RIGHT
  // (Ibytes = p[len-5], Obytes = p[len-2]). An address-less default route (utun*/VPN, lo0) has NO
  // MAC column → 10 fields, not 11; the old fixed indices p[6]/p[9] would read Opkts as RX and
  // Coll (always 0) as TX. Inject a 10-field utun row → rxTotal/txTotal must be the BYTE columns.
  const env = {
    ...process.env,
    MACHUD_TEST_NET_IFACE: "utun9",
    MACHUD_TEST_NETSTAT: "utun9 1380 <Link#30> 11 0 22492 33 0 19073 0",
  };
  let j = null;
  try {
    j = JSON.parse(await run("node", [bundle, "--json"], { env }));
  } catch {
    /* parse fail → assertion fails */
  }
  check(
    j?.net?.rxTotal === 22492 && j?.net?.txTotal === 19073,
    "network reads byte columns on an address-less default route (utun: 10-field row)",
  );
}
{
  // Regression: an interface WITH a MAC address has 11 fields; from-right indexing must still land
  // on Ibytes/Obytes. Inject an en0 row → rxTotal/txTotal = the byte columns (88888/77777).
  const env = {
    ...process.env,
    MACHUD_TEST_NET_IFACE: "en0",
    MACHUD_TEST_NETSTAT: "en0 1500 <Link#14> aa:bb:cc:dd:ee:ff 11 0 88888 33 0 77777 0",
  };
  let j = null;
  try {
    j = JSON.parse(await run("node", [bundle, "--json"], { env }));
  } catch {
    /* parse fail → assertion fails */
  }
  check(
    j?.net?.rxTotal === 88888 && j?.net?.txTotal === 77777,
    "network reads byte columns on an 11-field row (en0 regression — from-right indexing)",
  );
}
{
  // Disk near-full (RD3): inject 96% used → the EARNED "FULL" signal must render (text channel).
  const env = { ...process.env, MACHUD_TEST_OVERRIDE: JSON.stringify({ disk: { usedPct: 96 } }), COLUMNS: "120" };
  const f = await run("node", [bundle, "--once"], { env });
  check(f.includes("FULL"), "disk shows the earned near-full signal (96% → FULL)");
}
{
  // BigNumber hero (RD4): the CPU panel's overall % renders as 5-row block figures (DESIGN.md
  // glyphs.big_digit; Principle 1 "one hero metric, BIG"). Inject 88 → the two big 8s carry the
  // alternating mid-rows "█ █ █ █" that no bar/braille/sparkline produces — a value-specific signature.
  const env = { ...process.env, MACHUD_TEST_OVERRIDE: JSON.stringify({ cpu: { usage: 88 } }), COLUMNS: "120" };
  const f = await run("node", [bundle, "--once"], { env });
  check(f.includes("█ █ █ █"), "CPU hero renders a BigNumber (injected 88 → 5-row block figures)");
}
{
  // Per-core grid (RD4): each core is coloured by ITS OWN load (levelColor), not its cluster — the
  // small-multiples the old single cluster-coloured row couldn't show. Inject one cluster of mid-load
  // (70% → ▆, warn-tier) cores; the grid must emit a WARN-coloured ▆ (dark #dbbc7f). The old row
  // coloured every P core with the cpu accent (green), never warn. (▆ comes only from the cores grid /
  // sparklines, and only the grid runs levelColor, so warn-▆ is collision-free.)
  const cores = Array.from({ length: 8 }, () => ({ usage: 70, cluster: "P" }));
  const env = {
    ...process.env,
    FORCE_COLOR: "3",
    COLORTERM: "truecolor",
    COLUMNS: "120",
    MACHUD_TEST_APPEARANCE: "dark",
    MACHUD_TEST_OVERRIDE: JSON.stringify({ cpu: { cores, pCount: 8, eCount: 0 } }),
  };
  const f = await run("node", [bundle, "--once"], { env });
  check(/38;2;219;188;127m▆/.test(f), "CPU per-core grid colours each core by load (mid-load → warn-tier ▆)");
}
{
  // Top-process density (RD4): the CPU hero lists top CPU consumers so it EARNS its space (DESIGN
  // Principle 8 — "a big box holding three numbers is a failure"). Inject a distinctive name → renders.
  const env = {
    ...process.env,
    MACHUD_TEST_OVERRIDE: JSON.stringify({ cpu: { topProcs: [{ name: "ZZTOPPROC", pct: 73 }] } }),
    COLUMNS: "120",
  };
  const f = await run("node", [bundle, "--once"], { env });
  check(f.includes("ZZTOPPROC"), "CPU hero lists top processes (density — injected name renders)");
}
{
  // MEM hero density (RD4): the MEMORY panel leads with a BigNumber too (tier-1 parity with CPU,
  // Principle 6 consistency). Inject memory.usedPct=88 with cpu.usage=11 → only a MEM BigNumber can
  // emit the "█ █ █ █" 88-signature (CPU shows 11; the MEM graph/bars don't use spaced blocks).
  const env = {
    ...process.env,
    MACHUD_TEST_OVERRIDE: JSON.stringify({ cpu: { usage: 11 }, memory: { usedPct: 88 } }),
    COLUMNS: "120",
  };
  const f = await run("node", [bundle, "--once"], { env });
  check(f.includes("█ █ █ █"), "MEMORY hero renders a BigNumber (injected 88 → block figures)");
}
{
  // Stability (RD4, Principle 8): the BATTERY power row is ALWAYS present (—/on AC off-discharge), so
  // plugging in or finishing a charge never changes the panel's height (DESIGN's cited "height jump").
  // Inject a charged-on-AC battery with no charge flow → the power row must still render.
  const env = {
    ...process.env,
    MACHUD_TEST_OVERRIDE: JSON.stringify({ battery: { present: true, charging: false, chargeWatts: null, adapterWatts: null } }),
    COLUMNS: "120",
  };
  const sf = stripAnsi(await run("node", [bundle, "--once"], { env }));
  check(/power +(on AC|—)/.test(sf), "battery power row is always present (stability — on AC/— with no flow)");
}
{
  // Colour-tier / D11 (RD3): the gradient gate (supportsTruecolor = chalk.level>=3) is the SAME
  // signal vue-tui uses to emit 24-bit, so they can't diverge. At chalk.level 3 the meters render
  // a per-cell 38;2 gradient; at level 2 (256-colour, e.g. Terminal.app) it degrades to solid with
  // NO 38;2 codes (no banding). We drive the level deterministically via FORCE_COLOR.
  const hi = await run("node", [bundle, "--once"], {
    env: { ...process.env, COLORTERM: "truecolor", FORCE_COLOR: "3", COLUMNS: "120" },
  });
  const lo = await run("node", [bundle, "--once"], {
    env: { ...process.env, COLORTERM: "", FORCE_COLOR: "2", COLUMNS: "120" },
  });
  // Per-bar gradient: ONE bar line must carry several distinct 38;2 cells — a solid-colour
  // regression (broken ramp / fill-length gate) would collapse this to ~1, even though frame-wide
  // chrome colours alone exceed any whole-frame threshold.
  const barLine = hi.split("\n").find((l) => l.includes("used ")) ?? "";
  const barColors = new Set(barLine.match(/38;2;\d+;\d+;\d+/g) ?? []).size;
  check(
    barColors >= 3 && hi.includes("CPU") && !/NaN|undefined/.test(hi),
    `truecolor renders a per-cell gradient meter (${barColors} colours in one bar)`,
  );
  check(
    !lo.includes("\x1b[38;2;") && lo.includes("CPU") && !/NaN|undefined/.test(lo),
    "256-colour (chalk.level 2) degrades to solid — no 24-bit codes",
  );
}
{
  // B1: a battery in "finishing charge" (end-of-charge, ~99%) is ACTIVELY charging — but \bcharging\b
  // matches the word "charging", not "charge", so it read as not-charging. MACHUD_TEST_BATT_STATE feeds
  // the parsed state. Require charging=true; "charged" (full, on AC) must stay false (regression guard).
  let chg = null;
  let full = null;
  try {
    chg = JSON.parse(await run("node", [bundle, "--json"], { env: { ...process.env, MACHUD_TEST_BATT_STATE: "finishing charge" } }));
  } catch {
    /* parse fail → assertion fails */
  }
  try {
    full = JSON.parse(await run("node", [bundle, "--json"], { env: { ...process.env, MACHUD_TEST_BATT_STATE: "charged" } }));
  } catch {
    /* parse fail → assertion fails */
  }
  check(chg?.battery?.charging === true, "battery 'finishing charge' counts as charging (B1)");
  check(full?.battery?.charging === false, "battery 'charged' (full, on AC) is NOT charging (regression)");
}
{
  // Never-crash invariant (CpuPanel): a malformed/empty loadAvg must DEGRADE, not take down the whole
  // UI. Inject loadAvg:[] (arrays replace) → the one-shot render must still exit 0 and draw the panel.
  const r = await runExit("node", [bundle, "--once"], {
    cwd: root,
    env: { ...process.env, COLUMNS: "120", MACHUD_TEST_OVERRIDE: JSON.stringify({ cpu: { loadAvg: [] } }) },
  });
  check(r.code === 0 && r.out.includes("CPU") && !r.out.includes("toFixed"), "CpuPanel degrades on empty loadAvg (never crash)");
}
{
  // format.humanBytes: rounding must roll to the next unit, never print "1024 KB" (= 1 MB). Inject a
  // net rate that rounds up at the KB boundary → the frame shows "1.0 MB", never "1024 KB".
  const env = { ...process.env, MACHUD_TEST_OVERRIDE: JSON.stringify({ net: { rxBps: 1048575 } }), COLUMNS: "120" };
  const f = await run("node", [bundle, "--once"], { env });
  check(f.includes("1.0 MB") && !f.includes("1024 KB"), "humanBytes rolls 1024 KB up to 1.0 MB (no '1024 <unit>')");
}
{
  // Gate-coverage: GPU/DISK/BATTERY/NET/SENSORS headline VALUES must render in the FRAME — previously
  // asserted only in --json + by panel title, so a render-layer break (wrong binding, empty formatter,
  // dropped row) could stay green. Inject distinctive values → each must appear in the wide frame.
  const env = {
    ...process.env,
    COLUMNS: "120",
    MACHUD_TEST_OVERRIDE: JSON.stringify({
      gpu: { usage: 43 },
      disk: { usedPct: 59 },
      battery: { present: true, pct: 67 },
      net: { rxBps: 3145728 },
      sensors: { thermalPressure: "Fair" },
    }),
  };
  const f = stripAnsi(await run("node", [bundle, "--once"], { env }));
  check(
    f.includes("43%") && f.includes("59%") && f.includes("67%") && f.includes("3.0 MB") && f.includes("Fair"),
    "GPU/DISK/BATTERY/NET/SENSORS headline values render in the frame (not just JSON)",
  );
}
{
  // Gate-coverage: the narrow/watch-face view must render real labeled content, not merely fit width
  // (the old gate asserted only widest≤40 + no-hero, so a blank narrow view would pass). Inject
  // distinctive cpu/battery values at COLUMNS=40 → the compact rows must show them.
  const env = {
    ...process.env,
    COLUMNS: "40",
    MACHUD_TEST_OVERRIDE: JSON.stringify({ cpu: { usage: 44 }, battery: { present: true, pct: 71 } }),
  };
  const f = stripAnsi(await run("node", [bundle, "--once"], { env }));
  check(f.includes("CPU 44%") && f.includes("BAT 71%"), "narrow view renders labeled content (CPU/BAT values at COLUMNS=40)");
}
{
  // Gate-coverage: the footer advertises the keybindings; a regression dropping "t theme" would
  // silently lose toggle discoverability while the toggle still works. Assert the wide footer hint.
  const f = stripAnsi(await run("node", [bundle, "--once"], { env: { ...process.env, COLUMNS: "120" } }));
  check(f.includes("q quit") && f.includes("t theme"), "footer advertises the q/t keybindings");
}

// ── 9. Real npx artifact: pack → install → exec (RD0d, D13) ─────────────────
// The packaging section (6) inspects the LOCAL checkout; it cannot catch a bug that
// only surfaces from the *installed* package: a prepack that doesn't build, a bin that
// won't launch, or — the big one — a runtime import missing from `dependencies` (deps
// are EXTERNAL in this bundle, so an undeclared import crashes `npx machud` at load).
// This packs the way a pnpm project publishes (`pnpm pack` resolves `catalog:` + runs
// prepack), installs the tarball into a throwaway project the way `npx` does (npm),
// then runs the INSTALLED bin for real. Heaviest section (a clean pack rebuilds + a
// real install resolves the dep tree) → kept last, just before the count pin.
console.log("\nnpx artifact (pack → install → exec, D13)");
{
  const { mkdtemp, mkdir, writeFile, readdir, rm: rmrf } = await import("node:fs/promises");
  const os = await import("node:os");
  const tmp = await mkdtemp(join(os.tmpdir(), "machud-npx-"));
  try {
    // Clean-tree pack: drop the bundle so the tarball can only carry a dist/machud.mjs
    // that THIS pack rebuilt via prepack (catches a prepack that silently fails to build).
    await rm(bundle, { force: true });
    await run("pnpm", ["pack", "--pack-destination", tmp]);
    const tgzName = (await readdir(tmp)).find((f) => f.endsWith(".tgz"));
    const tgz = tgzName ? join(tmp, tgzName) : null;
    const tarList = tgz ? await run("tar", ["-tzf", tgz]) : "";
    check(
      tarList.split("\n").some((l) => l.trim().endsWith("dist/machud.mjs")),
      "npx tarball carries dist/machud.mjs (prepack builds the bin on a clean pack)",
    );

    // Install into a throwaway consumer the way `npx` does (npm), resolving the EXTERNAL
    // runtime deps (vue / @vue-tui/runtime / chalk) from the registry/cache.
    const proj = join(tmp, "consumer");
    await mkdir(proj, { recursive: true });
    await writeFile(
      join(proj, "package.json"),
      JSON.stringify({ name: "machud-npx-test", version: "1.0.0", private: true }),
    );
    const binLink = join(proj, "node_modules", ".bin", "machud");
    let linked = false;
    if (tgz) {
      await run("npm", ["install", tgz, "--prefer-offline", "--no-audit", "--no-fund", "--loglevel=error"], {
        cwd: proj,
      });
      linked = await fileExists(binLink);
    }
    check(linked, "npm install <tgz> resolves the dep tree and links the machud bin");

    // Run the INSTALLED bin via .bin/machud — exercises the shebang (byte 0) + the +x bit
    // npm sets, AND proves every external import resolves at runtime (no missing dep).
    let exec = { code: 1, out: "" };
    if (linked) exec = await runExit(binLink, ["--once"], { cwd: proj, env: { ...process.env, COLUMNS: "120" } });
    check(
      exec.code === 0 && /CPU/.test(exec.out),
      `installed \`machud --once\` launches the published bin (exit ${exec.code}, CPU ${
        /CPU/.test(exec.out) ? "rendered" : "MISSING"
      })`,
    );
    if (exec.code !== 0) {
      const first = exec.out.split("\n").find((l) => l.trim()) ?? "(no output)";
      console.log(`    \x1b[31m↳ ${first.slice(0, 200)}\x1b[0m`);
    }
  } finally {
    await rmrf(tmp, { recursive: true, force: true });
  }
}

// ── 10. Gate strength (strengthen-only floor) ───────────────────────────────
console.log("\ngate strength");
check(total >= MIN_CHECKS, `ran ${total} assertions ≥ pinned floor ${MIN_CHECKS} (strengthen-only)`);

// ── Summary ─────────────────────────────────────────────────────────────────
console.log("");
if (failures === 0) {
  console.log("\x1b[32mverify: PASS\x1b[0m\n");
  process.exit(0);
} else {
  console.log(`\x1b[31mverify: FAIL (${failures})\x1b[0m\n`);
  process.exit(1);
}

async function fileExists(p) {
  const { stat } = await import("node:fs/promises");
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}
