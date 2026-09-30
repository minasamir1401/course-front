// A persisted ID is a UUID/CUID - long strings from the server (length > 20).
// Short strings (timestamps, numeric strings) are treated as transient.
export const isPersistedId = (id: unknown): id is string => typeof id === 'string' && id.length > 20;

// Normalize question text to a comparable signature (strip HTML, collapse whitespace).
export function normalizeQuestionText(text: unknown): string {
  if (!text) return '';
  return String(text)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/[−–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/^(question|سؤال|q)\s*\d+(\s*\([^)]*\))?[:.\s-]*/i, '')
    .trim();
}

// Normalize question options to a comparable sorted string.
export function normalizeQuestionOptions(options: unknown): string {
  if (!options) return '';
  if (Array.isArray(options)) {
    return options
      .map((opt) => {
        if (typeof opt === 'object' && opt !== null) {
          return normalizeQuestionText(opt.text || opt.title || opt.content || '');
        }
        return normalizeQuestionText(opt);
      })
      .filter(Boolean)
      .sort()
      .join('|');
  }
  return normalizeQuestionText(options);
}

// Match client questions to their server counterparts so newly persisted IDs
// propagate back to the editor state. Priority:
//   Stage 1: Exact ID match across all items first (server-persisted IDs).
//   Stage 2: Text + options match for remaining items (or normalized text if options empty).
//   Stage 3: Same-index fallback — STRICTLY blocked for any item that has meaningful
//            text, options, media, or any ID, preventing removed or transient items
//            from taking the server ID of a saved question.
export function syncClientItemsWithServerIds(clientItems: any, serverItems: any) {
  const localItems = Array.isArray(clientItems) ? clientItems : [];
  const persistedItems = Array.isArray(serverItems) ? serverItems : [];
  const usedServerIndices = new Set<number>();
  const result: any[] = new Array(localItems.length);

  // Stage 1: Exact ID match across all items first.
  for (let i = 0; i < localItems.length; i++) {
    const item = localItems[i];
    if (isPersistedId(item?.id)) {
      const byId = persistedItems.findIndex(
        (s: any, si: number) => isPersistedId(s?.id) && s.id === item.id && !usedServerIndices.has(si),
      );
      if (byId !== -1) {
        usedServerIndices.add(byId);
        result[i] = { ...item, id: persistedItems[byId].id };
      }
    }
  }

  const getItemDetails = (item: any) => {
    const text = normalizeQuestionText(item?.text || item?.content || item?.title);
    const options = normalizeQuestionOptions(item?.options);
    const hasMedia = Boolean(
      (item?.imageUrl && String(item.imageUrl).trim()) ||
      (item?.videoUrl && String(item.videoUrl).trim())
    );
    const hasId = item?.id !== undefined && item?.id !== null && String(item.id).trim() !== '';
    return { text, options, hasMedia, hasId };
  };

  // Stage 2: Match by text + options for remaining items.
  for (let i = 0; i < localItems.length; i++) {
    if (result[i]) continue;
    const item = localItems[i];
    // Skip items with persisted IDs that failed Stage 1 (server no longer has this ID).
    if (isPersistedId(item?.id)) continue;

    const { text: localText, options: localOptions } = getItemDetails(item);
    if (localText.length >= 2) {
      // 2a. Match on both text and options if options exist.
      let matchIdx = -1;
      if (localOptions) {
        matchIdx = persistedItems.findIndex((s: any, si: number) => {
          if (usedServerIndices.has(si)) return false;
          const { text: sText, options: sOptions } = getItemDetails(s);
          return sText === localText && sOptions === localOptions;
        });
      }

      // 2b. If not matched, match by normalized text alone.
      if (matchIdx === -1) {
        matchIdx = persistedItems.findIndex((s: any, si: number) => {
          if (usedServerIndices.has(si)) return false;
          const { text: sText } = getItemDetails(s);
          return sText === localText;
        });
      }

      if (matchIdx !== -1) {
        usedServerIndices.add(matchIdx);
        result[i] = { ...item, id: persistedItems[matchIdx].id };
      }
    }
  }

  // Stage 3: Index fallback.
  // Block index fallback for ANY item that has text, options, media, or an existing ID.
  for (let i = 0; i < localItems.length; i++) {
    if (result[i]) continue;
    const item = localItems[i];

    const { text: localText, options: localOptions, hasMedia, hasId } = getItemDetails(item);

    // Any item with content or an identity must never receive an arbitrary ID via index.
    if (hasId || localText.length > 0 || localOptions.length > 0 || hasMedia) {
      result[i] = item;
      continue;
    }

    // Only completely empty/untyped items can take an unallocated server item at the same index,
    // provided the server item is also empty/untyped.
    if (i < persistedItems.length && !usedServerIndices.has(i)) {
      const serverItem = persistedItems[i];
      const { text: serverText, options: serverOptions, hasMedia: sMedia } = getItemDetails(serverItem);
      if (!serverText && !serverOptions && !sMedia) {
        usedServerIndices.add(i);
        result[i] = { ...item, id: serverItem.id };
        continue;
      }
    }

    result[i] = item;
  }

  return result;
}

export function syncClientSubExamsWithServerIds(clientSubExams: any, serverSubExams: any) {
  const localSubExams = Array.isArray(clientSubExams) ? clientSubExams : [];
  const persistedSubExams = Array.isArray(serverSubExams) ? serverSubExams : [];

  return localSubExams.map((localSub: any, index: number) => {
    const serverSub =
      persistedSubExams.find((s: any) => isPersistedId(s?.id) && isPersistedId(localSub?.id) && s.id === localSub.id) ||
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
