/**
 * Memoise report-share creation per analysis so the auto-navigation and the
 * "View Development Report" fallback button never create a second share link.
 * A failed attempt is forgotten so the user can retry (still no re-analysis).
 */
export function createShareOnce<T>(create: () => Promise<T>) {
  let inflight: Promise<T> | null = null;
  let value: T | undefined;
  let done = false;
  return function get(): Promise<T> {
    if (done) return Promise.resolve(value as T);
    if (inflight) return inflight;
    inflight = create().then(
      (v) => {
        value = v;
        done = true;
        inflight = null;
        return v;
      },
      (err) => {
        inflight = null;
        throw err;
      },
    );
    return inflight;
  };
}
