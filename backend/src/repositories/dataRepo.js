import fs from 'node:fs';
const file = new URL('../../data/district-water-data.json', import.meta.url);
const db = JSON.parse(fs.readFileSync(file, 'utf8'));
export const districts = () => db.districts;
export const periods = () => [...new Set(db.records.map(r => r.Period_Start))].sort();
export const latestObservedPeriod = () => { const o = db.records.filter(r => !r.Is_Projected).map(r => r.Period_Start).sort(); return o[o.length - 1]; };
export const recordsForPeriod = p => db.records.filter(r => r.Period_Start === p);
export const recordsForDistrict = id => db.records.filter(r => r.District_ID === id).sort((a, b) => a.Period_Start.localeCompare(b.Period_Start));
export const telemetry = () => db.telemetry;
export const SOURCE = {
  source_name: 'User-supplied dataset TN_Water_Shortage_ML_ready.csv', source_url: null, geographic_coverage: 'Tamil Nadu, 38 districts, quarterly 2021-2026',
  dataset_type: 'estimated / unverified (provenance undocumented; treat as synthetic demo data, not a live government feed)',
  units: { rainfall: 'mm (quarter total)', demand: 'MLD', supply: 'MLD', storage: '% of capacity', groundwater: 'm below ground level' },
  limitations: ['Original source of the CSV is not documented.', 'Rows flagged Is_Projected=1 are projections, not observations.', 'Not an official or real-time data feed.']
};
