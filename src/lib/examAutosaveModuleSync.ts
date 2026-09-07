export function syncClientItemsWithServerIds(clientItems: any, serverItems: any) {
  const localItems = Array.isArray(clientItems) ? clientItems : [];
  const persistedItems = Array.isArray(serverItems) ? serverItems : [];

  return localItems.map((item: any, index: number) => {
    const serverItem = persistedItems[index];
    return serverItem ? { ...item, id: serverItem.id } : item;
  });
}

export function syncClientSubExamsWithServerIds(clientSubExams: any, serverSubExams: any) {
  const localSubExams = Array.isArray(clientSubExams) ? clientSubExams : [];
  const persistedSubExams = Array.isArray(serverSubExams) ? serverSubExams : [];

  return localSubExams.map((localSub: any, index: number) => {
    const serverSub = persistedSubExams.find((s: any) => s.id && localSub.id && s.id === localSub.id)
      || persistedSubExams.find((s: any) => s.title && localSub.title && String(s.title).trim().toLowerCase() === String(localSub.title).trim().toLowerCase())
      || persistedSubExams[index];

    if (!serverSub) return localSub;

    return {
      ...localSub,
      id: serverSub.id || localSub.id,
      questions: syncClientItemsWithServerIds(localSub.questions, serverSub.questions),
    };
  });
}
