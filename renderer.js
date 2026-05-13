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
      const highlighted = hljs.highlightAuto(code).value;
      return `<pre><code class="hljs">${highlighted}</code></pre>`;
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
  .replaceAll("{{mermaidScript}}", hasMermaid ? mermaidScript() : "")
  .replaceAll("{{body}}", body);

fs.writeFileSync(output, html);

function mermaidScript() {
  return `<script type="module">
    import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

    function mermaidTheme() {
      return document.documentElement.dataset.mdopenTheme === "dark" ? "dark" : "default";
    }

    function initMermaid() {
      mermaid.initialize({
        startOnLoad: false,
        theme: mermaidTheme(),
        securityLevel: "strict",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
      });
    }

    async function renderMermaid() {
      initMermaid();
      document.querySelectorAll(".mermaid-container").forEach(function (container) {
        disableMermaidPanZoom(container);
        var diagram = container.querySelector(".mermaid");
        if (!diagram) return;
        if (!diagram.dataset.source) {
          diagram.dataset.source = diagram.textContent || "";
        }
        diagram.removeAttribute("data-processed");
        diagram.textContent = diagram.dataset.source;
      });
      await mermaid.run({ querySelector: ".mermaid" });
    }

    function fullscreenElement() {
      return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    }

    function getTransform(scale, translate) {
      return "translate(" + translate.x + "px, " + translate.y + "px) scale(" + scale + ")";
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

    function fitMermaidPanZoom(container) {
      var state = container._mdopenMermaidPanZoom;
      if (!state) return;
      state.scale = getFitScale(container, state.diagram);
      state.translate = { x: 0, y: 0 };
      state.diagram.style.transition = "transform 100ms ease-out";
      applyMermaidPanZoom(state);
    }

    function enableMermaidPanZoom(container, options) {
      if (container._mdopenMermaidPanZoom) {
        if (options && options.fit) {
          fitMermaidPanZoom(container);
        }
        return;
      }

      var diagram = container.querySelector(".mermaid");
      if (!diagram) return;

      var state = {
        diagram: diagram,
        scale: getFitScale(container, diagram),
        translate: { x: 0, y: 0 },
        dragging: false,
        dragStart: { x: 0, y: 0 },
        lastTouchDistance: 0
      };

      container.style.cursor = "grab";
      container.style.touchAction = "none";
      diagram.style.cursor = "grab";
      diagram.style.userSelect = "none";
      diagram.style.touchAction = "none";
      diagram.style.transformOrigin = "center center";
      diagram.style.transition = "transform 100ms ease-out";
      applyMermaidPanZoom(state);

      function isButtonEvent(event) {
        return event.target && event.target.closest && event.target.closest(".mermaid-fullscreen-btn");
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
        state.dragStart = {
          x: event.clientX - state.translate.x,
          y: event.clientY - state.translate.y
        };
        container.style.cursor = "grabbing";
        diagram.style.cursor = "grabbing";
        diagram.style.transition = "";
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
        container.style.cursor = "grab";
        diagram.style.cursor = "grab";
        diagram.style.transition = "transform 100ms ease-out";
      }

      function touchDistance(touches) {
        var a = touches[0];
        var b = touches[1];
        return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      }

      function touchStart(event) {
        if (isButtonEvent(event)) return;
        if (event.touches.length === 2) {
          state.lastTouchDistance = touchDistance(event.touches);
        } else if (event.touches.length === 1) {
          var touch = event.touches[0];
          state.dragging = true;
          state.dragStart = {
            x: touch.clientX - state.translate.x,
            y: touch.clientY - state.translate.y
          };
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
          var touch = event.touches[0];
          state.translate.x = touch.clientX - state.dragStart.x;
          state.translate.y = touch.clientY - state.dragStart.y;
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
        diagram.style.transition = "transform 220ms ease-out";
        applyMermaidPanZoom(state);
      }

      container.addEventListener("wheel", wheel, { passive: false });
      container.addEventListener("mousedown", mouseDown);
      document.addEventListener("mousemove", mouseMove);
      document.addEventListener("mouseup", mouseUp);
      container.addEventListener("touchstart", touchStart, { passive: false });
      container.addEventListener("touchmove", touchMove, { passive: false });
      container.addEventListener("touchend", touchEnd);
      container.addEventListener("dblclick", doubleClick);

      state.cleanup = function () {
        container.removeEventListener("wheel", wheel);
        container.removeEventListener("mousedown", mouseDown);
        document.removeEventListener("mousemove", mouseMove);
        document.removeEventListener("mouseup", mouseUp);
        container.removeEventListener("touchstart", touchStart);
        container.removeEventListener("touchmove", touchMove);
        container.removeEventListener("touchend", touchEnd);
        container.removeEventListener("dblclick", doubleClick);
      };

      container._mdopenMermaidPanZoom = state;
    }

    function disableMermaidPanZoom(container) {
      var state = container._mdopenMermaidPanZoom;
      if (state && state.cleanup) {
        state.cleanup();
      }

      var diagram = container.querySelector(".mermaid");
      if (diagram) {
        diagram.style.transform = "";
        diagram.style.transformOrigin = "";
        diagram.style.transition = "";
        diagram.style.cursor = "";
        diagram.style.userSelect = "";
        diagram.style.touchAction = "";
      }

      container.style.cursor = "";
      container.style.touchAction = "";
      delete container._mdopenMermaidPanZoom;
    }

    function syncMermaidFullscreen() {
      document.querySelectorAll(".mermaid-container").forEach(function (container) {
        if (fullscreenElement() === container) {
          enableMermaidPanZoom(container, { fit: true });
        } else {
          disableMermaidPanZoom(container);
        }
      });
    }

    document.addEventListener("click", function (event) {
      var button = event.target.closest(".mermaid-fullscreen-btn");
      if (!button) return;
      var container = button.closest(".mermaid-container");
      if (!container) return;
      if (fullscreenElement() === container) {
        disableMermaidPanZoom(container);
        document.exitFullscreen();
      } else {
        enableMermaidPanZoom(container);
        var request = container.requestFullscreen();
        if (request && request.catch) {
          request.catch(function () {
            disableMermaidPanZoom(container);
          });
        }
      }
    });

    document.addEventListener("fullscreenchange", syncMermaidFullscreen);
    document.addEventListener("webkitfullscreenchange", syncMermaidFullscreen);
    document.addEventListener("msfullscreenchange", syncMermaidFullscreen);
    document.addEventListener("mdopen-theme-change", renderMermaid);
    await renderMermaid();
  </script>`;
}
