import test from 'node:test'; import assert from 'node:assert/strict';
process.env.NODE_ENV = 'test';
const { app } = await import('../src/app.js'); const { allocate } = await import('../src/services/allocationService.js'); const { deficitMld } = await import('../src/services/waterService.js');
const { toCsv } = await import('../src/services/csvService.js');
let server, base; test.before(() => new Promise(r => { server = app.listen(0, () => { base = 'http://127.0.0.1:' + server.address().port + '/api/v1'; r(); }); })); test.after(() => server.close());
test('deficit formula', () => { assert.equal(deficitMld(100, 120), 0); assert.equal(deficitMld(120, 100), 20); });
test('allocation invariants + redistribution', () => {
  const items = [{ deficit: 120, deficit_pct: 40, essential: .9 }, { deficit: 5, deficit_pct: 60, essential: .5 }, { deficit: 50, deficit_pct: 20, essential: .5 }, { deficit: 70, deficit_pct: 30, essential: .5 }];
  for (const pool of [0, 10, 100, 1000]) for (const w of [0, .3, 1]) { const r = allocate(items, pool, w);
    r.rows.forEach(x => { assert.ok(x.allocated >= 0 && x.allocated <= x.deficit + 1e-6); assert.ok(x.unmet >= 0); assert.ok(Math.abs(x.unmet - (x.deficit - x.allocated)) < 1e-3); });
    assert.ok(r.total_allocated <= pool + 1e-6); assert.ok(Math.abs(r.total_allocated + r.remaining_pool - pool) < 1e-3 || r.total_allocated === r.total_deficit); }
  const r = allocate(items, 100, .3); assert.equal(r.rows[1].allocated, 5); assert.ok(Math.abs(r.total_allocated - 100) < 1e-3);
});
test('csv escapes', () => { const c = toCsv([{ a: 'x,y' }], ['a'], ['m']); assert.ok(c.includes('"x,y"')); });
test('invalid inputs -> 400', async () => {
  assert.equal((await fetch(base + '/water/map?metric=bogus')).status, 400); assert.equal((await fetch(base + '/water/summary?period=1999-01-01')).status, 400);
  assert.equal((await fetch(base + '/water/summary?demandGrowth=9999')).status, 400);
  const p = await fetch(base + '/allocations/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pool_mld: -5, districts: [] }) }); assert.equal(p.status, 400);
  assert.equal((await fetch(base + '/nope')).status, 404);
});
test('district matching: every record has a district', async () => { const { districts, recordsForPeriod, periods } = await import('../src/repositories/dataRepo.js'); const ids = new Set(districts().map(d => d.district_id)); assert.equal(ids.size, 38); for (const r of recordsForPeriod(periods()[0])) assert.ok(ids.has(r.District_ID)); });
const live = async () => { try { return (await fetch('http://127.0.0.1:8000/health')).ok; } catch { return false; } };
test('node->python integration (needs ai-service running)', async t => {
  if (!(await live())) return t.skip('ai-service not running');
  const r = await (await fetch(base + '/water/summary')).json(); assert.equal(r.meta.ai_service, 'ok'); assert.equal(r.data.kpis.districts_in_data, 38);
  const k = r.data.kpis; assert.equal(Object.values(k.risk_counts).reduce((a, b) => a + b, 0), 38);
  const a = await (await fetch(base + '/predictions/assess', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storage_pct: 20, demand_mld: 100, supply_mld: 70, groundwater_m_bgl: 9, rainfall_anomaly_mm: -100 }) })).json(); assert.equal(a.data.deficit_mld, 30);
  const s = await (await fetch(base + '/allocations/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pool_mld: 100, districts: [{ district_id: 'TN03', deficit_override_mld: 120 }, { district_id: 'TN14', deficit_override_mld: 70 }, { district_id: 'TN04', deficit_override_mld: 50 }] }) })).json();
  assert.ok(s.data.total_allocated <= 100 + 1e-6);
});
