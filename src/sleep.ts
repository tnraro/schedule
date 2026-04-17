export function sleep(delay: number, options?: { signal?: AbortSignal }) {
  const { promise, resolve } = Promise.withResolvers();
  if (options?.signal?.aborted || delay <= 0) {
    resolve();
    return promise;
  }
  delay = Math.max(delay | 0, 0);
  const t = setTimeout(resolve, delay);
  options?.signal?.addEventListener(
    "abort",
    () => {
      clearTimeout(t);
      resolve();
    },
    { once: true },
  );
  return promise;
}
