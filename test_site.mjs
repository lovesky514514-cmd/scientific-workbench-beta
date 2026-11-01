import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import test from 'node:test'
import { createHash } from 'node:crypto'

const root = dirname(fileURLToPath(import.meta.url))
const page = (path) => readFileSync(resolve(root, path), 'utf8')

test('product and docs pages are self-contained and linked', () => {
  const home = page('index.html')
  const docs = page('docs/index.html')
  assert.match(home, /href="\.\/docs\/"/)
  assert.match(docs, /href="\.\.\/"/)
  for (const name of ['overview', 'requirements', 'first-run', 'tasks', 'comsol', 'evidence', 'troubleshooting', 'release']) {
    assert.match(docs, new RegExp(`id="${name}"`))
    assert.match(docs, new RegExp(`href="#${name}"`))
  }
  assert.ok(existsSync(resolve(root, 'assets/site.css')))
  assert.ok(existsSync(resolve(root, 'assets/brand-icon.png')))
  for (const source of ['index.html', 'docs/index.html', 'releases/3.1/index.html']) {
    const base = pathToFileURL(resolve(root, source))
    for (const [, reference] of page(source).matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(?:https?:|mailto:|#)/i.test(reference)) continue
      const target = fileURLToPath(new URL(reference, base))
      assert.ok(existsSync(target), `${source} has a missing local asset: ${reference}`)
    }
  }
})

test('the staging site has no beta distribution or live-service entry point', () => {
  for (const html of [page('index.html'), page('docs/index.html')]) {
    assert.doesNotMatch(html, /<form\b|workers\.dev|\/api\/invite|turnstile|activation|邀请码|VIP|申请审核/i)
    assert.doesNotMatch(html, /href="[^"]+\.exe"/i)
    assert.match(html, /公开安装包|发行状态/)
  }
  assert.match(page('index.html'), /<script src="\.\/assets\/gallery\.js" defer><\/script>/)
  assert.doesNotMatch(page('index.html'), /<script(?! src="\.\/assets\/gallery\.js")/i)
  assert.doesNotMatch(page('docs/index.html'), /<script\b/i)
})

test('V3.1 product information preserves honest source and download links', () => {
  const home = page('index.html')
  const docs = page('docs/index.html')
  const repository = 'https://github.com/lovesky514514-cmd/sky-workbench'
  assert.match(home, /SKY Workbench V3\.1/)
  assert.match(home, /class="button source" href="https:\/\/github\.com\/lovesky514514-cmd\/sky-workbench"/)
  assert.match(docs, /当前版本<strong>不提供通用的任意 MPH 导入后修改流程<\/strong>/)
  assert.match(docs, /「停止」结束当前 attempt，不是可继续的暂停/)
  assert.match(docs, /当前版本为 <strong>SKY Workbench 3\.1\.0<\/strong>/)
  assert.match(docs, /href="mailto:swbtest001@yeah\.net"/)
  assert.ok(home.includes(repository) && docs.includes(repository))
  assert.match(home + docs, /releases\/tag\/v3\.0\.0/)
  assert.doesNotMatch(home + docs, /SKY Workbench V2\.0|DOCUMENTATION \/ V2\.0/)
  assert.doesNotMatch(home + docs, /github\.com\/[^"\s]+\/releases\/download\/|\.exe["']/i)
})

test('hero rotates only unmodified installed-app screenshots, not a simulated model', () => {
  const home = page('index.html')
  const css = page('assets/site.css')
  const hashes = {
    'workbench-desktop-rc51.png': '2DCF7B8C9C952A5E2B48BB7B0A844D03DF0572666AB16565BB7D751609F62220',
    'workbench-onboarding-rc51.png': '7D02E5954D59D8279C5FEE0D25223B81D85208E7BA32FA30BC46AB138CE011FA',
    'workbench-settings-rc51.png': 'D62664D2A613A77E88EE5D6035DA26C7264AA3F8A6D2CA52F3143C7F13E30708',
    'workbench-results-rc51.png': '649F9CA6BAE4AE981AD87F1DD8673F848C838BA69ABAE3CD21D5534CE9C32462',
  }
  for (const [name, expected] of Object.entries(hashes)) {
    assert.match(home, new RegExp(`src="\\./assets/${name}"`))
    const image = readFileSync(resolve(root, `assets/${name}`))
    assert.equal(createHash('sha256').update(image).digest('hex').toUpperCase(), expected)
  }
  assert.equal((home.match(/class="hero-slide/g) ?? []).length, 4)
  assert.doesNotMatch(home, /visual-figure|figure-contour|figure-domain/)
  assert.doesNotMatch(css, /\.visual-figure|\.figure-contour|\.figure-domain/)
  assert.doesNotMatch(home, /<figcaption/)
  assert.match(home, /<div class="gallery-frame">[\s\S]*?<\/div>\s*<div class="gallery-toolbar"/)
  assert.match(css, /\.gallery-toolbar\{display:none/)
  assert.match(page('assets/gallery.js'), /}, 5000\)/)
})


test('current product pages use 3.1 version wording and link the update notes', () => {
  for (const name of ['index.html', 'docs/index.html', 'releases/3.1/index.html', 'README.md']) {
    const content = page(name)
    assert.match(content, /3\.1/)
    assert.doesNotMatch(content, /实验室|内测|内部候选|Lab Preview/i)
  }
  assert.match(page('index.html'), /href="\.\/releases\/3.1\/"/)
  assert.match(page('docs/index.html'), /href="\.\.\/releases\/3.1\/"/)
  assert.match(page('releases/3.1/index.html'), /href="\.\/verification\.json"/)
  assert.doesNotMatch(page('index.html') + page('docs/index.html'), /releases\/tag\/v3\.1\.0/)
})

test('release evidence separates drafts, solver checks and unavailable engines', () => {
  const data = JSON.parse(page('releases/3.1/verification.json'))
  assert.equal(data.version, '3.1.0')
  assert.equal(data.live_llm.structured_drafts,
    data.live_llm.vague_prompts + data.live_llm.explicit_prompts + data.live_llm.additional_original_prompt)
  assert.equal(data.frozen_runtime.completed_workflows.length, 3)
  assert.match(data.live_llm.metric, /not scientific modeling accuracy/)
  for (const engine of ['MATLAB', 'VASP', 'Materials Studio']) {
    assert.match(data.additional_engines[engine], /skipped: software unavailable/)
  }
  assert.match(data.additional_engines.LAMMPS, /scientific review pending/)
  const notes = page('releases/3.1/index.html')
  assert.match(notes, /结构化草案生成覆盖率不等于 AI 科学建模准确率/)
  assert.match(notes, /缺少可用环境/)
  assert.match(notes, /目标电脑安装、重启、升级与实际界面交互仍需验证/)
})

test('knowledge base current-version entries agree with the release notes', () => {
  const html = page('knowledge-base/index.html')
  const marker = /\b(?:const|let|var)\s+KB\s*=\s*/.exec(html)
  assert.ok(marker)
  const value = html.slice(marker.index + marker[0].length)
  // The array ends immediately before the following JavaScript statement.
  let depth = 0, quoted = false, escaped = false, end = 0
  for (; end < value.length; end++) {
    const char = value[end]
    if (quoted) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') quoted = false
    } else if (char === '"') quoted = true
    else if (char === '[' || char === '{') depth++
    else if (char === ']' || char === '}') { if (--depth === 0) break }
  }
  const entries = JSON.parse(value.slice(0, end + 1))
  assert.equal(new Set(entries.map(x => x.id)).size, entries.length)
  assert.match(entries.find(x => x.id === 'k002').short, /3\.1\.0/)
  assert.match(entries.find(x => x.id === 'k005').short, /三个实际求解案例/)
  assert.doesNotMatch(entries.find(x => x.id === 'k0344').title, /V3\.0/)
  assert.match(html, /更新日期：2026-11-01/)
})


test('Windows 3.1 entry identifies the final installer and its verification file', () => {
  const installer = JSON.parse(page('releases/3.1/installer.json'))
  const evidence = JSON.parse(page('releases/3.1/verification.json'))
  assert.equal(installer.version, '3.1.0')
  assert.equal(installer.filename, 'SKY_Workbench_3.1.0_x64_setup.exe')
  assert.equal(installer.product_name, 'SKY Workbench')
  assert.equal(installer.availability, 'maintainer')
  assert.match(installer.sha256, /^[a-f0-9]{64}$/)
  assert.ok(Number.isInteger(installer.bytes) && installer.bytes > 0)
  assert.equal(installer.runtime_sha256, evidence.frozen_runtime.sha256)
  assert.doesNotMatch(JSON.stringify(installer), /Lab|Preview|实验室|内测/)
  const notes = page('releases/3.1/index.html')
  assert.ok(notes.includes(installer.filename) && notes.includes(installer.sha256))
  assert.match(notes, /href="\.\/installer\.json"/)
  assert.match(page('index.html'), /class="button primary" href="\.\/releases\/3.1\/#get-version"/)
  assert.match(page('assets/site.css'), /\.checksum\{[^}]*overflow-wrap:anywhere/)
})
