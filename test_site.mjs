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
  for (const source of ['index.html', 'docs/index.html']) {
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

test('V3 source and help links remain separate from internal installer distribution', () => {
  const home = page('index.html')
  const docs = page('docs/index.html')
  const repository = 'https://github.com/lovesky514514-cmd/sky-workbench'
  assert.match(home, /SKY Workbench V3\.0/)
  assert.match(home, /class="button source" href="https:\/\/github\.com\/lovesky514514-cmd\/sky-workbench"/)
  assert.match(docs, /当前候选版<strong>不提供通用的任意 MPH 导入后修改流程<\/strong>/)
  assert.match(docs, /「停止」结束当前 attempt，不是可继续的暂停/)
  assert.match(docs, /Windows Setup 仍是内部候选，本站不提供 EXE 下载/)
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
