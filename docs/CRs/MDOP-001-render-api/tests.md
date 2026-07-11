# Tests: MDOP-001

## Test Framework

Bun's built-in test runner (`bun test`) — zero new dependencies, satisfies AGENTS.md "do not add dependencies for simple work." Test files use `*.test.js` and CommonJS (matching `renderer.js` and `"type": "commonjs"` in `package.json`).

No existing test directory in the project; create `test/`.

## Module → Test Mapping

| Module | Test File | Tests |
|--------|-----------|-------|
| `renderer.js` (export `renderMarkdown`) | `test/renderer.test.js` | 7 |
| `renderer.js` (CLI parity) | `test/cli-parity.test.js` | 1 |

## Test Details

### `test/renderer.test.js` — export interface

| Test | What it verifies |
|------|------------------|
| `require` does not execute side effects | Importing the module with no argv does not write files or parse argv — no crash, no exit |
| `renderMarkdown` is a function | `typeof module.exports.renderMarkdown === 'function'` |
| renders markdown to HTML string | Calling with a sample heading returns a string containing `<h1>` and the heading text |
| resolves relative images for local-file context | `resolveImage` callback producing `path.resolve` output appears in rendered `<img src>` |
| resolves relative images for HTTP context | `resolveImage` callback producing a URL appears in rendered `<img src>` |
| leaves relative images unchanged when no resolver | Omitting `resolveImage` preserves the original relative `src` |
| handles empty markdown without error | Empty string input returns valid HTML without throwing |

### `test/cli-parity.test.js` — CLI output invariance

| Test | What it verifies |
|------|------------------|
| CLI output matches baseline | Spawning `renderer.js README.md templates/mdopen.html /tmp/out.html README mdopen.css` produces byte-identical output to the pre-refactor baseline (`/tmp/mdop001-before.html`, 39,676 bytes) |

## Data Mechanism Tests

| Pattern | Module | Tests |
|---------|--------|-------|
| Image resolution context | `renderMarkdown` `resolveImage` option | local-file (filesystem path), HTTP (URL), omitted (unchanged) |

## External Dependency Tests

None. `renderMarkdown` has no external dependencies beyond the existing markdown-it + highlight.js (already bundled). No env vars, no API calls, no external commands.

## Constraint Coverage

| Constraint | Test File | Tests |
|------------|-----------|-------|
| No new dependencies | n/a (verified by `package.json` diff, not a runtime test) | — |
| CLI argv contract preserved | `test/cli-parity.test.js` | CLI output matches baseline |
| Mermaid structure preserved | `test/renderer.test.js` | mermaid fence produces `.mermaid-container` / `.mermaid` structure (covered in render-output assertions) |

## Verification

```bash
bun test
```

Also re-run existing checks after implementation:

```bash
bash -n bin/mdopen
bun run check
bun renderer.js README.md templates/mdopen.html /tmp/mdopen-check.html README mdopen.css
./bin/mdopen README.md
```

## Implementation Notes

- Tests are written RED (fail until `renderMarkdown` export exists)
- The CLI-parity test depends on a baseline file; the test generates it on first run if missing, then asserts identical output on subsequent runs
- Baseline: `/tmp/mdop001-before.html` (39,676 bytes, captured 2026-07-11) — the test should use a fixture path under `test/` for portability, or regenerate-and-compare within a single run
