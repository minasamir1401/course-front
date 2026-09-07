"use client";

const LEGACY_QUEUE_STORAGE_KEY = "lms_offline_sync_queue";
const DATABASE_NAME = "lms-local-workspace";
const QUEUE_STORE = "pending-saves";
const DRAFT_STORE = "editor-drafts";

export interface OfflineOwner { userId: string; schoolId: string | null }
export interface PendingSave {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  enqueuedAt: string;
  attempts: number;
  owner?: OfflineOwner | null;
  label?: string;
}
export interface OfflineSyncState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
}
type Listener = (state: OfflineSyncState) => void;
interface StoredDraft { key: string; payload: unknown; savedAt: string }
let databasePromise: Promise<IDBDatabase | null> | null = null;

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      for (const [store, keyPath] of [[QUEUE_STORE, "id"], [DRAFT_STORE, "key"]]) {
        if (!request.result.objectStoreNames.contains(store)) request.result.createObjectStore(store, { keyPath });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { databasePromise = null; resolve(null); };
    request.onblocked = () => { databasePromise = null; resolve(null); };
  });
  return databasePromise;
}
function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
function readLegacyQueue(): PendingSave[] {
  const raw = localStorage.getItem(LEGACY_QUEUE_STORAGE_KEY);
  const value: unknown = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(value)) throw new Error("Invalid saved queue");
  return value.filter((entry): entry is PendingSave => entry && typeof entry.id === "string" &&
    typeof entry.url === "string" && typeof entry.method === "string" && typeof entry.body === "string");
}
function activeKeys() {
  const path = typeof window === "undefined" ? "" : window.location.pathname;
  if (path.startsWith("/super-admin")) return ["super_admin_user", "super_admin_token"];
  if (path.startsWith("/school-admin")) return ["school_admin_user", "school_admin_token"];
  return ["lms_user", "lms_token"];
}
function ownerFromUser(user: any): OfflineOwner | null {
  return user && typeof user.id === "string" && user.id.length > 0
    ? { userId: user.id, schoolId: typeof user.schoolId === "string" ? user.schoolId : null } : null;
}
function ownerFromToken(token: string): OfflineOwner | null {
  try {
    const payload = token.split(".")[1];
    return ownerFromUser(JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))));
  } catch { return null; }
}
/** Local identity is a label only; the server verifies it before every replay. */
export function captureOfflineOwner(headers?: HeadersInit): OfflineOwner | null {
  try {
    const authorization = new Headers(headers).get("Authorization");
    if (authorization && authorization !== "Bearer cookie_auth") return ownerFromToken(authorization.replace(/^Bearer\s+/i, ""));
    return ownerFromUser(JSON.parse(localStorage.getItem(activeKeys()[0]) || "null"));
  } catch { return null; }
}
function sameOwner(a?: OfflineOwner | null, b?: OfflineOwner | null) {
  return Boolean(a && b && a.userId === b.userId && a.schoolId === b.schoolId);
}
function safeHeaders(input: HeadersInit): Record<string, string> {
  const result: Record<string, string> = {};
  new Headers(input).forEach((value, key) => {
    if (!["authorization", "cookie", "x-offline-user-id", "x-offline-school-id"].includes(key)) result[key] = value;
  });
  return result;
}
function newId() { return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`; }

class OfflineSyncManager {
  private queue: PendingSave[] = [];
  private listeners: Listener[] = [];
  private isSyncing = false;
  private lastSyncedAt: string | null = null;
  private lastError: string | null = null;
  private isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private persistChain: Promise<void> = Promise.resolve();
  private ready: Promise<void>;
  // Avoid NotificationProvider's global fetch wrapper adding the replay to the queue again.
  private send = typeof window !== "undefined" ? window.fetch.bind(window) : fetch;

  constructor() {
    this.ready = typeof window === "undefined" ? Promise.resolve() : this.hydrateQueue();
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => { this.isOnline = true; this.notify(); this.scheduleFlush(1500); });
      window.addEventListener("offline", () => { this.isOnline = false; this.notify(); });
    }
  }

  async enqueue(item: Omit<PendingSave, "id" | "enqueuedAt" | "attempts">): Promise<void> {
    // Capture before the first await: a login switch during storage initialization must not change ownership.
    const owner = item.owner === undefined ? captureOfflineOwner(item.headers) : item.owner;
    await this.ready;
    const method = item.method.toUpperCase();
    // PUT endpoints also accept sparse updates. Never infer replacement semantics from the verb.
    const latest = Math.max(0, ...this.queue.map(entry => Date.parse(entry.enqueuedAt) || 0));
    const entry: PendingSave = { ...item, owner, method, headers: safeHeaders(item.headers), id: newId(), enqueuedAt: new Date(Math.max(Date.now(), latest + 1)).toISOString(), attempts: 0 };
    this.queue.push(entry);
    this.notify();
    await this.persistMutation([entry], []);
    if (this.isOnline) this.scheduleFlush(1500);
  }

  async dequeue(id: string): Promise<void> {
    await this.persistMutation([], [id]);
    this.queue = this.queue.filter(entry => entry.id !== id);
    this.notify();
  }
  async clearAll(): Promise<void> {
    await this.ready;
    const ids = this.queue.map(entry => entry.id);
    await this.persistMutation([], ids);
    this.queue = this.queue.filter(entry => !ids.includes(entry.id));
    this.notify();
  }
  subscribe(listener: Listener): () => void {
    this.listeners.push(listener); listener(this.getState());
    return () => { this.listeners = this.listeners.filter(item => item !== listener); };
  }
  getState(): OfflineSyncState {
    return { isOnline: this.isOnline, pendingCount: this.queue.length, isSyncing: this.isSyncing, lastSyncedAt: this.lastSyncedAt, lastError: this.lastError };
  }
  getPending(): PendingSave[] { return this.queue.map(entry => ({ ...entry, headers: { ...entry.headers }, owner: entry.owner ? { ...entry.owner } : null })); }
  getDraftStorageKey(key: string): string | null {
    const owner = captureOfflineOwner();
    return owner ? `lms_draft_v2:${encodeURIComponent(owner.userId)}:${encodeURIComponent(owner.schoolId || "")}:${key}` : null;
  }
  async saveDraft(key: string, payload: unknown): Promise<boolean> {
    const database = await openDatabase();
    if (!database) return false;
    const transaction = database.transaction(DRAFT_STORE, "readwrite");
    const done = transactionDone(transaction);
    transaction.objectStore(DRAFT_STORE).put({ key, payload, savedAt: new Date().toISOString() } satisfies StoredDraft);
    await done; return true;
  }
  async getDraft<T>(key: string): Promise<{ payload: T; savedAt: string } | null> {
    const database = await openDatabase();
    if (!database) return null;
    const stored = await requestResult(database.transaction(DRAFT_STORE, "readonly").objectStore(DRAFT_STORE).get(key)) as StoredDraft | undefined;
    return stored ? { payload: stored.payload as T, savedAt: stored.savedAt } : null;
  }
  async removeDraft(key: string) {
    const database = await openDatabase(); if (!database) return;
    const transaction = database.transaction(DRAFT_STORE, "readwrite");
    const done = transactionDone(transaction); transaction.objectStore(DRAFT_STORE).delete(key); await done;
  }
  private storageError() {
    this.lastError = "تعذر حفظ التغييرات في المتصفح. لا تغلق الصفحة؛ نزّل نسخة من التغييرات.";
    this.notify();
  }
  private async hydrateQueue() {
    try {
      const legacy = readLegacyQueue();
      const database = await openDatabase();
      let saved: PendingSave[] = [];
      if (database) saved = await requestResult(database.transaction(QUEUE_STORE, "readonly").objectStore(QUEUE_STORE).getAll());
      const records = new Map(saved.map(entry => [entry.id, entry]));
      for (const entry of legacy) if (!records.has(entry.id)) records.set(entry.id, entry);
      this.queue = Array.from(records.values()).map(entry => ({ ...entry, headers: safeHeaders(entry.headers || {}) })).sort((a, b) => (Date.parse(a.enqueuedAt) || 0) - (Date.parse(b.enqueuedAt) || 0));
      if (database && legacy.length > 0) {
        const transaction = database.transaction(QUEUE_STORE, "readwrite"); const done = transactionDone(transaction);
        for (const entry of this.queue) transaction.objectStore(QUEUE_STORE).put(entry);
        await done; localStorage.removeItem(LEGACY_QUEUE_STORAGE_KEY);
      }
      if (this.isOnline && this.queue.length) this.scheduleFlush(2000);
    } catch { this.storageError(); }
    this.notify();
  }
  private persistMutation(upserts: PendingSave[], deletes: string[]): Promise<void> {
    const operation = this.persistChain.then(async () => {
      const database = await openDatabase();
      if (database) {
        const transaction = database.transaction(QUEUE_STORE, "readwrite"); const done = transactionDone(transaction);
        const store = transaction.objectStore(QUEUE_STORE);
        deletes.forEach(id => store.delete(id)); upserts.forEach(entry => store.put(entry)); await done;
      } else {
        // Merge individual operations with fresh storage; never clear another tab's unrelated saves.
        const records = new Map(readLegacyQueue().map(entry => [entry.id, entry]));
        deletes.forEach(id => records.delete(id)); upserts.forEach(entry => records.set(entry.id, entry));
        localStorage.setItem(LEGACY_QUEUE_STORAGE_KEY, JSON.stringify(Array.from(records.values())));
      }
    });
    this.persistChain = operation.catch(() => { this.storageError(); });
    return operation;
  }
  private scheduleFlush(delay = 30000) {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => { void this.flush(); }, delay);
  }
  private async isStillPersisted(id: string): Promise<boolean> {
    const database = await openDatabase();
    if (database) return Boolean(await requestResult(database.transaction(QUEUE_STORE, "readonly").objectStore(QUEUE_STORE).get(id)));
    return readLegacyQueue().some(entry => entry.id === id);
  }
  async flush() {
    await this.ready;
    await this.persistChain;
    if (this.isSyncing || !this.isOnline || this.queue.length === 0) return;
    this.isSyncing = true; this.lastError = null; this.notify();
    let retryAfter: number | null = null;
    try {
      for (const item of [...this.queue]) {
        if (!this.queue.some(entry => entry.id === item.id)) continue;
        if (!(await this.isStillPersisted(item.id))) {
          this.queue = this.queue.filter(entry => entry.id !== item.id);
          continue;
        }
        if (!item.owner) { this.lastError = "تغييرات قديمة بلا حساب موثّق. نزّلها للمراجعة؛ لن تُرسل تلقائياً."; continue; }
        const target = new URL(item.url, window.location.origin);
        if (target.origin !== window.location.origin || !target.pathname.startsWith("/api/")) {
          this.lastError = "مسار حفظ غير معتمد؛ تم الاحتفاظ بالتغييرات للمراجعة."; continue;
        }
        if (!["PUT"].includes(item.method)) {
          this.lastError = "عمليات إنشاء أو تعديل جزئي تحتاج مراجعة قبل إعادة الإرسال لتجنب التكرار. نزّل التغييرات المحفوظة."; continue;
        }
        const currentOwner = captureOfflineOwner();
        if (!sameOwner(item.owner, currentOwner)) {
          this.lastError = "سجّل الدخول بالحساب الذي أنشأ التغييرات لاستكمال المزامنة."; continue;
        }
        const headers = new Headers(item.headers);
        const token = localStorage.getItem(activeKeys()[1]);
        if (token && token !== "cookie_auth" && sameOwner(ownerFromToken(token), item.owner)) headers.set("Authorization", `Bearer ${token}`);
        const identity = await this.send(`${window.location.origin}/api/auth/session`, {
          credentials: "include", headers: headers.has("Authorization") ? { Authorization: headers.get("Authorization")! } : {},
          cache: "no-store", signal: AbortSignal.timeout(15000),
        });
        if (!identity.ok) {
          this.lastError = "تعذر التحقق من جلسة الحفظ. التغييرات ما زالت محفوظة.";
          if (identity.status >= 500 || identity.status === 429) retryAfter = 30000;
          break;
        }
        const session = await identity.json();
        if (!sameOwner(ownerFromUser(session.user), item.owner)) {
          this.lastError = "جلسة المتصفح تخص حساباً آخر. لم تُرسل التغييرات."; continue;
        }
        headers.set("X-Offline-User-Id", item.owner.userId);
        headers.set("X-Offline-School-Id", item.owner.schoolId || "");
        const response = await this.send(target.href, { method: item.method, headers, body: item.body, credentials: "include", signal: AbortSignal.timeout(120000) });
        if (response.ok) {
          await this.dequeue(item.id); this.lastSyncedAt = new Date().toISOString();
        } else {
          const current = this.queue.find(entry => entry.id === item.id);
          if (current) { current.attempts += 1; await this.persistMutation([current], []); }
          this.lastError = `تعذر مزامنة التغييرات (${response.status}). تم الاحتفاظ بها للمراجعة وإعادة المحاولة.`;
          if (response.status >= 500 || response.status === 408 || response.status === 429) {
            const value = response.headers.get("Retry-After");
            const wait = value ? (/^\d+$/.test(value) ? Number(value) * 1000 : Date.parse(value) - Date.now()) : 30000;
            retryAfter = Math.max(30000, Math.min(Number.isFinite(wait) ? wait : 30000, 24 * 60 * 60 * 1000));
            break;
          }
          break; // Later sparse updates must not overtake an unresolved write.
        }
      }
    } catch {
      if (!this.lastError) this.lastError = "تعذر الاتصال أو حفظ حالة المزامنة. التغييرات لم تُحذف.";
      retryAfter = 30000;
    } finally {
      this.isSyncing = false;
      if (retryAfter !== null && this.queue.length) this.scheduleFlush(retryAfter);
      this.notify();
    }
  }
  private notify() { const state = this.getState(); this.listeners.forEach(listener => listener(state)); }
}
export const offlineSync = new OfflineSyncManager();
