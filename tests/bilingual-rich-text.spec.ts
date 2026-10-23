import { test, expect } from '@playwright/test';
import { syncRichTextFormatting, updateBilingualRichText } from '../src/lib/bilingualRichText';

test('shared formatting keeps translated wording, language-specific media and undo direction', async ({ page }) => {
  await page.goto('about:blank');
  await page.addScriptTag({ content: syncRichTextFormatting.toString() + '\n' + updateBilingualRichText.toString() });
  const result = await page.evaluate(() => {
    const sync = (window as any).syncRichTextFormatting;
    const before = '<p>English prompt</p>';
    const after = '<h2 style="text-align:center"><font color="#2563eb"><b>English prompt</b></font></h2>';
    const arabic = '<p>النص العربي<img src="/arabic-only.webp" data-align="right"></p>';
    const formatted = sync(before, after, arabic);
    const undo = sync(after, before, formatted);
    const unrelated = sync(before, '<p>Edited English wording</p>', arabic);
    const draft = (window as any).updateBilingualRichText({ hint: '', hintEn: '' }, 'hint', 'English hint', 'en');
    return { formatted, undo, unrelated, draft };
  });
  expect(result.formatted).toContain('<h2 style="text-align:center">');
  expect(result.formatted).toContain('<b>النص العربي');
  expect(result.formatted).toContain('src="/arabic-only.webp"');
  expect(result.formatted).not.toContain('English prompt');
  expect(result.undo).not.toContain('<h2');
  expect(result.undo).toContain('النص العربي');
  expect(result.unrelated).toBe('<p>النص العربي<img src="/arabic-only.webp" data-align="right"></p>');
  expect(result.draft).toEqual({ hint: '', hintEn: 'English hint' });
});
