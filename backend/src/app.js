import express from 'express'; import cors from 'cors'; import routes from './routes/index.js'; import { notFound, errorHandler } from './middleware/error.js'; import { config } from './config/index.js';
export const app = express();
app.use(cors({ origin: [config.corsOrigin, 'http://127.0.0.1:5173'] })); app.use(express.json({ limit: '200kb' }));
if (process.env.NODE_ENV !== 'test') app.use((req, _r, n) => { console.log(new Date().toISOString(), req.method, req.originalUrl); n(); });
app.use('/api/v1', routes); app.use(notFound); app.use(errorHandler);
