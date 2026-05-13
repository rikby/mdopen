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

| Artifact | Build runner | Smoke tested |
| --- | --- | --- |
| `mdopen-darwin-arm64` | macOS arm64 | yes |
| `mdopen-darwin-x64` | macOS arm64 cross-compile | no |
| `mdopen-linux-arm64` | Linux arm64 | yes |
| `mdopen-linux-x64` | Linux x64 | yes |
| `mdopen-linux-arm64-musl` | Linux arm64 cross-target | no |
| `mdopen-linux-x64-musl` | Linux x64 cross-target | no |
| `mdopen-windows-arm64.exe` | Linux cross-compile | no |
| `mdopen-windows-x64.exe` | Linux cross-compile | no |

Smoke tests are intentionally excluded for artifacts that cannot run on their build runner. This avoids waiting on scarce Intel macOS runners and avoids Windows target extraction issues seen on Windows-hosted runners.

Pushes to `main` and pull requests upload build artifacts. Tags matching `v*` also publish those artifacts to the GitHub release.
