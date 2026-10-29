export const notFound = (req, res) => res.status(404).json({ ok: false, error: { message: `Route not found: ${req.method} ${req.path}` } });
export const errorHandler = (err, req, res, _next) => { const status = err.status || 500; if (status >= 500 && process.env.NODE_ENV !== 'test') console.error(err.message);
  res.status(status).json({ ok: false, error: { message: status === 500 ? 'Internal server error' : err.message } }); };
export const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
