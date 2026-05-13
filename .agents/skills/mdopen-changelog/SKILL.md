---
name: mdopen-changelog
description: Update mdopen CHANGELOG.md for a release using Keep a Changelog style. Use when preparing mdopen release notes, adding an Unreleased section, or documenting a new version from git history and project docs.
---

# mdopen Changelog

Use this skill to maintain `CHANGELOG.md` for mdopen releases.

## Workflow

1. Inspect current state:
   - `git status --short`
   - `git log --oneline --decorate --max-count=30`
   - `git diff --stat`
   - Read `README.md`, `ARCHITECTURE.md`, and relevant docs touched by the release.
2. Update `CHANGELOG.md` in Keep a Changelog style:
   - Keep newest release first.
   - Use `## [x.y.z] - YYYY-MM-DD`.
   - Use only useful sections: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`, `Documentation`.
   - Keep bullets user-facing and concise.
   - Do not list internal refactors unless they changed maintainability, behavior, packaging, or docs in a way users should know.
3. For future work, keep an `## [Unreleased]` section only when there are unreleased changes worth tracking.
4. Verify before finishing:
   - `bash -n bin/mdopen`
   - `bun run check`
   - `bun renderer.js README.md templates/mdopen.html /tmp/mdopen-check.html README mdopen.css`

## mdopen Release Focus

Prioritize these categories when summarizing changes:

- CLI behavior and platform support.
- Markdown rendering features.
- Styling controls, print behavior, and template UI.
- Mermaid behavior.
- Packaging, binary builds, and GitHub Pages.
- Documentation that affects users or maintainers.

Keep the final summary short and mention verification results.
