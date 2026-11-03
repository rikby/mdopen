# BDD: MDOP-001 — Skipped

## Skipped Milestone

**Milestone**: Scenarios (BDD)
**Reason**: Architecture CR with `REQUIREMENTS_SCOPE=none`. The change is primarily an internal refactor of `renderer.js` (script-at-load → exported function + CLI wrapper). The primary user-visible contract is CLI parity — output must stay byte-identical — which is a verification concern for `mdt:tests`, not a behavior specification concern.

The `mdt:bdd` skill guardrail explicitly excludes this case: *"Do not use mdt:bdd for pure technical refactoring with no user-visible behavior."*

## New Behavior Captured Elsewhere

The one genuinely new capability — a caller can `require('./renderer.js')` and render markdown to an HTML string without disk I/O — is captured as:

- Functional acceptance criteria in `requirements.md` §4
- Concrete verification steps (CLI parity diff, export smoke test, image-resolution context check) in `requirements.md` §5
- Will map to exact test targets in `mdt:tests`

No user-facing UI, no new CLI command, no API endpoint — nothing that benefits from Gherkin scenario modeling.

## Next

`mdt:architecture` — the load-bearing milestone for this CR (function signature, image-resolution parameterization, file structure, ADR).
