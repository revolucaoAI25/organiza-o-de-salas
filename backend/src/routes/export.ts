import { Router, Request, Response } from 'express';
import { generateListPDF, generateMapPDF } from '../services/pdfGenerator';
import { generateXLSX } from '../services/xlsxExporter';
import { getSession } from '../storage';

const router = Router();

router.get('/:id/pdf', (req: Request, res: Response) => {
  const session = getSession(String(req.params.id));
  if (!session) { res.status(404).json({ error: 'Sessão não encontrada.' }); return; }

  try {
    const pdf = generateListPDF(session);
    const filename = `salas-${slugify(session.name)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
  } catch (err: unknown) {
    res.status(500).json({ error: 'Erro ao gerar PDF.' });
  }
});

router.get('/:id/pdf-map', (req: Request, res: Response) => {
  const session = getSession(String(req.params.id));
  if (!session) { res.status(404).json({ error: 'Sessão não encontrada.' }); return; }

  try {
    const pdf = generateMapPDF(session);
    const filename = `mapa-salas-${slugify(session.name)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
  } catch (err: unknown) {
    res.status(500).json({ error: 'Erro ao gerar mapa PDF.' });
  }
});

router.get('/:id/xlsx', async (req: Request, res: Response) => {
  const session = getSession(String(req.params.id));
  if (!session) { res.status(404).json({ error: 'Sessão não encontrada.' }); return; }

  try {
    const xlsx = await generateXLSX(session);
    const filename = `salas-${slugify(session.name)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(xlsx);
  } catch (err: unknown) {
    res.status(500).json({ error: 'Erro ao gerar XLSX.' });
  }
});

function slugify(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default router;
