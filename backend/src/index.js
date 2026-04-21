import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { testConnection } from './db/postgres.js';
import { getSqlite } from './db/sqlite.js';
import carRouter from './routes/car.js';
import tariffsRouter from './routes/tariffs.js';
import chargeCostRouter from './routes/chargeCost.js';
import widgetsRouter from './routes/widgets.js';
import settingsRouter from './routes/settings.js';
import updateRouter from './routes/update.js';
import linksRouter from './routes/links.js';
import layoutRouter from './routes/layout.js';
import tripsRouter  from './routes/trips.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/car',         carRouter);
app.use('/api/tariffs',     tariffsRouter);
app.use('/api/charge-cost', chargeCostRouter);
app.use('/api/widgets',     widgetsRouter);
app.use('/api/settings',    settingsRouter);
app.use('/api/update',      updateRouter);
app.use('/api/links',       linksRouter);
app.use('/api/layout',      layoutRouter);
app.use('/api/trips',       tripsRouter);

app.get('/api/health', async (req, res) => {
  const pg = await testConnection();
  getSqlite(); // ensure SQLite is init'd
  res.json({
    status: 'ok',
    postgres: pg.ok ? 'connected' : 'error',
    postgres_error: pg.error || null,
    timezone: process.env.TIMEZONE || 'UTC',
  });
});

// Serve built frontend in production
const publicDir = path.join(__dirname, '../public');
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`TeslaMate Dashboard API listening on :${PORT}`);
  testConnection().then(r => {
    if (r.ok) console.log('PostgreSQL connected');
    else console.warn('PostgreSQL connection failed:', r.error);
  });
  getSqlite();
  console.log('SQLite ready');
});
