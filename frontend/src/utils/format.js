export const periodLabel = p => { if (!p) return ''; const [y, m] = p.split('-'); return `${y} Q${Math.ceil(+m / 3)}`; };
export const f = (v, d = 1) => (v === null || v === undefined ? 'Data unavailable' : Number(v).toLocaleString('en-IN', { maximumFractionDigits: d }));
export const RISK_COL = { Low: '#2dbf8a', Moderate: '#f2c14e', High: '#f08a3c', Severe: '#d6453d' };
export const riskKey = c => (c || '').split(' ')[0];
export const SEQ = ['#e8f4ff', '#a9d4f5', '#5fb0e8', '#2a7fd1', '#0b4a9e'];
export function download(name, text, type = 'text/csv') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); }
