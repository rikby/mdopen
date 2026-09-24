# Directory Viewer

A CLI-generated local HTML page for `mdopen path/to/dir/` that lists Markdown files from the selected directory and renders the selected file in the existing mdopen document shell.

## Composition

```text
DirectoryViewerPage
├── ExistingToolbar
│   ├── ThemeToggle
│   ├── CopyRichButton
│   ├── PrintButton
│   ├── MenuButton
│   └── MenuPanel
├── DirectoryNav
│   ├── RootTitle
│   ├── IndexButton
│   ├── FolderGroup[] (collapsible `details`/`summary`)
│   └── FileButton[]
└── Preview
    └── <article class="markdown-body">
```

The toolbar in viewer mode gains a `NavToggleButton` (inserted by the viewer script, not the shared template). The editor toggle remains hidden. Directory browsing is a CLI viewer mode, not the GitHub Pages editor.

## Source files

| Type | Path |
|------|------|
| CLI generator | `bin/mdopen.js` |
| Binary generator | `scripts/build-binary.js` |
| HTML shell | `templates/mdopen.html` |
| Toolbar behavior | `templates/mdopen-script.html` |
| Styling guide | `docs/styling.md` |

## Layout

### Desktop

- `DirectoryNav` is fixed to the left: `12px` from top, left, and bottom.
- Width is capped at `280px` and never wider than the viewport minus `24px`.
- `Preview` keeps the existing `.markdown-body` styling and receives enough left margin to clear the nav.
- Toolbar remains fixed in the existing top-right position.
- Repo link remains fixed in the existing bottom-right position.

### Mobile (`< 760px`)

- `DirectoryNav` becomes a normal block above the article.
- It has a max height of `36vh` and scrolls internally when the file list is long.
- `Preview` returns to the normal centered article layout.

### Print

- `DirectoryNav` is hidden.
- `Preview` prints full width using normal mdopen print behavior.

## Directory discovery

| Rule | Behavior |
|------|----------|
| Input | One directory path passed to `mdopen` |
| File types | `.md` and `.markdown` |
| Depth | Maximum 5 directory levels below the selected root |
| Hidden directories | skipped |
| Generated directories | skip `.git`, `.n8n`, `node_modules`, `dist`, `build`, `_site`, and similar caches |
| Empty result | CLI exits with a clear no-Markdown-files message |

## Tree navigation

| Rule | Behavior |
|------|----------|
| Structure | The flat manifest is grouped client-side into a folder tree; folders sort first, then files, alphabetically per level |
| Folders | Native `details`/`summary` (`details.mdopen-directory-group`); no JS toggling logic, keyboard and screen-reader behavior come free |
| Labels | Folders show their basename; file buttons show the document title — first H1 outside fenced code blocks, filename fallback (markdown-ticket MDT-064 rule, extracted at generation time into the manifest `title`); the full path is a `title` tooltip |
| Default state | Folders are expanded; collapsing persists to `localStorage` (`mdopen-directory-tree` as an array of closed folder paths) |
| Auto-reveal | Selecting a file (button or rendered link) expands its ancestor folders (`setActiveButton` walks up from the active button) |
| Guides | Nested branches indent with a quiet 1px left guide; caret is a rotating `▸` pseudo-element |
| Toggle | Toolbar `NavToggleButton` (`.mdopen-directory-toggle`) hides/shows the nav; `aria-pressed` + `aria-controls`; state persists to `localStorage` (`mdopen-directory-nav-hidden`) |
| Nav search | Search input above the tree filters file buttons by title or path (case-insensitive substring); matching folders auto-expand while searching; folder open/closed state is not persisted while a filter is active; clearing restores persisted state; shows "No matches" when nothing fits |
| Hidden layout | When the nav is hidden, `body:has(.mdopen-directory-nav[hidden])` returns the article to centered layout |
| Theme | Tree chrome uses system colors (`Canvas`/`CanvasText`/`currentColor`) and neutral rgba grays, so it follows the light/dark theme toggle without extra attributes |
| Parity | The same tree logic ships minified in `scripts/build-binary.js`'s embedded viewer |

## Index page

- Lists each file as: title (from the manifest `title`, i.e. first H1), with the file path below it in monospace (`code.mdopen-index-path`).
- A copy icon button (`.mdopen-index-copy`, `⧉` with `✓` feedback) sits left of each item and copies the file path.
- A search input (`.mdopen-index-search`) above the list filters items on title + path and shows a "No matching files." message when nothing matches.
- Search box and copy buttons are hidden in print output.

## Deep links

| Rule | Behavior |
|------|----------|
| Format | `#{path}--{heading-slug}` opens that file scrolled to the heading; `#{path}` opens the file; empty hash opens the index |
| Slug | GitHub-compatible (markdown-ticket slugify): lowercase, whitespace to `-`, unicode letters/numbers kept; duplicates get `-1`/`-2` |
| Separator | the first `--` splits path from slug; the slug itself may contain `--` |
| Routing | all viewer navigation goes through `location.hash` + a `hashchange` handler, so browser back/forward walks selection history |
| Heading anchors | rendered headings h1-h6 get `id` + a full-title clickable link (`.mdopen-heading-link`); in the CLI single-file output this happens in `renderer.js`, in the viewer client-side after each render |
| Scroll | anchored headings carry `scroll-margin-top` so the fixed toolbar never covers the target |

## Rendering model

- The CLI writes one local HTML viewer page, not one HTML file per Markdown file.
- The generated page embeds a manifest with each file path, title, Markdown content, source file URL, and source directory URL.
- The initial article shows an index with the same file list as the nav.
- Selecting a file loads browser-side `markdown-it`, `highlight.js`, and the existing Markdown plugins from CDN if needed.
- The selected Markdown content renders into the existing `.markdown-body`.
- Relative image paths resolve against the selected source file's directory.
- Relative Markdown links to files in the manifest should navigate inside the viewer when possible.
- Mermaid fences preserve the existing `.mermaid-container` / `.mermaid` structure and lazy-load Mermaid only when needed.

## Children

| Child | Component | Spec | Conditional |
|-------|-----------|------|-------------|
| ExistingToolbar | existing toolbar shell | `toolbar-menu.spec.md` | always |
| NavToggleButton | toolbar button, viewer-generated | this spec | directory input only |
| DirectoryNav | generated `aside.mdopen-directory-nav` | this spec | directory input only |
| IndexButton | native button | this spec | always |
| FolderGroup | native `details`/`summary` per folder | this spec | one per discovered directory |
| FileButton | native button per Markdown file | this spec | one per discovered file |
| Preview | `.markdown-body` article | existing renderer contract | always |

## States

| State | Trigger | Visual change |
|-------|---------|---------------|
| index | page load or Index click | article shows root title, count, and file list; Index button active |
| loading-renderer | first file click | article may keep previous content while CDN scripts load |
| file-selected | file button click | article renders selected Markdown; selected nav button gets `aria-current="page"`; ancestor folders expand |
| inline-link-selected | click a rendered local Markdown link | linked file renders and matching nav button becomes active |
| folder-collapsed | summary click | folder children hidden; state persisted across visits |
| folder-expanded | summary click on collapsed folder | children visible with indent guide |
| nav-hidden | toolbar toggle click | nav hidden; article recenters; button `aria-pressed="false"`; state persisted |
| renderer-error | CDN renderer cannot load | article shows a short renderer failure message |
| long-list | more files than viewport allows | nav scrolls internally; toolbar remains usable |
| print | browser print | nav hidden; selected article prints full width |

## Tokens and classes used

| Element | Token / class | Usage |
|---------|---------------|-------|
| Nav shell | `.mdopen-directory-nav` | fixed/stacked directory navigation |
| Folder group | `details.mdopen-directory-group` / `summary` | collapsible folder |
| Branch | `.mdopen-directory-branch` | indented children with left guide |
| Nav toggle | `.mdopen-directory-toggle` | toolbar show/hide for the nav |
| Preview | `.markdown-body` | existing rendered document surface |
| Toolbar | `.mdopen-toolbar` | existing view controls |
| Active file | `aria-current="page"` | selected nav state |
| Theme state | `data-mdopen-*` attributes | existing toolbar-controlled view options |

## Extension notes

- Keep this surface generated by CLI scripts only; do not add it to GitHub Pages editor output.
- Do not add dependencies or a dev server. The viewer must remain a local file that can be opened by the platform browser.
- If the directory manifest becomes too large, add an explicit size guard before changing the UX model.
- Keep directory UI structural and quiet; the Markdown document remains the primary content.
