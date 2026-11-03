# Tasks: MDOP-001

Ordered implementation tasks. Each task has scope, files, commands, and expected result.

> Status: All tasks complete (2026-07-11). See review notes in CR §5.


## Task 1: Extract `renderMarkdown` function

**Scope**: Lift the rendering pipeline (markdown-it config → frontmatter → callouts → template substitution) into an exported function.

**Files**: `renderer.js`

**What changes**:
- Move the markdown-it configuration, fence/image rule overrides, frontmatter extraction, callout enhancement, and template substitution into a new exported `renderMarkdown(markdown, options)` function
- Function signature: `renderMarkdown(markdown, { template, templateDir, pageTitle, cssHref, defaultStyle = "default", resolveImage }) → { html, hasMermaid }`
- The image rule calls `resolveImage(src)` when provided, otherwise leaves `src` unchanged
- Template parts (`mdopen-script.html`, `mermaid-script.html`) are read from `templateDir`
- `escapeHtml`, `extractFrontmatter`, `renderFrontmatter`, `enhanceHtml`, `readTemplatePart` become inner helpers or module-level utilities used by the function
- `module.exports = { renderMarkdown }`

**Commands**:
```bash
bun test test/renderer.test.js
```

**Expected**: export-interface tests pass (side-effects, function exists, renders heading, mermaid structure). CLI parity test still fails (CLI block not added yet).

## Task 2: Add CLI wrapper block

**Scope**: Restore the CLI entry point as a guarded block so `bin/mdopen.js`'s subprocess call works unchanged.

**Files**: `renderer.js`

**What changes**:
- Add `if (require.main === module) { ... }` block at the bottom containing: argv parse (the existing lines 14–19 logic), `readFileSync` for input + template, `path.dirname(input)` for `inputDir`, call `renderMarkdown` with `resolveImage: (src) => path.resolve(inputDir, src)`, `writeFileSync` the result
- Preserve the exact argv contract: `renderer.js INPUT TEMPLATE OUTPUT TITLE CSS_HREF [STYLE]`
- Preserve the same usage error message and `process.exit(2)`

**Commands**:
```bash
bun test test/cli-parity.test.js
bash -n bin/mdopen
bun run check
```

**Expected**: CLI parity test passes (output byte-identical to baseline). `bun run check` passes. All renderer export tests still pass.

## Task 3: Update docs (ARCHITECTURE.md)

**Scope**: Note that `renderer.js` now exports `renderMarkdown` and can be required as a library.

**Files**: `ARCHITECTURE.md`

**What changes**:
- In the "Main Pieces" section, update the `renderer.js` entry to note it exports `renderMarkdown` and runs the CLI path only when invoked directly
- Add a short note in "Rendering Model" or a new subsection that the render pipeline is importable (e.g. `require('./renderer.js').renderMarkdown(md, opts)`)

**Commands**:
```bash
bun run check
```

**Expected**: docs updated; checks still pass.

## Task 4: Final verification

**Scope**: Run the full check suite to confirm nothing regressed.

**Commands**:
```bash
bun test
bash -n bin/mdopen
bun run check
bun renderer.js README.md templates/mdopen.html /tmp/mdopen-check.html README mdopen.css
./bin/mdopen README.md
```

**Expected**: all pass. CLI output identical to baseline. Tests GREEN.
