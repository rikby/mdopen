# AGENTS.md

## Purpose

`mdopen` is a small macOS helper that renders one Markdown file to styled HTML with `pandoc`, writes the result to a temp directory, and opens it in the default browser.

## Architecture

- `mdopen`: the whole app. Bash script that:
  - validates input and `pandoc`
  - creates temp CSS and HTML template files
  - embeds GitHub Markdown CSS from cdnjs
  - adds UI controls for light/dark, print theme, and density
  - runs `pandoc` and opens the generated HTML
- `README.md`: user-facing usage and install notes.

There is no build system, package manager, server, or app framework.

## Working Rules

- Keep changes small and script-local unless docs need updating.
- Preserve macOS + `pandoc` as the only runtime requirements.
- Keep generated CSS/HTML self-contained inside `mdopen`.
- Do not add dependencies for simple UI or formatting changes.
- Test script syntax with:

```bash
bash -n mdopen
```

- Smoke test with:

```bash
./mdopen README.md
```

## UI Notes

- Screen theme and print theme are separate concepts.
- Print themes should prioritize readability and ink economy.
- Body text should stay neutral; color should support hierarchy and scannable blocks.
