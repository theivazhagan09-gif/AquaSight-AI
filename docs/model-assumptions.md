# Model assumptions (rule-based-prototype-0.1.0 — not trained)
Stress per factor (0-1): rainfall = clip(0.5 − anomaly/400); storage = 1 − pct/100; groundwater = clip((depth−2)/(12−2)); demand = clip(deficit% / 30).
Weights: rainfall .30, storage .25, groundwater .20, demand .25 (renormalised over available factors; <2 factors → "Insufficient data").
Categories: Low <0.25, Moderate <0.45, High <0.65, Severe ≥0.65. All values are illustrative, not official classifications.
Allocation: priority=(1−w)·min(1,deficit%/50)+w·essential; proportional water-filling with caps and redistribution.
Forecasting: none yet. Required: dated history, chronological/rolling validation, baselines (persistence/seasonal), MAE/RMSE, precision/recall.
