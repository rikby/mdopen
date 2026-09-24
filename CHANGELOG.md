# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- `-h` / `--help` prints CLI help (usage, arguments, options, environment, examples) to stdout and exits 0; wrong arguments still print a short usage to stderr and exit 2.
- `renderer.js` exports `renderMarkdown(markdown, options)` so the rendering pipeline is importable as a library, not just callable via CLI. The CLI path runs only when invoked directly (`require.main === module`).
- Optional `resolveImage` callback parameterizes relative image path resolution: the CLI passes a filesystem resolver; HTTP consumers pass a URL resolver; omitted leaves relative paths unchanged.
- Test suite using Bun's built-in test runner (`bun test`) with CLI output parity and render export interface coverage.
- Architectural Decision Record for the render API: `docs/decisions/0001-expose-rendermarkdown-as-library-api.md`.

### Changed

- `ARCHITECTURE.md` documents the library entry point and `resolveImage` option.

## [0.2.0] - 2026-05-17

### Added

- Rich document copy button and copy mode menu.
- Live Markdown editor on GitHub Pages with local file open/save.
- Frontmatter block rendering.
- macOS x64 and Windows cross-compiled binaries.

### Fixed

- Improved formatting of code blocks, callouts, scrollbars, and print output.

### Changed

- Extracted toolbar script and merged print/code menu options.

## [0.1.0] - 2026-05-13

### Added

- Markdown-to-HTML rendering with Bun, `markdown-it`, and `highlight.js`.
- Cross-platform launchers for macOS, Linux, Windows, and MinGW/Git Bash.
- Styled browser output with GitHub Markdown CSS, local style sources, font themes, grayscale tones, color accents, density controls, and print-focused styles.
- Mermaid fenced diagram rendering with fullscreen, pan, zoom, theme re-rendering, and inline error handling.
- Support for relative local images, task lists, definition lists, footnotes, marks, subscript, superscript, and GitHub-style callouts.
- GitHub Pages demo build and release binary build workflow.

### Documentation

- Added architecture, styling, binary release, design mockup, and design spec documentation.
