const { test } = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const fs = require("node:fs");

const rendererPath = path.join(__dirname, "..", "renderer.js");
const templatePath = path.join(__dirname, "..", "templates", "mdopen.html");
const templateDir = path.dirname(templatePath);

test("require does not execute side effects when imported as a module", () => {
  // Importing renderer.js must not parse argv, read files, or write files.
  // It should export renderMarkdown and not throw or exit.
  const mod = require(rendererPath);
  assert.strictEqual(typeof mod.renderMarkdown, "function");
});

test("renderMarkdown renders a heading to an HTML string", () => {
  const { renderMarkdown } = require(rendererPath);
  const template = fs.readFileSync(templatePath, "utf8");

  const { html } = renderMarkdown("# Hello World", {
    template,
    templateDir,
    pageTitle: "Test",
    cssHref: "mdopen.css",
  });

  assert.ok(typeof html === "string", "html should be a string");
  assert.ok(html.includes("<h1"), "html should contain an h1 heading");
  assert.ok(html.includes("Hello World"), "html should contain the heading text");
});

test("renderMarkdown resolves relative images via resolveImage for local-file context", () => {
  const { renderMarkdown } = require(rendererPath);
  const template = fs.readFileSync(templatePath, "utf8");
  const inputDir = "/some/local/dir";

  const { html } = renderMarkdown("![alt](diagram.png)", {
    template,
    templateDir,
    pageTitle: "Test",
    cssHref: "mdopen.css",
    resolveImage: (src) => path.resolve(inputDir, src),
  });

  assert.ok(
    html.includes(path.resolve(inputDir, "diagram.png")),
    "html img src should be the resolved filesystem path",
  );
});

test("renderMarkdown resolves relative images via resolveImage for HTTP context", () => {
  const { renderMarkdown } = require(rendererPath);
  const template = fs.readFileSync(templatePath, "utf8");
  const baseUrl = "https://example.com/docs/";

  const { html } = renderMarkdown("![alt](diagram.png)", {
    template,
    templateDir,
    pageTitle: "Test",
    cssHref: "mdopen.css",
    resolveImage: (src) => new URL(src, baseUrl).href,
  });

  assert.ok(
    html.includes("https://example.com/docs/diagram.png"),
    "html img src should be the resolved URL",
  );
});

test("renderMarkdown leaves relative images unchanged when no resolveImage is given", () => {
  const { renderMarkdown } = require(rendererPath);
  const template = fs.readFileSync(templatePath, "utf8");

  const { html } = renderMarkdown("![alt](diagram.png)", {
    template,
    templateDir,
    pageTitle: "Test",
    cssHref: "mdopen.css",
  });

  assert.ok(
    html.includes('src="diagram.png"'),
    "html img src should be the original relative path",
  );
});

test("renderMarkdown handles empty markdown without error", () => {
  const { renderMarkdown } = require(rendererPath);
  const template = fs.readFileSync(templatePath, "utf8");

  const { html } = renderMarkdown("", {
    template,
    templateDir,
    pageTitle: "Test",
    cssHref: "mdopen.css",
  });

  assert.ok(typeof html === "string", "empty markdown should produce a string");
  assert.ok(html.length > 0, "empty markdown should still produce a full HTML page");
});

test("renderMarkdown preserves mermaid container structure for mermaid fences", () => {
  const { renderMarkdown } = require(rendererPath);
  const template = fs.readFileSync(templatePath, "utf8");

  const md = "```mermaid\ngraph LR\n  A-->B\n```\n";
  const { html, hasMermaid } = renderMarkdown(md, {
    template,
    templateDir,
    pageTitle: "Test",
    cssHref: "mdopen.css",
  });

  assert.strictEqual(hasMermaid, true, "hasMermaid should be true for mermaid fences");
  assert.ok(html.includes('class="mermaid-container"'), "html should contain mermaid-container");
  assert.ok(html.includes('class="mermaid"'), "html should contain mermaid div");
});
