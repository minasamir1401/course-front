// Normalize question text to a comparable signature (strip HTML, collapse whitespace).
function normalizeQuestionText(text: unknown): string {
  if (!text) return '';
  return String(text)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Match client questions to their server counterparts so newly persisted IDs
// propagate back to the editor state. Priority:
//   1. Exact ID match (question already has a server ID)
//   2. Normalized text match (same question, ID not yet assigned on client)
//   3. Same-index fallback (slides / attachments without meaningful text)
export function syncClientItemsWithServerIds(clientItems: any, serverItems: any) {
  const localItems = Array.isArray(clientItems) ? clientItems : [];
  const persistedItems = Array.isArray(serverItems) ? serverItems : [];
  const usedServerIndices = new Set<number>();

  return localItems.map((item: any, index: number) => {
    // 1. Exact ID match – item already carries a real database ID.
    if (item?.id) {
      const byId = persistedItems.findIndex((s: any, si: number) => s?.id === item.id && !usedServerIndices.has(si));
      if (byId !== -1) {
        usedServerIndices.add(byId);
        return { ...item, id: persistedItems[byId].id };
      }
    }

    // 2. Normalized text match – catches items whose IDs were not yet echoed back.
    const localText = normalizeQuestionText(item?.text || item?.content || item?.title);
    if (localText.length >= 3) {
      const byText = persistedItems.findIndex((s: any, si: number) => {
        if (usedServerIndices.has(si)) return false;
        const serverText = normalizeQuestionText(s?.text || s?.content || s?.title);
        return serverText === localText;
      });
      if (byText !== -1) {
        usedServerIndices.add(byText);
        return { ...item, id: persistedItems[byText].id };
      }
    }

    // 3. Index fallback (e.g. slides without text, attachments).
    if (index < persistedItems.length && !usedServerIndices.has(index)) {
      usedServerIndices.add(index);
      return { ...item, id: persistedItems[index].id };
    }

    return item;
  });
}

export function syncClientSubExamsWithServerIds(clientSubExams: any, serverSubExams: any) {
  const localSubExams = Array.isArray(clientSubExams) ? clientSubExams : [];
  const persistedSubExams = Array.isArray(serverSubExams) ? serverSubExams : [];

  return localSubExams.map((localSub: any, index: number) => {
    const serverSub =
      persistedSubExams.find((s: any) => s.id && localSub.id && s.id === localSub.id) ||
      persistedSubExams.find(
        (s: any) =>
          s.title &&
          localSub.title &&
          String(s.title).trim().toLowerCase() === String(localSub.title).trim().toLowerCase(),
      ) ||
      persistedSubExams[index];

    if (!serverSub) return localSub;

    return {
      ...localSub,
      id: serverSub.id || localSub.id,
      questions: syncClientItemsWithServerIds(localSub.questions, serverSub.questions),
    };
  });
}
