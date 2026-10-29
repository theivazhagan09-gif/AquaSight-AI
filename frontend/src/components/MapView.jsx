import React, { useEffect, useState, useMemo } from 'react'; import { MapContainer, GeoJSON } from 'react-leaflet';
import { RISK_COL, SEQ, riskKey, f } from '../utils/format'; import { ErrorBox, Skeleton } from './UI';
export const LAYERS = {
  rainfall: { label: 'Rainfall', unit: 'mm / quarter', bins: [100, 250, 400, 600], note: 'Fixed illustrative thresholds (mm per quarter); not IMD categories.' },
  availability: { label: 'Water availability (supply ÷ demand)', unit: '%', bins: [60, 75, 90, 100] },
  demand: { label: 'Estimated demand', unit: 'MLD' }, supply: { label: 'Available supply', unit: 'MLD' }, deficit: { label: 'Demand-supply deficit', unit: 'MLD' },
  risk: { label: 'Estimated water-stress risk', unit: 'category', cat: true, note: 'Colours are estimated rule-based model categories, not official drought declarations.' },
  scenario: { label: 'Predicted shortage scenario (stress score)', unit: 'score 0–1', bins: [.25, .45, .65, .8], note: 'Reflects the active scenario sliders (simulated).' },
  priority: { label: 'Allocation priority score', unit: 'score 0–1', bins: [.3, .45, .6, .75], note: '0.7×stress + 0.3×min(1, deficit%/50). Illustrative.' },
  coverage: { label: 'Missing-data coverage (factors missing)', unit: 'count of 4', bins: [0, 1, 2, 3], note: 'Districts with all 4 factors present are lightest.' } };
const binsFor = (m, vals) => { const L = LAYERS[m]; if (L.bins) return L.bins; const v = vals.filter(x => x !== null).sort((a, b) => a - b); if (!v.length) return [0, 1, 2, 3]; const lo = v[0], hi = v[v.length - 1]; return [1, 2, 3, 4].map(i => +(lo + (hi - lo) * i / 5).toFixed(1)); };
const colorFor = (m, d, bins) => { if (!d || d.value === null || d.value === undefined) return '#cfd8e3'; if (LAYERS[m].cat) return RISK_COL[riskKey(d.risk_category)] || '#cfd8e3'; let i = bins.findIndex(b => d.value < b); if (i < 0) i = bins.length; return SEQ[Math.min(i, 4)]; };
export function Legend({ metric, vals }) { const L = LAYERS[metric]; const b = binsFor(metric, vals);
  return <div className="legend" aria-label="Map legend"><b>{L.label}</b> <span style={{ color: '#5d7390' }}>({L.unit})</span>
    {L.cat ? Object.entries(RISK_COL).map(([k, c]) => <div key={k}><i style={{ background: c }} />{k}</div>) : SEQ.map((c, i) => <div key={i}><i style={{ background: c }} />{i === 0 ? `< ${b[0]}` : i === 4 ? `≥ ${b[3]}` : `${b[i - 1]} – ${b[i]}`}</div>)}
    <div><i style={{ background: '#cfd8e3' }} />Data unavailable / no boundary</div>{L.note && <div style={{ marginTop: 4, color: '#5d7390' }}>{L.note}</div>}</div>; }
export default function MapView({ data, metric, selected, onSelect, period, height }) {
  const [geo, setGeo] = useState(null), [err, setErr] = useState(null);
  useEffect(() => { fetch('/data/tamil-nadu-districts.geojson').then(r => { if (!r.ok) throw new Error('GeoJSON not found (' + r.status + ')'); return r.json(); }).then(setGeo).catch(e => setErr(e.message)); }, []);
  const by = useMemo(() => Object.fromEntries(data.map(d => [d.district_id, d])), [data]); const bins = binsFor(metric, data.map(d => d.value));
  if (err) return <ErrorBox e={'Boundary file failed to load: ' + err + '. Run scripts/prepare_data.py to regenerate it.'} />; if (!geo) return <Skeleton h={height || 400} />;
  const style = ft => { const d = by[ft.properties.district_id]; const sel = ft.properties.district_id === selected; return { fillColor: colorFor(metric, d, bins), fillOpacity: .88, color: sel ? '#0b2545' : '#fff', weight: sel ? 3 : 1 }; };
  const each = (ft, layer) => { const d = by[ft.properties.district_id]; const val = !d || d.value === null ? 'Data unavailable' : `${f(d.value, 2)} ${LAYERS[metric].unit}`;
    layer.bindTooltip(`<b>${ft.properties.name}</b><br/>${LAYERS[metric].label}: ${val}`, { sticky: true }); layer.on({ click: () => onSelect(ft.properties.district_id), mouseover: e => e.target.setStyle({ weight: 2.5, color: '#1769e0' }), mouseout: e => e.target.setStyle(style(ft)) }); };
  return <div style={{ height: height || '100%', position: 'relative' }}><MapContainer center={[10.9, 78.5]} zoom={7} minZoom={6} maxZoom={11} zoomSnap={.25} style={{ height: '100%' }} scrollWheelZoom attributionControl={false}>
    <GeoJSON key={metric + period + JSON.stringify(data.map(d => d.value)) + selected} data={geo} style={style} onEachFeature={each} /></MapContainer>
    <Legend metric={metric} vals={data.map(d => d.value)} />
    <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 900, background: '#fffe', padding: '4px 8px', borderRadius: 8, fontSize: 11 }}>Boundaries: {geo.features.length} of 38 districts (Mayiladuthurai not in source file) · Period {period}</div></div>; }
