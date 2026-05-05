import PDFDocument from 'pdfkit';
import { Session } from '../types';

const GRADE_COLOR: Record<string, string> = {
  '1ª SÉRIE': '#1d4ed8', '2ª SÉRIE': '#15803d', '3ª SÉRIE': '#c2410c',
};
const GRADE_BG: Record<string, string> = {
  '1ª SÉRIE': '#dbeafe', '2ª SÉRIE': '#dcfce7', '3ª SÉRIE': '#ffedd5',
};
const gc = (g: string) => GRADE_COLOR[g] ?? '#374151';
const gb = (g: string) => GRADE_BG[g] ?? '#f3f4f6';

type BoardPos = 'top' | 'bottom' | 'left' | 'right';

function docToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

// ── List PDF ───────────────────────────────────────────────────────────────

export async function generateListPDF(session: Session): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4', autoFirstPage: true });
  const buf = docToBuffer(doc);
  const rooms = session.rooms ?? [];
  const pageW = doc.page.width - 80;

  rooms.forEach((room, ri) => {
    if (ri > 0) doc.addPage();

    doc.rect(40, 40, pageW, 52).fill('#1e3a5f');
    doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
      .text(session.config.institutionName || 'Distribuição de Salas de Prova', 50, 48, { width: pageW - 20 });
    doc.fontSize(9).font('Helvetica')
      .text(`${session.config.sessionName}   ·   ${session.config.examDate}`, 50, 64, { width: pageW - 20 });

    const iy = 102;
    doc.rect(40, iy, pageW, 24).fill('#e8edf4');
    doc.fillColor('#1e3a5f').fontSize(11).font('Helvetica-Bold')
      .text(room.roomName, 50, iy + 6, { width: 120 });
    doc.fillColor('#374151').fontSize(9).font('Helvetica')
      .text(
        `Total: ${room.allocations.length}   |   1ª: ${room.stats.grade1}   2ª: ${room.stats.grade2}   3ª: ${room.stats.grade3}`,
        175, iy + 8, { width: pageW - 135 }
      );

    const TY = 136;
    const cols = { num: 50, place: 88, name: 145, grade: 390, turma: 462 };
    const colW = { num: 36, place: 52, name: 242, grade: 68, turma: 80 };
    doc.rect(40, TY, pageW, 16).fill('#334155');
    doc.fillColor('white').fontSize(7.5).font('Helvetica-Bold');
    doc.text('Nº',    cols.num,   TY + 4, { width: colW.num });
    doc.text('Lugar', cols.place, TY + 4, { width: colW.place });
    doc.text('Nome',  cols.name,  TY + 4, { width: colW.name });
    doc.text('Série', cols.grade, TY + 4, { width: colW.grade });
    doc.text('Turma', cols.turma, TY + 4, { width: colW.turma });

    let y = TY + 16;
    let curRow = 0;

    room.allocations.forEach((alloc, idx) => {
      if (alloc.rowNumber !== curRow) {
        curRow = alloc.rowNumber;
        if (y > doc.page.height - 50) { doc.addPage(); y = 40; }
        doc.rect(40, y, pageW, 13).fill('#f1f5f9');
        doc.fillColor('#475569').fontSize(7).font('Helvetica-Bold')
          .text(`— Fileira ${curRow} —`, 50, y + 3, { width: pageW - 20 });
        y += 13;
      }
      if (y > doc.page.height - 50) {
        doc.addPage(); y = 40;
        doc.rect(40, y, pageW, 16).fill('#334155');
        doc.fillColor('white').fontSize(7.5).font('Helvetica-Bold');
        doc.text('Nº',    cols.num,   y + 4, { width: colW.num });
        doc.text('Lugar', cols.place, y + 4, { width: colW.place });
        doc.text('Nome',  cols.name,  y + 4, { width: colW.name });
        doc.text('Série', cols.grade, y + 4, { width: colW.grade });
        doc.text('Turma', cols.turma, y + 4, { width: colW.turma });
        y += 16;
      }
      doc.rect(40, y, pageW, 15).fill(idx % 2 === 0 ? '#ffffff' : '#f8fafc');
      doc.fillColor('#111827').fontSize(7.5).font('Helvetica');
      doc.text(String(idx + 1), cols.num, y + 3.5, { width: colW.num });
      doc.text(`F${alloc.rowNumber}·C${alloc.seatNumber}`, cols.place, y + 3.5, { width: colW.place });
      doc.text(alloc.studentName, cols.name, y + 3.5, { width: colW.name });
      doc.rect(cols.grade - 1, y + 2, 64, 11).fill(gb(alloc.grade));
      doc.fillColor(gc(alloc.grade)).font('Helvetica-Bold').fontSize(7)
        .text(alloc.grade.replace(' SÉRIE', 'ª'), cols.grade + 1, y + 4, { width: 60 });
      doc.fillColor('#374151').font('Helvetica').fontSize(7.5)
        .text(alloc.classCode, cols.turma, y + 3.5, { width: colW.turma });
      y += 15;
    });

    doc.fillColor('#9ca3af').fontSize(7).font('Helvetica')
      .text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 40, doc.page.height - 30, {
        width: pageW, align: 'center',
      });
  });

  doc.end();
  return buf;
}

// ── Map PDF ────────────────────────────────────────────────────────────────

export async function generateMapPDF(
  session: Session,
  boardPositions: Record<number, string> = {}
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape', autoFirstPage: true });
  const buf = docToBuffer(doc);

  const rooms = session.rooms ?? [];
  const { rows, seatsPerRow } = session.config;
  const BOARD_THICK = 14; // px for horizontal board bar
  const BOARD_SIDE  = 18; // px for vertical board bar

  rooms.forEach((room, ri) => {
    if (ri > 0) doc.addPage();

    const pageW = doc.page.width - 80;
    const pageH = doc.page.height - 80;
    const boardPos: BoardPos = (boardPositions[room.roomNumber] ?? 'left') as BoardPos;

    // Header
    doc.rect(40, 40, pageW, 40).fill('#1e3a5f');
    doc.fillColor('white').fontSize(12).font('Helvetica-Bold')
      .text(`Mapa de Sala — ${room.roomName}`, 52, 47, { width: pageW - 20 });
    doc.fontSize(8.5).font('Helvetica')
      .text(
        `${session.config.sessionName}   ·   ${session.config.examDate}   ·   ${room.allocations.length} alunos   (1ª: ${room.stats.grade1}  2ª: ${room.stats.grade2}  3ª: ${room.stats.grade3})`,
        52, 63, { width: pageW - 20 }
      );

    // Legend
    const ly = 90;
    [
      { label: '1ª Série', color: '#1d4ed8', bg: '#dbeafe' },
      { label: '2ª Série', color: '#15803d', bg: '#dcfce7' },
      { label: '3ª Série', color: '#c2410c', bg: '#ffedd5' },
      { label: 'Vazio',    color: '#9ca3af', bg: '#f3f4f6' },
    ].forEach((item, i) => {
      const lx = 42 + i * 80;
      doc.rect(lx, ly, 11, 11).fill(item.bg);
      doc.rect(lx, ly, 11, 11).stroke(item.color);
      doc.fillColor(item.color).fontSize(8).font('Helvetica-Bold').text(item.label, lx + 14, ly + 1.5);
    });

    // Seat grid dimensions
    const gridTop = ly + 20;
    const availH  = pageH - gridTop + 30;
    const cellW   = Math.min(Math.floor((pageW - (boardPos === 'left' || boardPos === 'right' ? BOARD_SIDE + 4 : 0)) / seatsPerRow) - 2, 88);
    const cellH   = Math.min(Math.floor((availH  - (boardPos === 'top'  || boardPos === 'bottom' ? BOARD_THICK + 4 : 0)) / rows) - 4, 50);

    // Grid origin depends on board position
    const gridX = boardPos === 'left'  ? 40 + BOARD_SIDE + 4 : 40;
    const gridY = boardPos === 'top'   ? gridTop + BOARD_THICK + 4 : gridTop;

    // ── Draw board indicator ──────────────────────────────────────────
    if (boardPos === 'top' || boardPos === 'bottom') {
      const bW = seatsPerRow * (cellW + 2) - 2;
      const bY = boardPos === 'top'
        ? gridTop
        : gridY + rows * (cellH + 4);
      doc.rect(gridX, bY, bW, BOARD_THICK).fill('#1e293b');
      doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
        .text('QUADRO / FRENTE DA SALA', gridX, bY + 3.5, { width: bW, align: 'center' });
    } else {
      // left or right — vertical bar with rotated text
      const bH = rows * (cellH + 4);
      const bX = boardPos === 'left' ? 40 : gridX + seatsPerRow * (cellW + 2);
      doc.rect(bX, gridY, BOARD_SIDE, bH).fill('#1e293b');
      // Rotated text via transform
      doc.save();
      const cx = bX + BOARD_SIDE / 2;
      const cy = gridY + bH / 2;
      doc.translate(cx, cy);
      doc.rotate(boardPos === 'left' ? -90 : 90);
      doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
        .text('QUADRO / FRENTE', -bH / 4, -5, { width: bH / 2, align: 'center' });
      doc.restore();
    }

    // ── Draw seat cells ──────────────────────────────────────────────
    const seatMap = new Map<string, typeof room.allocations[0]>();
    room.allocations.forEach(a => seatMap.set(`${a.rowNumber}-${a.seatNumber}`, a));

    for (let r = 1; r <= rows; r++) {
      const ry = gridY + (r - 1) * (cellH + 4);
      // Row label
      doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold')
        .text(`F${r}`, gridX - 20, ry + cellH / 2 - 4, { width: 18, align: 'right' });

      for (let s = 1; s <= seatsPerRow; s++) {
        const cx = gridX + (s - 1) * (cellW + 2);
        const alloc = seatMap.get(`${r}-${s}`);
        if (alloc) {
          doc.rect(cx, ry, cellW, cellH).fill(gb(alloc.grade));
          doc.rect(cx, ry, cellW, cellH).stroke(gc(alloc.grade));
          doc.fillColor('#6b7280').fontSize(5.5).font('Helvetica')
            .text(`F${r}·C${s}`, cx + 2, ry + 2, { width: cellW - 4 });
          const parts = alloc.studentName.trim().split(' ').filter(Boolean);
          const short = parts.length > 2 ? `${parts[0]} ${parts[parts.length - 1]}` : alloc.studentName;
          doc.fillColor('#111827').fontSize(6.5).font('Helvetica-Bold')
            .text(short, cx + 2, ry + 11, { width: cellW - 4 });
          doc.fillColor(gc(alloc.grade)).fontSize(6).font('Helvetica')
            .text(alloc.classCode, cx + 2, ry + cellH - 13, { width: cellW - 4 });
        } else {
          doc.rect(cx, ry, cellW, cellH).fill('#f9fafb');
          doc.rect(cx, ry, cellW, cellH).stroke('#d1d5db');
          doc.fillColor('#d1d5db').fontSize(5.5).font('Helvetica')
            .text(`F${r}·C${s}`, cx + 2, ry + 2, { width: cellW - 4 });
        }
      }
    }
  });

  doc.end();
  return buf;
}
