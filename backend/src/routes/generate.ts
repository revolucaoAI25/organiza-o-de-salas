import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { distribute } from '../services/distributor';
import { saveSession } from '../storage';
import { GenerateRequest, Session } from '../types';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as GenerateRequest;

    if (!body.students || !Array.isArray(body.students) || body.students.length === 0) {
      res.status(400).json({ error: 'Lista de alunos ausente ou vazia.' });
      return;
    }

    const selectedRooms = Array.isArray(body.config?.selectedRooms) && body.config.selectedRooms.length > 0
      ? body.config.selectedRooms
      : undefined;

    const config = {
      sessionName: body.config?.sessionName ?? 'Aplicação de Prova',
      examDate: body.config?.examDate ?? new Date().toLocaleDateString('pt-BR'),
      institutionName: body.config?.institutionName ?? '',
      maxPerRoom: Number(body.config?.maxPerRoom) || 60,
      rows: Number(body.config?.rows) || 6,
      seatsPerRow: Number(body.config?.seatsPerRow) || 10,
      selectedRooms,
    };

    // In catalog mode individual room capacities are used, layout check is irrelevant
    if (!selectedRooms && config.rows * config.seatsPerRow < config.maxPerRoom) {
      res.status(400).json({
        error: `Configuração inválida: ${config.rows} fileiras × ${config.seatsPerRow} carteiras = ${config.rows * config.seatsPerRow} lugares, mas máximo por sala é ${config.maxPerRoom}.`,
      });
      return;
    }

    const rooms = distribute(body.students, config);

    const session: Session = {
      id: uuidv4(),
      name: config.sessionName,
      createdAt: new Date().toISOString(),
      config,
      totalStudents: body.students.length,
      totalRooms: rooms.length,
      rooms,
    };

    await saveSession(session);
    res.json(session);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao gerar distribuição.';
    res.status(500).json({ error: msg });
  }
});

export default router;
