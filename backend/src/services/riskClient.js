import { config } from '../config/index.js';
export async function callAi(path, body) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), config.aiTimeoutMs);
  try {
    const r = await fetch(config.aiUrl + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: ctl.signal });
    if (!r.ok) { const e = new Error('AI service error ' + r.status); e.status = r.status === 422 ? 422 : 502; throw e; }
    return await r.json();
  } catch (e) { if (e.status) throw e; const err = new Error('AI service unavailable'); err.status = 503; throw err; } finally { clearTimeout(t); }
}
