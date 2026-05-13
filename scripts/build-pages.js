const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectDir = path.resolve(__dirname, "..");
const siteDir = path.join(projectDir, "_site");
const assetsDir = path.join(projectDir, "assets");
const stylesDir = path.join(assetsDir, "styles");

function copyFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function copyDirectory(sourceDir, destinationDir) {
  fs.mkdirSync(destinationDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const source = path.join(sourceDir, entry.name);
    const destination = path.join(destinationDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(source, destination);
    } else if (entry.isFile()) {
      copyFile(source, destination);
    }
  }
}

fs.rmSync(siteDir, { recursive: true, force: true });
fs.mkdirSync(siteDir, { recursive: true });

copyFile(path.join(assetsDir, "mdopen.css"), path.join(siteDir, "mdopen.css"));
copyFile(path.join(assetsDir, "mdopen-overrides.css"), path.join(siteDir, "mdopen-overrides.css"));
copyFile(path.join(stylesDir, "demo.css"), path.join(siteDir, "demo.css"));
copyFile(path.join(stylesDir, "readthedocs.css"), path.join(siteDir, "readthedocs.css"));
copyDirectory(path.join(stylesDir, "fonts"), path.join(siteDir, "fonts"));
copyFile(path.join(projectDir, "examples", "demo.md"), path.join(siteDir, "demo.md"));
fs.writeFileSync(path.join(siteDir, ".nojekyll"), "");

const render = spawnSync(process.execPath, [
  path.join(projectDir, "renderer.js"),
  path.join(projectDir, "examples", "demo.md"),
  path.join(projectDir, "templates", "mdopen.html"),
  path.join(siteDir, "index.html"),
  "Markdown HTML Render Demo",
  "mdopen.css",
  "demo",
], {
  stdio: "inherit",
});

if (render.error) {
  console.error(`build-pages: renderer failed: ${render.error.message}`);
  process.exit(1);
}

if (typeof render.status === "number" && render.status !== 0) {
  process.exit(render.status);
}

console.log(path.join(siteDir, "index.html"));
