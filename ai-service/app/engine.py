"""Rule-based water-stress engine (prototype, NOT trained ML). Single source of truth for risk scoring."""
MODEL_VERSION = "rule-based-prototype-0.1.0"
WEIGHTS = {"rainfall": 0.30, "storage": 0.25, "groundwater": 0.20, "demand": 0.25}
THRESHOLDS = [(0.25, "Low"), (0.45, "Moderate"), (0.65, "High"), (1.01, "Severe")]
RAIN_ANOM_SPAN_MM = 200.0      # anomaly -200mm => stress 1, +200mm => stress 0
GW_RANGE_M = (2.0, 12.0)       # depth below ground level: <=2 m => 0, >=12 m => 1 (configurable assumption)
DEMAND_GAP_FULL_PCT = 30.0     # deficit >= 30% of demand => stress 1
LIMITATIONS = ["Rule-based prototype; not trained or validated against observed shortages.",
 "Thresholds and weights are illustrative, not official drought/scarcity classifications.",
 "Each factor is normalised to a 0-1 stress scale before weighting; units are never mixed directly."]
clip = lambda x: max(0.0, min(1.0, x))

def deficit_mld(demand, supply):
    return max(0.0, demand - supply)

def classify(score):
    for t, c in THRESHOLDS:
        if score < t: return c

def assess(rainfall_anomaly_mm=None, storage_pct=None, groundwater_m_bgl=None, demand_mld=None, supply_mld=None, weights=None):
    w = dict(WEIGHTS); w.update(weights or {})
    f = {}
    f["rainfall"] = None if rainfall_anomaly_mm is None else clip(0.5 - rainfall_anomaly_mm / (2 * RAIN_ANOM_SPAN_MM))
    f["storage"] = None if storage_pct is None else clip(1 - storage_pct / 100)
    f["groundwater"] = None if groundwater_m_bgl is None else clip((groundwater_m_bgl - GW_RANGE_M[0]) / (GW_RANGE_M[1] - GW_RANGE_M[0]))
    if demand_mld is None or supply_mld is None or demand_mld <= 0: f["demand"] = None; deficit = None
    else:
        deficit = deficit_mld(demand_mld, supply_mld); f["demand"] = clip((deficit / demand_mld * 100) / DEMAND_GAP_FULL_PCT)
    avail = {k: v for k, v in f.items() if v is not None}
    missing = [k for k in f if f[k] is None]
    tw = sum(w[k] for k in avail)
    if tw <= 0 or len(avail) < 2:
        return {"stress_score": None, "risk_category": "Insufficient data", "deficit_mld": deficit, "factors": [], "missing_factors": missing,
                "assumptions": ["Fewer than 2 factors available; no score produced."], "limitations": LIMITATIONS, "model_version": MODEL_VERSION, "model_type": "rule-based prototype"}
    score = sum(w[k] * v for k, v in avail.items()) / tw
    factors = [{"factor": k, "stress": round(v, 4), "weight_effective": round(w[k] / tw, 4), "contribution": round(w[k] / tw * v, 4)} for k, v in avail.items()]
    ass = [f"Weights (renormalised over available factors): {({k: round(w[k]/tw,3) for k in avail})}",
           f"Thresholds: Low<0.25, Moderate<0.45, High<0.65, Severe>=0.65",
           "deficit_mld = max(0, demand - supply)"]
    if missing: ass.append("Missing factors excluded, not zero-filled: " + ", ".join(missing))
    return {"stress_score": round(score, 4), "risk_category": classify(score), "deficit_mld": None if deficit is None else round(deficit, 2),
            "factors": factors, "missing_factors": missing, "assumptions": ass, "limitations": LIMITATIONS, "model_version": MODEL_VERSION, "model_type": "rule-based prototype"}
