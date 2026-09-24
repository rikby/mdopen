const { test } = require("node:test");
const assert = require("node:assert");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const cliPath = path.join(__dirname, "..", "bin", "mdopen.js");

function runCli(args) {
  return spawnSync(process.execPath, [cliPath, ...args], { stdio: "pipe" });
}

for (const flag of ["-h", "--help"]) {
  test(`CLI ${flag} prints help to stdout and exits 0`, () => {
    const result = runCli([flag]);
    assert.strictEqual(result.status, 0, `should exit 0, got ${result.status}`);
    const stdout = result.stdout.toString();
    assert.ok(stdout.includes("Usage:"), "help should contain a Usage section");
    assert.ok(stdout.includes("FILE.md|DIR"), "help should document arguments");
    assert.ok(stdout.includes("--help"), "help should list the --help option");
    assert.ok(stdout.includes("--output"), "help should list the --output option");
    assert.ok(stdout.includes("--open"), "help should list the --open option");
    assert.ok(stdout.includes("--no-open"), "help should list the --no-open option");
    assert.ok(stdout.includes("MDOPEN_NO_OPEN"), "help should document environment variables");
  });
}

test("CLI with no arguments prints usage to stderr and exits 2", () => {
  const result = runCli([]);
  assert.strictEqual(result.status, 2, `should exit 2, got ${result.status}`);
  assert.ok(result.stderr.toString().includes("Usage:"), "error usage goes to stderr");
});
