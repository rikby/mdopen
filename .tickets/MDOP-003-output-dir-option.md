---
code: MDOP-003
status: Implemented
dateCreated: 2026-09-24T13:31:22.692Z
type: Feature Enhancement
priority: Medium
---

# Add -o output directory option to CLI

## 1. Description

### Requirements Scope
`full`

### Problem
- `bin/mdopen.js` hardcodes output to the platform temp directory (`os.tmpdir()/mdopen`); users cannot keep rendered HTML in a project folder.
- Keeping output requires manually copying from the printed temp path after each run.
- No CLI flag exists to redirect output; `--help` documents no output option.

### Affected Artifacts
- `bin/mdopen.js` (argument parsing, `outputRoot`/`output` computation, `help()` text)
- `test/help.test.js` (help contract includes new option)
- `README.md` (Usage section)
- `CHANGELOG.md` (Unreleased → Added)
- `ARCHITECTURE.md` (Runtime Flow step 3/4 output location)

### Scope
- **Changes**: Add `-o, --output DIR` flag; single-file and directory outputs are written under `DIR` (created if missing) instead of the temp directory; browser still opens the generated file; help and docs updated.
- **Unchanged**: temp-directory default when `-o` is absent; `MDOPEN_NO_OPEN=1` behavior; renderer API; directory viewer generation; platform launchers.

## 2. Decision

### Chosen Approach
Parse `-o/--output DIR` in `bin/mdopen.js` and use it as the output root for both file and directory modes.

### Rationale
- Single insertion point: `outputRoot`/`output` are already computed in one place near the top of the CLI body.
- No renderer change: `renderer.js` already receives an absolute output path.
- Matches Unix convention (`-o`) with zero new dependencies, keeping Bun + markdown-it + highlight.js the only requirements.

## 3. Alternatives Considered

| Approach | Key Difference | Why Rejected |
|----------|---------------|--------------|
| **`-o DIR` flag in `bin/mdopen.js`** | One flag, output root swaps between temp and user dir | **ACCEPTED** - smallest diff at the existing single computation point |
| `--out-file FILE` | Full output path control | More parsing/validation for a need not expressed; directory default naming is already correct |
| Env var `MDOPEN_OUT` | No argv parsing | Hidden state; flags are discoverable via `--help`, env vars are not |

## 4. Artifact Specifications

### New Artifacts

| Artifact | Type | Purpose |
|----------|------|---------|
| none | — | feature is contained in existing CLI and tests |

### Modified Artifacts

| Artifact | Change Type | Modification |
|----------|-------------|--------------|
| `bin/mdopen.js` | Flag parsing added | `-o`/`--output DIR` sets `outputRoot`; `mkdir -p` on it; directory mode writes `index.html` inside it without wiping the user dir |
| `bin/mdopen.js` | Help updated | Options block documents `-o, --output DIR` |
| `test/help.test.js` | Test updated | help text assertions include `--output` |
| `test/output-dir.test.js` | Test added | file mode and directory mode write into `-o DIR`; dir contents preserved |
| `README.md` | Docs updated | Usage examples show `-o` |
| `CHANGELOG.md` | Docs updated | Unreleased Added entry |
| `ARCHITECTURE.md` | Docs updated | Runtime flow mentions output override |

### Integration Points

| From | To | Interface |
|------|----|-----------|
| `bin/mdopen.js` | `renderer.js` | unchanged absolute output path argument |
| `bin/mdopen.js` | platform opener | unchanged generated file path |

### Key Patterns
- Fail-fast validation: missing value for `-o` exits 2 with stderr usage (matches existing arg errors).
- Destructive `rmSync` stays scoped to the CLI-owned temp `<dir>-index` root only; user-supplied output dirs are never wiped.

## 5. Acceptance Criteria

### Functional
- [x] `mdopen FILE.md -o DIR` writes `DIR/<title>.html` (plus assets) and opens it
- [x] `mdopen DIR -o OUT` writes `OUT/index.html` without deleting existing files in `OUT`
- [x] `mdopen -o` with no value exits 2 with usage on stderr
- [x] `mdopen --help` lists `-o, --output DIR`
- [x] Without `-o`, output stays at the temp `mdopen/` root

### Non-Functional
- [x] No new runtime dependencies
- [x] All launchers (bash/cmd/ps1) work unchanged (flag passes through argv)

### Testing
- Unit: `test/output-dir.test.js` spawns `bin/mdopen.js` with `MDOPEN_NO_OPEN=1` and asserts written paths and preservation of pre-existing files
- Unit: `test/help.test.js` help output contains `--output`
- Manual: agent-browser opens the generated output file and asserts the rendered document is intact

## 6. Verification

### By CR Type
Feature: `bin/mdopen.js` accepts `-o/--output`; `bun test` passes including new `test/output-dir.test.js`; agent-browser smoke test renders a file generated into a folder.

### Metrics
Not applicable; verifiable artifacts: new flag, new test file, updated help/docs.

## 7. Deployment

### Simple Changes
- Source-only change; no config or migration.
- Ships with the next release build (`bun run build:binary` picks up `bin/mdopen.js` automatically).