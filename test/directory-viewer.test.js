const { test } = require("node:test");
const assert = require("node:assert");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const cliPath = path.join(__dirname, "..", "bin", "mdopen.js");

function runCli(args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    stdio: "pipe",
    env: { ...process.env, MDOPEN_NO_OPEN: "1" },
  });
}

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test("directory viewer generator embeds the collapsible tree UI", () => {
  const srcDir = makeTempDir("mdoptree-src-");
  fs.mkdirSync(path.join(srcDir, "docs", "inner"), { recursive: true });
  fs.writeFileSync(path.join(srcDir, "README.md"), "# Root Doc\n");
  fs.writeFileSync(
    path.join(srcDir, "docs", "guide.md"),
    "---\ntitle: front\n---\n\n```js\n# not a heading\n```\n\n# Styling Guide\n",
  );
  fs.writeFileSync(path.join(srcDir, "docs", "inner", "deep.md"), "# Deep\n");
  const outDir = makeTempDir("mdoptree-out-");

  const result = runCli([srcDir, "-o", outDir]);
  assert.strictEqual(result.status, 0, `CLI should exit 0, got ${result.status}: ${result.stderr}`);

  const html = fs.readFileSync(path.join(outDir, "index.html"), "utf8");
  assert.ok(html.includes("createElement('details')"), "tree folders use native details elements");
  assert.ok(html.includes("createElement('summary')"), "folders use summary headings");
  assert.ok(html.includes("mdopen-directory-group"), "folder groups are marked");
  assert.ok(html.includes("mdopen-directory-branch"), "branches are marked");
  assert.ok(html.includes("mdopenFolder"), "folders carry their path for persistence");
  assert.ok(html.includes("mdopen-directory-toggle"), "toolbar toggle button is generated");
  assert.ok(html.includes("mdopen-shell"), "nav, handle, and preview live in a flex shell");
  assert.ok(html.includes("mdopen-directory-resizer"), "resize handle is generated");
  assert.ok(html.includes("'aria-controls'"), "toggle controls the nav");
  assert.ok(html.includes("mdopen-directory-nav[hidden]"), "hidden-state CSS is present");
  assert.ok(html.includes("mdopen-directory-tree"), "folder state persists to localStorage");
  assert.ok(html.includes('"title":"Root Doc"'), "H1 becomes the manifest title");
  assert.ok(html.includes('"title":"Styling Guide"'), "fenced # ignored, real H1 found after fence");
  assert.ok(html.includes("mdopen-index-search"), "index page has a search input");
  assert.ok(html.includes("mdopen-index-copy"), "index items have copy buttons");
  assert.ok(html.includes("mdopen-index-title"), "index items show titles");
  assert.ok(html.includes("mdopen-index-path"), "index items show monospace paths");
  assert.ok(html.includes("mdopen-directory-search"), "nav tree has a search input");
  assert.ok(html.includes("applyIndexFilter"), "index filter is wired");
  assert.ok(html.includes("applyNavFilter"), "nav filter is wired");
});

test("single-file mode does not include directory viewer UI", () => {
  const srcDir = makeTempDir("mdoptree-single-");
  const mdPath = path.join(srcDir, "solo.md");
  fs.writeFileSync(mdPath, "# Solo\n");
  const outDir = makeTempDir("mdoptree-out-");

  const result = runCli([mdPath, "-o", outDir]);
  assert.strictEqual(result.status, 0, `CLI should exit 0, got ${result.status}: ${result.stderr}`);

  const html = fs.readFileSync(path.join(outDir, "solo.html"), "utf8");
  assert.ok(!html.includes("mdopen-directory-toggle"), "no tree toggle outside viewer mode");
  assert.ok(!html.includes("mdopen-directory-group"), "no folder groups outside viewer mode");
});
