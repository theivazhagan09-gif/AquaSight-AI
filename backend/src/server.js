import { app } from './app.js'; import { config } from './config/index.js';
app.listen(config.port, () => console.log(`AquaSight backend on http://localhost:${config.port}  (AI service: ${config.aiUrl})`));
