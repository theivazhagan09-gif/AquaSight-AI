import React, { useState, useEffect, useMemo } from 'react'; import { AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Map as MapIcon, Brain, CloudRain, Droplets, Share2, Bell, BarChart3, ShieldCheck, Settings as Cog, Menu, SlidersHorizontal, CircleDot } from 'lucide-react';
import { Ctx } from './ctx'; import { api } from './services/api'; import { periodLabel } from './utils/format'; import { useApi } from './components/UI';
import { Overview, MapPage, Prediction } from './pages/Core'; import { Rainfall, DemandSupply, Allocation, Alerts, Analytics, Sources, Settings } from './pages/More';
const NAV = [['overview', 'Overview', LayoutDashboard, Overview], ['map', 'Water Intelligence Map', MapIcon, MapPage], ['predict', 'AI Prediction Center', Brain, Prediction], ['rain', 'Rainfall & Drought', CloudRain, Rainfall],
  ['ds', 'Water Demand & Supply', Droplets, DemandSupply], ['alloc', 'Allocation Simulator', Share2, Allocation], ['alerts', 'Alerts & Risk Monitoring', Bell, Alerts], ['analytics', 'Analytics & Reports', BarChart3, Analytics], ['sources', 'Data Sources & Transparency', ShieldCheck, Sources], ['settings', 'Settings', Cog, Settings]];
export default function App() {
  const [page, setPage] = useState(location.hash.slice(1) || 'overview'); const [open, setOpen] = useState(false); const [sc, setSc] = useState({ demandGrowth: 0, supplyChange: 0, rainfallChange: 0 }); const [pop, setPop] = useState(false);
  const [period, setPeriod] = useState(null); const [district, setDistrict] = useState(null); const [lastAlloc, setLastAlloc] = useState(null);
  const periods = useApi('/periods'); const health = useApi('/health', null, [page]);
  useEffect(() => { if (periods.data && !period) setPeriod(periods.data.default); }, [periods.data]);
  useEffect(() => { const h = () => setPage(location.hash.slice(1) || 'overview'); addEventListener('hashchange', h); return () => removeEventListener('hashchange', h); }, []);
  const go = p => { location.hash = p; setPage(p); setOpen(false); };
  const q = useMemo(() => ({ period, ...sc }), [period, sc]); const active = NAV.find(n => n[0] === page) || NAV[0]; const Page = active[3];
  const aiOk = health.data?.ai_service?.status === 'ok'; const beOk = !!health.data;
  const dirty = Object.values(sc).some(v => v);
  return <Ctx.Provider value={{ period, q, sc, setSc, district, setDistrict, go, lastAlloc, setLastAlloc, periods: periods.data?.periods || [] }}>
    <div className="app"><aside className={'side' + (open ? ' open' : '')} aria-label="Main navigation"><div className="brand"><div className="logo"><Droplets size={20} /></div><div><b>AquaSight AI</b><small>Predict Water. Prevent Scarcity.</small></div></div>
      {NAV.map(([k, l, I]) => <button key={k} className={'nav' + (page === k ? ' on' : '')} onClick={() => go(k)} aria-current={page === k}><I size={17} />{l}</button>)}
      <div style={{ marginTop: 'auto', fontSize: 11, color: '#5d7390', padding: 8 }}>Tamil Nadu only · Rule-based prototype · Estimated demo data</div></aside>
      <div className="main"><header className="top"><button className="menu" onClick={() => setOpen(!open)} aria-label="Menu"><Menu size={16} /></button>
        <label style={{ fontSize: 13 }}>Period <select value={period || ''} onChange={e => setPeriod(e.target.value)}>{(periods.data?.periods || []).map(p => <option key={p} value={p}>{periodLabel(p)}{periods.data.periods.indexOf(p) === periods.data.periods.length - 1 ? ' (projected)' : ''}</option>)}</select></label>
        <DistrictSelect />
        <button onClick={() => setPop(!pop)} aria-expanded={pop}><SlidersHorizontal size={14} style={{ verticalAlign: -2 }} /> Scenario{dirty ? ' • active' : ''}</button>
        <span style={{ marginLeft: 'auto', fontSize: 12, display: 'flex', gap: 12 }} title="Dataset / service status"><span><CircleDot size={11} color={beOk ? '#2dbf8a' : '#d6453d'} /> API {beOk ? 'online' : 'offline'}</span><span><CircleDot size={11} color={aiOk ? '#2dbf8a' : '#d6453d'} /> AI service {aiOk ? 'online' : 'offline'}</span><span className="tag sim">Estimated demo dataset</span></span>
        {pop && <div className="card pop"><b>Scenario what-if</b> <span className="tag sim">simulated</span>{[['demandGrowth', 'Demand growth', -20, 50], ['supplyChange', 'Supply change', -50, 50], ['rainfallChange', 'Rainfall change', -60, 100]].map(([k, l, lo, hi]) => <div className="range" key={k}><span style={{ width: 100 }}>{l}</span><input type="range" min={lo} max={hi} value={sc[k]} onChange={e => setSc({ ...sc, [k]: +e.target.value })} /><span style={{ width: 40 }}>{sc[k]}%</span></div>)}
          <button className="btn ghost" onClick={() => setSc({ demandGrowth: 0, supplyChange: 0, rainfallChange: 0 })}>Reset scenario</button></div>}</header>
        <main className="content"><svg className="wave" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden><path d="M0 60 Q 60 30 120 60 T 240 60 T 360 60 T 480 60 T 600 60 T 720 60 T 840 60 T 960 60 T 1080 60 T 1200 60 T 1320 60 T 1440 60 V0 H0Z" fill="#d6ecff" /></svg>
          <div style={{ position: 'relative' }}>{health.error && <div className="banner err" role="alert">Backend unreachable: {health.error}. Start it with <code>npm start</code> in /backend.</div>}
            {health.data && !aiOk && <div className="banner err" role="alert">AI service offline — risk scores unavailable. Start it: <code>uvicorn app.main:app --port 8000</code> in /ai-service.</div>}
            {period ? <AnimatePresence mode="wait"><Page key={page} /></AnimatePresence> : periods.error ? null : <p>Loading…</p>}</div></main></div></div></Ctx.Provider>;
}
function DistrictSelect() { const { q, district, setDistrict, period } = React.useContext(Ctx); const d = useApi('/districts', q, [JSON.stringify(q)]);
  return <label style={{ fontSize: 13 }}>District <select value={district || ''} onChange={e => setDistrict(e.target.value || null)} aria-label="Select district"><option value="">All Tamil Nadu</option>{(d.data || []).map(x => <option key={x.district_id} value={x.district_id}>{x.name}</option>)}</select></label>; }
