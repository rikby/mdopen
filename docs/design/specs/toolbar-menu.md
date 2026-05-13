# Toolbar Menu

Compact toolbar behavior for hiding long view controls behind a hamburger menu while keeping the theme toggle one click away.

## Composition

```text
ToolbarMenu
├── ThemeToggle
├── MenuButton
└── MenuPanel
    ├── PinToggle
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

- Collapsed toolbar shows exactly two controls: `[theme icon] [Menu]`.
- `ThemeToggle` remains the first item, is round, and shows an icon for the active state.
- `MenuButton` is a square icon button using `☰` or an equivalent dependency-free hamburger glyph.
- `MenuPanel` opens below the toolbar, aligned to the right edge on desktop and stretched inside the mobile side margins.
- Panel order is fixed: Theme, Font, Tone, Color, Gap.
- `PinToggle` is absolutely positioned in the top-right corner and must not reserve a row or add vertical gap.
- Customization controls use native buttons with `aria-pressed`, not dropdowns.
- Selected options must be visible without opening a native select popup.
- Each Font option button previews that option's heading font; `Source` previews the selected theme's native `h1` with font overrides ignored.
- Keep the toolbar fixed at the current top-right placement on desktop.
- On mobile, keep the toolbar centered/full-width within the current `8px` side inset.
- Use the existing 30px control height, 4px toolbar gap, 6px control radius, and 8px toolbar radius.
- No control changes should affect the rendered Markdown article layout.

## States

| State | Trigger | Visual change | Behavior |
|-------|---------|---------------|----------|
| closed | page load, outside click when unpinned, Escape | only `ThemeToggle` and `MenuButton` visible | menu controls hidden from tab order |
| open | `MenuButton` click | `MenuPanel` appears below toolbar | focus can move into all option buttons |
| desktop selection | selecting Theme, Font, Tone, Color, or Gap at `>= 768px` | selected value updates | menu remains open |
| option selected | option button click | clicked option gets `aria-pressed="true"`; siblings in same group are false | menu remains open |
| pinned | Pin toggle click | pin button becomes pressed | outside clicks no longer close the menu |
| theme toggled | `ThemeToggle` click | button icon flips between light and dark state; accessible label describes the next action | menu state is unchanged |
| print | browser print | toolbar and menu panel hidden | print stays light per current styling contract |

## Responsive

| Breakpoint | Toolbar | Menu panel |
|------------|---------|------------|
| `< 768px` | `[☀/☾] [☰]`, centered in current mobile toolbar area | full available width inside `8px` page inset |
| `>= 768px` | `[☀/☾] [☰]`, fixed top-right | right-aligned popover, width fits button groups |

## Accessibility

- `MenuButton` has `aria-label="View options"`, `aria-expanded`, and `aria-controls`.
- `MenuPanel` has an id referenced by `aria-controls`.
- Closed menu controls must not be keyboard-focusable.
- Each option group has a visible label and an accessible group label.
- Every option button uses `aria-pressed` to expose the active value.
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
| menu button | `.mdopen-menu-button` proposed | stable structure for hamburger button |
| menu panel | `.mdopen-menu-panel` proposed | stable structure for hidden controls |
| option group | `.mdopen-option-group` proposed | fieldset reset and group spacing |
| segmented buttons | `.mdopen-segmented` proposed | short option groups |
| button grid | `.mdopen-button-grid` proposed | larger font option set |
| pin button | `.mdopen-pin-button` proposed | top-right pinned state control |

## Extension notes

- Keep theme separate from the menu. The collapsed toolbar contract is `[theme icon] [menu]`.
- Do not add dependencies for the menu interaction.
- Keep current `data-mdopen-*` persistence behavior unchanged.
