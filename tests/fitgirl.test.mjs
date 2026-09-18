import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright';

const source = await readFile(new URL('../fitgirl.user.js', import.meta.url), 'utf8');
const origin = 'https://fitgirl-repacks.site';
const image = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60"><rect width="100" height="60" fill="blue"/></svg>';
const article = `<article><h2 class="entry-title">Test game</h2><div class="entry-content">
  <p><img class="alignleft" src='${image}' alt="Poster">Game summary</p>
  <h3>Screenshots</h3><p>
    <a id="linked-shot" href="https://images.example/first.png" target="_blank"><img src='${image}' alt="First screenshot"></a>
    <img id="unlinked-shot" src='${image}' alt="Second screenshot">
  </p><h3>Repack Features</h3><ul><li>Feature one</li><li>Feature two</li></ul>
</div></article>`;

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function openPage(t, content = article, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, ...options });
  t.after(() => context.close());
  const page = await context.newPage();
  page.setDefaultTimeout(3000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, [], 'userscript raised an uncaught error'));
  await context.route('**/*', route => {
    const url = route.request().url();
    if (url === `${origin}/`) {
      return route.fulfill({ contentType: 'text/html', body: `<html><head></head><body>
        <div class="site"><header id="masthead" class="site-header"></header>
        <main>${content}</main><button id="outside">Outside gallery</button></div>
      </body></html>` });
    }
    return route.abort();
  });
  await page.addInitScript(`
    window.GM_addStyle = css => {
      const append = () => {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.append(style);
      };
      if (document.head) append();
      else document.addEventListener('DOMContentLoaded', append, { once: true });
    };
    window.__copied = [];
    window.GM_setClipboard = text => window.__copied.push(text);
  ` + source);
  await page.goto(`${origin}/`);
  if (content.includes('<article')) await page.waitForSelector('article[data-fg-ui="2"]');
  return page;
}

async function openGallery(page) {
  await page.locator('.fg-tab-screenshots').click();
  await page.locator('#linked-shot').focus();
  await page.locator('#linked-shot img').click();
  assert.equal(await page.locator('.fg-modal').count(), 1);
}

test('linked screenshots open the gallery with Enter without opening an external tab', async t => {
  const page = await openPage(t);
  await page.locator('.fg-tab-screenshots').click();
  await page.locator('#linked-shot').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.fg-modal').count(), 1);
  assert.equal(page.context().pages().length, 1);
});

test('WordPress mobile list view keeps transformed titles, content, and controls visible', async t => {
  // Twenty Fourteen hides post bodies below 400px. The userscript moves its title there.
  const themeRule = '<style>@media screen and (max-width: 400px) {'
    + '.list-view .site-content .type-post .entry-content { display: none; }}</style>';
  const content = themeRule + '<div class="list-view"><div class="site-content">'
    + article.replace('<article>', '<article class="type-post"><div class="entry-meta">18 September 2026</div>')
      .replace('<div class="entry-content">', '<div class="entry-content"><h3>#123 Test game</h3>') + '</div></div>';
  const page = await openPage(t, content, { viewport: { width: 390, height: 844 } });
  const entry = page.locator('article .entry-content');
  assert.equal(await entry.evaluate(element => getComputedStyle(element).display), 'block');
  assert.equal(await page.locator('.fg-post-title').isVisible(), true);
  assert.equal(await page.locator('.fg-tab-screenshots').isVisible(), true);
  await page.locator('.fg-tab-screenshots').click();
  await page.locator('#linked-shot img').click();
  assert.equal(await page.locator('.fg-modal').count(), 1);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1366, height: 900 });
  assert.equal(await entry.evaluate(element => getComputedStyle(element).display), 'block');
  assert.equal(await page.locator('.fg-post-title').isVisible(), true);
});

for (const width of [320, 390]) {
  test(`mobile tooltips and the accessible search link stay within ${width}px`, async t => {
    const content = '<style>.screen-reader-text { position:absolute; clip:rect(1px,1px,1px,1px); }</style>'
      + '<div class="header-main"><div class="search-toggle"><a href="#search-container" class="screen-reader-text">Search</a></div></div>'
      + '<article><div class="entry-content"><h3>Repack Features</h3><ul><li>'
      + 'Based on scene FINAL.FANTASY.TACTICS.The.Ivalice.Chronicles-TENOKE ISO release: '
      + 'tenoke-final.fantasy.tactics.the.ivalice.chronicles.iso (11,059,023,872 bytes)</li></ul>'
      + '<p style="text-align:right">12,345,678,901 bytes</p></div></article>';
    const page = await openPage(t, content, { viewport: { width, height: 844 } });
    const widthFits = () => page.evaluate(() => document.body.scrollWidth <= innerWidth);
    assert.equal(await widthFits(), true, 'inactive tooltips must not enlarge the page');
    for (const selector of ['.fg-source', '.fg-release', '.fg-size']) {
      await page.locator(selector).first().focus();
      assert.equal(await widthFits(), true, selector + ' tooltip must fit while focused');
    }
    const search = page.locator('.search-toggle .screen-reader-text');
    await search.focus();
    assert.equal(await search.evaluate(element => element === document.activeElement), true);
    assert.equal(await search.evaluate(element => element.getBoundingClientRect().right <= innerWidth), true);
    assert.match(await page.locator('.entry-content').textContent(), /tenoke-final\.fantasy\.tactics\.the\.ivalice\.chronicles\.iso/);
  });
}

test('unlinked screenshots are focusable and support Enter and Space', async t => {
  const page = await openPage(t);
  await page.locator('.fg-tab-screenshots').click();
  const shot = page.locator('#unlinked-shot');
  assert.equal(await shot.getAttribute('tabindex'), '0');
  assert.equal(await shot.getAttribute('role'), 'button');
  for (const key of ['Enter', 'Space']) {
    await shot.focus();
    await page.keyboard.press(key);
    assert.equal(await page.locator('.fg-modal').count(), 1);
    await page.keyboard.press('Escape');
    assert.equal(await shot.evaluate(element => element === document.activeElement), true);
  }
});

test('gallery keeps keyboard focus inside and restores it on all close paths', async t => {
  const page = await openPage(t);
  for (const close of ['Escape', 'button', 'backdrop']) {
    await openGallery(page);
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.locator('.fg-next').evaluate(element => element === document.activeElement), true);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('.fg-close').evaluate(element => element === document.activeElement), true);
    if (close === 'Escape') await page.keyboard.press('Escape');
    else if (close === 'button') await page.locator('.fg-close').click();
    else await page.locator('.fg-modal').click({ position: { x: 2, y: 2 } });
    assert.equal(await page.locator('.fg-modal').count(), 0);
    assert.equal(await page.locator('#linked-shot').evaluate(element => element === document.activeElement), true);
    await page.locator('.fg-tab-screenshots').click();
  }
});

test('gallery controls have accessible names and image navigation wraps', async t => {
  const page = await openPage(t);
  await openGallery(page);
  assert.equal(await page.getByRole('button', { name: 'Close image viewer', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Previous image', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Next image', exact: true }).count(), 1);
  const picture = page.locator('.fg-modal img');
  assert.equal(await picture.getAttribute('alt'), 'First screenshot');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await picture.getAttribute('alt'), 'Second screenshot');
  await page.keyboard.press('ArrowRight');
  assert.equal(await picture.getAttribute('src'), 'https://images.example/first.png');
});

test('modifier clicks keep linked navigation and still open unlinked screenshots', async t => {
  const page = await openPage(t);
  await page.locator('.fg-tab-screenshots').click();
  const result = await page.evaluate(() => {
    const linked = document.querySelector('#linked-shot img');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    linked.onclick(click);
    return { prevented: click.defaultPrevented, galleries: document.querySelectorAll('.fg-modal').length };
  });
  assert.deepEqual(result, { prevented: false, galleries: 0 });
  await page.locator('#unlinked-shot').click({ modifiers: ['Control'] });
  assert.equal(await page.locator('.fg-modal').count(), 1);
});

test('extra sections do not swallow screenshot panels', async t => {
  const page = await openPage(t, article.replace('<h3>Screenshots</h3>',
    '<h3>Game Updates</h3><p id="update-info">Update information</p><h3>Screenshots</h3>'));
  assert.equal(await page.locator('details.fg-extra .fg-tab-panel').count(), 0);
  assert.equal(await page.locator('details.fg-extra #update-info').count(), 1);
  await page.locator('.fg-tab-screenshots').click();
  assert.equal(await page.locator('#linked-shot').isVisible(), true);
});

test('sidebar nesting and user choices survive repeated processing and resize', async t => {
  const page = await openPage(t, `${article}
    <aside id="content-sidebar"><div class="widget"><h2 class="widget-title">Most Popular Repacks</h2><p>Popular game</p></div></aside>
    <div id="supplementary"><div id="footer-sidebar">More widgets</div></div>`);
  const sidebar = page.locator('details.fg-sidebar');
  const popular = page.locator('details.fg-popular-repacks');
  assert.equal(await sidebar.evaluate(element => element.open), true);
  assert.equal(await popular.evaluate(element => element.open), true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => !document.querySelector('details.fg-sidebar').open);
  await sidebar.locator(':scope > summary').click();
  await popular.locator('summary').click();
  await page.setViewportSize({ width: 420, height: 844 });
  assert.equal(await popular.evaluate(element => element.open), true);
  await page.evaluate(() => {
    const icon = document.createElement('i');
    icon.className = 'fa fa-comment';
    document.body.append(icon);
  });
  await page.waitForFunction(() => !document.querySelector('i.fa.fa-comment'));
  assert.equal(await sidebar.locator('#supplementary').count(), 1);
  assert.equal(await sidebar.evaluate(element => element.open), true);
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await sidebar.evaluate(element => element.open), true);
  assert.equal(await popular.evaluate(element => element.open), true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => !document.querySelector('details.fg-sidebar').open);
  assert.equal(await popular.evaluate(element => element.open), false);
});

test('pagination expands numbers while preserving previous links and search parameters', async t => {
  const page = await openPage(t, `<nav class="paging-navigation"><div class="pagination">
    <a class="prev page-numbers" href="${origin}/?s=game">Previous</a>
    <a class="page-numbers" href="${origin}/?s=game">1</a>
    <span class="page-numbers current">2</span>
    <a class="page-numbers" href="${origin}/page/3/?s=game">3</a>
    <span class="page-numbers dots">…</span>
    <a class="page-numbers" href="${origin}/page/25/?s=game">25</a>
    <a class="next page-numbers" href="${origin}/page/3/?s=game">Next</a>
    </div></nav>`);
  const navigation = page.locator('.paging-navigation').first();
  assert.equal(await navigation.locator('.prev').getAttribute('href'), `${origin}/?s=game`);
  assert.equal(await navigation.locator('[data-page="10"]').getAttribute('href'), `${origin}/page/10/?s=game`);
  assert.equal(await navigation.locator('[aria-current="page"]').textContent(), '2');
  assert.equal(await page.locator('.paging-navigation').nth(1).innerHTML(), await navigation.innerHTML());
});

test('formatting preserves the text before release sources', async t => {
  const page = await openPage(t, '<article><div class="entry-content"><p>Optional content. Based on Test.Game-GROUP ISO release: test.iso (1,024 bytes)</p></div></article>');
  assert.match(await page.locator('.entry-content').textContent(), /^Optional content\. Based on Test.Game-GROUP/);
  assert.equal(await page.locator('.fg-source').textContent(), 'Test.Game-GROUP');
  assert.equal(await page.locator('.fg-size').textContent(), '1.00 KB');
});

test('clipboard denial falls back to GM with unique HTTP links', async t => {
  const page = await openPage(t, `<article><div class="entry-content"><ul><li>Filehoster: Example
    <details><summary>Links</summary><div data-fg-links>
      <a href="https://files.example/part1">Part one</a>
      <a href="https://files.example/part1">Duplicate</a>
      <a href="http://files.example/part2">Part two</a>
      <a href="javascript:void(0)">Not a download</a>
    </div></details></li></ul></div></article>`);
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: async () => { throw new DOMException('Permission denied', 'NotAllowedError'); } },
  }));
  await page.locator('.fg-copy').click();
  assert.deepEqual(await page.evaluate(() => window.__copied), ['https://files.example/part1\nhttp://files.example/part2']);
  assert.match(await page.locator('.fg-copy').textContent(), /Copiado/);
});

test('Tolstoy iframe receives only its scoped comment theme', async t => {
  const page = await openPage(t, '<div id="comments"></div>');
  await page.route('https://web.tolstoycomments.com/widget/test', route => route.fulfill({
    contentType: 'text/html',
    body: '<html><head></head><body><div class="app"><textarea placeholder="Comment"></textarea><article><div class="entry-content"><h3>Screenshots</h3><p>Comment body</p></div></article></div></body></html>',
  }));
  await page.evaluate(() => {
    const frame = document.createElement('iframe');
    frame.src = 'https://web.tolstoycomments.com/widget/test';
    document.querySelector('#comments').append(frame);
  });
  const widget = page.frameLocator('iframe');
  await widget.locator('textarea').waitFor();
  assert.equal(await widget.locator('body').evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(23, 31, 40)');
  assert.equal(await widget.locator('textarea').evaluate(element => getComputedStyle(element).minHeight), '52px');
  assert.equal(await widget.locator('.fg-tabs').count(), 0);
  assert.equal(await widget.locator('article').getAttribute('data-fg-ui'), null);
});
