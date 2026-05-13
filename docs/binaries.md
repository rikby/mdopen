# Binary Builds

`mdopen` can be shipped as standalone Bun executables. The source CLI stays in `bin/mdopen.js`; binary packaging is an additive build path.

## Local Builds

Build a binary for the current platform:

```bash
bun run build:binary
```

Build a named target:

```bash
bun scripts/build-binary.js --target bun-linux-x64-baseline --outfile dist/mdopen-linux-x64
```

The build script generates `.build/mdopen-binary-entry.js`, then compiles it into `dist/`. Do not edit generated files.

## Embedded Runtime

The standalone binary embeds:

- `renderer.js`
- `templates/mdopen.html`
- `templates/mermaid-script.html`
- `assets/mdopen.css`
- `assets/mdopen-overrides.css`
- `assets/styles/*.css`
- `assets/styles/fonts/*`

At runtime, the binary writes embedded CSS and font assets into the platform temp `mdopen` directory, renders the Markdown file, and opens the generated HTML.

## Openers

The binary uses platform opener commands directly:

- macOS: `open`
- Linux: `xdg-open`
- Windows: `cmd.exe /c start`
- MinGW/Git Bash: Windows opener with path conversion when needed

Set `MDOPEN_NO_OPEN=1` to render without opening a browser.

## GitHub Actions

`.github/workflows/build.yml` builds release artifacts for:

- `mdopen-darwin-x64`
- `mdopen-darwin-arm64`
- `mdopen-linux-x64`
- `mdopen-linux-arm64`
- `mdopen-linux-x64-musl`
- `mdopen-linux-arm64-musl`
- `mdopen-windows-x64.exe`
- `mdopen-windows-arm64.exe`

Native smoke tests run where the GitHub runner can execute the binary. Cross-compiled binaries are uploaded but not smoke-tested on incompatible runners.

Pushes to `main` and pull requests upload build artifacts. Tags matching `v*` also publish those artifacts to the GitHub release.
