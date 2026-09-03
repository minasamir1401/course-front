type StorageLike = {
  getItem(key: string): string | null;
};

export function getExamSessionToken(storage: StorageLike, options?: { preferAdmin?: boolean }) {
  const preferAdmin = options?.preferAdmin ?? false;

  if (preferAdmin) {
    return storage.getItem("super_admin_token")
      || storage.getItem("school_admin_token")
      || storage.getItem("lms_token");
  }

  return storage.getItem("lms_token")
    || storage.getItem("school_admin_token")
    || storage.getItem("super_admin_token");
}
