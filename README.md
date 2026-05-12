# mdopen

Quickly render a Markdown file as styled HTML and open it in the browser.

## Usage

```bash
mdopen file.md
```

The generated HTML is written to a temporary directory and opened with the default macOS browser.

## Features

- GitHub Markdown styling from cdnjs
- Light / dark theme toggle
- Print themes: gray, blue, burgundy
- Gap controls: normal, `-1`, `-2`, `-3`
- Print-specific CSS for tighter output
- `-3` is the most compact print mode

## Requirements

- macOS
- `pandoc`

Check:

```bash
pandoc --version
```

## Install Layout

```text
~/home/mdopen/mdopen   source script
~/home/mdopen/README.md
~/bin/mdopen           symlink to source script
```
