import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import uploadRouter from './routes/upload';
import generateRouter from './routes/generate';
import sessionsRouter from './routes/sessions';
import exportRouter from './routes/export';

const app = express();
const PORT = process.env.PORT ?? 3001;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/upload', uploadRouter);
app.use('/api/generate', generateRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/export', exportRouter);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
