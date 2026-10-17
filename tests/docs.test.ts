import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { accessState, configFromEnv, showcaseWindow } from "@/lib/docs/access";
import { API, PITCH } from "@/lib/docs/content";
import { docsMarkdown } from "@/lib/docs/markdown";

const at = (iso: string) => new Date(iso);

test("docs are public by default, with no configuration at all", () => {
  const { config, warnings } = configFromEnv({});
  assert.deepEqual(config, { enabled: true, start: undefined, end: undefined });
  assert.deepEqual(warnings, []);
  assert.equal(accessState(config), "open");
});

test("the switch hides the docs whatever the window says", () => {
  const { config } = configFromEnv({ DOCS_ENABLED: "false" });
  assert.equal(accessState(config), "disabled");
  assert.equal(configFromEnv({ DOCS_ENABLED: "off" }).config.enabled, false);
  assert.equal(configFromEnv({ DOCS_ENABLED: "true" }).config.enabled, true);
});

test("a window opens at its start and closes after its end", () => {
  const config = { enabled: true, start: "2027-06-10T00:00:00Z", end: "2027-06-14T23:59:00Z" };
  assert.equal(accessState(config, at("2027-06-09T23:59:59Z")), "scheduled");
  assert.equal(accessState(config, at("2027-06-10T00:00:00Z")), "open");
  assert.equal(accessState(config, at("2027-06-14T23:59:00Z")), "open");
  assert.equal(accessState(config, at("2027-06-15T00:00:00Z")), "ended");
});

test("a duration sets the end from the start", () => {
  const { config } = configFromEnv({ DOCS_START: "2027-06-10T00:00:00Z", DOCS_DURATION_HOURS: "48" });
  assert.equal(config.end, "2027-06-12T00:00:00.000Z");
});

test("bad dates are ignored and reported, not fatal", () => {
  const { config, warnings } = configFromEnv({ DOCS_START: "soon", DOCS_DURATION_HOURS: "-3" });
  assert.equal(config.start, undefined);
  assert.equal(accessState(config), "open");
  assert.equal(warnings.length, 2);
});

test("the showcase preset is the next June 10–14 that hasn't passed", () => {
  assert.deepEqual(showcaseWindow(new Date(2026, 9, 9)), { start: "2027-06-10T00:00", end: "2027-06-14T23:59" });
  assert.deepEqual(showcaseWindow(new Date(2027, 2, 1)), { start: "2027-06-10T00:00", end: "2027-06-14T23:59" });
  assert.deepEqual(showcaseWindow(new Date(2027, 5, 12)), { start: "2027-06-10T00:00", end: "2027-06-14T23:59" });
});

/** Every `route.ts` under src/app/api, with the HTTP methods it exports. */
function realRoutes() {
  const root = join(process.cwd(), "src", "app");
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name === "route.ts") {
        const url = "/" + relative(root, dir).split(sep).join("/");
        const source = readFileSync(path, "utf8");
        for (const m of source.matchAll(/export (?:const|async function) (GET|POST|PUT|PATCH|DELETE)\b/g)) {
          found.push(`${m[1]} ${url}`);
        }
      }
    }
  };
  walk(join(root, "api"));
  return found.sort();
}

test("the API reference lists exactly the routes that exist", () => {
  const documented = API.map((e) => `${e.method} ${e.path}`).sort();
  assert.deepEqual(documented, realRoutes());
});

test("the Markdown export carries every pitch section", () => {
  const md = docsMarkdown();
  for (const block of PITCH) assert.ok(md.includes(`## ${block.title}`), block.title);
  assert.ok(md.includes("## API reference"));
});
