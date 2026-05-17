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
copyFile(path.join(projectDir, "README.md"), path.join(siteDir, "README.md"));
copyFile(path.join(projectDir, "examples", "demo.md"), path.join(siteDir, "demo.md"));
copyFile(path.join(assetsDir, "editor.css"), path.join(siteDir, "editor.css"));
fs.writeFileSync(path.join(siteDir, ".nojekyll"), "");

renderPage("README.md", "index.html", "mdopen", "default");
renderPage(path.join("examples", "demo.md"), "demo.html", "Markdown HTML Render Demo", "demo");
generateEditPage();

function renderPage(inputRelativePath, outputFile, title, defaultStyle) {
  const render = spawnSync(process.execPath, [
    path.join(projectDir, "renderer.js"),
    path.join(projectDir, inputRelativePath),
    path.join(projectDir, "templates", "mdopen.html"),
    path.join(siteDir, outputFile),
    title,
    "mdopen.css",
    defaultStyle,
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
}

function generateEditPage() {
  const template = fs.readFileSync(path.join(projectDir, "templates", "mdopen.html"), "utf8");
  const editorScript = fs.readFileSync(path.join(projectDir, "templates", "editor-script.html"), "utf8");
  const mdopenScript = fs.readFileSync(path.join(projectDir, "templates", "mdopen-script.html"), "utf8");

  const html = template
    .replaceAll("{{pageTitle}}", "Mermaid Editor - MDopen")
    .replaceAll("{{cssHref}}", "mdopen.css")
    .replaceAll("{{mdopenScript}}", mdopenScript)
    .replaceAll("{{editorScript}}", editorScript)
    .replaceAll("{{defaultStyle}}", "default")
    .replaceAll("{{mermaidScript}}", "")
    .replaceAll("{{frontmatter}}", "")
    .replaceAll("{{body}}", "")
    .replace(' data-mdopen-editor-hidden', '');

  fs.writeFileSync(path.join(siteDir, "edit.html"), html);
}

console.log(path.join(siteDir, "index.html"));
