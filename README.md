# mdopen

Quickly render a Markdown file as styled HTML and open it in the browser.

## Usage

```bash
mdopen file.md
```

The generated HTML is written to a temporary directory and opened with the default macOS browser.

## Features

- GitHub Markdown styling from cdnjs
- Light / dark toggle
- Style sources: default, demo, Read the Docs
- Gray levels: default, black, graphite, slate, ash
- Color accents: default, none, blue, sage, rose; each color uses varied heading and block tones
- Font sets: source, system, balanced docs, print serif, technical, editorial, product, mono
- Gap controls: normal, `-1`, `-2`, `-3`
- Mermaid fenced diagram rendering with fullscreen button
- Print-specific CSS for tighter output
- `-3` is the most compact print mode

Style, font, tone, color, and gap are dropdown menus.
Source font preserves the selected style source fonts.
Default tone and color preserve the selected style source colors.
Select `None` to remove the color accent. Dark mode is for screen reading only; print output stays light.
Print grayscale tones use flat neutral RGB values so near-black text stays clean on color laser printers.

## Requirements

- macOS
- `bun`
- installed packages: `markdown-it`, `highlight.js`

Check:

```bash
bun --version
```

## Architecture

See `ARCHITECTURE.md` for the runtime flow, source layout, and component responsibilities.
