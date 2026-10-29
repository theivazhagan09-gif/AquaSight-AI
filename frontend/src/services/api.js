const base = () => (localStorage.getItem('aq_api') || '') + '/api/v1';
export async function api(path, { params, body, timeout = 15000, raw } = {}) {
  const qs = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))) : '';
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(base() + path + qs, { method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, signal: ctl.signal });
    if (raw) return r;
    const j = await r.json().catch(() => null);
    if (!j || typeof j.ok !== 'boolean') throw new Error('Invalid response from API');
    if (!j.ok) throw new Error(j.error?.message || 'Request failed');
    return j;
  } catch (e) { throw new Error(e.name === 'AbortError' ? 'Request timed out' : e.message === 'Failed to fetch' ? 'Backend unreachable — is it running on port 4000?' : e.message); } finally { clearTimeout(t); }
}
export const exportUrl = p => base() + '/reports/export?' + new URLSearchParams(p);
