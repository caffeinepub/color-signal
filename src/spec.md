# Specification

## Summary
**Goal:** Add win/loss feedback buttons to track prediction accuracy and improve the prediction algorithm to analyze patterns better, reducing excessive Big predictions and consecutive loss streaks.

**Planned changes:**
- Add Win and Loss feedback buttons that appear after each prediction
- Store win/loss feedback locally alongside prediction history
- Update backend to accept and use win/loss feedback to refine predictions
- Improve pattern analysis algorithm to detect streaks, alternations, reversals, and trends
- Balance Big/Small predictions based on actual history distribution
- Add UI for uploading historical market pattern data
- Update backend to accept and incorporate uploaded historical patterns into prediction logic
- Pass feedback data from frontend to backend during prediction requests

**User-visible outcome:** Users can report whether predictions were correct using Win/Loss buttons. The app learns from this feedback and uploaded historical patterns to improve prediction accuracy over time, with better pattern recognition and reduced consecutive losses.
