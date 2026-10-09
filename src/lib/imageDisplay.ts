/** Local previews and HTTP sources cannot use the configured HTTPS optimizer. */
export function shouldSkipImageOptimization(src: string | null | undefined): boolean {
  return Boolean(src && /^(data:|blob:|http:)/i.test(src));
}
