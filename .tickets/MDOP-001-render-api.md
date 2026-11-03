---
code: MDOP-001
status: In Progress
dateCreated: 2026-07-11T15:26:00.045Z
type: Architecture
priority: Medium
---

# Expose renderMarkdown API for library reuse

## 1. Description

### Problem Statement

- mdopen's rendering pipeline (markdown-it + highlight.js + callouts + frontmatter + mermaid) is locked inside a CLI-only script that reads argv, writes to a temp file, and exits — there is no way for another tool to call "render this markdown to HTML" as a function
- The GitHub Pages browser-side editor (`templates/editor-script.html`) already duplicates the renderer's markdown-it configuration, callout regex, and mermaid handling by hand — two sources of truth that can drift
- Agent-generated markdown (reports, specs, ADRs, PRDs) rendered by mdopen cannot reach another device or person — `mdopen file.md` opens a local `file://` URL in a local browser only; there is no path from "agent writes `.md`" to "human reads rendered, shareable HTML at a URL"

### Current Architecture

- `renderer.js` is a single CommonJS script that does five things in one flow: parse argv → read input + template files → configure markdown-it → render + post-process → template-substitute → write output file
- No functions are exported; the entire pipeline runs as side effects at module load (lines 14–171)
- Image `src` rewriting resolves relative paths to absolute filesystem paths via `path.resolve(inputDir, src)` — correct for local file viewing, incorrect for HTTP-served output
- Template parts (`mdopen-script.html`, `mermaid-script.html`) are read from disk relative to the template path during substitution
- The browser-side editor re-implements the same markdown-it config independently rather than sharing configuration with `renderer.js`

### Proposed Architecture

- Extract the rendering pipeline into an importable function (e.g. `renderMarkdown(md, opts) → html`) so mdopen's rendering becomes reusable as a library, not just a CLI
- Keep the CLI path as a thin wrapper that calls the extracted function — existing `mdopen file.md` behavior is unchanged
- Parameterize the image-resolution strategy so the function works in both local-file (filesystem paths) and HTTP (URL prefix or custom resolver) contexts
- Record the decision to expose a render API in an ADR — mdopen's character shifts from "script-only tool" to "script + library"

### Rationale

- The refactor pays off independently of any specific consumer: the editor's duplicated pipeline can eventually retire, future callers get one source of truth, and the renderer stops being write-only code
- quick-share (a separate local HTTP file server with a public tunnel) becomes the first consumer: it can render `.md` to HTML on read using mdopen's pipeline, closing the gap between "agent writes markdown" and "human reads rendered HTML at a shareable URL"
- mdopen's rendering quality (syntax highlighting, callouts, mermaid, frontmatter) is reused rather than forked — single source of truth

## 2. Solution Analysis

### Architecture Overview

Detailed design deferred to `mdt:architecture`. High-level shape:

- `renderer.js` splits into: (a) a `renderMarkdown(md, opts)` export containing the pipeline, and (b) a thin CLI entry that parses argv, reads files, calls the export, writes output
- The function signature parameterizes what currently varies by context: image resolution strategy and template/script part sources
- quick-share (when integrated) calls the export directly — no subprocess, no temp file, no new dependency

### Key Components

- `renderMarkdown(md, opts)` — extracted pipeline: markdown-it config, highlight.js, frontmatter extraction, callout post-processing, mermaid fence handling, template substitution
- CLI wrapper — preserves current `renderer.js INPUT TEMPLATE OUTPUT TITLE CSS_HREF` contract
- ADR — records the decision and the new API surface as semi-public

### Design Decisions

Deferred to `mdt:architecture`:

- Exact function signature and option shape (especially how image resolution is parameterized)
- Whether to split into separate files or keep in `renderer.js`
- Repo-boundary mechanism for cross-tool consumption (path-require vs workspace package vs other)
- How to handle the template-substitution step (template path vs pre-loaded parts)

### Trade-offs Analysis

- **Gain**: reusable rendering, single source of truth, editor de-duplication path opens, external consumers enabled
- **Cost**: mdopen's render export becomes an API another project depends on — casual breaking changes are no longer free; mdopen's character shifts slightly toward "library" despite ARCHITECTURE.md line 5 remaining literally true ("There is no server")

## 3. Implementation Specification

### Technical Requirements

- `bun run check` must pass
- `./bin/mdopen README.md` smoke test must produce identical browser output to current behavior
- `renderer.js` must export a callable function while preserving the CLI contract

### Migration Strategy

- Extract function, keep CLI calling it — no user-facing behavior change
- No migration needed for mdopen itself; quick-share integration is a separate consumer-side change

### Dependencies

- No new runtime dependencies (Bun + markdown-it + highlight.js remain the only requirements)
- Cross-tool integration depends on the repo-boundary decision (deferred to `mdt:architecture`)

### Risk Assessment

- **Image resolution semantics**: relative image `src` rewriting currently produces absolute filesystem paths — if naively extracted, the function leaks `inputDir` meaning "filesystem dir" when an HTTP consumer needs "URL prefix" or a resolver. Architecture must parameterize this before code moves
- **API stability**: once another project depends on the export, the signature becomes a semi-public contract — worth being deliberate about the shape
- **Mermaid over HTTP**: lazy-loading and client-side rendering should work over HTTP but must be verified, not assumed

## 4. Acceptance Criteria

### Functional

- [x] `renderer.js` exports a function that renders a markdown string to an HTML string without writing to disk
- [x] CLI path (`renderer.js INPUT TEMPLATE OUTPUT TITLE CSS_HREF`) produces output identical to current behavior
- [x] The exported function handles image `src` resolution correctly in both local-file and HTTP contexts (parameterized, not hardcoded to filesystem paths)
- [x] An ADR exists documenting the decision to expose a render API and the API surface
- [x] `bun run check` passes
- [x] `./bin/mdopen README.md` smoke test produces visually identical output to current behavior

### Edge Cases

- Markdown with relative image paths rendered via the export in an HTTP context must not produce unreachable filesystem paths
- Markdown with mermaid blocks rendered via the export must still lazy-load and render client-side
- Markdown with no frontmatter, no callouts, and no mermaid must render without error through both CLI and export paths

## 5. Implementation Notes

### Implemented 2026-07-11

- Restructured `renderer.js` into exported `renderMarkdown(markdown, options)` + CLI wrapper guarded by `require.main === module`
- Image resolution parameterized via optional `resolveImage` callback; CLI passes `(src) => path.resolve(inputDir, src)`, preserving exact prior behavior
- No new files, no new dependencies; `bin/mdopen.js` unchanged
- Added `test/` directory with 8 tests (7 export interface + 1 CLI parity); all GREEN
- CLI output verified byte-identical to pre-refactor baseline (39,676 bytes)
- Updated `ARCHITECTURE.md` Main Pieces + Rendering Model to document the export

## 6. References

- `renderer.js` — now exports `renderMarkdown`; CLI path runs only when invoked directly
- `templates/editor-script.html` — browser-side duplicated pipeline (consolidation deferred — follow-up CR)
- `ARCHITECTURE.md` §Constraints — "keep changes small and local; this project is intentionally script-sized"
- quick-share — separate local HTTP file server with public tunnel (external project; consumer-side integration deferred)

> Architecture notes: [architecture.md](./MDOP-001/architecture.md)
> Assessment: [assess.md](./MDOP-001/assess.md)
> Requirements: [requirements.md](./MDOP-001/requirements.md)
> Tests: [tests.md](./MDOP-001/tests.md)
> Tasks: [tasks.md](./MDOP-001/tasks.md)
> ADR: [docs/decisions/0001-expose-rendermarkdown-as-library-api.md](../../decisions/0001-expose-rendermarkdown-as-library-api.md)
