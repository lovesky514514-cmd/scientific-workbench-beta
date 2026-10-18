(() => {
  'use strict';

  const cfg = window.SWB_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const root = String(cfg.apiBase || '').trim().replace(/\/+$/, '');
  const secureAPI = /^https:\/\/[^/]+/i.test(root);
  const ready = secureAPI && Boolean(cfg.turnstileSiteKey);
  let sessionToken = '';
  let applyWidget = null;
  let accessWidget = null;

  function notice(id, content, failed = false) {
    const el = $(id);
    el.textContent = String(content || '').slice(0, 320);
    el.classList.toggle('error', failed);
  }

  async function api(path, { method = 'GET', data, token } = {}) {
    if (!ready) throw new Error('申请与下载后台尚未开放。');
    const response = await fetch(root + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: data === undefined ? undefined : JSON.stringify(data),
      cache: 'no-store',
      credentials: 'omit'
    });
    let result;
    try { result = await response.json(); } catch { throw new Error('服务暂时不可用，请稍后再试。'); }
    if (!response.ok || !result || result.ok !== true) {
      throw new Error(typeof result?.message === 'string' ? result.message : '请求失败，请稍后再试。');
    }
    return result;
  }

  function showAccess(open) {
    $('access-area').hidden = !open;
    $('show-access').setAttribute('aria-expanded', String(open));
    if (open) {
      if (ready) setupCaptcha('access');
      $('access-area').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      $('invite-code').focus({ preventScroll: true });
    }
  }

  function setupCaptcha(which) {
    if (!ready || !window.turnstile) return;
    if (which === 'apply' && applyWidget === null) {
      applyWidget = window.turnstile.render('#apply-turnstile', { sitekey: cfg.turnstileSiteKey, theme: 'light' });
    }
    if (which === 'access' && accessWidget === null) {
      accessWidget = window.turnstile.render('#access-turnstile', { sitekey: cfg.turnstileSiteKey, theme: 'light' });
    }
  }

  function captchaValue(widget) {
    return widget !== null && window.turnstile ? window.turnstile.getResponse(widget) : '';
  }
  function resetCaptcha(widget) {
    if (widget !== null && window.turnstile) window.turnstile.reset(widget);
  }

  function resetAccess() {
    sessionToken = '';
    $('access-form').hidden = false;
    $('tester-panel').hidden = true;
    $('download-link').hidden = true;
    $('download-link').removeAttribute('href');
    $('release-extraction').hidden = true;
    $('release-extraction-value').textContent = '';
    $('feedback-area').hidden = true;
    $('toggle-feedback').setAttribute('aria-expanded', 'false');
    $('feedback-submit').disabled = true;
  }

  async function confirmSession() {
    if (!sessionToken) return;
    try {
      await api('/api/me', { token: sessionToken });
    } catch {
      resetAccess();
      notice('access-message', '资格已过期或撤销，请重新验证邀请码。', true);
    }
  }

  $('show-access').addEventListener('click', () => showAccess($('access-area').hidden));
  $('close-access').addEventListener('click', () => showAccess(false));

  if (ready) {
    $('availability').textContent = '邀请制 · 验证后发放';
    $('apply-submit').disabled = false;
    $('access-submit').disabled = false;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => setupCaptcha('apply');
    script.onerror = () => {
      $('apply-submit').disabled = true;
      $('access-submit').disabled = true;
      $('availability').textContent = '验证服务暂时不可用';
    };
    document.head.append(script);
  } else {
    $('availability').textContent = '领取与申请暂未开放';
    notice('apply-message', '申请入口正在准备中，目前不会收集邮箱。');
  }

  $('apply-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!ready || $('apply-submit').disabled) return;
    notice('apply-message', '');
    const email = $('apply-email').value.trim();
    if (!$('apply-form').checkValidity() || !$('apply-consent').checked) {
      notice('apply-message', '请填写有效邮箱并勾选同意说明。', true);
      return;
    }
    const captcha = captchaValue(applyWidget);
    if (!captcha) { notice('apply-message', '请先完成人机验证。', true); return; }
    $('apply-submit').disabled = true;
    try {
      const res = await api('/api/applications', {
        method: 'POST',
        data: { email, interest: 'general', consent: true, turnstileToken: captcha, website: '' }
      });
      notice('apply-message', res.message || '申请已提交，等待人工审核。');
      $('apply-form').reset();
    } catch (error) {
      notice('apply-message', error.message, true);
    } finally {
      resetCaptcha(applyWidget);
      $('apply-submit').disabled = false;
    }
  });

  $('access-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!ready || $('access-submit').disabled) return;
    const code = $('invite-code').value.trim();
    const captcha = captchaValue(accessWidget);
    if (!code || !captcha) { notice('access-message', '请输入邀请码并完成人机验证。', true); return; }
    $('access-submit').disabled = true;
    notice('access-message', '');
    try {
      const result = await api('/api/invite/verify', {
        method: 'POST',
        data: { code, turnstileToken: captcha }
      });
      sessionToken = result.token;
      $('invite-code').value = '';
      const me = await api('/api/me', { token: sessionToken });
      $('tester-number').textContent = 'Tester #' + String(result.testerNumber).padStart(3, '0');
      $('access-form').hidden = true;
      $('tester-panel').hidden = false;
      $('feedback-submit').disabled = false;
      const release = me.release;
      $('release-version').textContent = release?.version || '暂未开放';
      $('release-hash').textContent = release?.sha256 ? 'SHA-256 · ' + release.sha256 : '';
      $('release-note').textContent = '测试包仅限获邀使用；请勿转发链接或邀请码。';
      const link = $('download-link');
      link.hidden = true;
      link.removeAttribute('href');
      if (release?.url) {
        try {
          const url = new URL(release.url);
          if (url.protocol === 'https:') { link.href = url.href; link.hidden = false; }
        } catch { /* unsafe/invalid link is intentionally unavailable */ }
      }
      $('release-extraction').hidden = !release?.extractionCode;
      $('release-extraction-value').textContent = release?.extractionCode || '';
    } catch (error) {
      resetAccess();
      notice('access-message', error.message, true);
    } finally {
      resetCaptcha(accessWidget);
      $('access-submit').disabled = false;
    }
  });

  $('copy-extraction').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('release-extraction-value').textContent); }
    catch { /* no clipboard permission; user may select text manually */ }
  });

  $('toggle-feedback').addEventListener('click', () => {
    const open = $('feedback-area').hidden;
    $('feedback-area').hidden = !open;
    $('toggle-feedback').setAttribute('aria-expanded', String(open));
  });

  $('feedback-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!sessionToken || !$('feedback-form').checkValidity()) return;
    $('feedback-submit').disabled = true;
    notice('feedback-message', '');
    try {
      const result = await api('/api/feedback', {
        method: 'POST',
        token: sessionToken,
        data: {
          kind: $('feedback-kind').value,
          severity: $('feedback-severity').value,
          title: $('feedback-title').value.trim(),
          details: $('feedback-details').value.trim(),
          errorCode: $('feedback-code').value.trim(),
          version: $('feedback-version').value.trim()
        }
      });
      notice('feedback-message', '提交成功，回执编号：' + (result.reportId || '请联系管理员确认'));
      $('feedback-form').reset();
    } catch (error) {
      notice('feedback-message', error.message, true);
      if (/邀请码|过期|撤销/.test(error.message)) resetAccess();
    } finally {
      if (sessionToken) $('feedback-submit').disabled = false;
    }
  });

  window.addEventListener('focus', () => void confirmSession());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void confirmSession(); });
})();