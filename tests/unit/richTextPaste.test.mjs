import test from "node:test";
import assert from "node:assert/strict";

import {
  convertPlainTextToHtml,
  shouldPreferPlainTextPaste,
} from "../../src/lib/richTextPaste.ts";

test("large clipboard payloads prefer plain text fallback", () => {
  const plainText = `Line 1\n${"A".repeat(9000)}`;
  const html = `<div>${plainText}</div>`;

  assert.equal(shouldPreferPlainTextPaste(html, plainText), true);
});

test("small formatted clipboard payloads keep html paste", () => {
  const plainText = "Important text";
  const html = "<p><strong>Important</strong> text</p>";

  assert.equal(shouldPreferPlainTextPaste(html, plainText), false);
});

test("plain text fallback escapes markup and preserves line breaks", () => {
  const html = convertPlainTextToHtml("<b>unsafe</b>\nsecond line");

  assert.equal(html, "&lt;b&gt;unsafe&lt;/b&gt;<br>second line");
});
