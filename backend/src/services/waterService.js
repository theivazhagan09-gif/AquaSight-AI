import * as repo from '../repositories/dataRepo.js';
import { callAi } from './riskClient.js';
export const deficitMld = (d, s) => Math.max(0, d - s);
const num = v => (v === null || v === undefined || Number.isNaN(v) ? null : v);
export function applyScenario(r, sc = {}) {
  const g = (sc.demandGrowth || 0) / 100, s = (sc.supplyChange || 0) / 100, rn = (sc.rainfallChange || 0) / 100;
  const rain = num(r.Rainfall_mm), anom = num(r.Rainfall_Anomaly_mm);
  return { rainfall: rain === null ? null : +(rain * (1 + rn)).toFixed(1), anomaly: anom === null ? null : +(anom + (rain || 0) * rn).toFixed(1),
    demand: num(r.Estimated_Demand_MLD) === null ? null : +(r.Estimated_Demand_MLD * (1 + g)).toFixed(1), supply: num(r.Available_Supply_MLD) === null ? null : +(r.Available_Supply_MLD * (1 + s)).toFixed(1),
    storage: num(r.Reservoir_Storage_Pct), groundwater: num(r.Groundwater_Level_m_bgl) };
}
const cache = new Map();
export async function snapshot(period, sc = {}) {
  const key = JSON.stringify([period, sc]); if (cache.has(key)) return cache.get(key);
  const recs = repo.recordsForPeriod(period); if (!recs.length) { const e = new Error('Unknown period ' + period); e.status = 404; throw e; }
  const names = Object.fromEntries(repo.districts().map(d => [d.district_id, d]));
  let ai = 'ok';
  const tele = new Set(repo.telemetry().map(t => t.district_id));
  const rows = await Promise.all(recs.map(async r => {
    const v = applyScenario(r, sc); let risk = null;
    try { risk = await callAi('/predict/risk', { rainfall_anomaly_mm: v.anomaly, storage_pct: v.storage, groundwater_m_bgl: v.groundwater, demand_mld: v.demand, supply_mld: v.supply }); }
    catch (e) { ai = 'unavailable'; }
    const deficit = v.demand === null || v.supply === null ? null : deficitMld(v.demand, v.supply);
    return { district_id: r.District_ID, name: names[r.District_ID]?.name, has_polygon: names[r.District_ID]?.has_polygon, period, season: r.Season, projected: !!r.Is_Projected,
      rainfall_mm: v.rainfall, rainfall_anomaly_mm: v.anomaly, demand_mld: v.demand, supply_mld: v.supply, deficit_mld: deficit === null ? null : +deficit.toFixed(2),
      deficit_pct: deficit === null || !v.demand ? null : +(deficit / v.demand * 100).toFixed(2), storage_pct: v.storage, groundwater_m_bgl: v.groundwater,
      availability_pct: v.demand ? +(v.supply / v.demand * 100).toFixed(1) : null,
      stress_score: risk?.stress_score ?? null, risk_category: risk ? risk.risk_category : 'Data unavailable (AI service down)',
      factors: risk?.factors || [], missing_factors: risk?.missing_factors || [], dataset_severity_label: r.Shortage_Severity ?? null, has_telemetry: tele.has(r.District_ID) };
  }));
  const out = { rows, meta: { period, scenario: sc, ai_service: ai, model_version: ai === 'ok' ? 'rule-based-prototype-0.1.0' : null, model_type: 'Rule-based prototype (not trained AI)', projected_period: rows.some(r => r.projected),
    source: repo.SOURCE, generated_at: new Date().toISOString(), simulation: Object.values(sc).some(v => v) ? 'Scenario adjustments applied (simulated)' : 'No scenario adjustments' } };
  if (ai === 'ok') { if (cache.size > 200) cache.clear(); cache.set(key, out); } return out;
}
const cnt = rows => rows.reduce((a, r) => { const k = r.risk_category.split(' ')[0]; a[k] = (a[k] || 0) + 1; return a; }, {});
const sum = (rows, k) => rows.reduce((a, r) => a + (r[k] || 0), 0);
export async function summary(period, sc) {
  const { rows, meta } = await snapshot(period, sc);
  const top = [...rows].filter(r => r.deficit_mld !== null).sort((a, b) => b.deficit_mld - a.deficit_mld).slice(0, 8);
  const rain = rows.filter(r => r.rainfall_mm !== null); const st = rows.filter(r => r.stress_score !== null);
  return { meta, kpis: { districts_in_data: rows.length, districts_with_boundary: rows.filter(r => r.has_polygon).length, total_demand_mld: +sum(rows, 'demand_mld').toFixed(1), total_supply_mld: +sum(rows, 'supply_mld').toFixed(1),
    total_deficit_mld: +sum(rows, 'deficit_mld').toFixed(1), avg_rainfall_mm: rain.length ? +(sum(rain, 'rainfall_mm') / rain.length).toFixed(1) : null, risk_counts: cnt(rows), mean_stress: st.length ? +(sum(st, 'stress_score') / st.length).toFixed(3) : null }, top_deficit: top };
}
export async function trend(sc) {
  const out = [];
  for (const p of repo.periods()) { const { rows } = await snapshot(p, sc); out.push({ period: p, projected: rows.some(r => r.projected), demand: +sum(rows, 'demand_mld').toFixed(0), supply: +sum(rows, 'supply_mld').toFixed(0), deficit: +sum(rows, 'deficit_mld').toFixed(0), rainfall: +(sum(rows, 'rainfall_mm') / rows.length).toFixed(0), severe_high: rows.filter(r => /^(High|Severe)/.test(r.risk_category)).length }); }
  return out;
}
