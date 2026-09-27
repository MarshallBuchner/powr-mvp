/** Public support + operator identity used across legal/payment surfaces. */
export const SUPPORT_EMAIL = "powrhockeydevelopment@gmail.com";

export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`;

/** Operating name shown to users. Legal entity details may need counsel review. */
export const OPERATOR_NAME = "POWR";

export const OPERATOR_IDENTITY =
  "POWR is operated by Marshall Buchner, doing business as POWR (trainwithpowr.com).";

export const SITE_CANONICAL_URL = "https://trainwithpowr.com";

export function supportContactSentence(prefix = "Email") {
  return `${prefix} ${SUPPORT_EMAIL}`;
}
