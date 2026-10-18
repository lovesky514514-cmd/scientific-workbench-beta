/* In-page Markdown reader: builds DOM safely; never interprets HTML in the document. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const dialog = $('help-dialog'), toc = $('help-toc'), body = $('help-markdown'), state = $('help-load-status');
  if (!dialog || !toc || !body || !state) return;
  const docURL = new URL('./HELP.md', location.href);
  let loaded = false;
  const element = (tag, value) => { const e = document.createElement(tag); e.textContent = value; return e; };
  function urlFor(value) {
    try {
      const result = new URL(value, docURL);
      return result.protocol === 'https:' || (result.protocol === 'http:' && result.origin === location.origin) ? result : null;
    } catch { return null; }
  }
  function inline(target, value) {
    const pattern = /\[([^\]]{1,150})\]\(([^)\s]+)\)|\x60([^\x60\n]+)\x60|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
    let last = 0;
    for (const token of value.matchAll(pattern)) {
      if (token.index > last) target.append(document.createTextNode(value.slice(last, token.index)));
      if (token[1] !== undefined) {
        const url = urlFor(token[2]);
        if (!url) target.append(document.createTextNode(token[1]));
        else {
          const a = element('a', token[1]); a.href = url.href;
          if (url.origin !== location.origin) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
          target.append(a);
        }
      } else if (token[3] !== undefined) target.append(element('code', token[3]));
      else if (token[4] !== undefined) target.append(element('strong', token[4]));
      else target.append(element('em', token[5]));
      last = token.index + token[0].length;
    }
    if (last < value.length) target.append(document.createTextNode(value.slice(last)));
  }
  function render(markdown) {
    body.replaceChildren(); toc.replaceChildren();
    const label = element('p', '文档目录'); label.className = 'help-toc-label'; toc.append(label);
    let list = null, code = null, lines = [], counter = 0;
    function endCode() { if (code) { code.textContent = lines.join('\n'); code = null; lines = []; } }
    for (const original of markdown.replace(/\r\n?/g, '\n').split('\n')) {
      const line = original.trimEnd();
      if (/^\s*\x60{3}/.test(line)) {
        if (code) endCode();
        else { const pre = document.createElement('pre'); code = document.createElement('code'); pre.append(code); body.append(pre); }
        list = null; continue;
      }
      if (code) { lines.push(original); continue; }
      if (!line.trim()) { list = null; continue; }
      const match = /^(#{1,4})\s+(.+)$/.exec(line);
      if (match) {
        list = null;
        const title = document.createElement('h' + Math.min(5, match[1].length + 1));
        title.id = 'help-heading-' + (++counter);
        title.tabIndex = -1;
        inline(title, match[2]); body.append(title);
        if (match[1].length <= 3) {
          const button = element('button', match[2].replace(/[\x60*]/g, ''));
          button.type = 'button'; button.className = 'help-toc-item';
          button.addEventListener('click', () => {
            title.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
            title.focus({ preventScroll: true });
          });
          toc.append(button);
        }
        continue;
      }
      const ol = /^\s*\d+[.)]\s+(.+)$/.exec(line), ul = /^\s*[-*]\s+(.+)$/.exec(line);
      if (ol || ul) {
        const kind = ol ? 'ol' : 'ul';
        if (!list || list.tagName.toLowerCase() !== kind) { list = document.createElement(kind); body.append(list); }
        const li = document.createElement('li'); inline(li, (ol || ul)[1]); list.append(li);
        continue;
      }
      list = null;
      if (/^\s*---+\s*$/.test(line)) { body.append(document.createElement('hr')); continue; }
      const quote = /^\s*>\s?(.*)$/.exec(line);
      const p = document.createElement(quote ? 'blockquote' : 'p');
      inline(p, quote ? quote[1] : line); body.append(p);
    }
    endCode();
  }
  async function openHelp() {
    if (!dialog.open) dialog.showModal();
    if (loaded) return;
    state.textContent = '正在读取 HELP.md…';
    try {
      const res = await fetch(docURL.href, { credentials: 'omit', cache: 'no-store' });
      if (!res.ok || Number(res.headers.get('content-length') || 0) > 160000) throw new Error('unavailable');
      const text = await res.text();
      if (text.length > 160000) throw new Error('too large');
      render(text); loaded = true; state.textContent = '';
    } catch { state.textContent = '帮助文档暂时无法读取，请稍后重试。'; }
  }
  document.querySelectorAll('[data-open-help]').forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault(); void openHelp();
  }));
  $('close-help').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
})();