const { test } = require("node:test");
const assert = require("node:assert");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const cliPath = path.join(__dirname, "..", "bin", "mdopen.js");

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function runCli(args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    stdio: "pipe",
    env: { ...process.env, MDOPEN_NO_OPEN: "1" },
  });
}

test("-o DIR writes single-file output into the given directory", () => {
  const srcDir = makeTempDir("mdop003-src-");
  const outDir = makeTempDir("mdop003-out-");
  const mdPath = path.join(srcDir, "doc.md");
  fs.writeFileSync(mdPath, "# Output Dir Test\n\nhello\n");

  const result = runCli([mdPath, "-o", outDir]);
  assert.strictEqual(result.status, 0, `CLI should exit 0, got ${result.status}: ${result.stderr}`);

  const expected = path.join(outDir, "doc.html");
  assert.ok(fs.existsSync(expected), `output should exist: ${expected}`);
  assert.ok(fs.existsSync(path.join(outDir, "mdopen.css")), "assets should be copied into the output dir");
  const html = fs.readFileSync(expected, "utf8");
  assert.ok(html.includes("Output Dir Test"), "rendered HTML should contain the document content");
});

test("-o DIR preserves existing files in directory-viewer mode", () => {
  const srcDir = makeTempDir("mdop003-tree-");
  fs.writeFileSync(path.join(srcDir, "a.md"), "# A\n");
  fs.writeFileSync(path.join(srcDir, "b.md"), "# B\n");
  const outDir = makeTempDir("mdop003-out-");
  const sentinel = path.join(outDir, "keep-me.txt");
  fs.writeFileSync(sentinel, "do not delete\n");

  const result = runCli([srcDir, "--output", outDir]);
  assert.strictEqual(result.status, 0, `CLI should exit 0, got ${result.status}: ${result.stderr}`);

  assert.ok(fs.existsSync(path.join(outDir, "index.html")), "viewer index.html should exist");
  assert.ok(fs.existsSync(sentinel), "pre-existing files in the -o directory must be preserved");
});

test("-o without a value exits 2 with usage on stderr", () => {
  const result = runCli(["-o"]);
  assert.strictEqual(result.status, 2, `should exit 2, got ${result.status}`);
  assert.ok(result.stderr.toString().includes("output requires a directory"), "stderr should explain the error");
});
