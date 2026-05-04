import { Router, Request, Response } from 'express';
import { deleteSession, getSession, listSessions } from '../storage';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    res.json(await listSessions());
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao listar sessões.' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const session = await getSession(String(req.params.id));
    if (!session) { res.status(404).json({ error: 'Sessão não encontrada.' }); return; }
    res.json(session);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao carregar sessão.' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await deleteSession(String(req.params.id));
    res.json({ ok: true });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao deletar sessão.' });
  }
});

export default router;
