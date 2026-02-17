# Specification

## Summary
**Goal:** Restore reliable end-to-end predictions for anonymous users and improve recovery/diagnostics so the Prediction feature no longer gets stuck or fails silently.

**Planned changes:**
- Fix frontend prediction flow to wait for backend actor readiness before sending prediction requests, keeping the UI usable and allowing retry.
- Improve Prediction panel error handling with clear English failure categories/messages and a working “Retry Prediction” path without page refresh.
- Harden the backend prediction endpoint to never trap for valid inputs (history length 1–20, “Big”/“Small”) and to return a safe fallback prediction/explanation for unexpected values.
- Add a minimal automated frontend test/check covering: add history → attempt prediction → verify non-stuck UI and functional retry when actor becomes ready later.

**User-visible outcome:** After adding at least one history entry, anonymous users can click “Prediction” to see “Big” or “Small” plus an English explanation; if a transient error occurs, they see a clear English message and can retry successfully without refreshing the page.
