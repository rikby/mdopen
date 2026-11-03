# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.4.0] - 2026-11-03

### Added

- Fullscreen image zoom alongside Mermaid: scroll/pinch or +/− to zoom, drag to pan, Fit/double-click to reset, and Escape to close. Available in file previews, directory viewers, binaries, and the Pages editor; linked images keep their navigation.

### Changed

- Images and Mermaid share one modal viewer and gesture implementation; binary directory output now uses the same viewer generator as the source CLI.

- Printed tables now split across pages Excel-style instead of jumping wholesale to the next page: a long table starts right after the preceding text, fills the remaining page, and continues on the next page with its header row repeated (Chrome/Firefox; Safari splits but may not repeat the header). Rows are never cut mid-row, and code blocks and blockquotes still refuse to split. (MDOP-007)

## [0.3.0] - 2026-09-25

### Added

- GitHub-style heading anchors: every rendered heading h1-h6 gets an id and a clickable full-title link (hover shows a `#`); slugs are unicode-aware and deduped (`-1`, `-2`).
- Shareable hash links: single files support `#{heading-slug}` natively; the directory viewer routes `#{path}--{heading-slug}` (and `#{path}`) through `hashchange`, so shared URLs open the right document and scroll to the section, and browser back/forward walks selection history.
- `-o` / `--output DIR` writes the generated HTML (and assets) into `DIR` instead of the temp directory, for both single-file and directory-viewer modes; existing files in `DIR` are preserved.
- `-h` / `--help` prints CLI help (usage, arguments, options, environment, examples) to stdout and exits 0; wrong arguments still print a short usage to stderr and exit 2.
- `renderer.js` exports `renderMarkdown(markdown, options)` so the rendering pipeline is importable as a library, not just callable via CLI. The CLI path runs only when invoked directly (`require.main === module`).
- Optional `resolveImage` callback parameterizes relative image path resolution: the CLI passes a filesystem resolver; HTTP consumers pass a URL resolver; omitted leaves relative paths unchanged.
- Test suite using Bun's built-in test runner (`bun test`) with CLI output parity and render export interface coverage.
- Architectural Decision Record for the render API: `docs/decisions/0001-expose-rendermarkdown-as-library-api.md`.

### Changed

- `ARCHITECTURE.md` documents the library entry point and `resolveImage` option.
- Directory viewer nav renders as a collapsible folder tree (`details`/`summary`), with persisted expanded/collapsed state, auto-reveal of the selected file's ancestors, and a viewer-only toolbar toggle to hide the nav; ships in both the CLI and the standalone binary.
- Directory viewer tree uses the UI sans font stack regardless of the document font theme, and its width is user-resizable via a right-edge drag handle (arrow keys work too); the chosen width persists.
- Directory viewer file buttons show document titles (first H1 outside code fences, filename fallback), matching markdown-ticket's title rule.
- Directory viewer index page shows each file as title over a monospace path with a copy-path button on the path line; the whole row is clickable and hover matches the nav tree (hand cursor, no underlining). A search input filters by title or path; the nav tree gets the same search on top.
- `--open` / `--no-open` flags override the `MDOPEN_NO_OPEN` environment variable (last flag wins); standalone binary also gains `-h/--help` and `-o/--output DIR` parity.

### Fixed

- Directory viewer script was injected into two template slots and executed twice, producing two nav trees (one detached) — the visible tree ignored the hide toggle and mobile auto-collapse until fixed.
- Standalone binary single-file rendering silently wrote no HTML: the embedded renderer's `require.main === module` CLI guard never matched under the binary's require shim.

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
