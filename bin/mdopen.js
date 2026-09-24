#!/usr/bin/env bun
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { spawnSync } = require("node:child_process");

function usage() {
  console.error("Usage: mdopen FILE.md|DIR (see mdopen --help)");
}

function help() {
  console.log(`mdopen - render a Markdown file or directory as styled HTML and open it in the browser

Usage:
  mdopen FILE.md|DIR
  mdopen -h | --help

Arguments:
  FILE.md          Markdown file to render. Relative image paths resolve
                   against the file's directory.
  DIR              Open a local viewer page for the Markdown files in the
                   directory (up to 5 levels deep; hidden and generated
                   directories such as .git, node_modules, and dist are
                   skipped).

Options:
  -h, --help       Show this help and exit.

Environment:
  MDOPEN_NO_OPEN=1 Write the output but do not open the browser.

Output is written to the platform temp directory under mdopen/ and the
generated file path is printed to stdout.

Examples:
  mdopen README.md
  mdopen docs/
  MDOPEN_NO_OPEN=1 mdopen README.md`);
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

const DIRECTORY_SCAN_DEPTH = 5;
const IGNORED_DIRECTORY_NAMES = new Set([
  ".git",
  ".hg",
  ".svn",
  ".n8n",
  ".next",
  ".nuxt",
  ".svelte-kit",
  ".turbo",
  ".vite",
  ".cache",
  ".parcel-cache",
  ".pytest_cache",
  ".venv",
  "__pycache__",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "vendor",
  "_site",
]);

function isMarkdownFile(value) {
  const ext = path.extname(value).toLowerCase();
  return ext === ".md" || ext === ".markdown";
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function collectMarkdownFiles(rootDir) {
  const files = [];

  function walk(currentDir, depth) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true }).sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (depth >= DIRECTORY_SCAN_DEPTH || entry.name.startsWith(".") || IGNORED_DIRECTORY_NAMES.has(entry.name)) {
          continue;
        }
        walk(path.join(currentDir, entry.name), depth + 1);
        continue;
      }

      if (entry.isFile() && isMarkdownFile(entry.name)) {
        files.push(path.join(currentDir, entry.name));
      }
    }
  }

  walk(rootDir, 0);
  return files;
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

function renderMarkdownFile(renderer, template, input, output, title, defaultStyle) {
  fs.mkdirSync(path.dirname(output), { recursive: true });

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
}

function escapeScriptJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function readTemplatePart(value, name) {
  return fs.readFileSync(path.join(path.dirname(value), name), "utf8");
}

function renderDirectoryViewer(templatePath, output, pageTitle, cssHref, defaultStyle, inputDir, markdownFiles) {
  const template = fs.readFileSync(templatePath, "utf8");
  const documents = markdownFiles.map((file) => {
    const relative = path.relative(inputDir, file);
    return {
      path: toPosixPath(relative),
      title: path.basename(file, path.extname(file)),
      content: fs.readFileSync(file, "utf8"),
      dirUrl: pathToFileURL(`${path.dirname(file)}${path.sep}`).href,
      fileUrl: pathToFileURL(file).href,
    };
  });
  const data = {
    rootName: path.basename(inputDir) || inputDir,
    files: documents,
  };

  const html = template
    .replaceAll("{{pageTitle}}", escapeHtml(pageTitle))
    .replaceAll("{{cssHref}}", escapeHtml(cssHref))
    .replaceAll("{{mdopenScript}}", readTemplatePart(templatePath, "mdopen-script.html"))
    .replaceAll("{{defaultStyle}}", escapeHtml(defaultStyle))
    .replaceAll("{{mermaidScript}}", readTemplatePart(templatePath, "mermaid-overlay.html"))
    .replaceAll("{{editorScript}}", renderDirectoryViewerScript(data))
    .replaceAll("{{frontmatter}}", "")
    .replaceAll("{{body}}", "<p>Loading directory...</p>");

  fs.writeFileSync(output, html);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderDirectoryViewerScript(data) {
  return `
  <style>
    @media screen {
      .mdopen-directory-nav {
        position: fixed;
        inset: 12px auto 12px 12px;
        z-index: 20;
        width: min(280px, calc(100vw - 24px));
        overflow: auto;
        padding: 12px;
        border: 1px solid rgba(127, 127, 127, 0.28);
        border-radius: 8px;
        background: color-mix(in srgb, Canvas 94%, transparent);
        color: CanvasText;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
      }
      .mdopen-directory-nav h2 {
        margin: 0 0 8px;
        font-size: 14px;
      }
      .mdopen-directory-nav button {
        display: block;
        width: 100%;
        margin: 0;
        padding: 7px 8px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: inherit;
        font: inherit;
        font-size: 13px;
        text-align: left;
        overflow-wrap: anywhere;
        cursor: pointer;
      }
      .mdopen-directory-nav button:hover,
      .mdopen-directory-nav button[aria-current="page"] {
        background: rgba(127, 127, 127, 0.16);
      }
      body > .markdown-body {
        margin-left: 320px;
      }
    }
    @media screen and (max-width: 760px) {
      .mdopen-directory-nav {
        position: static;
        width: auto;
        max-height: 36vh;
        margin: 72px 12px 12px;
      }
      body > .markdown-body {
        margin-left: auto;
      }
    }
    @media print {
      .mdopen-directory-nav {
        display: none;
      }
      body > .markdown-body {
        margin-left: auto;
      }
    }
  </style>
  <script>
    (function () {
      var directoryData = ${escapeScriptJson(data)};
      var article = document.querySelector('.markdown-body');
      if (!article) return;

      var md = null;
      var scriptsLoaded = false;
      var activeFile = null;
      var mermaidLoaded = false;
      var mermaidModule = null;
      var mermaidRenderCounter = 0;
      var filesByPath = {};
      var filesByUrl = {};

      directoryData.files.forEach(function (file) {
        filesByPath[file.path] = file;
        filesByUrl[file.fileUrl] = file;
      });

      function escapeHtml(value) {
        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }

      function enhanceHtml(value) {
        return value.replace(
          /<blockquote>\\s*<p>\\[!(NOTE|TIP|WARNING|IMPORTANT)\\]\\s*(?:<br>\\s*)?([\\s\\S]*?)<\\/blockquote>/gi,
          function (match, type, body) {
            return '<section class="callout ' + type.toLowerCase() + '"><p class="callout-title">' + type + '</p><p>' + body + '</section>';
          }
        );
      }

      function extractFrontmatter(value) {
        if (value.indexOf('---\\n') !== 0 && value.indexOf('---\\r\\n') !== 0) {
          return { frontmatter: '', body: value };
        }
        var marker = value.indexOf('---\\r\\n') === 0 ? '---\\r\\n' : '---\\n';
        var searchIndex = marker.length;
        while (searchIndex < value.length) {
          var nextLineIndex = value.indexOf('\\n', searchIndex);
          var lineEnd = nextLineIndex === -1 ? value.length : nextLineIndex + 1;
          var line = value.slice(searchIndex, lineEnd).replace(/\\r?\\n$/, '');
          if (line === '---') {
            return {
              frontmatter: value.slice(marker.length, searchIndex).replace(/\\r?\\n$/, ''),
              body: value.slice(lineEnd)
            };
          }
          if (nextLineIndex === -1) break;
          searchIndex = lineEnd;
        }
        return { frontmatter: '', body: value };
      }

      function renderFrontmatter(value) {
        if (!value.trim()) return '';
        return [
          '<details class="mdopen-frontmatter">',
          '<summary>Frontmatter</summary>',
          '<pre><code>' + escapeHtml(value) + '</code></pre>',
          '</details>'
        ].join('');
      }

      function loadScript(src, callback) {
        var script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        script.onerror = callback;
        document.head.appendChild(script);
      }

      function loadScripts(callback) {
        if (scriptsLoaded) {
          callback();
          return;
        }
        var scripts = [
          'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js',
          'https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/dist/markdown-it.min.js',
          'https://cdn.jsdelivr.net/npm/markdown-it-deflist@3.0.0/dist/markdown-it-deflist.min.js',
          'https://cdn.jsdelivr.net/npm/markdown-it-footnote@4.0.0/dist/markdown-it-footnote.min.js',
          'https://cdn.jsdelivr.net/npm/markdown-it-mark@4.0.0/dist/markdown-it-mark.min.js',
          'https://cdn.jsdelivr.net/npm/markdown-it-sub@2.0.0/dist/markdown-it-sub.min.js',
          'https://cdn.jsdelivr.net/npm/markdown-it-sup@2.0.0/dist/markdown-it-sup.min.js',
          'https://cdn.jsdelivr.net/npm/markdown-it-task-lists@2.1.1/dist/markdown-it-task-lists.min.js'
        ];
        var loaded = 0;
        scripts.forEach(function (src) {
          loadScript(src, function () {
            loaded += 1;
            if (loaded === scripts.length) {
              scriptsLoaded = true;
              callback();
            }
          });
        });
      }

      function initMarkdownIt() {
        if (md || !window.markdownit) return;
        var hljs = window.hljs;

        md = window.markdownit({
          html: true,
          breaks: true,
          linkify: true,
          typographer: true,
          highlight: function (code, language) {
            var normalizedLanguage = language && language.trim();
            if (normalizedLanguage && hljs && hljs.getLanguage(normalizedLanguage)) {
              try {
                return '<pre><code class="hljs language-' + escapeHtml(normalizedLanguage) + '">' + hljs.highlight(code, {
                  language: normalizedLanguage,
                  ignoreIllegals: true
                }).value + '</code></pre>';
              } catch (e) {}
            }
            return '<pre><code class="hljs">' + escapeHtml(code) + '</code></pre>';
          }
        });

        var defaultFence = md.renderer.rules.fence ||
          function (tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };
        var mermaidCounter = 0;
        md.renderer.rules.fence = function (tokens, idx, options, env, self) {
          var token = tokens[idx];
          var language = token.info.trim().split(/\\s+/)[0];
          if (language === 'mermaid') {
            var id = 'mermaid-diagram-' + (++mermaidCounter);
            return [
              '<div class="mermaid-container" data-mermaid-id="' + id + '">',
              '<div class="mermaid" id="' + id + '">' + escapeHtml(token.content) + '</div>',
              '</div>'
            ].join('');
          }
          return defaultFence(tokens, idx, options, env, self);
        };

        var defaultImage = md.renderer.rules.image ||
          function (tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };
        md.renderer.rules.image = function (tokens, idx, options, env, self) {
          var token = tokens[idx];
          var srcIndex = token.attrIndex('src');
          if (activeFile && srcIndex >= 0) {
            var src = token.attrs[srcIndex][1];
            if (src && !/^(?:[a-z]+:|#|\\/)/i.test(src)) {
              try {
                token.attrs[srcIndex][1] = new URL(src, activeFile.dirUrl).href;
              } catch (e) {}
            }
          }
          return defaultImage(tokens, idx, options, env, self);
        };

        var defaultLink = md.renderer.rules.link_open ||
          function (tokens, idx, options, env, self) { return self.renderToken(tokens, idx, options); };
        md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
          var token = tokens[idx];
          var hrefIndex = token.attrIndex('href');
          if (activeFile && hrefIndex >= 0) {
            var href = token.attrs[hrefIndex][1];
            if (href && /\\.m(?:d|arkdown)(?:#.*)?$/i.test(href) && !/^(?:[a-z]+:|#|\\/)/i.test(href)) {
              try {
                var resolved = new URL(href, activeFile.dirUrl);
                var target = filesByUrl[resolved.href.replace(/#.*$/, '')];
                if (target) {
                  token.attrs[hrefIndex][1] = '#';
                  token.attrSet('data-mdopen-path', target.path);
                }
              } catch (e) {}
            }
          }
          return defaultLink(tokens, idx, options, env, self);
        };

        if (window.markdownitDeflist) md.use(window.markdownitDeflist);
        if (window.markdownitFootnote) md.use(window.markdownitFootnote);
        if (window.markdownitMark) md.use(window.markdownitMark);
        if (window.markdownitSub) md.use(window.markdownitSub);
        if (window.markdownitSup) md.use(window.markdownitSup);
        if (window.markdownitTaskLists) md.use(window.markdownitTaskLists, { enabled: true, label: true });
      }

      function hasMermaidFence(text) {
        return /^\\x60\\x60\\x60mermaid\\b/m.test(text);
      }

      function loadMermaid(callback) {
        if (mermaidLoaded) {
          callback();
          return;
        }
        var s = document.createElement('script');
        s.type = 'module';
        s.textContent = [
          'import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";',
          'window._mdopenMermaid = mermaid;',
          'document.dispatchEvent(new Event("mdopen-mermaid-loaded"));'
        ].join('\\n');
        document.head.appendChild(s);
        document.addEventListener('mdopen-mermaid-loaded', function onLoaded() {
          document.removeEventListener('mdopen-mermaid-loaded', onLoaded);
          mermaidModule = window._mdopenMermaid;
          mermaidLoaded = true;
          wireMermaidOverlay();
          callback();
        });
      }

      function renderMermaidDiagrams() {
        if (!mermaidModule) return;
        var overlay = window.mdopenMermaidOverlay;
        if (overlay) overlay.exit();
        var theme = document.documentElement.dataset.mdopenTheme === 'dark' ? 'dark' : 'default';
        mermaidModule.initialize({
          startOnLoad: false,
          theme: theme,
          securityLevel: 'strict',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
        });
        document.querySelectorAll('.mermaid-container').forEach(function (container) {
          var diagram = container.querySelector('.mermaid');
          if (!diagram) return;
          if (!diagram.dataset.source) diagram.dataset.source = diagram.textContent || '';
          diagram.removeAttribute('data-processed');
          diagram.textContent = diagram.dataset.source;
          mermaidModule.render(diagram.id + '-svg-' + (++mermaidRenderCounter), diagram.dataset.source)
            .then(function (result) {
              diagram.innerHTML = result.svg;
              if (result.bindFunctions) result.bindFunctions(diagram);
              if (overlay) overlay.addButtons(container);
            })
            .catch(function (error) {
              diagram.textContent = 'Mermaid render failed: ' + (error.message || error);
              if (overlay) overlay.addButtons(container);
            });
        });
      }

      function getTransform(scale, translate) {
        return 'translate(' + translate.x + 'px, ' + translate.y + 'px) scale(' + scale + ')';
      }

      function getFitScale(container, diagram) {
        var rect = diagram.getBoundingClientRect();
        if (!rect.width || !rect.height) return 1;
        var fitX = window.innerWidth * 0.9 / rect.width;
        var fitY = window.innerHeight * 0.9 / rect.height;
        return Math.max(0.2, Math.min(8, Math.min(fitX, fitY)));
      }

      function applyMermaidPanZoom(state) {
        state.diagram.style.transform = getTransform(state.scale, state.translate);
      }

      function enableMermaidPanZoom(container) {
        if (container._mdopenMermaidPanZoom) {
          var st = container._mdopenMermaidPanZoom;
          st.scale = getFitScale(container, st.diagram);
          st.translate = { x: 0, y: 0 };
          st.diagram.style.transition = 'transform 100ms ease-out';
          applyMermaidPanZoom(st);
          return;
        }
        var diagram = container.querySelector('.mermaid');
        if (!diagram) return;
        var state = {
          diagram: diagram,
          scale: getFitScale(container, diagram),
          translate: { x: 0, y: 0 },
          dragging: false,
          dragStart: { x: 0, y: 0 },
          lastTouchDistance: 0
        };
        container.style.cursor = 'grab';
        container.style.touchAction = 'none';
        diagram.style.cursor = 'grab';
        diagram.style.userSelect = 'none';
        diagram.style.touchAction = 'none';
        diagram.style.transformOrigin = 'center center';
        diagram.style.transition = 'transform 100ms ease-out';
        applyMermaidPanZoom(state);
        function isButtonEvent(event) {
          return event.target && event.target.closest && event.target.closest('.mermaid-fullscreen-btn');
        }
        function wheel(event) {
          event.preventDefault();
          var step = state.scale * (event.ctrlKey ? 0.15 : 0.1);
          var direction = event.deltaY > 0 ? -1 : 1;
          state.scale = Math.max(0.1, Math.min(20, state.scale + direction * step));
          applyMermaidPanZoom(state);
        }
        function mouseDown(event) {
          if (event.button !== 0 || isButtonEvent(event)) return;
          event.preventDefault();
          state.dragging = true;
          state.dragStart = { x: event.clientX - state.translate.x, y: event.clientY - state.translate.y };
          container.style.cursor = 'grabbing';
          diagram.style.cursor = 'grabbing';
          diagram.style.transition = '';
        }
        function mouseMove(event) {
          if (!state.dragging) return;
          state.translate.x = event.clientX - state.dragStart.x;
          state.translate.y = event.clientY - state.dragStart.y;
          applyMermaidPanZoom(state);
        }
        function mouseUp() {
          if (!state.dragging) return;
          state.dragging = false;
          container.style.cursor = 'grab';
          diagram.style.cursor = 'grab';
          diagram.style.transition = 'transform 100ms ease-out';
        }
        function touchDistance(touches) {
          return Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY);
        }
        function touchStart(event) {
          if (isButtonEvent(event)) return;
          if (event.touches.length === 2) {
            state.lastTouchDistance = touchDistance(event.touches);
          } else if (event.touches.length === 1) {
            state.dragging = true;
            state.dragStart = { x: event.touches[0].clientX - state.translate.x, y: event.touches[0].clientY - state.translate.y };
          }
        }
        function touchMove(event) {
          event.preventDefault();
          if (event.touches.length === 2) {
            var distance = touchDistance(event.touches);
            if (state.lastTouchDistance > 0) {
              var delta = distance > state.lastTouchDistance ? 1 : -1;
              state.scale = Math.max(0.1, Math.min(20, state.scale + delta * state.scale * 0.1));
              applyMermaidPanZoom(state);
            }
            state.lastTouchDistance = distance;
          } else if (event.touches.length === 1 && state.dragging) {
            state.translate.x = event.touches[0].clientX - state.dragStart.x;
            state.translate.y = event.touches[0].clientY - state.dragStart.y;
            applyMermaidPanZoom(state);
          }
        }
        function touchEnd() {
          state.dragging = false;
          state.lastTouchDistance = 0;
        }
        function doubleClick(event) {
          if (isButtonEvent(event)) return;
          state.scale = getFitScale(container, diagram);
          state.translate = { x: 0, y: 0 };
          diagram.style.transition = 'transform 220ms ease-out';
          applyMermaidPanZoom(state);
        }
        container.addEventListener('wheel', wheel, { passive: false });
        container.addEventListener('mousedown', mouseDown);
        document.addEventListener('mousemove', mouseMove);
        document.addEventListener('mouseup', mouseUp);
        container.addEventListener('touchstart', touchStart, { passive: false });
        container.addEventListener('touchmove', touchMove, { passive: false });
        container.addEventListener('touchend', touchEnd);
        container.addEventListener('dblclick', doubleClick);
        state.cleanup = function () {
          container.removeEventListener('wheel', wheel);
          container.removeEventListener('mousedown', mouseDown);
          document.removeEventListener('mousemove', mouseMove);
          document.removeEventListener('mouseup', mouseUp);
          container.removeEventListener('touchstart', touchStart);
          container.removeEventListener('touchmove', touchMove);
          container.removeEventListener('touchend', touchEnd);
          container.removeEventListener('dblclick', doubleClick);
        };
        container._mdopenMermaidPanZoom = state;
      }

      function disableMermaidPanZoom(container) {
        var state = container._mdopenMermaidPanZoom;
        if (state && state.cleanup) state.cleanup();
        var diagram = container.querySelector('.mermaid');
        if (diagram) {
          diagram.style.transform = '';
          diagram.style.transformOrigin = '';
          diagram.style.transition = '';
          diagram.style.cursor = '';
          diagram.style.userSelect = '';
          diagram.style.touchAction = '';
        }
        container.style.cursor = '';
        container.style.touchAction = '';
        delete container._mdopenMermaidPanZoom;
      }

      function wireMermaidOverlay() {
        var overlay = window.mdopenMermaidOverlay;
        if (!overlay) return;
        overlay.setHooks({ onEnter: enableMermaidPanZoom, onExit: disableMermaidPanZoom });
      }

      function renderIndex() {
        activeFile = null;
        article.innerHTML = [
          '<h1>' + escapeHtml(directoryData.rootName) + '</h1>',
          '<p>' + directoryData.files.length + ' Markdown file' + (directoryData.files.length === 1 ? '' : 's') + ' found.</p>',
          '<ul>' + directoryData.files.map(function (file) {
            return '<li><a href="#" data-mdopen-path="' + escapeHtml(file.path) + '">' + escapeHtml(file.path) + '</a></li>';
          }).join('') + '</ul>'
        ].join('');
        setActiveButton('');
      }

      function renderFile(file) {
        activeFile = file;
        if (window.mdopenMermaidOverlay) window.mdopenMermaidOverlay.exit();
        var parsed = extractFrontmatter(file.content);
        article.innerHTML = renderFrontmatter(parsed.frontmatter) + enhanceHtml(md.render(parsed.body));
        document.title = file.path + ' - mdopen';
        setActiveButton(file.path);
        if (hasMermaidFence(parsed.body)) {
          loadMermaid(renderMermaidDiagrams);
        }
      }

      function setActiveButton(filePath) {
        document.querySelectorAll('.mdopen-directory-nav button').forEach(function (button) {
          if (button.dataset.mdopenPath === filePath) {
            button.setAttribute('aria-current', 'page');
          } else {
            button.removeAttribute('aria-current');
          }
        });
      }

      function openPath(filePath) {
        if (!filePath) {
          renderIndex();
          return;
        }
        var file = filesByPath[filePath];
        if (!file) return;
        loadScripts(function () {
          initMarkdownIt();
          if (!md) {
            article.innerHTML = '<p>Could not load the browser Markdown renderer.</p>';
            return;
          }
          renderFile(file);
        });
      }

      function createNav() {
        var nav = document.createElement('aside');
        nav.className = 'mdopen-directory-nav';
        nav.setAttribute('aria-label', 'Markdown files');
        nav.innerHTML = '<h2>' + escapeHtml(directoryData.rootName) + '</h2>';

        var indexButton = document.createElement('button');
        indexButton.type = 'button';
        indexButton.dataset.mdopenPath = '';
        indexButton.textContent = 'Index';
        nav.appendChild(indexButton);

        directoryData.files.forEach(function (file) {
          var button = document.createElement('button');
          button.type = 'button';
          button.dataset.mdopenPath = file.path;
          button.textContent = file.path;
          nav.appendChild(button);
        });

        nav.addEventListener('click', function (event) {
          var button = event.target.closest('button[data-mdopen-path]');
          if (button) openPath(button.dataset.mdopenPath);
        });

        document.body.insertBefore(nav, document.body.firstChild);
      }

      article.addEventListener('click', function (event) {
        var link = event.target.closest('a[data-mdopen-path]');
        if (!link) return;
        event.preventDefault();
        openPath(link.getAttribute('data-mdopen-path'));
      });

      createNav();
      renderIndex();
    }());
  </script>`;
}

const args = process.argv.slice(2);
if (args.includes("-h") || args.includes("--help")) {
  help();
  process.exit(0);
}
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

if (!inputStat.isFile() && !inputStat.isDirectory()) {
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
const isDirectoryInput = inputStat.isDirectory();
const outputRoot = isDirectoryInput ? path.join(outdir, `${path.basename(input) || "directory"}-index`) : outdir;
const output = isDirectoryInput ? path.join(outputRoot, "index.html") : path.join(outputRoot, `${title}.html`);

if (isDirectoryInput) {
  fs.rmSync(outputRoot, { recursive: true, force: true });
}

copyFile(path.join(assetsDir, "mdopen.css"), path.join(outputRoot, "mdopen.css"));
copyFile(path.join(assetsDir, "mdopen-overrides.css"), path.join(outputRoot, "mdopen-overrides.css"));
copyFile(path.join(stylesDir, "demo.css"), path.join(outputRoot, "demo.css"));
copyFile(path.join(stylesDir, "readthedocs.css"), path.join(outputRoot, "readthedocs.css"));
copyDirectoryFiles(path.join(stylesDir, "fonts"), path.join(outputRoot, "fonts"));

const examplesDir = path.join(projectDir, "examples");
const defaultStyle = pathStartsWith(input, examplesDir) ? "demo" : "default";

if (isDirectoryInput) {
  const markdownFiles = collectMarkdownFiles(input);
  if (markdownFiles.length === 0) {
    fail(`no Markdown files found within ${DIRECTORY_SCAN_DEPTH} levels: ${args[0]}`);
  }

  renderDirectoryViewer(template, output, path.basename(input) || "Directory", "mdopen.css", defaultStyle, input, markdownFiles);
} else {
  renderMarkdownFile(renderer, template, input, output, title, defaultStyle);
}

openHtml(output);
console.log(output);
