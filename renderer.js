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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extractFrontmatter(value) {
  if (!value.startsWith("---\n") && !value.startsWith("---\r\n")) {
    return { frontmatter: "", body: value };
  }

  const marker = value.startsWith("---\r\n") ? "---\r\n" : "---\n";
  let searchIndex = marker.length;

  while (searchIndex < value.length) {
    const nextLineIndex = value.indexOf("\n", searchIndex);
    const lineEnd = nextLineIndex === -1 ? value.length : nextLineIndex + 1;
    const line = value.slice(searchIndex, lineEnd).replace(/\r?\n$/, "");

    if (line === "---") {
      const frontmatter = value.slice(marker.length, searchIndex).replace(/\r?\n$/, "");
      return {
        frontmatter,
        body: value.slice(lineEnd),
      };
    }

    if (nextLineIndex === -1) break;
    searchIndex = lineEnd;
  }

  return { frontmatter: "", body: value };
}

function renderFrontmatter(value) {
  if (!value.trim()) return "";
  return [
    '<details class="mdopen-frontmatter">',
    "<summary>Frontmatter</summary>",
    `<pre><code>${escapeHtml(value)}</code></pre>`,
    "</details>\n",
  ].join("");
}

function enhanceHtml(value) {
  return value.replace(
    /<blockquote>\s*<p>\[!(NOTE|TIP|WARNING|IMPORTANT)\]\s*(?:<br>\s*)?([\s\S]*?)<\/blockquote>/gi,
    (_match, type, body) => {
      const content = body.trim();
      const calloutBody = content.startsWith("</p>") ? content.slice(4).trimStart() : `<p>${content}`;
      return `<section class="callout ${type.toLowerCase()}"><p class="callout-title">${type}</p>${calloutBody}</section>`;
    },
  );
}

// GitHub-compatible heading slug (markdown-ticket slugify.ts): lowercase, split on
// whitespace, strip non letters/numbers/hyphens (unicode-aware), join with hyphens.
function slugifyHeading(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .toLowerCase()
    .split(/\s+/)
    .map((segment) => segment.replace(/[^\p{L}\p{N}-]/gu, ""))
    .join("-");
}

function addHeadingAnchors(html) {
  const used = Object.create(null);
  return html.replace(
    /<h([1-6])((?:\s[^>]*)?)>([\s\S]*?)<\/h\1>/g,
    (match, level, attrs, inner) => {
      const text = inner.replace(/<[^>]+>/g, "");
      const base = slugifyHeading(text).replace(/^-+|-+$/g, "") || "section";
      let slug = base;
      if (used[base]) {
        slug = `${base}-${used[base]}`;
      }
      used[base] = (used[base] || 0) + 1;
      // markdown-it-anchor permalink pattern: wrap the whole title so it is clickable
      return `<h${level}${attrs} id="${slug}"><a class="mdopen-heading-link" href="#${slug}">${inner}</a></h${level}>`;
    },
  );
}

/**
 * @param {string} value
 * @param {string} name
 * @returns {string}
 */
function readTemplatePart(value, name) {
  return fs.readFileSync(path.join(value, name), "utf8");
}

/**
 * Render a Markdown string into a complete HTML page using mdopen's pipeline.
 *
 * @param {string} markdown - Raw Markdown source.
 * @param {object} options
 * @param {string} options.template - Pre-loaded template HTML string.
 * @param {string} options.templateDir - Directory containing `mdopen-script.html` and `mermaid-script.html`.
 * @param {string} options.pageTitle - Page title injected into the template.
 * @param {string} options.cssHref - CSS href injected into the template.
 * @param {string} [options.defaultStyle="default"] - Default style source identifier.
 * @param {(src: string) => string} [options.resolveImage] - Optional resolver for relative image src values.
 * @returns {{ html: string, hasMermaid: boolean }}
 */
function renderMarkdown(markdown, options) {
  const {
    template,
    templateDir,
    pageTitle,
    cssHref,
    defaultStyle = "default",
    resolveImage,
  } = options;

  const md = new MarkdownIt({
    html: true,
    breaks: true,
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
      if (src && !/^(?:[a-z]+:|#|\/)/i.test(src) && resolveImage) {
        token.attrs[srcIndex][1] = resolveImage(src);
      }
    }

    return defaultImage(tokens, idx, options, env, self);
  };

  const parsedMarkdown = extractFrontmatter(markdown);
  const frontmatter = renderFrontmatter(parsedMarkdown.frontmatter);
  const body = addHeadingAnchors(enhanceHtml(md.render(parsedMarkdown.body)));

  const html = template
    .replaceAll("{{pageTitle}}", escapeHtml(pageTitle))
    .replaceAll("{{cssHref}}", escapeHtml(cssHref))
    .replaceAll("{{mdopenScript}}", readTemplatePart(templateDir, "mdopen-script.html"))
    .replaceAll("{{defaultStyle}}", escapeHtml(defaultStyle))
    .replaceAll("{{mermaidScript}}", hasMermaid ? readTemplatePart(templateDir, "mermaid-script.html") : "")
    .replaceAll("{{editorScript}}", "")
    .replaceAll("{{frontmatter}}", frontmatter)
    .replaceAll("{{body}}", body);

  return { html, hasMermaid };
}

module.exports = { renderMarkdown };

if (require.main === module) {
  const [input, templatePath, output, pageTitle, cssHref, defaultStyle = "default"] = process.argv.slice(2);

  if (!input || !templatePath || !output || !pageTitle || !cssHref) {
    console.error("Usage: renderer.js INPUT TEMPLATE OUTPUT TITLE CSS_HREF");
    process.exit(2);
  }

  const markdown = fs.readFileSync(input, "utf8");
  const template = fs.readFileSync(templatePath, "utf8");
  const inputDir = path.dirname(input);
  const templateDir = path.dirname(templatePath);

  const { html } = renderMarkdown(markdown, {
    template,
    templateDir,
    pageTitle,
    cssHref,
    defaultStyle,
    resolveImage: (src) => path.resolve(inputDir, src),
  });

  fs.writeFileSync(output, html);
}
