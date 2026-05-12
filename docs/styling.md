# Styling Guide

`mdopen` uses a small CSS cascade and one HTML template. Keep styling changes small, explicit, and dependency-free.

## Files

- `assets/mdopen.css`: all core screen, print, theme, tone, accent, font, and density styles.
- `assets/mdopen-overrides.css`: final user-control override layer loaded after style-source CSS.
- `assets/styles/demo.css`: optional style-source CSS adapted from the review demo.
- `assets/styles/readthedocs.css`: optional style-source CSS adapted from the Read the Docs Sphinx theme document styles.
- `assets/styles/fonts/`: local Read the Docs font assets used by `readthedocs.css`.
- `templates/mdopen.html`: toolbar markup, control wiring, persisted preferences, and print theme behavior.

Do not add Tailwind, component CSS folders, or a frontend build step.

## CSS Architecture

Styles are loaded in this order:

1. External GitHub Markdown CSS for the default markdown baseline.
2. `assets/mdopen.css` for shared layout, toolbar, theme, tone, accent, font tokens, density, Mermaid, and print rules.
3. `assets/styles/*.css` style sources, for example `demo.css` and `readthedocs.css`.
4. `assets/mdopen-overrides.css` for user-selected overrides that must win over style sources.

Keep this separation strict:

- `mdopen.css` defines shared tokens and base behavior.
- Style-source CSS defines the native look for one selected style.
- `mdopen-overrides.css` applies user choices that intentionally override style sources.

Do not put user-control override rules in style-source CSS. Do not put style-specific visual identity in `mdopen-overrides.css`.

## Naming

- Use `mdopen-` classes for fixed UI structure, for example `.mdopen-toolbar`.
- Use `data-mdopen-*` attributes for selectable variants and persisted view options.
- Keep Markdown content styling scoped under `.markdown-body` when possible.
- Use custom properties with the `--mdopen-` prefix for shared styling values.

## Toolbar Controls

- Use a single light/dark toggle.
- Use dropdown menus for style, font, tone, color, and density.
- Keep toolbar classes structural only; selected values belong in `data-mdopen-*` attributes.

## Variant Rules

Use data attributes for semantic or user-selected values:

- `data-mdopen-theme`
- `data-mdopen-style`
- `data-mdopen-tone`
- `data-mdopen-accent`
- `data-mdopen-font`
- `data-mdopen-density`

Tone `default` and accent `default` must remove their override attributes so the selected style source can keep its native colors.
Font `source` must preserve the selected style source fonts. Other font values are user overrides and must be applied from `assets/mdopen-overrides.css`, after all style-source CSS.

Use classes for stable structure only. Do not add separate classes for every tone, accent, font, or density value.

## Theme Rules

- Dark mode is for screen reading only.
- Print output must stay light.
- Grayscale tones should affect the full document.
- Print grayscale colors must stay neutral RGB values, for example `#333333`.
- Color accents should use related but varied tones across headings, links, blockquotes, and rules.
- Accent palettes should stay light and laser-printer friendly.

## Font Rules

- Font themes should use named stacks with practical fallbacks.
- Do not add web font dependencies.
- Keep letter spacing conservative and avoid negative values.
- `source` is the default font option and means "use the selected style source fonts."
- Non-source font options are user overrides and must be applied only from `mdopen-overrides.css`.
- Style-source CSS may define native fonts, but it must not special-case user font options.

## Adding A Style Source

Add new style sources under `assets/styles/` and load/copy them from `templates/mdopen.html` and `mdopen`.

Style-source CSS should:

- Scope rules with `html[data-mdopen-style="name"]`.
- Preserve the shared `.markdown-body` content root.
- Define native colors, typography, spacing, and component treatment for that style.
- Avoid changing toolbar UI.
- Avoid overriding `data-mdopen-font` values.

## When To Add Structure

Keep the current flat structure unless a new styling area becomes genuinely large or reusable. If that happens, prefer another small file under `assets/styles/` or a focused shared CSS file over introducing a build system.
