// @ts-check

const fs = require("node:fs");
const path = require("node:path");
const hljs = require("highlight.js");
const MarkdownIt = require("markdown-it");
const deflist = require("markdown-it-deflist");
const footnote = require("markdown-it-footnote");
const mark = require("markdown-it-mark");
const sub = require("markdown-it-sub");
const sup = require("markdown-it-sup");
const taskLists = require("markdown-it-task-lists");

const [input, templatePath, output, pageTitle, cssHref, defaultStyle = "default"] = process.argv.slice(2);

if (!input || !templatePath || !output || !pageTitle || !cssHref) {
  console.error("Usage: renderer.js INPUT TEMPLATE OUTPUT TITLE CSS_HREF");
  process.exit(2);
}

const markdown = fs.readFileSync(input, "utf8");
const template = fs.readFileSync(templatePath, "utf8");
const inputDir = path.dirname(input);

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(code, language) {
    const normalizedLanguage = language && language.trim();

    if (normalizedLanguage && hljs.getLanguage(normalizedLanguage)) {
      const highlighted = hljs.highlight(code, {
        language: normalizedLanguage,
        ignoreIllegals: true,
      }).value;

      return `<pre><code class="hljs language-${escapeHtml(normalizedLanguage)}">${highlighted}</code></pre>`;
    }

    if (!normalizedLanguage) {
      return `<pre><code class="hljs">${escapeHtml(code)}</code></pre>`;
    }

    return `<pre><code class="hljs">${escapeHtml(code)}</code></pre>`;
  },
});

let mermaidCounter = 0;
let hasMermaid = false;

const defaultFence =
  md.renderer.rules.fence ||
  ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const language = token.info.trim().split(/\s+/)[0];

  if (language === "mermaid") {
    hasMermaid = true;
    const id = `mermaid-diagram-${++mermaidCounter}`;
    return [
      `<div class="mermaid-container" data-mermaid-id="${id}">`,
      '<button type="button" class="mermaid-fullscreen-btn" aria-label="Open diagram fullscreen">Full</button>',
      `<div class="mermaid" id="${id}">${escapeHtml(token.content)}</div>`,
      "</div>",
    ].join("");
  }

  return defaultFence(tokens, idx, options, env, self);
};

md.use(deflist)
  .use(footnote)
  .use(mark)
  .use(sub)
  .use(sup)
  .use(taskLists, { enabled: true, label: true });

const defaultImage =
  md.renderer.rules.image ||
  ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const srcIndex = token.attrIndex("src");

  if (srcIndex >= 0) {
    const src = token.attrs[srcIndex][1];
    if (src && !/^(?:[a-z]+:|#|\/)/i.test(src)) {
      token.attrs[srcIndex][1] = path.resolve(inputDir, src);
    }
  }

  return defaultImage(tokens, idx, options, env, self);
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function enhanceHtml(value) {
  return value.replace(
    /<blockquote>\s*<p>\[!(NOTE|TIP|WARNING|IMPORTANT)\]\s*(?:<br>\s*)?([\s\S]*?)<\/blockquote>/gi,
    (_match, type, body) => `<section class="callout ${type.toLowerCase()}"><p class="callout-title">${type}</p><p>${body}</section>`,
  );
}

const body = enhanceHtml(md.render(markdown));

const html = template
  .replaceAll("{{pageTitle}}", escapeHtml(pageTitle))
  .replaceAll("{{cssHref}}", escapeHtml(cssHref))
  .replaceAll("{{defaultStyle}}", escapeHtml(defaultStyle))
  .replaceAll("{{mermaidScript}}", hasMermaid ? readMermaidScript(templatePath) : "")
  .replaceAll("{{body}}", body);

fs.writeFileSync(output, html);

/**
 * @param {string} value
 * @returns {string}
 */
function readMermaidScript(value) {
  return fs.readFileSync(path.join(path.dirname(value), "mermaid-script.html"), "utf8");
}
