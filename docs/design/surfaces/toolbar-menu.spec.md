# Toolbar Menu

Compact toolbar behavior for hiding long view controls behind a hamburger menu while keeping the theme toggle one click away.

## Composition

```text
ToolbarMenu
├── EditorToggle (GitHub Pages only, hidden on CLI pages)
├── ThemeToggle
├── CopyRichButton
├── PrintButton
├── MenuButton
└── MenuPanel
    ├── PinToggle
    ├── CopyButtonGroup
    ├── OtherButtonGroup
    ├── ThemeButtonGroup
    ├── FontButtonGroup
    ├── ToneButtonGroup
    ├── ColorButtonGroup
    └── DensityButtonGroup
```

## Source files

| Type | Path |
|------|------|
| Template | `templates/mdopen.html` |
| CSS | `assets/mdopen.css` |
| Styling guide | `docs/styling.md` |

## Layout

- Collapsed toolbar shows five controls: `[pencil] [theme icon] [Copy rich] [Print] [Menu]`.
- `ThemeToggle` remains the first item, is round, and shows an icon for the active state.
- `CopyRichButton` and `PrintButton` sit between `ThemeToggle` and `MenuButton`.
- `CopyRichButton` is the fast-path default and always uses the same behavior as the menu's `Rich` copy action.
- `PrintButton` uses a dependency-free printer icon and calls browser printing.
- `MenuButton` is a square icon button using `☰` or an equivalent dependency-free hamburger icon.
- Top-level toolbar icon buttons share the same fixed width.
- `MenuPanel` opens below the toolbar, aligned to the right edge on desktop and stretched inside the mobile side margins.
- Panel order is fixed: Copy, Other, Theme, Font, Tone, Color, Gap.
- `PinToggle` is absolutely positioned in the top-right corner and must not reserve a row or add vertical gap.
- Customization controls use native buttons with `aria-pressed`, not dropdowns.
- Selected options must be visible without opening a native select popup.
- Each Font option button previews that option's heading font; `Source` previews the selected theme's native `h1` with font overrides ignored.
- Keep the toolbar fixed at the current top-right placement on desktop.
- On mobile, keep the toolbar centered/full-width within the current `8px` side inset.
- Use the existing 30px control height, 4px toolbar gap, 6px control radius, and 8px toolbar radius.
- No control changes should affect the rendered Markdown article layout.

## Copy Modes

| Control | Location | Clipboard payload | Intended use |
|---------|----------|-------------------|--------------|
| `CopyRichButton` | top-level toolbar | rendered article as `text/html` plus `text/plain` | fastest default copy for rich targets |
| `Rich` | Copy menu group | same payload as `CopyRichButton` | discoverable duplicate of the toolbar default |
| `Plain text` | Copy menu group | article text only | paste without Markdown styling or HTML formatting |
| `Google Docs` | Copy menu group | semantic HTML with mdopen classes, inline styles, color attributes, and chrome removed, plus plain text fallback | preserve document structure while avoiding mdopen theme colors in Google Docs |

- Copy actions are commands, not persistent modes; they do not use `aria-pressed`.
- Copy actions must not alter current theme, style source, tone, color, font, or density preferences.
- The copied document excludes mdopen toolbar chrome and Mermaid fullscreen buttons.

## Copy Behavior

- Clicking `CopyRichButton` immediately copies the current rendered article using the `Rich` payload.
- Opening the menu and clicking `Rich`, `Plain text`, or `Google Docs` copies that specific payload; the menu remains open so users can retry or choose another copy target.
- Successful copy replaces only the clicked button label with `✓`, then restores the original label after a short delay.
- Failed copy keeps the button in place and changes its tooltip/title to `Copy failed`; no modal, toast, or layout shift is shown.
- Rich HTML copy should use the async Clipboard API when available, with a selection-based HTML copy fallback for browsers that block or lack rich clipboard writes.
- Plain text copy should use text clipboard write when available, with a hidden textarea selection fallback.
- Google Docs copy should preserve semantic document structure, for example headings, lists, tables, links, code, emphasis, and blockquotes, while stripping mdopen classes, inline styles, ids, and color-related attributes.

## Print Options

| Control | Location | Persistent value | Intended use |
|---------|----------|------------------|--------------|
| `Print frontmatter` | Other menu group | `mdopen-print-frontmatter` boolean | include the document metadata block in browser print output |

- `Print frontmatter` is a persistent view/print option and uses `aria-pressed`.
- Default value is off.
- Enabling the option sets `html[data-mdopen-print-frontmatter="true"]`.
- Disabling the option removes that data attribute.
- The option affects print output only; it must not force the frontmatter block open on screen.
- See `frontmatter-block.spec.md` for frontmatter block composition and print visibility.

## Code Options

| Control | Location | Persistent value | Intended use |
|---------|----------|------------------|--------------|
| `Wrap code` | Other menu group | `mdopen-code-wrap` boolean | wrap long code lines instead of requiring horizontal scrolling |

- `Wrap code` is a persistent view option and uses `aria-pressed`.
- Default value is on.
- Enabling the option sets `html[data-mdopen-code-wrap="true"]`.
- Disabling the option sets `html[data-mdopen-code-wrap="false"]`.
- Code block scrollbars stay hidden until the code block is hovered or focused.

## States

| State | Trigger | Visual change | Behavior |
|-------|---------|---------------|----------|
| closed | page load, outside click when unpinned, Escape | top-level toolbar buttons visible | menu controls hidden from tab order |
| open | `MenuButton` click | `MenuPanel` appears below toolbar | focus can move into all option buttons |
| desktop selection | selecting Theme, Font, Tone, Color, or Gap at `>= 768px` | selected value updates | menu remains open |
| customization selected | customization option button click | clicked option gets `aria-pressed="true"`; siblings in same group are false | menu remains open |
| print frontmatter toggled | `Print frontmatter` option click | option flips `aria-pressed` | future prints include or exclude frontmatter |
| code wrap toggled | `Wrap code` option click | option flips `aria-pressed` | code blocks wrap or preserve long-line scrolling |
| pinned | Pin toggle click | pin button becomes pressed | outside clicks no longer close the menu |
| theme toggled | `ThemeToggle` click | button icon flips between light and dark state; accessible label describes the next action | menu state is unchanged |
| rich copy requested | `CopyRichButton` click | button briefly shows success | copies rendered document HTML and plain text |
| menu copy requested | Copy group button click | clicked button briefly shows success | copies Rich, Plain text, or Google Docs semantic HTML mode |
| print requested | `PrintButton` click | browser print dialog opens | calls `window.print()`; menu state is unchanged |
| print | browser print | toolbar and menu panel hidden | print stays light per current styling contract |

## Responsive

| Breakpoint | Toolbar | Menu panel |
|------------|---------|------------|
| `< 768px` | `[✏️] [☀/☾] [⧉] [🖨] [☰]`, centered in current mobile toolbar area | full available width inside `8px` page inset; Other group appears after Copy |
| `>= 768px` | `[✏️] [☀/☾] [⧉] [🖨] [☰]`, fixed top-right | right-aligned popover, width fits button groups |

## Accessibility

- `MenuButton` has `aria-label="View options"`, `aria-expanded`, and `aria-controls`.
- `CopyRichButton` has `aria-label="Copy rich document"` and does not use `aria-pressed`.
- `PrintButton` has `aria-label="Print document"` and does not use `aria-pressed`.
- `MenuPanel` has an id referenced by `aria-controls`.
- Closed menu controls must not be keyboard-focusable.
- Each option group has a visible label and an accessible group label.
- Every customization option button uses `aria-pressed` to expose the active value.
- The `Print frontmatter` option uses `aria-pressed` because it is a persistent boolean setting.
- The `Wrap code` option uses `aria-pressed` because it is a persistent boolean setting.
- Escape closes the menu and returns focus to `MenuButton`.
- Clicking outside the toolbar/menu closes the menu only when the menu is unpinned.
- Pin preference is persisted in `localStorage`.

## Tokens used

| Element | Token / value | Usage |
|---------|---------------|-------|
| toolbar background | `--bgColor-default` with current `color-mix` pattern | toolbar and panel background |
| text | `--fgColor-default`, `--fgColor-muted` | buttons and labels |
| border | existing `rgba(128, 128, 128, ...)` pattern | toolbar, panel, option buttons |
| radius | existing `6px` / `8px` | controls and containers |

## Classes used

| Element | Class | Source |
|---------|-------|--------|
| toolbar | `.mdopen-toolbar` | existing CSS |
| divider | `.mdopen-divider` | remove or hide in collapsed toolbar |
| rich-copy button | `.mdopen-copy-rich-button` | stable structure for default rich document copy |
| print button | `.mdopen-print-button` proposed | stable structure for print CTA |
| menu button | `.mdopen-menu-button` proposed | stable structure for hamburger button |
| menu panel | `.mdopen-menu-panel` proposed | stable structure for hidden controls |
| option group | `.mdopen-option-group` proposed | fieldset reset and group spacing |
| segmented buttons | `.mdopen-segmented` proposed | short option groups |
| button grid | `.mdopen-button-grid` proposed | larger font option set |
| pin button | `.mdopen-pin-button` proposed | top-right pinned state control |

## Extension notes

- Keep theme, rich copy, and print separate from the menu. The collapsed toolbar contract is `[pencil] [theme icon] [copy rich] [print] [menu]`.
- Do not add dependencies for the menu interaction.
- Keep current `data-mdopen-*` persistence behavior unchanged.
- Keep print-specific metadata and code readability options in the `Other` menu group, not in the top-level toolbar.
