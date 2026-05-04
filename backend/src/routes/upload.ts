import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseStudentsFromBuffer } from '../services/xlsxParser';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      return;
    }

    const ext = req.file.originalname.toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
      res.status(400).json({ error: 'Formato inválido. Envie um arquivo .xlsx ou .xls.' });
      return;
    }

    const result = parseStudentsFromBuffer(req.file.buffer);

    if (result.totals.total === 0) {
      res.status(422).json({ error: 'Nenhum aluno encontrado na planilha.' });
      return;
    }

    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao processar planilha.';
    res.status(422).json({ error: msg });
  }
});

export default router;
