import { snapshot } from './waterService.js';
export const ALGO = 'Priority-weighted water-filling: priority_i = (1-w)*severity_i + w*essential_i, severity_i = min(1, deficit_pct_i/50). The pool is split proportionally to priority; any district reaching its deficit cap is fixed at its deficit and the leftover is redistributed among the rest; loops until the pool or all deficits are exhausted (at most n+1 iterations).';
export function allocate(items, pool, w = 0.3) {
  const EPS = 1e-9; const out = items.map(i => ({ ...i, allocated: 0, priority: (1 - w) * Math.min(1, i.deficit_pct / 50) + w * i.essential }));
  let rem = pool, active = out.filter(o => o.deficit > EPS && o.priority > 0);
  for (let it = 0; it < items.length + 1 && rem > EPS && active.length; it++) {
    const tp = active.reduce((a, o) => a + o.priority, 0); let spent = 0;
    for (const o of active) { const give = Math.min(rem * o.priority / tp, o.deficit - o.allocated); o.allocated += give; spent += give; }
    rem -= spent; active = active.filter(o => o.deficit - o.allocated > EPS);
  }
  const rows = out.map(o => { const a = Math.max(0, Math.min(o.deficit, +o.allocated.toFixed(4))); return { ...o, allocated: a, unmet: +(o.deficit - a).toFixed(4), priority: +o.priority.toFixed(4) }; });
  const total = rows.reduce((a, r) => a + r.allocated, 0);
  return { rows, total_allocated: +total.toFixed(4), remaining_pool: +Math.max(0, pool - total).toFixed(4), total_unmet: +rows.reduce((a, r) => a + r.unmet, 0).toFixed(4), total_deficit: +rows.reduce((a, r) => a + r.deficit, 0).toFixed(4) };
}
export async function simulate({ period, scenario = {}, pool_mld, essential_weight = 0.3, districts }) {
  const { rows: snap, meta } = await snapshot(period, scenario); const by = Object.fromEntries(snap.map(r => [r.district_id, r]));
  const items = districts.map(d => { const s = by[d.district_id]; if (!s) { const e = new Error('Unknown district_id ' + d.district_id); e.status = 404; throw e; }
    const manual = d.deficit_override_mld !== undefined; const deficit = manual ? d.deficit_override_mld : s.deficit_mld;
    if (deficit === null || deficit === undefined) { const e = new Error(`Deficit unavailable for ${d.district_id}`); e.status = 422; throw e; }
    const dp = manual ? (s.demand_mld ? Math.min(100, deficit / s.demand_mld * 100) : 50) : s.deficit_pct;
    return { district_id: d.district_id, name: s.name, deficit, deficit_pct: dp ?? 0, essential: d.essential_factor ?? 0.5, deficit_source: manual ? 'manual / illustrative input' : 'dataset deficit (scenario-adjusted)' }; });
  const res = allocate(items, pool_mld, essential_weight);
  return { ...res, pool_mld, essential_weight, algorithm: ALGO, label: 'Simulated allocation — not a government decision.', meta: { period, scenario, generated_at: new Date().toISOString(), units: 'MLD', source: meta.source.source_name, data_status: 'simulation' } };
}
