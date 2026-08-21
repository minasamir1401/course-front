"use client";

const LEGACY_QUEUE_STORAGE_KEY = "lms_offline_sync_queue";
const DATABASE_NAME = "lms-local-workspace";
const DATABASE_VERSION = 1;
const QUEUE_STORE = "pending-saves";
const DRAFT_STORE = "editor-drafts";

export interface PendingSave {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  enqueuedAt: string;
  attempts: number;
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

interface StoredDraft {
  key: string;
  payload: unknown;
  savedAt: string;
}

let databasePromise: Promise<IDBDatabase | null> | null = null;

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(QUEUE_STORE)) {
        database.createObjectStore(QUEUE_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(DRAFT_STORE)) {
        database.createObjectStore(DRAFT_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
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

function getLegacyQueue(): PendingSave[] {
  try {
    const raw = localStorage.getItem(LEGACY_QUEUE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getCurrentAuthorization(): string | null {
  if (typeof window === "undefined") return null;
  const pathname = window.location.pathname;
  const tokenKey = pathname.startsWith("/super-admin")
    ? "super_admin_token"
    : pathname.startsWith("/school-admin")
      ? "school_admin_token"
      : "lms_token";
  const token = localStorage.getItem(tokenKey);
  return token ? `Bearer ${token}` : null;
}

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

  constructor() {
    if (typeof window === "undefined") {
      this.ready = Promise.resolve();
      return;
    }

    this.queue = getLegacyQueue();
    this.ready = this.hydrateQueue();
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
  }

  enqueue(item: Omit<PendingSave, "id" | "enqueuedAt" | "attempts">) {
    const existingIndex = this.queue.findIndex((entry) => entry.url === item.url && entry.method === item.method);
    const entry: PendingSave = {
      ...item,
      id: existingIndex >= 0 ? this.queue[existingIndex].id : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      enqueuedAt: new Date().toISOString(),
      attempts: existingIndex >= 0 ? this.queue[existingIndex].attempts : 0,
    };

    if (existingIndex >= 0) this.queue[existingIndex] = entry;
    else this.queue.push(entry);

    this.persistQueue();
    this.notify();
  }

  dequeue(id: string) {
    this.queue = this.queue.filter((entry) => entry.id !== id);
    this.persistQueue();
    this.notify();
  }

  clearAll() {
    this.queue = [];
    this.persistQueue();
    this.notify();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((registered) => registered !== listener);
    };
  }

  getState(): OfflineSyncState {
    return {
      isOnline: this.isOnline,
      pendingCount: this.queue.length,
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
    };
  }

  getPending(): PendingSave[] {
    return [...this.queue];
  }

  async saveDraft(key: string, payload: unknown) {
    const database = await openDatabase();
    if (!database) return;
    const transaction = database.transaction(DRAFT_STORE, "readwrite");
    transaction.objectStore(DRAFT_STORE).put({ key, payload, savedAt: new Date().toISOString() } satisfies StoredDraft);
    await transactionDone(transaction);
  }

  async getDraft<T>(key: string): Promise<{ payload: T; savedAt: string } | null> {
    const database = await openDatabase();
    if (!database) return null;
    const transaction = database.transaction(DRAFT_STORE, "readonly");
    const stored = await requestResult(transaction.objectStore(DRAFT_STORE).get(key)) as StoredDraft | undefined;
    return stored ? { payload: stored.payload as T, savedAt: stored.savedAt } : null;
  }

  async removeDraft(key: string) {
    const database = await openDatabase();
    if (!database) return;
    const transaction = database.transaction(DRAFT_STORE, "readwrite");
    transaction.objectStore(DRAFT_STORE).delete(key);
    await transactionDone(transaction);
  }

  async flush() {
    await this.ready;
    await this.flushQueue();
  }

  private async hydrateQueue() {
    const database = await openDatabase();
    if (database) {
      try {
        const transaction = database.transaction(QUEUE_STORE, "readonly");
        const saved = await requestResult(transaction.objectStore(QUEUE_STORE).getAll()) as PendingSave[];
        for (const entry of saved) {
          const existingIndex = this.queue.findIndex((current) => current.url === entry.url && current.method === entry.method);
          if (existingIndex < 0 || this.queue[existingIndex].enqueuedAt < entry.enqueuedAt) {
            if (existingIndex < 0) this.queue.push(entry);
            else this.queue[existingIndex] = entry;
          }
        }
      } catch {
        // localStorage remains a fallback if IndexedDB is unavailable or blocked.
      }
    }

    this.persistQueue();
    this.notify();
    if (this.isOnline && this.queue.length > 0) this.scheduleFlush(2_000);
  }

  private persistQueue() {
    const snapshot = this.queue.map((entry) => ({ ...entry }));
    this.persistChain = this.persistChain
      .then(async () => {
        const database = await openDatabase();
        if (database) {
          const transaction = database.transaction(QUEUE_STORE, "readwrite");
          const store = transaction.objectStore(QUEUE_STORE);
          store.clear();
          snapshot.forEach((entry) => store.put(entry));
          await transactionDone(transaction);
        }

        try {
          localStorage.setItem(LEGACY_QUEUE_STORAGE_KEY, JSON.stringify(snapshot));
        } catch {
          // IndexedDB is the primary store; localStorage is only a legacy fallback.
        }
      })
      .catch(() => undefined);
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.lastError = null;
    this.notify();
    if (this.queue.length > 0) this.scheduleFlush(1_500);
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notify();
  };

  private scheduleFlush(delayMs = 0) {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => void this.flush(), delayMs);
  }

  private async flushQueue() {
    if (this.isSyncing || this.queue.length === 0 || !this.isOnline) return;
    this.isSyncing = true;
    this.lastError = null;
    this.notify();

    let anyFailed = false;
    for (const item of [...this.queue]) {
      try {
        const headers = { ...item.headers };
        const authorization = getCurrentAuthorization();
        for (const key of Object.keys(headers)) {
          if (key.toLowerCase() === "authorization") delete headers[key];
        }
        if (authorization) {
          headers.Authorization = authorization;
        }
        const response = await fetch(item.url, { method: item.method, headers, body: item.body });
        if (response.ok) {
          this.dequeue(item.id);
          this.lastSyncedAt = new Date().toISOString();
        } else if (response.status === 401) {
          // Keep work created before a session expired. A successful login will retry it.
          this.incrementAttempts(item.id);
          this.lastError = "Sign in required before local changes can sync";
          anyFailed = true;
          break;
        } else if (response.status >= 500) {
          this.incrementAttempts(item.id);
          this.lastError = `Server returned ${response.status}`;
          anyFailed = true;
          break;
        } else {
          // Invalid or unauthorized requests require a user decision; do not retry forever.
          this.dequeue(item.id);
        }
      } catch {
        this.incrementAttempts(item.id);
        this.lastError = "Network unavailable";
        anyFailed = true;
        break;
      }
    }

    this.isSyncing = false;
    if (anyFailed && this.queue.length > 0 && this.lastError !== "Sign in required before local changes can sync") {
      this.scheduleFlush(30_000);
    }
    this.notify();
  }

  private incrementAttempts(id: string) {
    const item = this.queue.find((entry) => entry.id === id);
    if (!item) return;
    item.attempts += 1;
    this.persistQueue();
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}

export const offlineSync = new OfflineSyncManager();
