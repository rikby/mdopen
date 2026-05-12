# AGENTS.md

## Purpose

`mdopen` is a small macOS helper that renders one Markdown file to styled HTML with Bun, `markdown-it`, and `highlight.js`, writes the result to a temp directory, and opens it in the default browser.

## Architecture

- `mdopen`: the whole app. Bash script that:
  - validates input and Bun
  - resolves the project directory, including symlink execution
  - copies the CSS asset to the temp render directory
  - runs `renderer.js` and opens the generated HTML
- `renderer.js`: Bun-executed CommonJS renderer using `markdown-it` and direct `highlight.js` integration.
- `assets/mdopen.css`: screen, density, grayscale tone, color accent, and print styling.
- `assets/styles/demo.css`: optional screen style source adapted from `review/markdown_html_render_demo.html`.
- `templates/mdopen.html`: HTML template, GitHub Markdown CSS link, toolbar, and UI JavaScript.
- `docs/styling.md`: local styling contract for CSS structure, data attributes, themes, tones, accents, fonts, and print rules.
- `README.md`: user-facing usage and install notes.

There is no build system, server, or app framework.

## Working Rules

- Keep changes small and script-local unless docs need updating.
- Preserve macOS + Bun + `markdown-it` + `highlight.js` as the only runtime requirements.
- Keep source CSS in `assets/mdopen.css`.
- Keep optional style-source CSS in `assets/styles/`.
- Keep template markup and UI JavaScript in `templates/mdopen.html`.
- Mermaid support should keep the `.mermaid-container` / `.mermaid` structure and load Mermaid only when needed.
- Follow `docs/styling.md` for CSS and template styling conventions.
- Do not add dependencies for simple UI or formatting changes.
- Test script syntax with:

```bash
bash -n mdopen
bun renderer.js README.md templates/mdopen.html /tmp/mdopen-check.html README mdopen.css
```

- Smoke test with:

```bash
./mdopen README.md
```

## UI Notes

- Screen theme, style source, grayscale tone, color accent, font theme, and density are separate controls.
- Use a single light/dark toggle and dropdown menus for style, tone, color, font, and density.
- Tone `default` and color `default` must not set override data attributes; preserve style-source colors.
- Dark mode is for reading only; print output should stay light.
- Grayscale tone affects the whole document.
- Print grayscale colors must stay neutral RGB values, for example `#333333`, not tinted near-blacks.
- Color accents should use related but varied tones across heading levels and blocks.
- Keep accent palettes light and laser-printer friendly.
- Font themes should use named stacks with practical fallbacks; avoid web font dependencies.
