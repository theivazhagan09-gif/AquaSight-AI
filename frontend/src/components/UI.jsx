import React, { useEffect, useState, useCallback } from 'react'; import { motion, animate } from 'framer-motion'; import { AlertTriangle, RefreshCw } from 'lucide-react'; import { api } from '../services/api'; import { RISK_COL, riskKey } from '../utils/format';
export const Page = ({ title, sub, children }) => <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}><h1>{title}</h1><p className="sub">{sub}</p>{children}</motion.div>;
export const Card = ({ children, i = 0, className = '', ...p }) => <motion.div className={'card ' + className} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * .05 }} {...p}>{children}</motion.div>;
export function Num({ v, d = 0 }) { const [x, setX] = useState(0); useEffect(() => { if (v === null || v === undefined) return; const c = animate(x, v, { duration: .7, onUpdate: n => setX(n) }); return () => c.stop(); }, [v]); return v === null || v === undefined ? <>Data unavailable</> : <>{x.toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d })}</>; }
export const Kpi = ({ label, v, unit, d = 0, i, note }) => <Card i={i} className="kpi"><div className="l">{label}</div><div className="v"><Num v={v} d={d} /> <span className="u">{unit}</span></div>{note && <div className="l">{note}</div>}</Card>;
export const Badge = ({ cat }) => <span className={'badge b-' + riskKey(cat)} style={{}}>{cat}</span>;
export const Skeleton = ({ h = 120 }) => <div className="skel" style={{ height: h }} />;
export const ErrorBox = ({ e, retry }) => <div className="banner err" role="alert"><AlertTriangle size={14} style={{ verticalAlign: -2 }} /> {e} {retry && <button className="btn ghost" style={{ marginLeft: 8, padding: '3px 10px' }} onClick={retry}><RefreshCw size={12} /> Retry</button>}</div>;
export function useApi(path, params, deps = []) {
  const [s, set] = useState({ loading: true }); const [n, setN] = useState(0);
  useEffect(() => { let live = true; set(x => ({ ...x, loading: true, error: null })); api(path, { params }).then(j => live && set({ data: j.data, meta: j.meta })).catch(e => live && set({ error: e.message })); return () => { live = false; }; }, [path, n, ...deps]);
  return { ...s, retry: () => setN(x => x + 1) };
}
export const Async = ({ r, children, h }) => r.error ? <ErrorBox e={r.error} retry={r.retry} /> : r.loading && !r.data ? <Skeleton h={h} /> : r.data ? children(r.data, r.meta) : null;
export const SimTag = ({ meta }) => <>{meta?.projected_period && <span className="tag sim">Projected period</span>} {meta?.simulation && meta.simulation.startsWith('Scenario') && <span className="tag sim">Simulated scenario</span>} <span className="tag">Estimated data · not live</span></>;
export const Table = ({ cols, rows, max = 420 }) => <div style={{ maxHeight: max, overflow: 'auto' }}><table><thead><tr>{cols.map(c => <th key={c.k}>{c.h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={r.id || r.district_id || i}>{cols.map(c => <td key={c.k}>{c.r ? c.r(r) : r[c.k] ?? 'Data unavailable'}</td>)}</tr>)}</tbody></table></div>;
