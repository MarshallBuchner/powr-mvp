/**
 * Ownership tracking for the uploaded clip's blob: preview URL.
 *
 * UploadCard creates the URL, but Home unmounts UploadCard as soon as the
 * Analysis Lab opens and AnalysisScreen's PoseVideoPlayer keeps playing the
 * same URL. Revoking on UploadCard unmount (regression from #32) left iPhone
 * Safari with a dead <video> src. After `handoff()` the card no longer owns the
 * URL; the page releases it when the analysis session ends.
 */
export type ObjectUrlApi = {
  create: (file: Blob) => string;
  revoke: (url: string) => void;
};

const browserApi: ObjectUrlApi = {
  create: (file) => URL.createObjectURL(file),
  revoke: (url) => URL.revokeObjectURL(url),
};

export function createPreviewUrlOwner(api: ObjectUrlApi = browserApi) {
  let owned = "";
  const handedOff = new Set<string>();

  const revokeOwned = () => {
    if (owned.startsWith("blob:") && !handedOff.has(owned)) api.revoke(owned);
    owned = "";
  };

  return {
    /** Replace the preview with a new file (or clear with null). */
    select(file: Blob | null): string {
      revokeOwned();
      if (!file) return "";
      owned = api.create(file);
      return owned;
    },
    /** Transfer the URL to the analysis session; dispose() will not revoke it. */
    handoff(url: string): string {
      if (url) handedOff.add(url);
      return url;
    },
    /** UploadCard unmount: revoke only URLs that were never handed off. */
    dispose() {
      revokeOwned();
    },
  };
}

/** Page-level release once the analysis session no longer needs the clip. */
export function releaseAnalysisVideoUrl(
  url: string | null | undefined,
  api: Pick<ObjectUrlApi, "revoke"> = browserApi,
) {
  if (typeof url === "string" && url.startsWith("blob:")) api.revoke(url);
}

/** Safari reports failed fetch() as TypeError "Load failed". */
export function isNetworkFetchError(err: unknown): boolean {
  if (!(err instanceof TypeError)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg === "load failed" ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network connection was lost") ||
    msg.includes("the internet connection appears to be offline")
  );
}

export const CONNECTION_LOST_MESSAGE =
  "We lost the connection while analyzing your clip. Check your connection and keep this page open, then try again. If you were signed in, check Assessments before retrying in case the analysis already finished.";
