# Requirements: MDOP-001

## 1. Description

### Requirements Scope

`none` — Architecture CR; detailed design deferred to `mdt:architecture`.

### Problem

- mdopen's rendering pipeline cannot be called as a function — `renderer.js` runs its entire flow (argv parse → read files → render → write file) at module load with no exports, so no other tool can ask "render this markdown to HTML"
- Relative image paths resolve to absolute filesystem paths (`path.resolve(inputDir, src)`), which only works for local `file://` viewing; an HTTP consumer would get unreachable paths
- Agent-generated markdown rendered by mdopen cannot reach another device — `mdopen file.md` opens a local browser only; there is no path from "agent writes `.md`" to "human reads rendered, shareable HTML at a URL"
- `package.json` declares `"main": "renderer.js"` but the file exports nothing — a pre-existing inconsistency between declared library intent and actual module shape

### Affected Areas

- `renderer.js` (root): the file being restructured from script-at-load to exported function + CLI wrapper
- `docs/`: ADR documenting the render API as a semi-public surface; `ARCHITECTURE.md` update noting the library entry point

### Scope

- **In scope**: extract `renderMarkdown` export from `renderer.js`; parameterize image resolution for file vs HTTP contexts; preserve CLI behavior; add CLI-parity verification; write ADR
- **Out of scope**: quick-share integration (separate consumer-side change); consolidating the three markdown-it config copies (follow-up CR); editor de-duplication (depends on this export existing first); `mdopen share` subcommand (rejected in proposal)

## 2. Desired Outcome

### Success Conditions

- A caller can `require('./renderer.js')` and invoke a function that accepts a markdown string and returns an HTML string, without any file being written to disk
- `renderer.js INPUT TEMPLATE OUTPUT TITLE CSS_HREF` (the CLI contract) produces output byte-identical to current behavior
- The exported function resolves relative image paths correctly for both local-file consumers (filesystem paths) and HTTP consumers (URL prefixes or resolvers), selected via an option
- An HTTP consumer can render markdown containing relative images and receive image `src` values that are reachable over HTTP
- Markdown with mermaid blocks rendered via the export produces HTML that lazy-loads and renders mermaid client-side
- An ADR exists documenting the decision to expose a render API, the function signature, and its status as a semi-public surface

### Constraints

- Must preserve Bun + markdown-it + highlight.js as the only runtime requirements (no new dependencies)
- Must preserve the CLI argv contract (`renderer.js INPUT TEMPLATE OUTPUT TITLE CSS_HREF [STYLE]`) unchanged — `bin/mdopen.js` calls it via `spawnSync` and must not require changes
- Must preserve cross-platform launcher compatibility (macOS, Linux, Windows, MinGW/Git Bash)
- Must remain compatible with `bun run build:binary` (the binary embeds templates at compile time)
- Must keep changes small and local — ARCHITECTURE.md §Constraints: "this project is intentionally script-sized"
- Must keep `main` field in `package.json` accurate (it already points to `renderer.js`)

### Non-Goals

- Not changing the directory viewer's rendering (separate browser-side pipeline)
- Not consolidating the three markdown-it config copies (renderer.js, directory viewer, editor)
- Not adding HTTP server functionality to mdopen (mdopen stays a renderer; quick-share is the server)
- Not adding the `mdopen share` subcommand
- Not versioning or documenting the API for external consumers beyond the ADR

## 3. Open Questions

| Area | Question | Constraints |
|------|----------|-------------|
| API Design | What is the exact `renderMarkdown(md, opts)` signature — what opts, defaults, return shape? | Must support both file and HTTP image resolution; must carry enough context for template substitution |
| Image Resolution | How is image resolution parameterized — `context` flag, `resolveImage` callback, or `imageBaseUrl` string? | Must not break current `path.resolve(inputDir, src)` behavior for CLI; must produce URLs for HTTP consumers |
| Template Handling | Does the function accept a template path, pre-loaded template string, or both? | Current code reads `mdopen-script.html`/`mermaid-script.html` relative to template path during substitution |
| File Structure | Does `renderMarkdown` stay in `renderer.js` or move to a new file (e.g. `lib/render.js`)? | ARCHITECTURE.md favors script-sized, local changes; `package.json` `main` already points to `renderer.js` |
| Repo Boundary | How will an external consumer (quick-share) depend on mdopen — path-require, workspace package, or other? | Both projects live on one machine; no published package today |

### Known Constraints

- No new runtime dependencies
- CLI argv contract preserved unchanged
- Cross-platform launchers unchanged
- Binary build compatibility preserved
- mdopen stays renderer-only (no server added)

### Decisions Deferred

- Exact function signature and option shape → `mdt:architecture`
- Image resolution parameterization approach → `mdt:architecture`
- File structure (single file vs new module) → `mdt:architecture`
- Repo-boundary mechanism for external consumers → `mdt:architecture`
- Task breakdown → `mdt:tasks`

## 4. Acceptance Criteria

### Functional

- [x] `require('./renderer.js')` exposes a callable render function
- [x] The render function accepts a markdown string plus options and returns an HTML string without writing to disk
- [x] Calling the render function with a markdown string containing headings, code blocks, callouts, frontmatter, a mermaid block, a task list, and a relative image produces styled HTML with all features present
- [x] The render function resolves relative image `src` to filesystem paths when invoked for a local-file context
- [x] The render function resolves relative image `src` to URL-based paths when invoked for an HTTP context
- [x] `renderer.js INPUT TEMPLATE OUTPUT TITLE CSS_HREF` produces output identical to current behavior (CLI parity)
- [x] `bun run check` passes
- [x] `bash -n bin/mdopen` passes
- [x] `./bin/mdopen README.md` smoke test produces visually identical browser output

### Non-Functional

- [x] No new entries in `package.json` `dependencies`
- [x] Render function execution time does not regress CLI performance (subprocess spawn remains the dominant cost)

### Edge Cases

- Markdown with no frontmatter, no callouts, and no mermaid renders without error through both CLI and export paths
- Markdown with a mermaid block rendered via the export produces the `.mermaid-container` / `.mermaid` structure for client-side rendering
- Markdown with an invalid frontmatter marker (not leading `---`) stays in normal document flow, not treated as frontmatter
- Empty markdown string renders to a valid (empty-body) HTML page without error

## 5. Verification

### How to Verify Success

- **CLI parity**: capture `bun renderer.js README.md templates/mdopen.html /tmp/before.html README mdopen.css` output before refactor; run the same command after; diff the two HTML files — must be identical
- **Export smoke test**: write a small script that `require`s `renderer.js`, calls the export with a sample markdown string, and prints whether the result contains expected elements (frontmatter details block, callout section, mermaid container, highlighted code)
- **Image resolution**: call the export with `![alt](image.png)` in both file and HTTP contexts; verify the output `src` is a filesystem path in one and a URL in the other
- **Existing checks**: `bash -n bin/mdopen`, `bun run check`, `./bin/mdopen README.md` all pass unchanged
- **Binary build**: `bun run build:binary` succeeds (the binary embeds templates at compile time — the refactor must not break embedding)
