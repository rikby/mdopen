# AGENTS.md

## Purpose

`mdopen` is a small cross-platform helper that renders one Markdown file to styled HTML with Bun, `markdown-it`, and `highlight.js`, writes the result to a temp directory, and opens it in the default browser.

## Architecture

`ARCHITECTURE.md` is the source of truth for runtime flow, component responsibilities, and constraints.

This file keeps agent-specific working rules only.

## Working Rules

- The editor panel (pencil button, editor CSS, editor script) is GitHub Pages only — it must NOT be included in the binary build. Only `build-pages.js` generates the editor page (`edit.html`).

- Keep changes small and script-local unless docs need updating.
- Preserve Bun + `markdown-it` + `highlight.js` as the only runtime requirements.
- Keep macOS, Linux, Windows, and MinGW/Git Bash launchers working.
- Keep renderer, template, CSS, and asset changes compatible with `bun run build:binary`.
- Keep source CSS in `assets/mdopen.css`.
- Keep optional style-source CSS in `assets/styles/`.
- Keep template markup in `templates/mdopen.html`.
- Keep toolbar and copy UI JavaScript in `templates/mdopen-script.html`.
- Mermaid support should keep the `.mermaid-container` / `.mermaid` structure and load Mermaid only when needed.
- Follow `ARCHITECTURE.md` for runtime/component boundaries.
- Follow `docs/styling.md` for CSS and template styling conventions.
- Do not add dependencies for simple UI or formatting changes.
- Test script syntax with:

```bash
bash -n bin/mdopen
bun run check
bun renderer.js README.md templates/mdopen.html /tmp/mdopen-check.html README mdopen.css
```

- Smoke test with:

```bash
./bin/mdopen README.md
```

## UI Notes

- Screen theme, style source, grayscale tone, color accent, font theme, and density are separate controls.
- Use a single round light/dark icon toggle and a hamburger menu with button groups for style, tone, color, font, and density.
- Tone `default` and color `default` must not set override data attributes; preserve style-source colors.
- Dark mode is for reading only; print output should stay light.
- Grayscale tone affects the whole document.
- Print grayscale colors must stay neutral RGB values, for example `#333333`, not tinted near-blacks.
- Color accents should use related but varied tones across heading levels and blocks.
- Keep accent palettes light and laser-printer friendly.
- Font themes should use named stacks with practical fallbacks; avoid web font dependencies.
