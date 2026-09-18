# POWR Assessment Report UI v2

Visual, mobile-first assessment report experience based on the MVP mockups.

## Live path (cutover)
- Upload → analyze → `/r?d=…`, `/r/sample`, and `/r/[id]` now render **ReportV2Flow** with real `RealAnalysis` via `reportV2FromAnalysis()`
- Soft upgrade CTAs (UpgradePanel + next session) are preserved on the Progress step
- `/r/v2` remains a mock/demo preview (`demoMode`)

## Local test
```bash
npm run dev
# Live sample (real sampleAnalysis data in v2 UI):
open http://localhost:3000/r/sample
# Mock preview:
open http://localhost:3000/r/v2
```

## What’s included
- Hero, score ring, coach summary, technique bars, comparison stills
- Priorities / drills with slideshow + lightbox
- Real strengths, priority, drills, confidence from analysis
- Evidence frame thumbs when available from the same-session stash

## Still later
- Real pose overlays / pro video sync
- Multi-assessment progress history
- Saved-account report chrome parity (save CTA)
