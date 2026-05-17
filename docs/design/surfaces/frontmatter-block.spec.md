# Frontmatter Block

Collapsible metadata block shown above rendered Markdown when the source file starts with frontmatter.

## Composition

```text
FrontmatterBlock
├── SummaryLabel
└── RawFrontmatterCode
```

## Source files

| Type | Path |
|------|------|
| Renderer | `renderer.js` |
| Template | `templates/mdopen.html` |
| CSS | `assets/mdopen.css` |
| Toolbar print control | `templates/mdopen.html`, `templates/mdopen-script.html` |

## Layout

- Render the block before the Markdown body content, inside `.markdown-body`.
- Use native `<details class="mdopen-frontmatter">` and `<summary>` so collapse behavior works without JavaScript.
- Default screen state is collapsed.
- Summary text is `Frontmatter`.
- Raw metadata is shown in a `<pre><code>` block when expanded.
- Screen metadata uses one disclosure/code block. The `<details>` element is the visible code block; the inner `<pre><code>` does not add a second border or inset panel.
- Preserve original line breaks and indentation.
- Do not parse YAML/TOML into a table; mdopen should preserve metadata text without adding a parser dependency.
- Escape metadata as text, never render it as HTML.
- If no frontmatter is detected, render no frontmatter block.

## Frontmatter Detection

| Case | Result |
|------|--------|
| File starts with standalone `---` and later standalone `---` | extract lines between markers and remove them from Markdown body |
| File starts with text before `---` | treat all content as normal Markdown |
| Opening `---` has no closing marker | treat all content as normal Markdown |
| Empty frontmatter block | do not render the block; remove the empty markers only if extraction succeeds |

## States

| State | Trigger | Visual change | Behavior |
|-------|---------|---------------|----------|
| absent | no valid leading frontmatter | no block | Markdown renders normally |
| collapsed | page load with frontmatter | one-line summary above document | metadata hidden on screen |
| expanded | user opens details | raw metadata code block appears | standard details collapse behavior |
| print default | browser print | block is hidden | frontmatter does not print |
| print enabled | menu flag enabled before print | block prints above document | metadata prints regardless of screen collapsed state |

## Print Behavior

- Frontmatter is not printable by default.
- The toolbar menu owns a persistent `Print frontmatter` flag.
- The flag sets `html[data-mdopen-print-frontmatter="true"]`.
- Print CSS hides `.mdopen-frontmatter` unless that attribute is present.
- When printing is enabled, CSS must print the metadata content even if the screen `<details>` is collapsed.
- The browser print handler temporarily opens closed frontmatter details before printing, then restores the previous collapsed state after print.
- The `Frontmatter` summary label is screen-only and must not print.
- Printed metadata keeps the screen summary hidden and uses the normal print code-block styling without a second nested panel.
- Print output stays light and uses existing neutral print tokens.

## Responsive

| Breakpoint | Change |
|------------|--------|
| `< 768px` | full-width block within current article padding; code wraps or scrolls like existing code blocks |
| `>= 768px` | same article width and flow spacing as other Markdown blocks |

## Tokens used

| Element | Token / value | Usage |
|---------|---------------|-------|
| border | `--borderColor-default` / existing mdopen border fallback | details border |
| background | `--bgColor-muted` fallback pattern | subtle metadata surface |
| text | `--fgColor-default`, `--fgColor-muted` | summary and metadata |
| print text | `--mdopen-print-text`, `--mdopen-print-muted` | print output |
| print border | `--mdopen-print-border` | print outline |

## Classes used

| Element | Class | Source |
|---------|-------|--------|
| details root | `.mdopen-frontmatter` proposed | stable structure for metadata block |
| code block | `.mdopen-frontmatter pre` | existing Markdown code treatment plus small overrides |

## Acceptance Criteria

| ID | Criterion |
|----|-----------|
| FM-1 | `markdown-it` never receives the leading frontmatter markers as body Markdown. |
| FM-2 | Valid leading frontmatter renders as one collapsed block above the document. |
| FM-3 | Metadata content is escaped and displayed exactly as source text. |
| FM-4 | Default print output excludes frontmatter. |
| FM-5 | Enabling `Print frontmatter` makes frontmatter visible in print output. |
| FM-6 | Files without valid leading frontmatter render exactly as before. |

## Extension notes

- Keep this dependency-free. Do not add `gray-matter` or a YAML parser unless mdopen later needs semantic metadata.
- Keep the block generic; frontmatter may be YAML-like, TOML-like, or plain key-value text.
