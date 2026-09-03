import assert from "node:assert/strict";
import test from "node:test";

import { buildCourseLessonSummary } from "../src/lib/courseLessonSummary.ts";

test("buildCourseLessonSummary keeps list metadata without parsing heavy lesson payloads", () => {
  const summary = buildCourseLessonSummary({
    id: "lesson-1",
    title: "Exponents",
    slides: '[{"id":"slide-1"},{"id":"slide-2"}]',
    questions: '[{"text":"large question payload"}]',
    assignments: '[{"text":"large assignment payload"}]',
    attachments: '[{"url":"https://example.com/file.pdf"}]',
    isVisible: true,
    publishDate: "2026-07-05T09:00:00.000Z",
  });

  assert.equal(summary.id, "lesson-1");
  assert.equal(summary.slidesCount, 2);
  assert.equal((summary as any).questions, undefined);
  assert.equal((summary as any).assignments, undefined);
  assert.equal((summary as any).attachments, undefined);
  assert.equal((summary as any).slides, undefined);
});
