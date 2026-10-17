# POWR Meta completion measurement

Dataset: POWR `1191232966775490`. Ad account: `260427007879512`.

This integration uses Conversions API only. It does not install a Meta browser script, measure every visitor, or send report contents. Its only event is `AssessmentCompleted`.

## Event definition

A new real analysis must pass the server's existing usable-analysis gate. Only when an adult separately opts into ad measurement does the success response contain a random event ID and a signed, HttpOnly, one-hour receipt cookie. Home arms a same-session marker bound to the destination report path. SharedReportView acknowledges the event only after it renders a report with analysis at that destination. The completion API verifies the proof and calls Meta with a stable event ID for deduplication.

Samples, failed analysis, unavailable reports, old/shared report visits without a fresh same-session marker, missing consent, and the teen/under-13 UI paths do not emit this event. Measurement errors do not block analysis or report navigation. Refresh can retry a failed delivery while proof remains valid; delivery success removes the proof. There is no persistent retry queue.

Meta receives only event name/time/random ID, a fixed public source URL, request IP address, browser user agent, and a validated Meta click ID if present. No filename, footage, frames, scores, coaching text, report URL/token, email, account ID or payment data is sent. No global CSP change is needed.

## Configuration

Set server-only Vercel variables on the verified POWR `powr-mvp` project:

- `META_CAPI_ACCESS_TOKEN`: a dedicated credential for the POWR dataset, stored as a Secret. Never put it in source, chat, logs, command arguments or a `NEXT_PUBLIC_*` variable.
- `META_CAPI_ENABLED=false` until connection testing is ready; set true only in the intended tested environment.

Creating a new credential requires the owner's approval at that action. Do not select the Dataset Quality API option that expands permissions of other tokens. Do not use BUILD credentials or dataset.

## Validation before activation

1. Verify the intended team/project, branch/commit and environment. Deploy reviewed code with measurement disabled first.
2. With an approved POWR-only credential, test server delivery using Events Manager's test-event code and synthetic non-personal matching values. The helper supports an explicit `testCode` for this; production routes do not read a test code from a browser request.
3. Verify the fixed dataset receives `AssessmentCompleted` and no private parameters, then test consent-declined and sample paths with no Meta transmission.
4. After the live assessment reliability fix is confirmed, run one authorized real assessment with adult opt-in. Verify the report actually opens and only one completion is received. Do not repeatedly consume paid credits.
5. Select the verified event in the existing draft ad set (create a custom conversion based on `AssessmentCompleted` if required by Meta). Do not substitute Purchase or CompleteRegistration.
6. Ads remain OFF and UNPUBLISHED until the owner separately confirms reliability and explicitly authorizes launch.

Limitations: only consenting adult assessments are measured; ad-platform reporting will undercount total product usage. CAPI-only matching uses IP/user agent and an available ad click ID, not email or browser pixel cookies. The API cannot prove a human read the report; it measures successful rendering. The existing application must independently fix live assessment reliability. Production privacy copy should continue to match any later implementation changes.
