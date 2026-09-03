import test from "node:test";
import assert from "node:assert/strict";

import { buildRichTextImageHtml, getRichTextImageStyles } from "../../src/lib/richTextImage.ts";

test("right-aligned rich text images avoid float-based layout", () => {
  const html = buildRichTextImageHtml("/uploads/example.webp", "75", "right");

  assert.match(html, /data-align="right"/);
  assert.doesNotMatch(html, /float:/);
  assert.match(html, /margin-left: auto;/);
});

test("center-aligned rich text image styles use auto margins", () => {
  const styles = getRichTextImageStyles("center", "80");

  assert.equal(styles.display, "block");
  assert.equal(styles.marginLeft, "auto");
  assert.equal(styles.marginRight, "auto");
});
