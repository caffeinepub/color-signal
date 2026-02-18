# Specification

## Summary
**Goal:** Increase the rolling history maximum from 20 to 30 entries across the app while keeping all existing behavior, order, styling, and flow unchanged except where numeric limits must reflect 30.

**Planned changes:**
- Update the in-memory rolling history cap from 20 to 30 entries, preserving the current as-entered chronological order and existing numbering/order logic.
- Update the gated input flow to use 30/30: show “Next” only at exactly 30 entries; when locked at 30 disable Big/Small; pressing “Next” unlocks exactly one Big/Small tap; that tap appends a new entry while keeping the history length at 30 (oldest drops), then re-lock until “Next” is pressed again.
- Replace all UI counters/helper text/hard-coded references from 20 to 30 so the interface consistently shows X/30 and 30/30 states (English text only).
- Extend the Results panel compact history visualization to display 30 entries in the same compact style and order, adjusting the existing layout to fit 30 without changing the panel look-and-feel.
- Ensure prediction generation/retry uses the current in-memory history up to 30 items with no remaining 20-item assumptions.
- Update any backend history-capping utilities from 20 to 30 while keeping the existing anonymous prediction flow unchanged.
- Update the existing DOM-based automated prediction flow check (?checkPrediction=1) to remove any assumptions tied to a 20-entry maximum.

**User-visible outcome:** The app now supports a 30-entry rolling history with counters showing X/30, the Results panel displaying all 30 entries, the “Next” gating behavior operating at 30/30, and predictions continuing to work normally using up to 30 history items.
