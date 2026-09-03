# Module Portal Legacy Questions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show legacy direct module questions in both admin module portals and stop legacy edit links from opening the module dialog automatically.

**Architecture:** Keep the two admin pages consistent through shared utilities. The module portal will derive direct questions from the hydrated module and include them in the visible total; the legacy `editModuleId` route will remain a full-editor route without auto-opening the modal.

**Tech Stack:** Next.js, React, TypeScript, Node test runner.

**Spec:** `D:/New Text Document.txt`

## Global Constraints

- Apply the same behavior to Super Admin and School Admin.
- Preserve child-exam question behavior.
- Add regression tests before implementation.

---

### Task 1: Preserve legacy module questions in the portal

**Files:**
- Modify: `src/components/exams/ExamModulePortal.tsx`
- Test: `tests/exam-module-view.test.ts`

**Interfaces:**
- Consumes: `examModule.questions` hydrated by `attachQuestionsToModules`.
- Produces: a question total and visible legacy-question section in the portal.

- [ ] **Step 1: Write the failing test**

Add a module fixture containing two direct questions and assert the shared count helper returns `2` when no child exams exist.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types tests/exam-module-view.test.ts`

- [ ] **Step 3: Write minimal implementation**

Create a shared helper that returns the direct module questions and use it in `ExamModulePortal` for its count and list.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types tests/exam-module-view.test.ts`

### Task 2: Disable automatic module-dialog opening from legacy URLs

**Files:**
- Modify: `src/app/super-admin/exams/edit/[id]/page.tsx`
- Modify: `src/app/school-admin/exams/edit/[id]/page.tsx`
- Modify: `src/lib/examModuleView.ts`
- Test: `tests/edit-module-autopen.test.ts`
- Test: `tests/exam-module-view.test.ts`

**Interfaces:**
- Consumes: legacy `editModuleId` URLs.
- Produces: a normal full-editor page with no automatic modal opening.

- [ ] **Step 1: Write the failing tests**

Assert `resolveEditModuleAutoOpenIndex` returns `null` for `editModuleId`, and assert module settings links omit `editModuleId`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test --experimental-strip-types tests/edit-module-autopen.test.ts tests/exam-module-view.test.ts`

- [ ] **Step 3: Write minimal implementation**

Remove the automatic opening effect from both editor pages and generate a stable full-editor link for module settings.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test --experimental-strip-types tests/edit-module-autopen.test.ts tests/exam-module-view.test.ts`

### Task 3: Verify both roles

**Files:**
- Test: `tests/unit/examModuleQuestions.test.mjs`
- Test: `tests/exam-module-view.test.ts`

- [ ] **Step 1: Run targeted tests**

Run: `node --test --experimental-strip-types tests/unit/examModuleQuestions.test.mjs tests/exam-module-view.test.ts tests/edit-module-autopen.test.ts`

- [ ] **Step 2: Run TypeScript validation**

Run: `npx tsc -p tsconfig.json --noEmit`

- [ ] **Step 3: Inspect final diff**

Run: `git diff --check`
