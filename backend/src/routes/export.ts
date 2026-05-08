import { Router, Request, Response } from 'express';
import { generateListPDF, generateMapPDF, generateClassListPDF, generateSignaturePDF } from '../services/pdfGenerator';
import { generateXLSX } from '../services/xlsxExporter';
import { getSession } from '../storage';

const router = Router();

router.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const session = await getSession(String(req.params.id));
    if (!session) { res.status(404).json({ error: 'Sessão não encontrada.' }); return; }
    const pdf = await generateListPDF(session);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="salas-${slugify(session.name)}.pdf"`);
    res.send(pdf);
  } catch (err) { console.error('PDF list error:', err); res.status(500).json({ error: 'Erro ao gerar PDF.' }); }
});

router.get('/:id/pdf-map', async (req: Request, res: Response) => {
  try {
    const session = await getSession(String(req.params.id));
    if (!session) { res.status(404).json({ error: 'Sessão não encontrada.' }); return; }

    // Board positions are passed as a JSON query parameter from the frontend
    let boardPositions: Record<number, string> = {};
    if (req.query.positions) {
      try { boardPositions = JSON.parse(String(req.query.positions)); } catch { /* ignore */ }
    }

    const pdf = await generateMapPDF(session, boardPositions);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="mapa-${slugify(session.name)}.pdf"`);
    res.send(pdf);
  } catch (err) { console.error('PDF map error:', err); res.status(500).json({ error: 'Erro ao gerar mapa PDF.' }); }
});

router.get('/:id/xlsx', async (req: Request, res: Response) => {
  try {
    const session = await getSession(String(req.params.id));
    if (!session) { res.status(404).json({ error: 'Sessão não encontrada.' }); return; }
    const xlsx = await generateXLSX(session);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="salas-${slugify(session.name)}.xlsx"`);
    res.send(xlsx);
  } catch (err) { console.error('XLSX error:', err); res.status(500).json({ error: 'Erro ao gerar XLSX.' }); }
});

router.get('/:id/pdf-turmas', async (req: Request, res: Response) => {
  try {
    const session = await getSession(String(req.params.id));
    if (!session) { res.status(404).json({ error: 'Sessão não encontrada.' }); return; }
    const pdf = await generateClassListPDF(session);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="turmas-${slugify(session.name)}.pdf"`);
    res.send(pdf);
  } catch (err) { console.error('PDF turmas error:', err); res.status(500).json({ error: 'Erro ao gerar PDF por turma.' }); }
});

router.get('/:id/pdf-assinaturas', async (req: Request, res: Response) => {
  try {
    const session = await getSession(String(req.params.id));
    if (!session) { res.status(404).json({ error: 'Sessão não encontrada.' }); return; }
    const pdf = await generateSignaturePDF(session);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="assinaturas-${slugify(session.name)}.pdf"`);
    res.send(pdf);
  } catch (err) { console.error('PDF assinaturas error:', err); res.status(500).json({ error: 'Erro ao gerar PDF de assinaturas.' }); }
});

function slugify(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default router;
