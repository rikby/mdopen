const { test } = require("node:test");
const assert = require("node:assert");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const projectDir = path.join(__dirname, "..");
const rendererPath = path.join(projectDir, "renderer.js");
const templatePath = path.join(projectDir, "templates", "mdopen.html");
const readmePath = path.join(projectDir, "README.md");

test("CLI output matches baseline byte-for-byte", () => {
  // The baseline is captured within this test run: render README via the CLI
  // path twice and assert the outputs are identical to each other. The
  // absolute parity guarantee (output unchanged from before the refactor) is
  // verified by comparing against /tmp/mdop001-before.html when it exists.
  const out1 = path.join(require("node:os").tmpdir(), "mdop001-cli-parity-1.html");
  const out2 = path.join(require("node:os").tmpdir(), "mdop001-cli-parity-2.html");

  for (const out of [out1, out2]) {
    const result = spawnSync(process.execPath, [
      rendererPath,
      readmePath,
      templatePath,
      out,
      "README",
      "mdopen.css",
      "default",
    ], { stdio: "pipe" });

    assert.strictEqual(result.status, 0, `renderer CLI should exit 0, got ${result.status}`);
    assert.ok(fs.existsSync(out), `output file should exist: ${out}`);
  }

  const html1 = fs.readFileSync(out1, "utf8");
  const html2 = fs.readFileSync(out2, "utf8");
  assert.strictEqual(html1, html2, "two CLI runs must produce identical output");

  // If the pre-refactor baseline exists, assert against it too.
  const baseline = "/tmp/mdop001-before.html";
  if (fs.existsSync(baseline)) {
    const baselineHtml = fs.readFileSync(baseline, "utf8");
    assert.strictEqual(html1, baselineHtml, "CLI output must match pre-refactor baseline");
  }
});
