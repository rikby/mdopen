---
status: draft
date: 2026-07-11
decision-makers: [kirby]
consulted: []
informed: []
---

# Expose renderMarkdown as a library API

## Context and Problem Statement

`renderer.js` is a CommonJS script that runs its entire pipeline at module load: it parses `process.argv`, reads input and template files, configures markdown-it, renders, performs template substitution, and calls `writeFileSync` — all as side effects of `require`. There is no function boundary to call. `bin/mdopen.js` invokes it exclusively via `spawnSync` as a subprocess.

This means no other tool can ask mdopen "render this markdown to HTML" as a function call. The rendering pipeline (markdown-it config, highlight.js, callout post-processing, frontmatter extraction, mermaid handling) is locked behind a CLI that writes to a temp file and exits.

Meanwhile, `package.json` already declares `"main": "renderer.js"` — the package metadata claims library entry-point status, but the file exports nothing. This is a pre-existing inconsistency.

The immediate consumer is quick-share, a separate local HTTP file server with a public tunnel. Agents drop `.md` files into the served directory; quick-share currently serves them as `text/plain` (raw source). The goal: quick-share renders `.md` to styled HTML on read using mdopen's pipeline, so any device reaching the tunnel URL sees rendered markdown. This requires mdopen's rendering to be callable as a function, parameterized for HTTP context (image paths must resolve to URLs, not filesystem paths).

## Decision Drivers

- mdopen's rendering quality (syntax highlighting, callouts, mermaid, frontmatter) should be reused, not forked — single source of truth
- `package.json` `main` field already declares library intent; the file should fulfill it
- The refactor must not change CLI output (`bin/mdopen.js` spawns `renderer.js` via subprocess; that contract stays fixed)
- No new runtime dependencies — Bun + markdown-it + highlight.js only (AGENTS.md working rule)
- ARCHITECTURE.md §Constraints: "this project is intentionally script-sized" — changes stay small and local
- Relative image paths must work in both local-file (filesystem paths) and HTTP (URL) contexts

## Considered Options

- **Option A: Extract `renderMarkdown` export, keep CLI as wrapper in `renderer.js`**
  Restructure the file into an exported function plus a `require.main === module` CLI block. Parameterize image resolution via a `resolveImage` callback. No new files. `package.json` `main` already points here.

- **Option B: New `lib/render.js` module, `renderer.js` re-exports or becomes CLI-only**
  Move the pipeline to a new file under `lib/`. More "library-like" structure. Requires updating `package.json` `main`, adding a path, and deciding whether `renderer.js` stays as a CLI shim or is removed.

- **Option C: markdown-it + CSS directly in quick-share (fork the pipeline)**
  quick-share configures its own markdown-it instance with the same plugins. Zero coupling between projects. ~25 lines in quick-share. But forks the render pipeline — two sources of truth that drift.

- **Option D: Spawn `mdopen` per request in quick-share**
  quick-share shells out to `mdopen` for each `.md` request. No code coupling. But subprocess-per-request cost, and mdopen's output CSS sits in a temp dir the server doesn't serve — broken styling unless inlined.

## Decision Outcome

Chosen option: **Option A** — extract `renderMarkdown` export in `renderer.js`, keep CLI as wrapper.

Rationale:
- Smallest change that makes the pipeline callable — no new files, no `package.json` changes (main already points here)
- Single source of truth preserved — quick-share calls the same pipeline the CLI uses
- CLI contract preserved structurally — `require.main === module` guard means the subprocess call in `bin/mdopen.js` is unaffected
- `resolveImage` callback is the minimal seam for context-dependent image resolution — expresses current behavior exactly (`(src) => path.resolve(inputDir, src)`) and HTTP behavior naturally (`(src) => new URL(src, baseUrl).href`)
- Option B adds structure without functional gain for this CR; consolidation of the three markdown-it config copies (renderer, directory viewer, editor) may revisit file structure later
- Option C was rejected because forking the pipeline defeats the purpose of "integrate mdopen"
- Option D was rejected: subprocess-per-request plus broken CSS serving is strictly worse

### Function signature

```text
renderMarkdown(markdown, options) → { html, hasMermaid }
```

Options: `template` (string), `templateDir` (string), `pageTitle` (string), `cssHref` (string), `defaultStyle` (string, default "default"), `resolveImage` (function, optional).

The `resolveImage` callback receives a relative `src` and returns the resolved value. When omitted, relative `src` is left unchanged. The CLI path passes `(src) => path.resolve(inputDir, src)` to preserve current behavior exactly.

### CLI guard

```text
if (require.main === module) {
  // argv parse, readFileSync, renderMarkdown, writeFileSync
}
```

`bin/mdopen.js` spawns `renderer.js` as a subprocess, so `require.main === module` is true for CLI use and false when the module is `require`d.

## Consequences

### Good

- mdopen's rendering pipeline becomes reusable as a library function — quick-share, the GitHub Pages editor, and future callers share one source of truth
- `package.json` `main` field becomes accurate (it already claimed this role)
- The path to retiring the editor's duplicated markdown-it config (in `templates/editor-script.html`) opens — the export can eventually serve the editor too
- No new files, no new dependencies, no changes to `bin/mdopen.js` or templates

### Bad

- `renderMarkdown`'s signature becomes a semi-public API that another project (quick-share) depends on — casual breaking changes are no longer free
- mdopen's character shifts slightly from "script-only tool" toward "script + library," despite ARCHITECTURE.md line 5 ("There is no server") remaining literally true
- The `resolveImage` option adds a small cognitive cost to the function signature — callers must understand when to pass it

### Neutral

- The three copies of the markdown-it config still exist after this CR (renderer.js, directory viewer in `bin/mdopen.js`, editor-script.html); consolidation is a follow-up that this CR enables but does not require
- Repo-boundary mechanism (how quick-share depends on mdopen — path-require vs workspace package) is decided by the consumer, not by this ADR

## Verification

- CLI output parity: `bun renderer.js README.md templates/mdopen.html /tmp/out.html README mdopen.css` produces byte-identical output before and after (baseline: 39,676 bytes)
- `require('./renderer.js')` does not execute argv parsing or file I/O
- `bun run check` passes unchanged
- `./bin/mdopen README.md` smoke test produces visually identical browser output

## References

- CR: `docs/CRs/MDOP-001-render-api.md`
- Architecture: `docs/CRs/MDOP-001-render-api/architecture.md`
- Assessment: `docs/CRs/MDOP-001-render-api/assess.md`
- `renderer.js` (current monolithic script)
- `bin/mdopen.js` line 164 (subprocess call preserved)
- `package.json` line `"main": "renderer.js"` (pre-existing library claim)
