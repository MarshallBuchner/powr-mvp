/** Checkout resume helpers for guest → login → Stripe. */

export const CHECKOUT_PATH = "/checkout";
export const CHECKOUT_RETURN_KEY = "powr_checkout_return_v1";

export function buildCheckoutPath(source = "upgrade") {
  const params = new URLSearchParams();
  if (source) params.set("source", source);
  const query = params.toString();
  return query ? `${CHECKOUT_PATH}?${query}` : CHECKOUT_PATH;
}

export function buildCheckoutLoginUrl(source = "upgrade") {
  return `/login?next=${encodeURIComponent(buildCheckoutPath(source))}`;
}

export function unlockCancelledPath(source = "upgrade") {
  return `/unlock?checkout=cancelled&source=${encodeURIComponent(source)}`;
}

export function unlockFailedPath(source = "upgrade") {
  return `/unlock?checkout=failed&source=${encodeURIComponent(source)}`;
}

/** Stash report URL so post-purchase UX can return users to their assessment. */
export function stashCheckoutReturnPath(path?: string) {
  if (typeof window === "undefined") return;
  const value = path ?? `${window.location.pathname}${window.location.search}`;
  if (!value.startsWith("/r")) return;
  try {
    sessionStorage.setItem(CHECKOUT_RETURN_KEY, value);
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function readCheckoutReturnPath(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(CHECKOUT_RETURN_KEY);
    if (!value || !value.startsWith("/r")) return null;
    return value;
  } catch {
    return null;
  }
}

export function clearCheckoutReturnPath() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHECKOUT_RETURN_KEY);
  } catch {
    // ignore
  }
}
