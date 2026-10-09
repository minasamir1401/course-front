import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { buildRichTextMathHtml } from '../../src/lib/richTextMath.ts';
import { decodeHtmlEntities, sanitizeHtml } from '../../src/lib/sanitize.ts';

test('KaTeX fallback renders hostile formula as text and preserves editable LaTeX', async () => {
  const formula = String.raw`x < y & "quoted" &#34; <img src=x onerror="window.mathInjected=true"> \\frac{1}{2}`;
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
  try {
    const page = await browser.newPage();
    await page.setContent(buildRichTextMathHtml(formula, 'normal', '1em', false));
    assert.equal(await page.locator('img').count(), 0);
    assert.equal(await page.locator('.math-tex').getAttribute('data-latex'), formula);
    assert.equal(await page.locator('.math-tex').textContent(), `\\( ${formula} \\)`);
    assert.equal(await page.evaluate(() => window.mathInjected), undefined);
    // Editing replaces an existing element through the same HTML path.
    await page.evaluate(html => { document.querySelector('.math-tex').outerHTML = html; }, buildRichTextMathHtml(formula, 'normal', '1em', true));
    assert.equal(await page.locator('.math-tex').getAttribute('data-display'), 'true');
    assert.equal(await page.locator('img').count(), 0);
  } finally {
    await browser.close();
  }
});

test('successful KaTeX HTML is preserved while attribute entities are escaped once', () => {
  const html = buildRichTextMathHtml('x &quot; < y', 'normal', '1em', false, '<span class="katex">rendered</span>');
  assert.match(html, /data-latex="x &amp;quot; &lt; y"/);
  assert.match(html, /<span class="katex">rendered<\/span>/);
});

test('display sanitization preserves escaped formula text while supporting legacy encoded HTML', () => {
  const html = buildRichTextMathHtml('x < y & "z"', 'normal', '1em', false);
  assert.equal(decodeHtmlEntities(html), html);
  assert.equal(sanitizeHtml(html), html);
  assert.equal(decodeHtmlEntities('&lt;p&gt;Legacy&lt;/p&gt;'), '<p>Legacy</p>');
});
