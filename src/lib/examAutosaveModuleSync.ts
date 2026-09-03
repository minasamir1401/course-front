export function syncClientItemsWithServerIds(clientItems: any, serverItems: any) {
  const localItems = Array.isArray(clientItems) ? clientItems : [];
  const persistedItems = Array.isArray(serverItems) ? serverItems : [];

  return localItems.map((item: any, index: number) => {
    const serverItem = persistedItems[index];
    return serverItem ? { ...item, id: serverItem.id } : item;
  });
}
