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
const MIN_CHECKS = 40;

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

  // Memory
  check(m.memory.total > 0, "memory total > 0");
  check(inRange(m.memory.usedPct, 0, 100), "memory usedPct in 0–100");
  check(["Normal", "Elevated", "High"].includes(m.memory.pressure), "memory pressure valid");

  // GPU / Disk / Net
  check(inRangeOrNull(m.gpu.usage, 0, 100), "gpu usage null or 0–100");
  check(m.disk.total > 0 && inRange(m.disk.usedPct, 0, 100), "disk total>0 and usedPct in range");
  check(m.net.rxBps >= 0 && m.net.txBps >= 0, "net rates non-negative");

  // Battery / Sensors
  check(inRange(m.battery.pct, 0, 100), "battery pct in 0–100");
  check(inRangeOrNull(m.battery.healthPct, 0, 100), "battery health null or 0–100");
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
  check(themedFrame.includes("machud"), `${mode} mode frame renders`);
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

// ── 7. Gate strength (strengthen-only floor) ────────────────────────────────
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
