/** Match the backend's existing 100 MiB JSON/form limit unless explicitly configured. */
export function proxyBodyLimit(value = process.env.PROXY_MAX_BODY_BYTES): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 100 * 1024 * 1024;
}

export class ProxyBodyTooLargeError extends Error {
  constructor() { super('Request body exceeds proxy limit'); }
}

export function proxyLifetime(clientSignal: AbortSignal, timeoutMs: number) {
  const controller = new AbortController();
  const abortClient = () => controller.abort(clientSignal.reason);
  const timer = setTimeout(() => controller.abort(new DOMException('Backend request timed out', 'TimeoutError')), timeoutMs);
  timer.unref?.();
  clientSignal.addEventListener('abort', abortClient, { once: true });
  if (clientSignal.aborted) abortClient();
  return {
    signal: controller.signal,
    abort: (reason?: unknown) => controller.abort(reason),
    dispose() {
      clearTimeout(timer);
      clientSignal.removeEventListener('abort', abortClient);
    },
  };
}

/** Count actual bytes, including chunked bodies and dishonest Content-Length headers. */
export async function readProxyBody(body: ReadableStream<Uint8Array>, limit: number, signal: AbortSignal): Promise<ArrayBuffer> {
  signal.throwIfAborted();
  const reader = body.getReader();
  const cancel = () => { void reader.cancel(signal.reason).catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        const error = new ProxyBodyTooLargeError();
        void reader.cancel(error).catch(() => {});
        throw error;
      }
      chunks.push(value);
    }
    const result = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return result.buffer;
  } finally {
    signal.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
}

/** Preserve backpressure; keep the deadline active until EOF or downstream cancellation. */
export function proxyResponseBody(body: ReadableStream<Uint8Array>, lifetime: ReturnType<typeof proxyLifetime>) {
  const reader = body.getReader();
  let finished = false;
  let onAbort: () => void;
  const finish = () => {
    finished = true;
    lifetime.signal.removeEventListener('abort', onAbort);
    lifetime.dispose();
  };
  return new ReadableStream<Uint8Array>({
    start(controller) {
      onAbort = () => {
        if (finished) return;
        finish();
        controller.error(lifetime.signal.reason);
        void reader.cancel(lifetime.signal.reason).catch(() => {}).finally(() => reader.releaseLock());
      };
      lifetime.signal.addEventListener('abort', onAbort, { once: true });
      if (lifetime.signal.aborted) onAbort();
    },
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (finished) return;
        if (done) {
          finish();
          reader.releaseLock();
          controller.close();
        } else {
          controller.enqueue(value);
        }
      } catch (error) {
        if (finished) return;
        finish();
        lifetime.abort(error);
        void reader.cancel(error).catch(() => {}).finally(() => reader.releaseLock());
        controller.error(error);
      }
    },
    cancel(reason) {
      if (finished) return;
      finish();
      lifetime.abort(reason);
      return reader.cancel(reason).finally(() => reader.releaseLock());
    },
  });
}
