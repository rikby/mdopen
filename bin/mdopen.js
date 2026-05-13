#!/usr/bin/env bun
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function usage() {
  console.error("Usage: mdopen FILE.md");
}

function fail(message, code = 1) {
  console.error(`mdopen: ${message}`);
  process.exit(code);
}

function isMingwSession() {
  return Boolean(process.env.MSYSTEM || process.env.MINGW_PREFIX);
}

function cygpathToWindows(value) {
  if (process.platform !== "win32" || !isMingwSession() || !value.startsWith("/")) {
    return value;
  }

  const cygpath = spawnSync("cygpath", ["-w", value], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });

  if (cygpath.status === 0 && cygpath.stdout.trim()) {
    return cygpath.stdout.trim();
  }

  const drivePath = value.match(/^\/([a-zA-Z])(?:\/(.*))?$/);
  if (drivePath) {
    const rest = drivePath[2] ? `\\${drivePath[2].replaceAll("/", "\\")}` : "\\";
    return `${drivePath[1].toUpperCase()}:${rest}`;
  }

  return value;
}

function commandExists(command) {
  const probe = process.platform === "win32" ? "where" : "command";
  const args = process.platform === "win32" ? [command] : ["-v", command];
  const result = spawnSync(probe, args, { stdio: "ignore", shell: process.platform !== "win32" });
  return result.status === 0;
}

function copyFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function copyDirectoryFiles(sourceDir, destinationDir) {
  fs.mkdirSync(destinationDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (entry.isFile()) {
      copyFile(path.join(sourceDir, entry.name), path.join(destinationDir, entry.name));
    }
  }
}

function pathStartsWith(child, parent) {
  const relative = path.relative(
    process.platform === "win32" ? parent.toLowerCase() : parent,
    process.platform === "win32" ? child.toLowerCase() : child,
  );
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function openHtml(outputPath) {
  if (process.env.MDOPEN_NO_OPEN === "1") {
    return;
  }

  let result;
  if (process.platform === "darwin") {
    result = spawnSync("open", [outputPath], { stdio: "ignore" });
  } else if (process.platform === "linux") {
    if (!commandExists("xdg-open")) {
      fail(`xdg-open is not on PATH; generated HTML was not opened: ${outputPath}`);
    }
    result = spawnSync("xdg-open", [outputPath], { stdio: "ignore" });
  } else if (process.platform === "win32") {
    result = spawnSync("cmd.exe", ["/c", "start", "", cygpathToWindows(outputPath)], {
      stdio: "ignore",
      windowsHide: true,
    });
  } else {
    fail(`unsupported platform: ${process.platform}`);
  }

  if (result.error) {
    fail(`could not open generated HTML: ${result.error.message}: ${outputPath}`);
  }
  if (typeof result.status === "number" && result.status !== 0) {
    fail(`could not open generated HTML: opener exited with status ${result.status}: ${outputPath}`);
  }
}

const args = process.argv.slice(2);
if (args.length !== 1) {
  usage();
  process.exit(2);
}

const inputArg = cygpathToWindows(args[0]);
const input = path.resolve(inputArg);

let inputStat;
try {
  inputStat = fs.statSync(input);
} catch {
  fail(`file not found: ${args[0]}`);
}

if (!inputStat.isFile()) {
  fail(`file not found: ${args[0]}`);
}

const cliPath = fs.realpathSync(__filename);
const projectDir = path.resolve(path.dirname(cliPath), "..");
const template = path.join(projectDir, "templates", "mdopen.html");
const renderer = path.join(projectDir, "renderer.js");
const assetsDir = path.join(projectDir, "assets");
const stylesDir = path.join(assetsDir, "styles");
const outdir = path.join(os.tmpdir(), "mdopen");
const title = path.basename(input, path.extname(input));
const output = path.join(outdir, `${title}.html`);

copyFile(path.join(assetsDir, "mdopen.css"), path.join(outdir, "mdopen.css"));
copyFile(path.join(assetsDir, "mdopen-overrides.css"), path.join(outdir, "mdopen-overrides.css"));
copyFile(path.join(stylesDir, "demo.css"), path.join(outdir, "demo.css"));
copyFile(path.join(stylesDir, "readthedocs.css"), path.join(outdir, "readthedocs.css"));
copyDirectoryFiles(path.join(stylesDir, "fonts"), path.join(outdir, "fonts"));

const reviewDir = path.join(projectDir, "review");
const defaultStyle = pathStartsWith(input, reviewDir) ? "demo" : "default";

const render = spawnSync(process.execPath, [
  renderer,
  input,
  template,
  output,
  title,
  "mdopen.css",
  defaultStyle,
], {
  stdio: "inherit",
});

if (render.error) {
  fail(`renderer failed: ${render.error.message}`);
}
if (typeof render.status === "number" && render.status !== 0) {
  process.exit(render.status);
}

openHtml(output);
console.log(output);
