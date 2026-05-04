import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import uploadRouter from './routes/upload';
import generateRouter from './routes/generate';
import sessionsRouter from './routes/sessions';
import exportRouter from './routes/export';

const app = express();
const PORT = process.env.PORT ?? 3001;
const isProd = process.env.NODE_ENV === 'production';

// In dev allow the Vite dev server; in prod same-origin (no CORS needed)
if (!isProd) {
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
  }));
}

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/upload', uploadRouter);
app.use('/api/generate', generateRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/export', exportRouter);

// Serve built frontend in production
const frontendDist = path.join(__dirname, '..', 'public');
if (isProd && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${isProd ? 'production' : 'development'})`);
});
