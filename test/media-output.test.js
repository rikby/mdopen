const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { renderMarkdown } = require('../renderer.js');
const projectDir = path.resolve(__dirname, '..');
const templateDir = path.join(projectDir, 'templates');
const template = fs.readFileSync(path.join(templateDir, 'mdopen.html'), 'utf8');

function render(markdown) {
  return renderMarkdown(markdown, { template, templateDir, pageTitle:'Media', cssHref:'mdopen.css' }).html;
}

function checkScripts(html) {
  assert.ok(!/\{\{(?:mediaScript|mermaidScript)\}\}/.test(html), 'script slots must be resolved');
  for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/type="module"/.test(match[1])) {
      const body = match[2].replace(/^\s*import .*;$/gm, '');
      new (Object.getPrototypeOf(async function () {}).constructor)(body);
    } else new vm.Script(match[2]);
  }
}

test('image pages include shared zoom without a Mermaid CDN request', () => {
  const html = render('![Diagram](relative.png)\n\n[![Linked](other.svg)](details.md)');
  assert.ok(html.includes('window.mdopenMediaOverlay'));
  assert.ok(html.includes('src="relative.png"'));
  assert.ok(html.includes('<a href="details.md"><img src="other.svg"'));
  assert.ok(!html.includes('import mermaid from'));
  checkScripts(html);
});

test('Mermaid pages load the shared zoom engine once and keep lazy rendering', () => {
  const html = render('```mermaid\ngraph LR\nA-->B\n```');
  assert.equal((html.match(/window.mdopenMediaOverlay =/g) || []).length, 1);
  assert.ok(html.includes('import mermaid from'));
  assert.ok(html.includes('class="mermaid-container"'));
  checkScripts(html);
});

test('binary and source share image and Mermaid output in file and directory modes', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mdopen-media-parity-'));
  function run(command, args) {
    const result = spawnSync(command, args, {cwd:projectDir, encoding:'utf8', env:{...process.env, MDOPEN_NO_OPEN:'1'}});
    assert.equal(result.status, 0, result.stderr);
  }
  try {
    const binary = path.join(temp, process.platform === 'win32' ? 'mdopen.exe' : 'mdopen');
    run(process.execPath, ['scripts/build-binary.js', '--outfile', binary]);
    const input = path.join(temp, 'input');
    fs.mkdirSync(input);
    fs.writeFileSync(path.join(input, 'media.md'), '# Media\n\n![Diagram](relative.png)\n\n```mermaid\ngraph LR\nA-->B\n```');
    for (const directory of [false, true]) {
      const target = directory ? input : path.join(input, 'media.md');
      const sourceOut = path.join(temp, 'source-' + directory);
      const binaryOut = path.join(temp, 'binary-' + directory);
      run(process.execPath, ['bin/mdopen.js', target, '--no-open', '-o', sourceOut]);
      run(binary, [target, '--no-open', '-o', binaryOut]);
      const file = directory ? 'index.html' : 'media.html';
      const sourceHtml = fs.readFileSync(path.join(sourceOut, file), 'utf8');
      assert.equal(fs.readFileSync(path.join(binaryOut, file), 'utf8'), sourceHtml);
      assert.ok(!sourceHtml.includes('id="mdopen-editor-panel"'), 'Pages editor must not ship in CLI output');
      checkScripts(sourceHtml);
    }
  } finally { fs.rmSync(temp, {recursive:true, force:true}); }
});
