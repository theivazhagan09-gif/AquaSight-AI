import { snapshot } from './waterService.js';
export async function alerts(period, sc) {
  const { rows, meta } = await snapshot(period, sc); const at = meta.generated_at; const out = [];
  const base = { generated_at: at, data_status: 'Derived from estimated demonstration data — not an official warning' };
  const add = (r, rule, sev, metric, value, unit, action) => out.push({ id: `${r.district_id}:${rule}:${period}`, district_id: r.district_id, district: r.name, rule, severity: sev, metric, value, unit, action, ...base });
  const d = rows.map(r => r.deficit_mld).filter(x => x !== null).sort((a, b) => a - b); const p90 = d[Math.floor(d.length * 0.9)] ?? Infinity;
  for (const r of rows) {
    if (r.deficit_mld !== null && r.deficit_mld >= p90 && r.deficit_mld > 0) add(r, 'high_deficit', 'critical', 'deficit (top decile)', r.deficit_mld, 'MLD', 'Review supply augmentation / tanker planning for this district.');
    if (r.stress_score !== null && r.stress_score >= 0.65) add(r, 'elevated_stress', 'critical', 'stress score', r.stress_score, 'score 0-1', 'Prioritise in allocation scenarios; review the largest stress factor.');
    else if (r.stress_score !== null && r.stress_score >= 0.45) add(r, 'elevated_stress', 'warning', 'stress score', r.stress_score, 'score 0-1', 'Monitor; check storage and groundwater trend.');
    if (r.storage_pct !== null && r.storage_pct < 30) add(r, 'low_storage', 'warning', 'reservoir storage', r.storage_pct, '%', 'Conserve storage; consider demand management.');
    if ((sc.demandGrowth || 0) > 0 && r.demand_mld > r.supply_mld && r.supply_mld !== null) add(r, 'demand_exceeds_supply', 'warning', 'demand minus supply', +(r.demand_mld - r.supply_mld).toFixed(1), 'MLD', 'Scenario demand growth exceeds supply; plan additional supply.');
    if (r.missing_factors.length) add(r, 'missing_data', 'info', 'missing factors', r.missing_factors.length, r.missing_factors.join(','), 'Collect missing observations; score excludes them (not zero-filled).');
  }
  const o = { critical: 0, warning: 1, info: 2 }; out.sort((a, b) => o[a.severity] - o[b.severity]);
  return { alerts: out, meta };
}
