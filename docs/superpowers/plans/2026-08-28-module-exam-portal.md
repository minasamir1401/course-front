# Module Exam Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline execution selected by the user). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep module settings separate from exam and question management in both admin portals.

**Architecture:** A shared pure helper will describe the tabs allowed for each editor state. The four existing module modal components will consume that helper, while the existing module portal remains the place that creates and lists child exams and the child-exam screen remains the place that edits questions.

**Tech Stack:** Next.js 16, React 19, TypeScript, Node test runner.

**Spec:** `D:\mina\docs\superpowers\specs\2026-08-23-exam-workflow-design.md`

## Global Constraints

- Preserve existing rich-text-editor changes in the worktree.
- Keep Super Admin and School Admin workflows behaviorally aligned.
- Run a failing test before production code and verify the focused tests after each change.

---

### Task 1: Shared Module Editor Tab Policy

**Files:**
- Create: `src/lib/moduleEditorTabs.ts`
- Modify: `tests/module-editor-tabs.test.ts`

**Interfaces:**
- Produces: `getModuleEditorTabs({ moduleMode, hasActiveSubExam, language })` returning tab identifiers and localized labels.

- [ ] **Step 1: Write the failing test**

```ts
assert.deepEqual(
  getModuleEditorTabs({ moduleMode: true, hasActiveSubExam: false, language: 'ar' }).map((tab) => tab.id),
  ['info', 'scheduling'],
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types tests/module-editor-tabs.test.ts`

Expected: FAIL because `moduleEditorTabs.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
export function getModuleEditorTabs({ moduleMode, hasActiveSubExam, language }) {
  if (moduleMode) return moduleTabs(language);
  if (hasActiveSubExam) return subExamTabs(language);
  return assessmentTabs(language);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types tests/module-editor-tabs.test.ts`

Expected: PASS.

### Task 2: Apply The Policy To Every Admin Modal

**Files:**
- Modify: `src/app/super-admin/exams/new/components/ModuleModal.tsx`
- Modify: `src/app/school-admin/exams/new/components/ModuleModal.tsx`
- Modify: `src/app/super-admin/exams/edit/[id]/components/ModuleModal.tsx`
- Modify: `src/app/school-admin/exams/edit/[id]/components/ModuleModal.tsx`

**Interfaces:**
- Consumes: `getModuleEditorTabs` from Task 1.
- Produces: identical tab behavior across creation and editing for both admin roles.

- [ ] **Step 1: Replace local tab branching with the shared helper**
- [ ] **Step 2: Run focused policy tests**

Run: `node --experimental-strip-types tests/module-editor-tabs.test.ts`

Expected: PASS.

### Task 3: Verify The Existing Module Portal Flow

**Files:**
- Test: `tests/module-creation-workflow.test.ts`
- Test: `tests/exam-module-view.test.ts`

- [ ] **Step 1: Run creation redirect and portal route tests**

Run: `node --experimental-strip-types tests/module-creation-workflow.test.ts; node --experimental-strip-types tests/exam-module-view.test.ts`

Expected: PASS for both Super Admin and School Admin routes.

- [ ] **Step 2: Run lint for the changed source**

Run: `npx eslint src/lib/moduleEditorTabs.ts src/app/super-admin/exams/new/components/ModuleModal.tsx src/app/school-admin/exams/new/components/ModuleModal.tsx src/app/super-admin/exams/edit/[id]/components/ModuleModal.tsx src/app/school-admin/exams/edit/[id]/components/ModuleModal.tsx`

Expected: exit code 0.
