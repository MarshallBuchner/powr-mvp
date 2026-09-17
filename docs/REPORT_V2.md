# POWR Assessment Report UI v2 (preview)

Visual, mobile-first assessment report experience based on the MVP mockups.

## Safety
- Live product path is unchanged: upload → analyze → `/r/...` → existing `ReportScreen`
- This UI lives at **`/r/v2`** with **mock data** only
- Safe to develop/test on localhost and Vercel preview before cutover

## Local test
```bash
npm run dev
open http://localhost:3000/r/v2
# Steps: /r/v2?step=2 … ?step=6 (1 = Overview)
```

## Next steps (later PRs)
1. Map real `RealAnalysis` via `reportV2FromAnalysis()`
2. Optional opt-in from sample report
3. Replace `SharedReportView` → `ReportScreen` only after v2 feels ready
4. Wire real video comparison + saved progress history
