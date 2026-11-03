# Architecture

`mdopen` is a small cross-platform command-line helper. It renders one Markdown file, or one local directory of Markdown files, into styled browser output written to a temp directory and opened in the default browser.

There is no server, build system, app framework, or frontend bundler.

## Runtime Flow

1. `mdopen FILE.md|DIR` validates the input path through the Bun CLI in `bin/mdopen.js`.
2. Thin launchers in `bin/mdopen`, `bin/mdopen.cmd`, and `bin/mdopen.ps1` delegate to the Bun CLI.
3. The CLI creates the output root — the platform temp `mdopen` directory, or `DIR` when `-o/--output DIR` is given — copies CSS and font assets there, and chooses a default style source. A user-supplied output directory is never wiped; only the CLI-owned temp `<dir>-index` root is cleaned between runs.
4. For a file input, it runs `renderer.js` with the input path, template path, output path, page title, CSS filename, and default style.
5. `renderer.js` renders Markdown into the HTML template and writes the final file.
6. For a directory input, the CLI scans Markdown files, writes one local HTML viewer page, and embeds a file manifest plus browser-side Markdown rendering script.
7. The CLI opens the generated HTML with the platform opener: `open`, `xdg-open`, or Windows `cmd.exe /c start`.

## Main Pieces

- `bin/mdopen.js`: cross-platform Bun CLI and asset-copy orchestration.
- `bin/mdopen`, `bin/mdopen.cmd`, `bin/mdopen.ps1`: platform launchers.
- `renderer.js`: Bun-executed CommonJS renderer using `markdown-it` and `highlight.js`. Exports `renderMarkdown(markdown, options)` so the rendering pipeline is importable as a library; the CLI path runs only when invoked directly via `require.main === module`.
- `templates/mdopen.html`: HTML shell and toolbar markup.
- `templates/mdopen-script.html`: browser-side toolbar controls, persisted view controls, copy behavior, and print theme behavior.
- `templates/mermaid-script.html`: lazy Mermaid rendering and diagram error handling (CLI single-file path).
- `templates/media-overlay.html`: shared image/Mermaid Full buttons, modal dialog, pan, zoom, focus return, and cleanup (`window.mdopenMediaOverlay`) for every rendering path.
- `assets/mdopen.css`: shared layout, toolbar, Mermaid, base tokens, and print defaults.
- `assets/mdopen-overrides.css`: final user-control override layer.
- `assets/styles/`: optional style-source CSS loaded by the template.

## Rendering Model

The renderer enables Markdown extensions through `markdown-it` plugins for definition lists, footnotes, marks, subscript, superscript, and task lists.

Code fences with a known language are highlighted by `highlight.js`. Unknown or unlabeled fences are escaped and rendered without auto-detection to keep rendering predictable and cheap.

Relative image paths are resolved against the input Markdown file directory so rendered HTML can display local images from the source document.

Leading `---` frontmatter is extracted before Markdown rendering. Valid frontmatter renders as a collapsed `.mdopen-frontmatter` details block above the document body; invalid or non-leading markers stay in normal Markdown flow.

GitHub-style callout blockquotes are post-processed into `.callout` sections after Markdown rendering.

Headings are post-processed into anchor targets after Markdown rendering: h1-h6 receive a GitHub-compatible unicode-aware slug `id` (duplicates get `-1`/`-2` suffixes) and their content is wrapped in `.mdopen-heading-link` so the whole title is clickable. The directory viewer applies the same transformation client-side after each render and routes navigation through the URL hash: `#{path}--{slug}` opens a file at a heading, `#{path}` opens a file, and `hashchange` drives history.

The rendering pipeline is importable via `require('./renderer.js').renderMarkdown(markdown, options)`. The `resolveImage` option controls relative image path resolution: the CLI passes a filesystem resolver (`path.resolve`), while HTTP consumers pass a URL resolver. When omitted, relative paths are left unchanged.

## Directory Viewer

`mdopen DIR` is a local viewer mode for navigating a small Markdown tree. It does not generate one HTML file per Markdown file. Instead, the CLI:

1. Scans `.md` and `.markdown` files up to 5 levels deep.
2. Skips hidden directories and common generated directories such as `.git`, `.n8n`, `node_modules`, `dist`, `build`, and `_site`.
3. Embeds the discovered Markdown content and source file URLs in one generated HTML page.
4. Adds a left-side `.mdopen-directory-nav` collapsible folder tree (`details`/`summary`) with a viewer-only toolbar toggle to hide the nav; expanded/collapsed and hidden state persist in `localStorage`.
5. Renders the selected file in-browser into the existing `.markdown-body` article.

The viewer keeps the existing toolbar, theme controls, copy controls, print behavior, and document CSS cascade. Relative image paths in selected Markdown files resolve against the selected source file's directory.

The directory viewer is CLI-only. It is not the GitHub Pages editor and does not expose write access to source files.

## Mermaid

Mermaid is loaded only when the Markdown includes a `mermaid` fenced block. The renderer emits this structure (the Full button is injected by the overlay engine after render, not at render time):

```html
<div class="mermaid-container">
  <div class="mermaid">...</div>
</div>
```

The browser script renders each diagram independently. Invalid diagrams show an inline error message instead of breaking the rest of the page. Theme changes re-render diagrams so Mermaid matches light or dark reading mode.

## Media Zoom

Every page includes `templates/media-overlay.html` through the `{{mediaScript}}`
slot, independently of the conditional Mermaid module. The engine discovers
article images and rendered Mermaid SVGs, adding a Full button. A single
article-scoped MutationObserver handles directory navigation, editor previews,
and asynchronous diagram rendering. Broken or unloaded images have a disabled
button until loaded. Linked images retain their navigation, with the zoom button
outside the link.

Full opens a native modal `<dialog>` in the browser top layer, without the
Fullscreen API. The engine copies the selected image (using its current source)
or serializes the rendered Mermaid SVG into an isolated image. The original
media stays in document flow, with its IDs, styles, and links untouched. This
also avoids duplicate SVG IDs and clipping by document filters or scroll areas.

One gesture implementation owns wheel zoom, pointer drag/pinch, zoom buttons,
keyboard +/−/0, centered fit, and double-click reset. Resize refits the media.
Escape/Close releases scroll lock and returns focus; source replacement, theme
changes, and printing also close the overlay. Zoom buttons and the dialog are
excluded from print output. There are no new runtime dependencies.

The binary build embeds the same media partial and extracts the directory viewer
script generator from `bin/mdopen.js` at build time, so the source and binary
viewers share rendering and interaction behavior. The Pages-only editor remains
excluded from the binary.

## Styling Model

Styles load in this order:

1. External GitHub Markdown CSS.
2. `assets/mdopen.css`.
3. Style sources from `assets/styles/`.
4. `assets/mdopen-overrides.css`.

Use `data-mdopen-*` attributes for selected view options:

- `data-mdopen-theme`
- `data-mdopen-style`
- `data-mdopen-tone`
- `data-mdopen-accent`
- `data-mdopen-font`
- `data-mdopen-density`
- `data-mdopen-print-frontmatter`
- `data-mdopen-code-wrap`

Tone `default` and accent `default` remove their override attributes so the selected style source can keep its native colors. Dark mode is for screen reading only; print output stays light.

## GitHub Pages Editor

The editor is a client-side Markdown editor added to mdopen's GitHub Pages site. It is a slide-in panel toggled by a pencil button in the toolbar. The editor uses CDN-loaded markdown-it and highlight.js to render live previews after 1 second of inactivity.

### Scope

The editor is GitHub Pages only. It is NOT included in the binary build. The binary embeds templates and scripts at compile time — editor CDN scripts and the pencil button have no place there.

### Components

- `assets/editor.css`: editor panel layout, textarea styling, responsive rules, scoped under `.mdopen-editor-panel`.
- `templates/editor-script.html`: browser-side script for CDN loading, markdown-it initialization, textarea binding, debounce rendering, and mermaid lazy-loading.
- The pencil button (`.mdopen-editor-button`) is added to the toolbar in `templates/mdopen.html` with `data-mdopen-editor-hidden` to hide it on non-editor pages.
- `scripts/build-pages.js` generates `edit.html` with the pencil button visible and the editor script injected via `{{editorScript}}`.

### Rendering Pipeline

The browser-side rendering uses the same markdown-it configuration as the CLI `renderer.js`:

1. Same plugins: deflist, footnote, mark, sub, sup, task-lists.
2. Same highlight.js integration for code blocks.
3. Same callout regex (`enhanceHtml()`) for GitHub-style callout blockquotes.
4. Same mermaid container structure for mermaid diagrams.

Differences from CLI renderer:

- Image path resolution is skipped (URL images only).
- Rendering is triggered by 1s debounce on textarea input instead of CLI invocation.
- CDN scripts are loaded only when the editor opens.

## Constraints

- Keep runtime requirements to Bun, `markdown-it`, and `highlight.js`.
- Support macOS, Linux, Windows native shells, and MinGW/Git Bash.
- Do not add dependencies for simple UI or formatting work.
- Keep source CSS in `assets/`.
- Keep template markup and browser UI scripts in `templates/`.
- Keep changes small and local; this project is intentionally script-sized.

## Verification

Use the package check for syntax and render validation:

```bash
bun run check
```

Smoke test the installed flow:

```bash
./bin/mdopen README.md
```
