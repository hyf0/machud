// Component test for the per-core load grid: P/E grouping + the single-cluster (Intel) fallback.
// verify.mjs covers the by-load colouring (warn-▆ injection); here we pin the grouping STRUCTURE —
// two labelled groups when both clusters exist, one unlabelled row otherwise (never an empty E/P).
import { test, expect } from "vite-plus/test";
import { defineComponent, h } from "vue";
import { renderToString } from "@vue-tui/runtime";
import { setThemeMode } from "../src/theme";
import CoreGrid from "../src/components/CoreGrid.vue";

setThemeMode("dark");
const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
const frame = (props: Record<string, unknown>, columns = 40): string =>
  strip(renderToString(defineComponent(() => () => h(CoreGrid, props)), { columns }));
const GLYPH = /[▁▂▃▄▅▆▇█]/;

test("CoreGrid labels E and P groups when both clusters are present", () => {
  const f = frame({
    cores: [
      { usage: 10, cluster: "E" },
      { usage: 20, cluster: "E" },
      { usage: 90, cluster: "P" },
      { usage: 80, cluster: "P" },
    ],
  });
  expect(f).toContain("E");
  expect(f).toContain("P");
  expect(f).toMatch(GLYPH); // one load glyph per core
});

test("CoreGrid renders one UNlabelled row on a single cluster (Intel — never an empty E/P group)", () => {
  const f = frame({
    cores: [
      { usage: 50, cluster: "P" },
      { usage: 60, cluster: "P" },
      { usage: 70, cluster: "P" },
    ],
  });
  expect(f).toMatch(GLYPH);
  expect(f).not.toContain("E "); // no E-cluster label
  expect(f).not.toContain("P "); // single cluster is unlabelled
});
