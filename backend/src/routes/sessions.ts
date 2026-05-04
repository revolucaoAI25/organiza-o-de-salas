import { Router, Request, Response } from 'express';
import { deleteSession, getSession, listSessions } from '../storage';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json(listSessions());
});

router.get('/:id', (req: Request, res: Response) => {
  const session = getSession(String(req.params.id));
  if (!session) {
    res.status(404).json({ error: 'Sessão não encontrada.' });
    return;
  }
  res.json(session);
});

router.delete('/:id', (req: Request, res: Response) => {
  deleteSession(String(req.params.id));
  res.json({ ok: true });
});

export default router;
