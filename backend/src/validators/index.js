import * as repo from '../repositories/dataRepo.js';
const bad = m => { const e = new Error(m); e.status = 400; throw e; };
const numIn = (v, name, lo, hi, def = 0) => { if (v === undefined || v === '') return def; const n = Number(v); if (!Number.isFinite(n) || n < lo || n > hi) bad(`${name} must be a number in [${lo}, ${hi}]`); return n; };
export const METRICS = ['rainfall', 'availability', 'demand', 'supply', 'deficit', 'risk', 'scenario', 'priority', 'coverage'];
export function parseCommon(q) {
  const period = q.period || repo.latestObservedPeriod(); if (!repo.periods().includes(period)) bad('period must be one of: ' + repo.periods().join(', '));
  return { period, scenario: { demandGrowth: numIn(q.demandGrowth, 'demandGrowth', -50, 100), supplyChange: numIn(q.supplyChange, 'supplyChange', -80, 100), rainfallChange: numIn(q.rainfallChange, 'rainfallChange', -100, 200) } };
}
export function parseMetric(q) { const m = q.metric || 'rainfall'; if (!METRICS.includes(m)) bad('metric must be one of: ' + METRICS.join(', ')); return m; }
export function parseAssess(b) {
  const o = {};
  for (const [k, lo, hi] of [['rainfall_anomaly_mm', -3000, 3000], ['storage_pct', 0, 100], ['groundwater_m_bgl', 0, 200], ['demand_mld', 0, 1e6], ['supply_mld', 0, 1e6]]) {
    if (b?.[k] === undefined || b[k] === null || b[k] === '') o[k] = null; else { const n = Number(b[k]); if (!Number.isFinite(n) || n < lo || n > hi) bad(`${k} must be in [${lo}, ${hi}]`); o[k] = n; } }
  if (b?.demand_growth_pct !== undefined && o.demand_mld !== null) o.demand_mld = o.demand_mld * (1 + numIn(b.demand_growth_pct, 'demand_growth_pct', -50, 100) / 100);
  return o;
}
export function parseAlloc(b) {
  if (!b || typeof b !== 'object') bad('JSON body required');
  const { period, scenario } = parseCommon({ ...(b.scenario || {}), period: b.period });
  const pool = Number(b.pool_mld); if (!Number.isFinite(pool) || pool < 0 || pool > 100000) bad('pool_mld must be in [0, 100000]');
  const w = numIn(b.essential_weight, 'essential_weight', 0, 1, 0.3);
  if (!Array.isArray(b.districts) || !b.districts.length || b.districts.length > 38) bad('districts must be a non-empty array (max 38)');
  const seen = new Set();
  const ds = b.districts.map(d => { if (!d?.district_id || seen.has(d.district_id)) bad('district_id required and unique'); seen.add(d.district_id);
    const o = { district_id: String(d.district_id), essential_factor: numIn(d.essential_factor, 'essential_factor', 0, 1, 0.5) };
    if (d.deficit_override_mld !== undefined && d.deficit_override_mld !== null) o.deficit_override_mld = numIn(d.deficit_override_mld, 'deficit_override_mld', 0, 100000); return o; });
  return { period, scenario, pool_mld: pool, essential_weight: w, districts: ds };
}
