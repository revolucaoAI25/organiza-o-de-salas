import { Router, Request, Response } from 'express';
import { deleteSession, getSession, listSessions, saveSession } from '../storage';
import { Allocation, Room } from '../types';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try { res.json(await listSessions()); }
  catch (err) { res.status(500).json({ error: err instanceof Error ? err.message : 'Erro.' }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const session = await getSession(String(req.params.id));
    if (!session) { res.status(404).json({ error: 'Sessão não encontrada.' }); return; }
    res.json(session);
  } catch (err) { res.status(500).json({ error: err instanceof Error ? err.message : 'Erro.' }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try { await deleteSession(String(req.params.id)); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: err instanceof Error ? err.message : 'Erro.' }); }
});

interface SeatPos { roomNumber: number; rowNumber: number; seatNumber: number; }

// PATCH /api/sessions/:id/seats — swap two students or move one to an empty seat
router.patch('/:id/seats', async (req: Request, res: Response) => {
  try {
    const session = await getSession(String(req.params.id));
    if (!session?.rooms) { res.status(404).json({ error: 'Sessão não encontrada.' }); return; }

    const { from, to } = req.body as { from: SeatPos; to: SeatPos };
    if (!from || !to) { res.status(400).json({ error: 'Parâmetros from/to obrigatórios.' }); return; }

    // Deep-clone rooms
    const rooms: Room[] = session.rooms.map(r => ({
      ...r, allocations: r.allocations.map(a => ({ ...a })),
    }));

    const fromRoom = rooms.find(r => r.roomNumber === from.roomNumber);
    const toRoom   = rooms.find(r => r.roomNumber === to.roomNumber);
    if (!fromRoom || !toRoom) { res.status(400).json({ error: 'Sala inválida.' }); return; }

    const fromIdx = fromRoom.allocations.findIndex(
      a => a.rowNumber === from.rowNumber && a.seatNumber === from.seatNumber
    );
    if (fromIdx < 0) { res.status(400).json({ error: 'Aluno não encontrado na posição de origem.' }); return; }

    const toIdx = toRoom.allocations.findIndex(
      a => a.rowNumber === to.rowNumber && a.seatNumber === to.seatNumber
    );

    const fromAlloc: Allocation = { ...fromRoom.allocations[fromIdx] };

    if (toIdx >= 0) {
      // Both seats occupied — swap students, keep seat numbers
      const toAlloc: Allocation = { ...toRoom.allocations[toIdx] };
      fromRoom.allocations[fromIdx] = { ...toAlloc, rowNumber: from.rowNumber, seatNumber: from.seatNumber };
      toRoom.allocations[toIdx]     = { ...fromAlloc, rowNumber: to.rowNumber,   seatNumber: to.seatNumber   };
    } else {
      // Destination is empty — move student
      fromRoom.allocations.splice(fromIdx, 1);
      toRoom.allocations.push({ ...fromAlloc, rowNumber: to.rowNumber, seatNumber: to.seatNumber });
      const byPos = (a: Allocation, b: Allocation) =>
        a.rowNumber !== b.rowNumber ? a.rowNumber - b.rowNumber : a.seatNumber - b.seatNumber;
      fromRoom.allocations.sort(byPos);
      toRoom.allocations.sort(byPos);
    }

    // Recalculate stats
    for (const room of [fromRoom, toRoom]) {
      room.stats = {
        grade1: room.allocations.filter(a => a.grade === '1ª SÉRIE').length,
        grade2: room.allocations.filter(a => a.grade === '2ª SÉRIE').length,
        grade3: room.allocations.filter(a => a.grade === '3ª SÉRIE').length,
      };
    }

    const updated = { ...session, rooms };
    await saveSession(updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao mover aluno.' });
  }
});

export default router;
