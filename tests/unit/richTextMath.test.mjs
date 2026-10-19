import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { buildRichTextMathHtml, isolateRichTextMath, protectRenderedMath, isolateEditorMath, isolatePlainTextMath, escapeMathHtml } from '../../src/lib/richTextMath.ts';
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

test('Arabic editor isolates both new and legacy formulas; superscripts stay above and to the right', async () => {
  const html = isolateRichTextMath('<p dir="rtl">أوجد قيمة x<sup>2</sup> - y<sup>2</sup> الآن</p>');
  assert.equal(isolateRichTextMath(html), html);
  assert.match(html, /dir="ltr"/);
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
  try {
    const page = await browser.newPage();
    await page.setContent('<style>body{font-size:32px}</style>' + html);
    assert.equal(await page.locator('.math-tex').evaluate(el => getComputedStyle(el).direction), 'ltr');
    const positions = await page.locator('.math-tex').evaluate(el => {
      const range = document.createRange(); range.setStart(el.firstChild, 0); range.setEnd(el.firstChild, 1);
      const x = range.getBoundingClientRect(), exponent = el.querySelector('sup').getBoundingClientRect();
      return { x: x.x, y: x.y, exponentX: exponent.x, exponentY: exponent.y };
    });
    assert.ok(positions.exponentX > positions.x); assert.ok(positions.exponentY < positions.y);
    assert.equal(await page.locator('p').textContent(), 'أوجد قيمة x2 - y2 الآن');
  } finally { await browser.close(); }
});
test('rendered tree extraction preserves nested KaTeX, MathML and its data-latex verbatim',()=>{
 const original='<span class="math-tex" data-latex="x &lt; y"><span class="katex"><span>x</span><math><mi>x</mi></math></span></span>';
 const masked=protectRenderedMath('قبل '+original+' بعد');assert.deepEqual(masked.blocks,[original]);assert.equal(masked.html,'قبل \x00RENDERED0\x00 بعد');
 const normalized=isolateRichTextMath(original);assert.equal(isolateRichTextMath(normalized),normalized);
});

test('Arabic prose isolates plain equations and intervals without changing characters or attributes', async () => {
  const examples = ['(-2,0)', '(3,5)', 'a(b + c) = ab + ac', '4(3 + 7) = 4(3) + 4(7)', 'x ≤ -2', '(-٢,٠)', '≤', '≥', 'x ∈ (-∞,2]', 'x² - y²'];
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
  try {
    const page = await browser.newPage();
    for (const expression of examples) {
      const raw = `<p dir="rtl" data-formula="${expression}">الدالة ثابتة على الفترة ${expression} ثم تتغير</p>`;
      const html = isolateRichTextMath(raw);
      assert.equal(isolateRichTextMath(html), html);
      await page.setContent(html);
      assert.equal(await page.locator('p').textContent(), `الدالة ثابتة على الفترة ${expression} ثم تتغير`);
      assert.equal(await page.locator('p').getAttribute('data-formula'), expression);
      assert.equal(await page.locator('.math-ltr').textContent(), expression);
      assert.equal(await page.locator('p').evaluate(el => getComputedStyle(el).direction), 'rtl');
      assert.equal(await page.locator('.math-ltr').evaluate(el => getComputedStyle(el).direction), 'ltr');
      if (expression === '(-2,0)') {
        const positions = await page.locator('.math-ltr').evaluate(el => Array.from(el.textContent).map((_, i) => {
          const range = document.createRange(); range.setStart(el.firstChild, i); range.setEnd(el.firstChild, i + 1);
          return range.getBoundingClientRect().x;
        }));
        assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
      }
    }
    assert.doesNotMatch(isolateRichTextMath('<p>نص عربي عادي 20 سؤال</p>'), /math-ltr/);
    assert.equal(isolateRichTextMath(String.raw`<p>أوجد \(x=\frac{1}{2}\)</p>`), String.raw`<p>أوجد \(x=\frac{1}{2}\)</p>`);
  } finally { await browser.close(); }
});

test('live editor isolation preserves the caret, Arabic text, and canonical math nodes', async () => {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe' });
  try {
    const page = await browser.newPage();
    await page.setContent('<div id="editor" contenteditable="true" dir="rtl">الفترة (-2,0) ثم تتغير</div>');
    await page.addScriptTag({ content: `${escapeMathHtml.toString()}\n${isolatePlainTextMath.toString()}\n${isolateEditorMath.toString()}` });
    const result = await page.evaluate(() => {
      const editor = document.getElementById('editor');
      const selection = getSelection();
      selection.setBaseAndExtent(editor.firstChild, 11, editor.firstChild, 11);
      isolateEditorMath(editor);
      const range = document.createRange(); range.selectNodeContents(editor); range.setEnd(selection.anchorNode, selection.anchorOffset);
      const caret = range.toString().length;
      const html = editor.innerHTML;
      isolateEditorMath(editor);
      return { caret, stable: editor.innerHTML === html, text: editor.textContent, direction: getComputedStyle(editor.querySelector('.math-ltr')).direction };
    });
    assert.deepEqual(result, { caret: 11, stable: true, text: 'الفترة (-2,0) ثم تتغير', direction: 'ltr' });
    await page.evaluate(() => {
      document.querySelector('.math-ltr').append(' والنص العربي');
      isolateEditorMath(document.getElementById('editor'));
    });
    assert.equal(await page.locator('.math-ltr').textContent(), '(-2,0)');
    assert.match(await page.locator('#editor').textContent(), /والنص العربي/);
  } finally { await browser.close(); }
});
