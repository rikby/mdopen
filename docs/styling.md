# Styling Guide

`mdopen` uses a small CSS cascade, one HTML shell template, and focused script partials. Keep styling changes small, explicit, and dependency-free.

For runtime flow and component ownership, use `ARCHITECTURE.md` as the source of truth. This file is only the styling contract.

## Files

- `assets/mdopen.css`: shared base tokens, page layout, toolbar, Mermaid, and print defaults.
- `assets/mdopen-overrides.css`: final user-control override layer loaded after theme-source CSS.
- `assets/styles/demo.css`: optional theme-source CSS adapted from the Markdown example demo.
- `assets/styles/readthedocs.css`: optional theme-source CSS adapted from the Read the Docs Sphinx theme document styles.
- `assets/styles/fonts/`: local Read the Docs font assets used by `readthedocs.css`.
- `templates/mdopen.html`: HTML shell and toolbar markup.
- `templates/mdopen-script.html`: toolbar control wiring, persisted preferences, copy behavior, print options, and print theme behavior.

Do not add Tailwind, component CSS folders, or a frontend build step.

## CSS Architecture

CSS files are loaded in this order:

1. External GitHub Markdown CSS for the default markdown baseline.
2. `assets/mdopen.css` for shared layout, toolbar, Mermaid, print defaults, and base tokens.
3. `assets/styles/*.css` theme sources, for example `demo.css` and `readthedocs.css`.
4. `assets/mdopen-overrides.css` for user-selected overrides that must win over theme sources.

Keep this separation strict:

- `mdopen.css` defines shared tokens and base behavior.
- Theme-source CSS defines the native look for one selected theme.
- `mdopen-overrides.css` applies user choices that intentionally override theme sources.

Do not put user-control override rules in theme-source CSS. Do not put theme-specific visual identity in `mdopen-overrides.css`.

## Customization Architecture

The styling system has two different jobs:

- Theme source: chooses the document's native look, for example GitHub, demo, or Read the Docs.
- User controls: modify that look across every theme, for example font, tone, accent, and density.

User controls must be later in the cascade than theme sources. If a control has to win against theme-source margins, colors, or fonts, put the rule in `assets/mdopen-overrides.css`.

Do not duplicate the same user-control selectors inside every theme source. That makes each new theme source responsible for global behavior and is why spacing controls can drift.

Prefer this flow:

1. `mdopen.css` declares shared default tokens and structural rules.
2. A theme source sets its native tokens and consumes them in its own selectors.
3. `mdopen-overrides.css` changes only control tokens or applies final user-control rules.

## Token Contract

Use semantic tokens for shared controls. A theme source may use its own private tokens for visual identity, but it should map document spacing, typography, and color surfaces through shared tokens when a user control must be able to override them.

Recommended shared token groups:

- `--mdopen-text-gap`: paragraph, list, blockquote, table, pre, details, and footnote spacing.
- `--mdopen-heading-major-top`, `--mdopen-heading-major-bottom`: `h1` and `h2` spacing.
- `--mdopen-heading-minor-top`, `--mdopen-heading-minor-bottom`: `h3` through `h6` spacing.
- `--mdopen-list-item-gap`: sibling list item spacing.
- `--mdopen-nested-list-gap`: nested list spacing.
- `--mdopen-rule-gap`, `--mdopen-rule-height`: horizontal rule spacing and weight.
- `--mdopen-pre-padding`, `--mdopen-cell-padding-y`: code block and table density.
- `--mdopen-font-*`: font override stacks and weights.
- `--mdopen-preview-*`: tone and accent override colors.

Private theme-source tokens should include the theme name, for example `--mdopen-rtd-*` or `--mdopen-demo-*`.

## Density Rules

Density is a user override, not a theme-source feature. It must work the same way for `default`, `demo`, `readthedocs`, and any future theme source.

The durable approach is:

- Define density token values in `mdopen-overrides.css` under `html[data-mdopen-density="tight"]`, `dense`, and `compact`.
- Keep canonical density selectors in `mdopen-overrides.css`, because it loads after theme-source CSS.
- Make theme-source spacing use shared spacing tokens where practical.
- Keep theme-specific layout choices, such as document width, card border, and page padding, inside the theme source.
- Do not add `html[data-mdopen-style="name"][data-mdopen-density="..."]` blocks unless a style has a real exceptional layout need.
- Density must not create a top gap for the first rendered Markdown block. If a theme source starts H1 at `margin-top: 0`, `tight`, `dense`, and `compact` must preserve that.
- Density must cover generated Markdown structures such as `.footnotes`, `.footnotes-list`, and `.footnote-item`, not only raw `p`, `ol`, and `li` elements.

The risk pattern is any theme source setting element margins with `!important` after `mdopen.css`. Those rules can override density rules if density lives in `mdopen.css`. Keep final density rules in `mdopen-overrides.css` and make new theme sources consume density tokens.

## Naming

- Use `mdopen-` classes for fixed UI structure, for example `.mdopen-toolbar`.
- Use `data-mdopen-*` attributes for selectable variants and persisted view options.
- Keep Markdown content styling scoped under `.markdown-body` when possible.
- Use custom properties with the `--mdopen-` prefix for shared styling values.

## Toolbar Controls

- Use a single round light/dark icon toggle.
- Keep the fixed toolbar collapsed to the light/dark icon toggle, rich-copy button, print button, and menu button.
- Keep copy modes, other options, theme, font, tone, color, and density controls inside `.mdopen-menu-panel`.
- Use native buttons with `aria-pressed` for menu customizations so the current state is visible without opening dropdowns.
- Keep outside-click closing controlled by the persisted pin toggle in the menu corner.
- Keep toolbar classes structural only; selected values belong in `data-mdopen-*` attributes.

## Repo Link

- Keep the repo back link fixed in the bottom-right corner.
- Use `.mdopen-github-link` and `.mdopen-github-label` as structural classes.
- The collapsed state shows only the GitHub icon; hover and keyboard focus expand the chip to show `MDopen` plus the icon.
- Do not use the native `title` tooltip for this link; the visible hover/focus chip is the label.
- Hide fixed chrome, including the repo back link, in print.

## Variant Rules

Use data attributes for semantic or user-selected values:

- `data-mdopen-theme`
- `data-mdopen-style`
- `data-mdopen-tone`
- `data-mdopen-accent`
- `data-mdopen-font`
- `data-mdopen-density`
- `data-mdopen-print-frontmatter`
- `data-mdopen-code-wrap`

Tone `default` and accent `default` must remove their override attributes so the selected theme source can keep its native colors.
Font `source` must preserve the selected theme-source fonts. Other font values are user overrides and must be applied from `assets/mdopen-overrides.css`, after all theme-source CSS.
Density `normal` keeps the selected theme source spacing. Other density values are user overrides and must be applied from `assets/mdopen-overrides.css`, after all theme-source CSS.
Print-only options, such as `data-mdopen-print-frontmatter`, belong in `assets/mdopen.css` with the shared print rules unless they need to override a theme source.
User code options, such as `data-mdopen-code-wrap`, belong in `assets/mdopen-overrides.css` because they must win over theme-source code block rules.

Use classes for stable structure only. Do not add separate classes for every tone, accent, font, or density value.

The toolbar label is `Theme`; the internal attribute remains `data-mdopen-style` to avoid renaming persisted settings and CSS selectors.

## Theme Rules

- Dark mode is for screen reading only.
- Print output must stay light.
- Mermaid containers must use theme-aware surface tokens on screen and force white only in print.
- Grayscale tones should affect the full document.
- Print grayscale colors must stay neutral RGB values, for example `#333333`.
- Color accents should use related but varied tones across headings, links, blockquotes, and rules.
- Accent palettes should stay light and laser-printer friendly.

## Font Rules

- Font themes should use named stacks with practical fallbacks.
- Do not add web font dependencies.
- Keep letter spacing conservative and avoid negative values.
- `source` is the default font option and means "use the selected theme-source fonts."
- Non-source font options are user overrides and must be applied only from `mdopen-overrides.css`.
- Theme-source CSS may define native fonts, but it must not special-case user font options.

## Adding A Theme Source

Add new theme sources under `assets/styles/` and load/copy them from `templates/mdopen.html` and `mdopen`.

Theme-source CSS should:

- Scope rules with `html[data-mdopen-style="name"]`.
- Preserve the shared `.markdown-body` content root.
- Define native colors, typography, spacing, and component treatment for that theme.
- Avoid changing toolbar UI.
- Avoid overriding `data-mdopen-font` values.
- Avoid special-casing density unless the theme has a documented exception.
- Use shared spacing tokens for margins and padding that density should control.

## Optimization Priorities

1. Keep screen density rules in `assets/mdopen-overrides.css`.
2. Convert repeated flow-spacing selectors to shared tokens consumed by all theme sources.
3. Move tone and accent override selectors out of theme-source CSS where possible; keep theme-source CSS focused on native colors.
4. Keep `!important` only where overriding GitHub Markdown CSS or loaded theme-source CSS is required.
5. Add any new theme source only after checking font, tone, accent, density, dark mode, and print behavior.

## When To Add Structure

Keep the current flat structure unless a new styling area becomes genuinely large or reusable. If that happens, prefer another small file under `assets/styles/` or a focused shared CSS file over introducing a build system.
