(() => {  
'use strict';
  const cfg = window.SWB_CONFIG || {}, apiRoot = (cfg.apiBase || '').replace(/\/$/, '');
  const $ = id => document.getElementById(id);
  let testerToken = '', testerNumber = '', widgetApply = null, widgetAccess = null;
  const ready = !!apiRoot && !!cfg.turnstileSiteKey;
  const message = (id, text, error = false) => { const el = $(id); el.textContent = text; el.classList.toggle('error', error) };
  async function request(path, options = {}) {
    if (!ready) throw new Error('后台尚未配置，请稍后访问。');
    const response = await fetch(apiRoot + path, { method: options.method || 'GET', headers: { 'Content-Type': 'application/json', ...(options.token ? { 'Authorization': 'Bearer ' + options.token } : {}) }, body: options.data ? JSON.stringify(options.data) : undefined, cache: 'no-store' });
    const result = await response.json().catch(() => ({ ok: false, message: '服务返回的内容无法解析' }));
    if (!response.ok || !result.ok) throw new Error(result.message || '请求失败，请稍后重试。');
    return result;
  }
  function clearTester() { testerToken = ''; testerNumber = ''; $('access-form').hidden = false; $('tester-panel').hidden = true; $('download-link').hidden = true; $('download-link').removeAttribute('href'); $('release-extraction-value').textContent = ''; $('feedback-submit').disabled = true; $('feedback-tester-label').textContent = '请先在「测试者入口」验证邀请码。' }
  async function recheckTester() { if (!testerToken) return; try { await request('/api/me', { token: testerToken }) } catch (e) { clearTester(); message('access-message', '测试资格已过期或撤销，请重新验证邀请码。', true) } }
  function showPage(page) {
    const safe = ['home', 'about', 'apply', 'access', 'feedback', 'privacy'].includes(page) ? page : 'home';
    document.querySelectorAll('.view').forEach(el => el.hidden = el.dataset.view !== safe);
    document.querySelectorAll('[data-nav]').forEach(el => el.classList.toggle('active', el.dataset.nav === safe));
    $('menu-toggle').setAttribute('aria-expanded', 'false'); document.querySelector('.topnav').classList.remove('open');
    if ((safe === 'access' || safe === 'feedback') && testerToken) void recheckTester();
    if (safe === 'feedback' && !testerToken) { $('feedback-tester-label').textContent = '请先在「测试者入口」验证邀请码。'; $('feedback-submit').disabled = true }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function renderTurnstile() {
    if (!ready || !window.turnstile) return;
    if (widgetApply === null) widgetApply = window.turnstile.render('#apply-turnstile', { sitekey: cfg.turnstileSiteKey, theme: 'light' });
    if (widgetAccess === null) widgetAccess = window.turnstile.render('#access-turnstile', { sitekey: cfg.turnstileSiteKey, theme: 'light' });
  }
  function tokenOf(id) { return window.turnstile && id !== null ? window.turnstile.getResponse(id) : '' }
  function resetCaptcha(id) { if (window.turnstile && id !== null) window.turnstile.reset(id) }
  if (ready) {    
$('apply-submit').disabled = false; $('access-submit').disabled = false;
    const script = document.createElement('script'); script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.async = true; script.onload = renderTurnstile; document.head.append(script);
  } else { ['apply-turnstile', 'access-turnstile'].forEach(id => $(id).textContent = '申请和邀请码系统尚未启用；官网目前可预览。') }
  window.addEventListener('hashchange', () => showPage(location.hash.slice(1))); window.addEventListener('focus', () => void recheckTester()); document.addEventListener('visibilitychange', () => { if (!document.hidden) void recheckTester() }); showPage(location.hash.slice(1));
  $('menu-toggle').addEventListener('click', () => { const n = document.querySelector('.topnav'); const open = n.classList.toggle('open'); $('menu-toggle').setAttribute('aria-expanded', String(open)) });
  $('apply-form').addEventListener('submit', async e => {    
e.preventDefault(); message('apply-message', ''); const email = $('apply-email').value.trim(); if (!$('apply-consent').checked) { message('apply-message', '请先阅读并同意隐私说明。', true); return }
    const tok = tokenOf(widgetApply); if (!tok) { message('apply-message', '请先完成人机验证。', true); return }
    $('apply-submit').disabled = true;
    try { const r = await request('/api/applications', { method: 'POST', data: { email, interest: $('apply-interest').value, consent: true, turnstileToken: tok, website: '' } }); message('apply-message', r.message); $('apply-form').reset() } catch (err) { message('apply-message', err.message, true) } finally { resetCaptcha(widgetApply); $('apply-submit').disabled = false }  
});
  $('access-form').addEventListener('submit', async e => {    
e.preventDefault(); message('access-message', ''); const code = $('invite-code').value.trim(); const tok = tokenOf(widgetAccess); if (!tok) { message('access-message', '请先完成人机验证。', true); return }
    $('access-submit').disabled = true;
    try {      
const valid = await request('/api/invite/verify', { method: 'POST', data: { code, turnstileToken: tok } }); testerToken = valid.token; testerNumber = valid.testerNumber;
      $('invite-code').value = ''; const me = await request('/api/me', { token: testerToken });
      $('tester-number').textContent = '#' + testerNumber;
      $('feedback-tester-label').textContent = 'Tester #' + testerNumber + ' · 请勿提供敏感数据';
      $('feedback-submit').disabled = false;
      $('access-form').hidden = true; $('tester-panel').hidden = false;
      const r = me.release;
      $('release-version').textContent = r?.version || '下载尚未开放';
      $('release-hash').textContent = r?.sha256 ? 'SHA-256 · ' + r.sha256 : '';
      const link = $('download-link'); link.hidden = !r?.url;
      if (r?.url) { const uri = new URL(r.url); if (uri.protocol === 'https:') link.href = r.url; else link.hidden = true }
      $('release-extraction').hidden = !r?.extractionCode;
      $('release-extraction-value').textContent = r?.extractionCode || '';
      $('release-note').textContent = r ? '此链接仅用于受控内测；请不要转发。下载后请核对文件 SHA-256。' : '当前还没有开放安装包，请等待负责人通知。';
    } catch (err) { message('access-message', err.message, true); clearTester() } finally { resetCaptcha(widgetAccess); $('access-submit').disabled = false }  
});
  $('to-feedback').addEventListener('click', () => location.hash = '#feedback');
  $('copy-extraction').addEventListener('click', () => navigator.clipboard.writeText($('release-extraction-value').textContent).catch(() => { }));
  $('feedback-form').addEventListener('submit', async e => {    
e.preventDefault(); if (!testerToken) { location.hash = '#access'; return }
    $('feedback-submit').disabled = true; message('feedback-message', ''); try {
      const r = await request('/api/feedback', { method: 'POST', token: testerToken, data: { kind: $('feedback-kind').value, severity: $('feedback-severity').value, title: $('feedback-title').value, details: $('feedback-details').value, errorCode: $('feedback-code').value, version: $('feedback-version').value } });
      message('feedback-message', '提交成功！反馈回执：' + r.reportId + '。请保存此编号。'); $('feedback-form').reset();
    } catch (err) { message('feedback-message', err.message, true); if (err.message.includes('验证邀请码')) clearTester() } finally { if (testerToken) $('feedback-submit').disabled = false }  
});
  if (cfg.githubUrl && /^https:\/\//.test(cfg.githubUrl)) { const a = document.createElement('a'); a.href = cfg.githubUrl; a.textContent = 'GitHub ↗'; a.rel = 'noopener noreferrer'; a.target = '_blank'; document.querySelector('.footer-links').append(a) }
  if (cfg.supportEmail && /^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(cfg.supportEmail)) {
    const link = document.createElement('a'); link.href = 'mailto:' + cfg.supportEmail; link.textContent = '联系 / 删除申请'; document.querySelector('.footer-links').append(link)
  }
})();