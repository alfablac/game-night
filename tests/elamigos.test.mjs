import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright';

const source = await readFile(new URL('../elamigos.user.js', import.meta.url), 'utf8');
const indexHTML = '<h2>18.09.2026</h2><h3>Alpha + ElAmigos <a href="data/alpha.html">download</a></h3>'
    + '<h3>Beta + ElAmigos <a href="data/beta.html">download</a></h3>';
const gameHTML = title => '<h2>' + title + '</h2><h3>DOWNLOAD</h3><a href="https://example.test/directdownload/game">Download</a>';
let browser;

before(async () => {
    browser = await chromium.launch({ args: ['--host-resolver-rules=MAP * ~NOTFOUND'] });
});
after(async () => { await browser?.close(); });

function installMocks({ savedCache, blockStorage, useFetch }) {
    window.__requests = [];
    window.__errors = [];
    window.addEventListener('unhandledrejection', event => window.__errors.push(String(event.reason)));
    if (savedCache) localStorage.setItem('ea-index-v3', JSON.stringify(savedCache));
    if (blockStorage) {
        Storage.prototype.getItem = () => { throw new DOMException('Storage disabled', 'SecurityError'); };
    }
    window.GM_addStyle = css => {
        const style = document.createElement('style');
        style.textContent = css;
        document.documentElement.append(style);
    };
    window.GM_getValue = (key, fallback) => fallback;
    window.GM_registerMenuCommand = () => {};
    if (!useFetch) window.GM_xmlhttpRequest = options => { window.__requests.push(options); };
}

async function open(t, { url = 'https://elamigos.site/#/all', html = indexHTML, savedCache, blockStorage, useFetch, fetchStatus = 200, fetchBody = indexHTML, fetchHang = false } = {}) {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    t.after(() => context.close());
    await context.route('**/*', async route => {
        const request = route.request();
        if (request.isNavigationRequest() && request.url().startsWith('https://elamigos.site/')) {
            return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head></head><body>' + html + '</body></html>' });
        }
        if (useFetch && request.url().includes('ea_index_refresh=')) {
            if (fetchHang) return;
            return route.fulfill({ status: fetchStatus, contentType: 'text/html', body: fetchBody });
        }
        return route.abort();
    });
    const setup = '(' + installMocks.toString() + ')(' + JSON.stringify({ savedCache, blockStorage, useFetch }) + ');\n';
    // Userscript managers inject once the document root exists, before body parsing.
    // Keep the shipped script intact inside the same lifecycle wrapper.
    await context.addInitScript({ content: '(() => { const run = () => {\n' + setup + source
        + '\n}; if (document.documentElement) run(); else { const observer = new MutationObserver(() => {'
        + ' if (document.documentElement) { observer.disconnect(); run(); } }); observer.observe(document, { childList: true }); } })();' });
    const page = await context.newPage();
    page.setDefaultTimeout(2500);
    if (fetchHang) await page.clock.install();
    await page.goto(url);
    await page.locator('#ea-app').waitFor();
    return page;
}

async function respond(page, match, body = indexHTML, status = 200) {
    await page.waitForFunction(match => window.__requests.some(request => request.url.includes(match)), match);
    await page.evaluate(({ match, body, status }) => {
        const request = window.__requests.find(request => request.url.includes(match));
        request.onload({ status, responseText: body });
        request.settled = true;
    }, { match, body, status });
}

test('Recent selects only its own navigation tab', async t => {
    const page = await open(t, { url: 'https://elamigos.site/#/' });
    await respond(page, 'ea_index_refresh=');
    assert.deepEqual(await page.locator('.ea-tab.on').allTextContents(), ['Recent']);
});

test('archive search spans all initial letters and resolves index URLs from /data pages', async t => {
    const page = await open(t, { url: 'https://elamigos.site/data/other.html#/archive?q=beta', blockStorage: true });
    await respond(page, 'ea_index_refresh=');
    assert.deepEqual(await page.locator('.ea-row-title').allTextContents(), ['Beta']);
    assert.equal(await page.locator('.ea-row-title').getAttribute('href'), 'https://elamigos.site/data/beta.html');
});

test('nested archive headings and trailing update markers are parsed', async t => {
    const page = await open(t, { url: 'https://elamigos.site/#/archive?q=gamma' });
    await respond(page, 'ea_index_refresh=', indexHTML
        + '<div><h2>Full log of updates</h2><section><h3>Gamma + ElAmigos [Update 1] + <a href="data/gamma.html">download</a></h3></section></div>');
    assert.deepEqual(await page.locator('.ea-row-title').allTextContents(), ['Gamma']);
});

test('pending navigation shares one index request and renders the latest route', async t => {
    const page = await open(t);
    await page.locator('.ea-input').fill('beta');
    await page.locator('.ea-input').press('Enter');
    // Updating location.hash is synchronous; its hashchange handler is not.
    // Wait until the pending Archive view has subscribed to the shared request.
    await page.waitForFunction(() => document.querySelector('.ea-tab.on')?.textContent === 'A–Z archive');
    assert.equal(await page.evaluate(() => window.__requests.length), 1);
    await respond(page, 'ea_index_refresh=');
    assert.deepEqual(await page.locator('.ea-row-title').allTextContents(), ['Beta']);
    assert.deepEqual(await page.locator('.ea-tab.on').allTextContents(), ['A–Z archive']);
});

test('a malformed fresh cache is discarded before rendering', async t => {
    const page = await open(t, {
        url: 'https://elamigos.site/data/other.html#/all',
        savedCache: { savedAt: Date.now(), data: { recent: [null], archive: [], all: [null] } }
    });
    await respond(page, 'ea_index_refresh=');
    assert.deepEqual(await page.locator('.ea-row-title').allTextContents(), ['Alpha', 'Beta']);
    assert.deepEqual(await page.evaluate(() => window.__errors), []);
});

test('empty successful index responses show a retry without poisoning storage', async t => {
    const page = await open(t, { url: 'https://elamigos.site/data/other.html#/all', html: '<h2>Other game</h2>' });
    await respond(page, 'ea_index_refresh=', '<h1>Verify your browser</h1>');
    assert.match(await page.locator('.ea-main').textContent(), /Could not load the release index/);
    assert.equal(await page.evaluate(() => localStorage.getItem('ea-index-v3')), null);
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await page.waitForFunction(() => window.__requests.length === 2);
    await page.evaluate(body => window.__requests[1].onload({ status: 200, responseText: body }), indexHTML);
    assert.deepEqual(await page.locator('.ea-row-title').allTextContents(), ['Alpha', 'Beta']);
});

test('a GM timeout rejects the index request and permits retry', async t => {
    const page = await open(t, { url: 'https://elamigos.site/data/other.html#/all' });
    const timeout = await page.evaluate(() => {
        const request = window.__requests[0];
        request.ontimeout?.({ status: 0 });
        return request.timeout;
    });
    assert.ok(timeout > 0, 'GM requests must have a finite timeout');
    assert.match(await page.locator('.ea-main').textContent(), /Could not load the release index/);
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    assert.equal(await page.evaluate(() => window.__requests.length), 2);
});

test('fetch fallback rejects HTTP error pages', async t => {
    const page = await open(t, { url: 'https://elamigos.site/data/other.html#/all', useFetch: true, fetchStatus: 503 });
    await page.getByRole('button', { name: 'Try again', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('ea-index-v3')), null);
    assert.deepEqual(await page.evaluate(() => window.__errors), []);
});

test('fetch fallback times out stalled requests', async t => {
    const page = await open(t, { url: 'https://elamigos.site/data/other.html#/all', useFetch: true, fetchHang: true });
    await page.clock.fastForward(30001);
    await page.getByRole('button', { name: 'Try again', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('ea-index-v3')), null);
    assert.deepEqual(await page.evaluate(() => window.__errors), []);
});

test('download links cannot preserve executable URL schemes', async t => {
    const page = await open(t);
    await respond(page, 'ea_index_refresh=');
    await page.getByRole('link', { name: 'Alpha', exact: true }).click();
    await respond(page, '/data/alpha.html', gameHTML('Alpha') + '<a href="javascript:alert(\'filecrypt\')">Untrusted link</a>');
    assert.equal(await page.locator('.ea-modal-body a[href^="javascript:"]').count(), 0);
    assert.equal(await page.locator('.ea-modal-body a[href="https://example.test/directdownload/game"]').count(), 1);
});

test('a stale game response cannot replace the last requested game', async t => {
    const page = await open(t);
    await respond(page, 'ea_index_refresh=');
    await page.getByRole('link', { name: 'Alpha', exact: true }).click();
    await page.getByRole('link', { name: 'Beta', exact: true }).click();
    await respond(page, '/data/beta.html', gameHTML('Beta'));
    await respond(page, '/data/alpha.html', gameHTML('Alpha'));
    assert.equal(await page.locator('.ea-modal-body .ea-title').textContent(), 'Beta');
});

test('closing a modal prevents an older response from reopening it', async t => {
    const page = await open(t);
    await respond(page, 'ea_index_refresh=');
    await page.getByRole('link', { name: 'Alpha', exact: true }).click();
    await page.getByRole('link', { name: 'Beta', exact: true }).click();
    await respond(page, '/data/beta.html', gameHTML('Beta'));
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await respond(page, '/data/alpha.html', gameHTML('Alpha'));
    assert.equal(await page.locator('.ea-modal').isHidden(), true);
});

test('Escape closes game details and restores keyboard focus', async t => {
    const page = await open(t);
    await respond(page, 'ea_index_refresh=');
    const opener = page.getByRole('link', { name: 'Alpha', exact: true });
    await opener.focus();
    await opener.press('Enter');
    await respond(page, '/data/alpha.html', gameHTML('Alpha'));
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Close');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.ea-modal').isHidden(), true);
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Alpha');
});

test('keyboard Tab stays inside the game details modal', async t => {
    const page = await open(t);
    await respond(page, 'ea_index_refresh=');
    await page.getByRole('link', { name: 'Alpha', exact: true }).click();
    await respond(page, '/data/alpha.html', gameHTML('Alpha'));
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement.href), 'https://example.test/directdownload/game');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Close');
});

test('failed game requests show a closeable error without unhandled rejection', async t => {
    const page = await open(t);
    await respond(page, 'ea_index_refresh=');
    await page.getByRole('link', { name: 'Alpha', exact: true }).click();
    await respond(page, '/data/alpha.html', 'Unavailable', 503);
    assert.equal(await page.locator('.ea-modal-body').textContent(), 'Could not load Alpha');
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    assert.equal(await page.locator('.ea-modal').isHidden(), true);
    assert.deepEqual(await page.evaluate(() => window.__errors), []);
});

test('Filecrypt resolver is offered only for the exact allowed hostname', async t => {
    const page = await open(t);
    await respond(page, 'ea_index_refresh=');
    await page.getByRole('link', { name: 'Alpha', exact: true }).click();
    await respond(page, '/data/alpha.html', gameHTML('Alpha')
        + '<a href="https://filecrypt.cc.evil.test/Container/a.html">Forged host</a>'
        + '<a href="https://evil.test/?filecrypt.cc">Forged query</a>'
        + '<a href="https://filecrypt.cc/Container/a.html">Filecrypt</a>');
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Show Filecrypt' }).check();
    await page.getByRole('link', { name: 'Alpha', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Resolve Filecrypt' }).count(), 1);
});

test('Filecrypt messages check origin and frame source, and tolerate malformed rows offline', async t => {
    const page = await open(t);
    await respond(page, 'ea_index_refresh=');
    await page.getByRole('checkbox', { name: 'Show Filecrypt' }).check();
    await page.getByRole('link', { name: 'Alpha', exact: true }).click();
    await respond(page, '/data/alpha.html', gameHTML('Alpha') + '<a href="https://filecrypt.cc/Container/a.html">Filecrypt</a>');
    await page.getByRole('button', { name: 'Resolve Filecrypt' }).click();
    await page.evaluate(() => {
        const frame = document.querySelector('iframe[title="Filecrypt verification"]');
        const data = { eaFilecrypt: true, payload: { type: 'container-ready', rows: [{ filename: 'Untrusted', linkURL: 'https://filecrypt.cc/Link/a.html' }] } };
        window.dispatchEvent(new MessageEvent('message', { origin: 'https://evil.test', source: frame.contentWindow, data }));
        window.dispatchEvent(new MessageEvent('message', { origin: 'https://filecrypt.cc', source: window, data }));
    });
    assert.equal(await page.locator('iframe[title="Filecrypt link resolver"]').count(), 0);
    await page.evaluate(() => {
        const frame = document.querySelector('iframe[title="Filecrypt verification"]');
        window.dispatchEvent(new MessageEvent('message', {
            origin: 'https://filecrypt.cc', source: frame.contentWindow,
            data: { eaFilecrypt: true, payload: { type: 'container-ready', rows: [null, { filename: 'Invalid', linkURL: 'javascript:alert(1)' }] } }
        }));
    });
    await page.waitForFunction(() => document.querySelector('.ea-fc-results').value.includes('Invalid\nERROR: invalid link'));
    assert.equal(await page.locator('iframe[title="Filecrypt link resolver"]').count(), 0);
    assert.deepEqual(await page.evaluate(() => window.__errors), []);
});
