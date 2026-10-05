/** Resolve only after full decode, or false on error/timeout/abort. */
export function waitForDecodedImage(image: HTMLImageElement, signal: AbortSignal, timeoutMs = 20000): Promise<boolean> {
  return new Promise(resolve => {
    let finished = false, decoding = false;
    const finish = (ok: boolean) => {
      if (finished) return; finished = true;
      clearTimeout(timer); image.removeEventListener('load',loaded); image.removeEventListener('error',failed); signal.removeEventListener('abort',failed);
      resolve(ok);
    };
    const failed = () => finish(false);
    const loaded = () => {
      if (finished || decoding) return;
      if (!image.naturalWidth) return finish(false);
      decoding = true;
      Promise.resolve().then(() => image.decode()).then(() => finish(true),failed);
    };
    const timer = setTimeout(failed,timeoutMs);
    image.addEventListener('load',loaded); image.addEventListener('error',failed); signal.addEventListener('abort',failed,{once:true});
    if (signal.aborted) failed(); else if (image.complete) loaded();
  });
}
