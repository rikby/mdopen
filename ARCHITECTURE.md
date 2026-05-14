# Architecture

`mdopen` is a small cross-platform command-line helper. It renders one Markdown file into styled HTML, writes the output to a temp directory, and opens it in the default browser.

There is no server, build system, app framework, or frontend bundler.

## Runtime Flow

1. `mdopen FILE.md` validates the input file through the Bun CLI in `bin/mdopen.js`.
2. Thin launchers in `bin/mdopen`, `bin/mdopen.cmd`, and `bin/mdopen.ps1` delegate to the Bun CLI.
3. The CLI creates the platform temp `mdopen` directory, copies CSS and font assets there, and chooses a default style source.
4. It runs `renderer.js` with the input path, template path, output path, page title, CSS filename, and default style.
5. `renderer.js` renders Markdown into the HTML template and writes the final file.
6. The CLI opens the generated HTML with the platform opener: `open`, `xdg-open`, or Windows `cmd.exe /c start`.

## Main Pieces

- `bin/mdopen.js`: cross-platform Bun CLI and asset-copy orchestration.
- `bin/mdopen`, `bin/mdopen.cmd`, `bin/mdopen.ps1`: platform launchers.
- `renderer.js`: Bun-executed CommonJS renderer using `markdown-it` and `highlight.js`.
- `templates/mdopen.html`: HTML shell and toolbar markup.
- `templates/mdopen-script.html`: browser-side toolbar controls, persisted view controls, copy behavior, and print theme behavior.
- `templates/mermaid-script.html`: browser-side Mermaid rendering, fullscreen, pan, zoom, and diagram error handling.
- `assets/mdopen.css`: shared layout, toolbar, Mermaid, base tokens, and print defaults.
- `assets/mdopen-overrides.css`: final user-control override layer.
- `assets/styles/`: optional style-source CSS loaded by the template.

## Rendering Model

The renderer enables Markdown extensions through `markdown-it` plugins for definition lists, footnotes, marks, subscript, superscript, and task lists.

Code fences with a known language are highlighted by `highlight.js`. Unknown or unlabeled fences are escaped and rendered without auto-detection to keep rendering predictable and cheap.

Relative image paths are resolved against the input Markdown file directory so rendered HTML can display local images from the source document.

GitHub-style callout blockquotes are post-processed into `.callout` sections after Markdown rendering.

## Mermaid

Mermaid is loaded only when the Markdown includes a `mermaid` fenced block. The renderer preserves this structure:

```html
<div class="mermaid-container">
  <button class="mermaid-fullscreen-btn">Full</button>
  <div class="mermaid">...</div>
</div>
```

The browser script renders each diagram independently. Invalid diagrams show an inline error message instead of breaking the rest of the page. Theme changes re-render diagrams so Mermaid matches light or dark reading mode.

Fullscreen behavior uses the browser Fullscreen API when available. Pan and zoom are enabled only while a diagram container is fullscreen.

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

Tone `default` and accent `default` remove their override attributes so the selected style source can keep its native colors. Dark mode is for screen reading only; print output stays light.

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
