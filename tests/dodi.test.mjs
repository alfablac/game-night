import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright';

const script = await readFile(new URL('../dodi.user.js', import.meta.url), 'utf8');
const origin = 'https://dodi-repacks.site';
const pinned = `<article class="sticky"><div class="entry-content">
  <h2>Exclusive Repacks</h2><ul><li><a href="${origin}/game-a/">Game A</a></li>
  <li><a href="${origin}/game-b/">Game B</a></li></ul>
</div></article>`;
let browser;

before(async () => { browser = await chromium.launch({ headless: true, args: ['--host-resolver-rules=MAP * ~NOTFOUND'] }); });
after(async () => { await browser?.close(); });

function article(title, content = '') {
  return `<article><h2 class="entry-title"><a href="${origin}/${title}/">${title}</a></h2>
    <div class="entry-content">${content}</div></article>`;
}

async function start(t, html = pinned, { nativeFetch = false, clock = false, viewport, path = '/' } = {}) {
  const context = await browser.newContext({ serviceWorkers: 'block', ...(viewport ? { viewport } : {}) });
  const errors = [];
  t.after(async () => {
    await context.close();
    assert.deepEqual(errors, [], 'userscript must not emit uncaught browser errors');
  });
  await context.route('**/*', route => {
    if (route.request().isNavigationRequest() && route.request().url() === origin + path) {
      return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head></head><body>' + html + '</body></html>' });
    }
    return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(5_000);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin + path);
  if (clock) await page.clock.install();
  await page.evaluate(({ nativeFetch }) => {
    window.__requests = [];
    window.GM_getValue = (_, fallback) => fallback;
    window.GM_setValue = () => {};
    window.GM_addStyle = css => {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.append(style);
    };
    if (nativeFetch) {
      window.fetch = (url, options = {}) => new Promise((resolve, reject) => {
        const request = { url, resolve, reject, aborted: false };
        window.__requests.push(request);
        options.signal?.addEventListener('abort', () => {
          request.aborted = true;
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    } else {
      window.GM_xmlhttpRequest = options => {
        const request = { url: options.url, options, aborted: false };
        window.__requests.push(request);
        return { abort() { request.aborted = true; options.onabort?.(); } };
      };
    }
  }, { nativeFetch });
  await page.addScriptTag({ content: script });
  await page.locator('#dodi-app').waitFor();
  return page;
}

async function reply(page, url, html, status = 200) {
  await page.waitForFunction(url => window.__requests.some(request => request.url === url), url);
  await page.evaluate(({ url, html, status }) => {
    window.__requests.find(request => request.url === url).options.onload({ status, responseText: html });
  }, { url, html, status });
}

for (const width of [320, 390, 1366]) {
  test(`DODI header controls fit ${width}px and the original-site toggle remains usable`, async t => {
    // The WordPress theme supplies border-box sizing on the live site.
    const page = await start(t, '<style>*, *::before, *::after { box-sizing: border-box; }</style>'
      + pinned + article('Local'), { viewport: { width, height: 900 } });
    const bounds = await page.evaluate(() => {
      const selectors = ['.dodi-brand', '.dodi-search-input', '.dodi-search-btn', '.dodi-btn-toggle'];
      return selectors.map(selector => {
        const rect = document.querySelector(selector).getBoundingClientRect();
        return { selector, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      });
    });
    for (const rect of bounds) {
      assert.ok(rect.left >= 0 && rect.right <= width, `${rect.selector} must fit viewport: ${JSON.stringify(rect)}`);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('.dodi-btn-toggle').click();
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dodi-on')), false);
    await page.locator('.dodi-btn-toggle').click();
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dodi-on')), true);
  });
}

test('DODI rejects executable mirror URLs while retaining web and magnet links', async t => {
  const links = `<a href="https://downloads.example/game">HTTPS</a>
    <a href="/relative-download/">Relative</a><a href="magnet:?xt=urn:btih:123">Magnet</a>
    <a href="JaVaScRiPt:alert(1)">Mixed case</a><a href="java&#10;script:alert(1)">Control</a>
    <a href=" data:text/html,unsafe">Data</a>`;
  const page = await start(t, pinned + article('Safe', '<h3>Download Links</h3><ul><li>' + links + '</li></ul><p>' + links + '</p>'));
  const protocols = await page.locator('.ea-dl-actions a').evaluateAll(links => links.map(link => new URL(link.href).protocol));
  assert.deepEqual(protocols, ['https:', 'https:', 'magnet:', 'https:', 'https:', 'magnet:']);
});

test('DODI falls back to "#" for a pinned item whose URL is not on the allow-listed host', async t => {
  const html = `<article class="sticky"><div class="entry-content">
    <h2>Exclusive Repacks</h2><ul><li><a href="javascript:alert(1)">Evil Game</a></li></ul>
  </div></article>`;
  const page = await start(t, html);
  await page.locator('[data-tab="exclusive"]').click();
  assert.equal(await page.locator('.ea-title-text a', { hasText: 'Evil Game' }).getAttribute('href'), '#');
  assert.equal(await page.getByRole('link', { name: /Original/ }).getAttribute('href'), '#');
});

test('DODI upgrades allow-listed http mirrors to https but still blocks other hosts', async t => {
  const html = `<article class="sticky"><div class="entry-content">
    <h2>Exclusive Repacks</h2><ul>
      <li><a href="http://dodi-repacks.site/game-a/">Game A</a></li>
      <li><a href="http://evil.test/game-b/">Game B</a></li>
    </ul>
  </div></article>`;
  const page = await start(t, html);
  await page.locator('[data-tab="exclusive"]').click();
  const releaseButtons = page.getByRole('button', { name: 'View Release' });

  await releaseButtons.nth(0).click();
  await reply(page, origin + '/game-a/', article('Game A'));
  await page.locator('.dodi-modal-body .ea-card').waitFor();
  assert.equal(await page.evaluate(() => window.__requests.some(request => request.url === 'https://dodi-repacks.site/game-a/')), true);

  await page.getByRole('button', { name: /close/i }).click();
  await releaseButtons.nth(1).click();
  await page.waitForFunction(() => (document.querySelector('.dodi-modal-body')?.textContent || '').includes('Blocked host'));
  assert.equal(await page.evaluate(() => window.__requests.some(request => request.url.includes('evil.test'))), false);
});

test('DODI blocks a redirect that lands off the allow-listed host', async t => {
  const page = await start(t);
  await page.locator('[data-tab="exclusive"]').click();
  await page.getByRole('button', { name: 'View Release' }).first().click();
  const url = origin + '/game-a/';
  await page.waitForFunction(u => window.__requests.some(request => request.url === u), url);
  // GM_xmlhttpRequest follows redirects on its own; simulate it having landed off-host.
  await page.evaluate(u => {
    window.__requests.find(request => request.url === u).options.onload({ status: 200, responseText: '<html></html>', finalUrl: 'https://evil.test/x' });
  }, url);
  await page.waitForFunction(() => (document.querySelector('.dodi-modal-body')?.textContent || '').includes('Blocked host'));
});

test('DODI evicts an invalid cached Zovo destination instead of reusing it forever', async t => {
  const content = '<h3>Download Links</h3><ul><li><a href="https://go.zovo.ink/abc">Zovo Mirror</a></li></ul>';
  const page = await start(t, pinned + article('CacheBug', content));
  await page.evaluate(() => {
    window.__gmSets = [];
    window.GM_getValue = key => (key.indexOf('dodi_zovo_') === 0 ? 'ftp://stale-mirror.example/file' : undefined);
    window.GM_setValue = (key, value) => { window.__gmSets.push([key, value]); };
  });
  await page.locator('[data-tab="exclusive"]').click();
  await page.getByRole('button', { name: 'View Release' }).first().click();
  await reply(page, origin + '/game-a/', article('CacheBug', content));
  await page.locator('.dodi-modal-body .ea-card').waitFor();
  await page.locator('.fg-downloads > summary').click();
  await page.getByRole('button', { name: 'Silent Resolve' }).click();
  // The stale entry must be evicted (set back to '') rather than kept forever...
  await page.waitForFunction(() => window.__gmSets.some(entry => entry[1] === ''));
  // ...and a fresh resolution attempted against the real Zovo URL instead of trusting the bad cache.
  await page.waitForFunction(() => window.__requests.some(request => request.url === 'https://go.zovo.ink/abc'));
});

test('DODI treats "zovo" only as a hostname, not a substring anywhere in a mirror URL', async t => {
  const content = '<h3>Download Links</h3><ul>' +
    '<li>Real Zovo mirror: <a href="https://go.zovo.ink/abc">Mirror</a></li>' +
    '<li>Fake LAN mirror: <a href="http://192.168.0.1/apply.cgi?action=reboot&x=zovo">Mirror</a></li>' +
    '</ul>';
  const page = await start(t, pinned + article('HostCheck', content));
  await page.locator('[data-tab="exclusive"]').click();
  await page.getByRole('button', { name: 'View Release' }).first().click();
  await reply(page, origin + '/game-a/', article('HostCheck', content));
  await page.locator('.dodi-modal-body .ea-card').waitFor();
  await page.locator('.fg-downloads > summary').click();
  // Only the real Zovo host gets a "Silent Resolve" button; the LAN URL merely containing "zovo" must not.
  assert.equal(await page.getByRole('button', { name: 'Silent Resolve' }).count(), 1);
  await page.getByRole('button', { name: 'Silent Resolve' }).click();
  await page.waitForFunction(() => window.__requests.some(request => request.url === 'https://go.zovo.ink/abc'));
  assert.equal(await page.evaluate(() => window.__requests.some(request => request.url.includes('192.168.0.1'))), false);
});

test('DODI keeps a single roving tab and a resolvable tabpanel label for an empty search results page', async t => {
  const page = await start(t, '<p>No results.</p>', { path: '/?s=zzzz' });
  await page.waitForFunction(() => document.querySelectorAll('[role="tab"][tabindex="0"]').length === 1);
  const labelledby = await page.locator('#dodi-main-panel').getAttribute('aria-labelledby');
  assert.equal(await page.locator('#' + labelledby).count(), 1);
});

test('DODI distinguishes completed empty pinned lists from loading', async t => {
  const page = await start(t, article('Local'));
  await page.locator('[data-tab="exclusive"]').click();
  assert.equal(await page.locator('.dodi-main .dodi-spinner').count(), 1);
  await reply(page, origin + '/', article('Home'));
  for (const tab of ['activation', 'exclusive', 'trending']) {
    await page.locator(`[data-tab="${tab}"]`).click();
    assert.equal(await page.locator('.dodi-main .dodi-spinner').count(), 0);
    assert.match(await page.locator('.dodi-main').innerText(), /No .*available/i);
  }
});

test('DODI reports failed pinned loading without an endless spinner', async t => {
  const page = await start(t, article('Local'));
  await page.locator('[data-tab="trending"]').click();
  await reply(page, origin + '/', '', 503);
  await page.waitForFunction(() => !document.querySelector('.dodi-main .dodi-spinner'));
  assert.match(await page.locator('.dodi-main').innerText(), /Unable to load.*HTTP status 503/i);
});

for (const nativeFetch of [false, true]) {
  test(`DODI stops a stalled ${nativeFetch ? 'fetch' : 'GM request'} and renders a retry`, async t => {
    const page = await start(t, pinned, { nativeFetch, clock: true });
    await page.locator('[data-tab="exclusive"]').click();
    await page.getByRole('button', { name: 'View Release' }).first().click();
    await page.clock.fastForward(30_001);
    assert.match(await page.locator('.dodi-modal-body').innerText(), /timed out/i);
    assert.equal(await page.getByRole('button', { name: 'Retry', exact: true }).count(), 1);
    assert.equal(await page.evaluate(() => window.__requests[0].aborted), true);
  });
}

test('DODI tabs support keyboard navigation and expose the selected panel', async t => {
  const page = await start(t);
  const main = page.locator('[data-tab="main"]');
  assert.equal(await main.getAttribute('role'), 'tab');
  await main.focus();
  await page.keyboard.press('ArrowRight');
  const active = page.locator('.dodi-tab.active');
  assert.equal(await active.getAttribute('data-tab'), 'activation');
  assert.equal(await active.getAttribute('aria-selected'), 'true');
  assert.equal(await active.evaluate(el => el === document.activeElement), true);
  assert.equal(await page.locator('.dodi-main').getAttribute('aria-labelledby'), await active.getAttribute('id'));
  await page.keyboard.press('End');
  assert.equal(await page.locator('.dodi-tab.active').getAttribute('data-tab'), 'trending');
  await page.locator('.dodi-search-input').fill('query');
  await page.locator('.dodi-search-btn').click();
  assert.equal(await page.locator('[data-tab="search"]').getAttribute('aria-selected'), 'true');
  assert.equal(await page.locator('[data-tab="trending"]').getAttribute('aria-selected'), 'false');
});

test('DODI modal keeps keyboard focus inside and restores its opener and scroll state', async t => {
  const page = await start(t);
  await page.evaluate(() => { document.body.style.overflow = 'clip'; });
  await page.locator('[data-tab="exclusive"]').click();
  const opener = page.getByRole('button', { name: 'View Release' }).first();
  await opener.click();
  const modal = page.locator('.dodi-modal-box');
  assert.equal(await modal.getAttribute('role'), 'dialog');
  assert.equal(await modal.getAttribute('aria-modal'), 'true');
  assert.equal(await modal.evaluate(el => el.contains(document.activeElement)), true);
  const close = page.locator('.dodi-modal-close');
  await close.focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('.dodi-modal-actions a').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await close.evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.dodi-modal').evaluate(el => el.hidden), true);
  assert.equal(await opener.evaluate(el => el === document.activeElement), true);
  assert.equal(await page.evaluate(() => document.body.style.overflow), 'clip');
});

test('DODI discards late modal responses after close or another selection', async t => {
  const page = await start(t);
  await page.locator('[data-tab="exclusive"]').click();
  await page.getByRole('button', { name: 'View Release' }).first().click();
  await page.locator('.dodi-modal-close').click();
  await reply(page, origin + '/game-a/', article('Stale'));
  assert.equal(await page.locator('.dodi-modal-body .ea-card').count(), 0);
  await page.getByRole('button', { name: 'View Release' }).last().click();
  await reply(page, origin + '/game-b/', article('Current'));
  await page.waitForFunction(() => document.querySelector('.dodi-modal-title').textContent === 'Current');
  assert.equal(await page.locator('.dodi-modal-actions a').getAttribute('href'), origin + '/game-b/');
});

async function search(page, query) {
  await page.locator('.dodi-search-input').fill(query);
  await page.locator('.dodi-search-btn').click();
}

test('DODI retains the newest search when an older result page arrives late', async t => {
  const page = await start(t);
  await search(page, 'old');
  await search(page, 'new');
  await reply(page, origin + '/?s=new', article('Current'));
  await reply(page, origin + '/Current/', article('Current'));
  await page.locator('.dodi-search-summary').waitFor();
  await reply(page, origin + '/?s=old', article('Old'));
  assert.match(await page.locator('.dodi-search-summary').innerText(), /"new"/);
  assert.equal(await page.locator('.dodi-main .ea-title-text').innerText(), 'Current');
  assert.equal(await page.evaluate(() => window.__requests.some(request => request.url.endsWith('/Old/'))), false);
});

test('DODI preserves a newer cached article when an older search batch fails late', async t => {
  const page = await start(t);
  await search(page, 'old');
  await reply(page, origin + '/?s=old', article('Shared'));
  await search(page, 'new');
  await reply(page, origin + '/?s=new', article('Shared'));
  await page.waitForFunction(url => window.__requests.filter(request => request.url === url).length === 2, origin + '/Shared/');
  await page.evaluate(({ url, html }) => {
    window.__requests.filter(request => request.url === url)[1].options.onload({ status: 200, responseText: html });
  }, { url: origin + '/Shared/', html: article('Shared', '<p>Download Links</p><p><a href="https://downloads.example/game">Current mirror</a></p>') });
  await page.locator('.dodi-search-summary').waitFor();
  assert.equal(await page.locator('.dodi-main .ea-dl-actions a').count(), 1);
  await reply(page, origin + '/Shared/', '', 503);
  await page.locator('[data-tab="main"]').click();
  await page.locator('[data-tab="search"]').click();
  assert.equal(await page.locator('.dodi-main .ea-dl-actions a').count(), 1);
});

test('DODI keeps the active tab intact and renders failed search results as retryable cards', async t => {
  const page = await start(t, pinned + article('Local', '<p>Download Links</p><p><a href="https://downloads.example/local">Mirror</a></p>'));
  await search(page, 'failure');
  await reply(page, origin + '/?s=failure', article('Failed'));
  await page.locator('[data-tab="main"]').click();
  await page.locator('.dodi-main .fg-downloads summary').click();
  await reply(page, origin + '/Failed/', '', 503);
  assert.equal(await page.locator('.dodi-main .fg-downloads').getAttribute('open'), '');
  await page.locator('[data-tab="search"]').click();
  assert.equal(await page.locator('.dodi-main .ea-title-text').innerText(), 'Failed');
  assert.match(await page.locator('.dodi-search-summary').innerText(), /Showing 1 of 1/);
});

test('DODI preserves legitimate sections, warning colors, wrapped sizes, and singular update groups', async t => {
  const content = `<div class="sp-wrap"><div class="sp-head">Information</div><div class="sp-body">
    <p><strong><span>Repack Size</span></strong>: from 36.4 GB</p>
    <p style="color: red">Warning</p><img src="bad-image" onerror="window.__injected = true">
    <a href="java&#10;script:alert(1)" onclick="window.__injected = true">Unsafe</a>
    <script>window.__injected = true</script><iframe src="https://unsafe.example"></iframe>
    <h4 style="color: green">Notes</h4>
    </div></div><h3>Download Links</h3><p>elamigos Update</p>
    <p><a href="https://downloads.example/update">Update</a></p>`;
  const page = await start(t);
  await page.locator('[data-tab="exclusive"]').click();
  await page.getByRole('button', { name: 'View Release' }).first().click();
  await reply(page, origin + '/game-a/', article('Fixture', content));
  await page.locator('.dodi-modal-body .ea-card').waitFor();
  assert.equal(await page.evaluate(() => window.__injected), undefined);
  assert.match(await page.locator('.dodi-modal-body .ea-meta-row').innerText(), /36.4 GB/);
  assert.equal(await page.locator('.ea-dl-cat-title').textContent(), 'ElAmigos Updates');
  const section = page.locator('#dodi-app .fg-extra-body').first();
  assert.equal(await section.locator('script, iframe, [onclick], [onerror]').count(), 0);
  assert.equal(await section.locator('a').getAttribute('href'), null);
  assert.equal(await section.locator('.dodi-warning').evaluate(el => el.style.color), 'rgb(255, 94, 94)');
  assert.equal(await section.locator('h4').evaluate(el => el.style.fontSize), '12.5px');
});

test('DODI strips remote SVG animations that can turn sanitized links into script URLs', async t => {
  const page = await start(t);
  await page.locator('[data-tab="exclusive"]').click();
  await page.getByRole('button', { name: 'View Release' }).first().click();
  const content = `<div class="sp-wrap"><div class="sp-head">Information</div><div class="sp-body">
    <svg xmlns="http://www.w3.org/2000/svg"><a href="https://safe.example/">
      <animate attributeName="href" values="javascript:window.__svgInjected=42" dur="1ms" fill="freeze"></animate>
      <text x="0" y="20">Injected</text></a></svg><math><mtext>Remote MathML</mtext></math>
    <p>Legitimate information remains visible.</p></div></div>`;
  await reply(page, origin + '/game-a/', article('Remote', content));
  await page.locator('.dodi-modal-body .ea-card').waitFor();
  const section = page.locator('.dodi-modal-body .fg-extra-body').first();
  assert.equal(await section.locator('svg, math').count(), 0);
  assert.match(await section.textContent(), /Legitimate information remains visible/);
  assert.equal(await page.evaluate(() => window.__svgInjected), undefined);
});

test('DODI neutralizes form-based DOM clobbering in collapsible HTML', async t => {
  // A descendant control named/id'd "attributes" replaces form.attributes with itself, so a naive
  // Array.prototype.slice.call(el.attributes) walk sees [] and never inspects the form's own on*/action.
  const content = `<div class="sp-wrap"><div class="sp-head">Information</div><div class="sp-body">
    <p>Visible information</p>
    <form style="animation:dodiSpin 1s" onanimationstart="window.__pwned=(window.__pwned||[]).concat('anim')"><input name="attributes">Read me</form>
    <form action="javascript:window.__pwned=(window.__pwned||[]).concat('action')"><input name="attributes"><input type="submit" value="Show instructions"></form>
  </div></div>`;
  const page = await start(t);
  await page.locator('[data-tab="exclusive"]').click();
  await page.getByRole('button', { name: 'View Release' }).first().click();
  await reply(page, origin + '/game-a/', article('Clobber', content));
  await page.locator('.dodi-modal-body .ea-card').waitFor();
  await page.evaluate(() => { window.__pwned = []; });
  const section = page.locator('.dodi-modal-body .fg-extra-body').first();
  await page.locator('.dodi-modal-body details.fg-extra summary', { hasText: 'Information' }).click();
  // Give a real (unstripped) animation a chance to start and fire onanimationstart.
  await page.waitForTimeout(300);
  assert.deepEqual(await page.evaluate(() => window.__pwned), []);
  assert.equal(await section.locator('form, input, button[type=submit]').count(), 0);
  assert.doesNotMatch(await section.innerHTML(), /javascript:/i);
  assert.match(await section.textContent(), /Visible information/);
});

test('DODI strips full-viewport overlay styling from collapsible links', async t => {
  const content = `<div class="sp-wrap"><div class="sp-head">Information</div><div class="sp-body">
    <p style="color: red">Warning</p>
    <a href="https://evil.example/" style="position:fixed;inset:0;z-index:2147483647;opacity:0">Click hijack</a>
    <dialog open popover style="width:100vw;height:300vh;max-width:none;max-height:none;margin:0"><a href="https://evil.example/">Dialog hijack</a></dialog>
  </div></div>`;
  const page = await start(t);
  await page.locator('[data-tab="exclusive"]').click();
  await page.getByRole('button', { name: 'View Release' }).first().click();
  await reply(page, origin + '/game-a/', article('Overlay', content));
  await page.locator('.dodi-modal-body .ea-card').waitFor();
  const section = page.locator('.dodi-modal-body .fg-extra-body').first();
  const link = section.locator('a', { hasText: 'Click hijack' });
  const style = await link.evaluate(el => ({
    position: el.style.position, inset: el.style.inset, top: el.style.top, zIndex: el.style.zIndex, opacity: el.style.opacity
  }));
  assert.deepEqual(style, { position: '', inset: '', top: '', zIndex: '', opacity: '' });
  // <dialog open> is absolutely positioned by the browser stylesheet, so no inline style reveals it.
  assert.equal(await section.locator('dialog, [popover]').count(), 0);
  // The unrelated red-warning colour logic must still work.
  assert.equal(await section.locator('.dodi-warning').evaluate(el => el.style.color), 'rgb(255, 94, 94)');
});

test('DODI strips remote style blocks and non-web URL attributes from collapsible HTML', async t => {
  const page = await start(t);
  await page.locator('[data-tab="exclusive"]').click();
  await page.getByRole('button', { name: 'View Release' }).first().click();
  const content = `<div class="sp-wrap"><div class="sp-head">Information</div><div class="sp-body">
    <style>#dodi-app{display:none!important}</style>
    <p><a id="data-link" href="data:text/html,xss">Unsafe data</a></p>
    <p>Visible information</p>
  </div></div>`;
  await reply(page, origin + '/game-a/', article('Styled', content));
  await page.locator('.dodi-modal-body .ea-card').waitFor({ state: 'attached' });
  const section = page.locator('.dodi-modal-body .fg-extra-body').first();
  assert.equal(await section.locator('style').count(), 0);
  assert.equal(await section.locator('a[href^="data:"]').count(), 0);
  assert.match(await section.textContent(), /Visible information/);
  assert.notEqual(await page.locator('#dodi-app').evaluate(el => getComputedStyle(el).display), 'none');
});

test('DODI search timeout is reported instead of an empty result list', async t => {
  const page = await start(t, pinned, { clock: true });
  await page.locator('.dodi-search-input').fill('query');
  await page.locator('.dodi-search-btn').click();
  await page.clock.fastForward(30_001);
  const text = await page.locator('.dodi-main').innerText();
  assert.doesNotMatch(text, /No articles found/);
  assert.match(text, /timed out|failed/i);
  assert.equal(await page.getByRole('button', { name: 'Retry', exact: true }).count(), 1);
});

test('DODI close control has an accessible name', async t => {
  const page = await start(t);
  await page.locator('[data-tab="exclusive"]').click();
  await page.getByRole('button', { name: 'View Release' }).first().click();
  await page.getByRole('button', { name: /close/i }).click();
  assert.equal(await page.locator('.dodi-modal').evaluate(el => el.hidden), true);
});

test('userscript metadata names the project URLs', () => {
  assert.match(script, /@homepage\s+https:\/\/github\.com\/alfablac\/game-night/);
  assert.match(script, /@homepageURL\s+https:\/\/github\.com\/alfablac\/game-night/);
  assert.match(script, /@supportURL\s+https:\/\/github\.com\/alfablac\/game-night\/issues/);
});

test('source contains no stray control characters', () => {
  // Only \n (and \t/\r, if the file ever grows them) are legitimate control characters;
  // anything else (e.g. a literal NUL slipped into a regex) is a bug, not intentional content.
  // eslint-disable-next-line no-control-regex
  assert.doesNotMatch(script, /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/);
});
