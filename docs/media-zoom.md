# Image and diagram zoom

Images and Mermaid diagrams share a fullscreen icon button and zoom viewer in single-file
output, directory output, standalone binaries, HTTP exports, and the Pages editor.

- Scroll or pinch to zoom; drag to pan.
- Tap ? to expand the floating help menu for +/− and Fit controls; tap again to hide it. Keyboard +/− also zoom.
- Use Fit, keyboard 0, or double-click to reset.
- Use the original exit-fullscreen icon or Escape to return to the document.

Links around images still navigate normally. Their separate fullscreen icon zooms the
image. Unloaded or broken images cannot open the viewer. Printing closes zoom and
prints the original document without zoom controls. Images need no Mermaid CDN.

The canvas fills the entire viewport. The translucent floating controls use the
original Mermaid icon style; there is no fixed header or reserved top space.
The same shared overlay owns this UI for every fullscreen image and diagram.

## Plan and acceptance goals

1. Add image zoom with the same interaction as Mermaid, preserving relative URLs,
   linked image navigation, normal document scrolling, and printing.
2. Give one shared browser partial ownership of overlays and gestures; remove
   repeated Mermaid gesture implementations and the copied binary viewer.
3. Verify the source CLI, binary, directory viewer, HTTP renderer, and Pages
   editor; publish the feature in v0.4.0 with scoped commits.

Runtime ownership is defined in [ARCHITECTURE.md](../ARCHITECTURE.md).

## Regression checks

The reported example is `~/work/smartflyer/docs/architecture/c4-containers.md`.
It contains two relative PNG images, including a 6492 × 3814 container diagram.
Preview it locally without changing that source file:

```bash
./bin/mdopen ~/work/smartflyer/docs/architecture/c4-containers.md
```

Check both fullscreen icons, immediate wheel zoom/drag, Fit, Escape, and light print
output. Also check a linked image, a broken image, and a Mermaid fenced diagram.

The repeatable browser probe in `test/browser/media-zoom.js` checks fit, wheel and
button zoom, drag distance, keyboard controls, synthetic two-pointer pinch,
Escape, focus return, printing, theme change, and document replacement. It
replaces the displayed article at the end, so reload before another run.
It requires the separately installed `playwright-cli`, not a runtime dependency:

```bash
PLAYWRIGHT_MCP_ALLOW_UNRESTRICTED_FILE_ACCESS=1 playwright-cli -s=media-zoom open file:///absolute/path/to/generated.html
playwright-cli -s=media-zoom run-code "$(cat test/browser/media-zoom.js)"
playwright-cli -s=media-zoom close
```

For directory output, select the document first. For the Pages editor, enter
Markdown containing a URL image and wait for its preview first. Run the same
probe on a rendered Mermaid page to check the shared interaction path.
