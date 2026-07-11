# Assessment: MDOP-001

## Verdict

**Recommendation**: Option 2 — Redesign Inline

The feature fits the project's direction but not `renderer.js`'s current structure. The renderer is a script that runs entirely at module load (argv parse at line 14, file reads, rendering, and `writeFileSync` at line 171 all execute on `require`). Extracting a reusable function requires a bounded structural redesign of that one file. The mismatch is real but localized to `renderer.js`; it does not distort ownership, routing, or other modules.

## Feature Pressure

### Target Feature Needs

- A callable function that renders a markdown string to an HTML string without disk I/O or process spawning
- Parameterized image resolution so the same function works for local-file consumers (filesystem paths) and HTTP consumers (URL prefixes or custom resolvers)
- A stable, semi-public API surface that another project (quick-share) can depend on
- mdopen's CLI behavior (`mdopen file.md`) to remain unchanged

### Current System Assumptions

- `renderer.js` is invoked as a subprocess by `bin/mdopen.js` (`renderMarkdownFile`, line 164: `spawnSync(process.execPath, [renderer, input, template, output, title, "mdopen.css", defaultStyle])`) — it is never `require`d as a module
- All rendering inputs come from `process.argv` (line 14); there is no function boundary to call
- Image `src` rewriting (lines 86–98) assumes a local filesystem context: `path.resolve(inputDir, src)` produces absolute filesystem paths, correct only for `file://` viewing
- Template parts (`mdopen-script.html`, `mermaid-script.html`) are read from disk relative to the template path during substitution (lines 164–166)
- `package.json` declares `"main": "renderer.js"` — the package metadata already claims library entry-point status, but the file exports nothing. This is a pre-existing inconsistency the CR resolves

## Fitness Summary

| Dimension | Verdict | Why |
|-----------|---------|-----|
| Structural Fit | Concerning | `renderer.js` runs its entire pipeline as module-load side effects; there is no function boundary to extract without restructuring the file |
| Extension Fit | Healthy | The renderer is called from exactly one place (`bin/mdopen.js` line 164 via subprocess); adding an export does not punch through layers |
| Dependency Fit | Healthy | No new packages, runtimes, or config; Bun + markdown-it + highlight.js unchanged |
| Verification Fit | Concerning | No automated tests exist; `bun run check` is a smoke test, not a regression net. Safe-to-refactor relies on byte-identical CLI output comparison |
| Redesign Scope | Healthy | Redesign is bounded to `renderer.js`; no other module's ownership or boundary changes |

## Mismatch Points

### renderer.js module structure
- Current system assumes: the file is a script invoked via subprocess with argv; the entire pipeline runs at module load
- Feature needs: a callable `renderMarkdown(md, opts)` export with the CLI path as a thin wrapper
- Mismatch: extracting the function requires moving the argv parse, file reads, and `writeFileSync` into a CLI entry section guarded from `require` callers, and lifting the pipeline into a parameterized function
- Adjustment required: restructure `renderer.js` into (a) an exported `renderMarkdown` function and (b) a CLI-only execution block
- Scope: bounded (one file)

### Image resolution semantics
- Current system assumes: consumers view output via `file://` — `path.resolve(inputDir, src)` producing absolute filesystem paths is correct
- Feature needs: HTTP consumers (quick-share) must resolve image `src` to URLs, not filesystem paths
- Mismatch: `inputDir` means "filesystem directory" today; an HTTP consumer needs a URL prefix or resolver function
- Adjustment required: parameterize image resolution in the extracted function (e.g. a `resolveImage` option or a `context: 'file' | 'http'` flag) rather than hardcoding `path.resolve`
- Scope: bounded (inside the extracted function)

## Dependency and Tooling Pressure

- New packages: none
- Runtime/config impact: none — Bun, markdown-it, highlight.js, CommonJS all unchanged
- Testing/E2E impact: no test harness exists today; the CR should introduce a minimal render-output check to lock CLI parity, but this is verification debt to address, not a system-shape change
- Main risk introduced: `renderer.js`'s export becomes a semi-public API that another project depends on — signature stability matters once shipped

## Verification Gaps

- Preservation tests needed: a test that captures current CLI render output for a representative `.md` (headings, code, callout, frontmatter, mermaid, image, task list) and asserts the refactored path produces identical HTML
- E2E/contract drift risks: none (no E2E layer exists); the subprocess call in `bin/mdopen.js` line 164 stays the same so the CLI contract is preserved structurally
- Safe-to-refactor now?: conditionally yes — safe if a CLI-parity check is added before the refactor; risky without one since `bun run check` only proves the script runs, not that output is unchanged

## Recommendation

### Option 2: Redesign Inline

Use when: the renderer's script-at-load structure is a real but localized mismatch; the fix stays inside `renderer.js` and this CR
Architecture must redesign: `renderer.js` structure — split into exported `renderMarkdown` function + CLI wrapper; parameterize image resolution and template-part sources
Expected scope added: CLI-parity verification check; ADR documenting the new export as a semi-public API; `ARCHITECTURE.md` update noting the renderer's library entry point

### Why not Option 1 (Integrate As-Is)
The renderer has no function boundary today — "integrate" still requires restructuring the file, which is a design decision architecture should make explicitly, not a local implementation detail.

### Why not Option 3 (Redesign First)
No systemic mismatch exists. Ownership, state flow, routing, and other modules are unaffected. The three-copy duplication of the markdown-it config (renderer.js, directory viewer in `bin/mdopen.js`, editor-script.html) is real debt, but consolidating those copies is out of scope for this CR — it depends on the export existing first. This CR enables that future consolidation; it does not require it upfront.

## Notes for Architecture

- The `package.json` `"main": "renderer.js"` already declares library intent — architecture should treat the export as fulfilling that existing claim, not introducing a new role
- The directory viewer (`bin/mdopen.js` lines 404–488) uses URL-based image resolution (`new URL(src, activeFile.dirUrl)`) — a different pattern from `renderer.js`'s `path.resolve`. Architecture should note both patterns exist when designing the resolution parameterization
- Three copies of the markdown-it config exist; consolidation is a follow-up, not this CR
