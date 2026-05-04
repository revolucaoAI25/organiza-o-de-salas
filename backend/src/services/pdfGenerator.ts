import PDFDocument from 'pdfkit';
import { Room, Session } from '../types';

const COLORS = {
  '1ª SÉRIE': '#1d4ed8',
  '2ª SÉRIE': '#15803d',
  '3ª SÉRIE': '#c2410c',
} as const;

const GRADE_BG = {
  '1ª SÉRIE': '#dbeafe',
  '2ª SÉRIE': '#dcfce7',
  '3ª SÉRIE': '#ffedd5',
} as const;

function gradeColor(grade: string): string {
  return COLORS[grade as keyof typeof COLORS] ?? '#374151';
}

function gradeBg(grade: string): string {
  return GRADE_BG[grade as keyof typeof GRADE_BG] ?? '#f3f4f6';
}

export function generateListPDF(session: Session): Buffer {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const buffers: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => buffers.push(chunk));

  const rooms = session.rooms ?? [];

  rooms.forEach((room, roomIdx) => {
    if (roomIdx > 0) doc.addPage();

    const pageWidth = doc.page.width - 80;

    // ── Header ─────────────────────────────────────────────────────────
    doc.rect(40, 40, pageWidth, 56).fill('#1e3a5f');

    doc.fillColor('white').fontSize(14).font('Helvetica-Bold')
      .text(session.config.institutionName || 'Distribuição de Salas', 50, 50, { width: pageWidth - 20 });

    doc.fontSize(10).font('Helvetica')
      .text(`${session.config.sessionName}   •   ${session.config.examDate}`, 50, 68, { width: pageWidth - 20 });

    // ── Room info bar ──────────────────────────────────────────────────
    const infoY = 106;
    doc.rect(40, infoY, pageWidth, 28).fill('#e0e7ef');

    doc.fillColor('#1e3a5f').fontSize(12).font('Helvetica-Bold')
      .text(`${room.roomName}`, 50, infoY + 8, { continued: true });

    const statsText =
      `   Total: ${room.allocations.length} alunos` +
      `   |   1ª: ${room.stats.grade1}   2ª: ${room.stats.grade2}   3ª: ${room.stats.grade3}`;
    doc.font('Helvetica').fillColor('#374151')
      .text(statsText, { width: pageWidth - 20 });

    // ── Column headers ─────────────────────────────────────────────────
    const tableTop = 144;
    const colX = [50, 90, 130, 185, 395, 465];
    const colW = [38, 38, 53, 208, 68, 80];
    const headers = ['Nº', 'Fileira', 'Carteira', 'Nome', 'Série', 'Turma'];

    doc.rect(40, tableTop, pageWidth, 18).fill('#334155');
    doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
    headers.forEach((h, i) => {
      doc.text(h, colX[i], tableTop + 5, { width: colW[i] });
    });

    // ── Rows ───────────────────────────────────────────────────────────
    let y = tableTop + 18;
    let currentRow = 0;

    room.allocations.forEach((alloc, idx) => {
      // Row separator header
      if (alloc.rowNumber !== currentRow) {
        currentRow = alloc.rowNumber;
        doc.rect(40, y, pageWidth, 14).fill('#f1f5f9');
        doc.fillColor('#475569').fontSize(7).font('Helvetica-Bold')
          .text(`── Fileira ${currentRow} ──`, 50, y + 3, { width: pageWidth - 20 });
        y += 14;
      }

      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(40, y, pageWidth, 16).fill(bg);

      doc.fillColor('#111827').fontSize(8).font('Helvetica');
      doc.text(String(idx + 1), colX[0], y + 4, { width: colW[0] });
      doc.text(`F${alloc.rowNumber}`, colX[1], y + 4, { width: colW[1] });
      doc.text(`C${alloc.seatNumber}`, colX[2], y + 4, { width: colW[2] });
      doc.text(alloc.studentName, colX[3], y + 4, { width: colW[3], ellipsis: true });

      // Grade badge background
      const bg2 = gradeBg(alloc.grade);
      const gradeText = alloc.grade.replace(' SÉRIE', 'ª');
      doc.rect(colX[4] - 2, y + 2, 62, 12).fill(bg2);
      doc.fillColor(gradeColor(alloc.grade)).font('Helvetica-Bold').fontSize(7)
        .text(gradeText, colX[4], y + 5, { width: 60 });

      doc.fillColor('#374151').font('Helvetica').fontSize(8)
        .text(alloc.classCode, colX[5], y + 4, { width: colW[5] });

      y += 16;

      // Page overflow check
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 40;
        doc.rect(40, y, pageWidth, 18).fill('#334155');
        doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
        headers.forEach((h, i) => doc.text(h, colX[i], y + 5, { width: colW[i] }));
        y += 18;
      }
    });

    // ── Footer ─────────────────────────────────────────────────────────
    const footerY = doc.page.height - 40;
    doc.fillColor('#9ca3af').fontSize(7).font('Helvetica')
      .text(
        `Gerado em ${new Date().toLocaleString('pt-BR')}   •   Sessão: ${session.id}`,
        40, footerY, { width: pageWidth, align: 'center' }
      );
  });

  doc.end();
  return Buffer.concat(buffers);
}

export function generateMapPDF(session: Session): Buffer {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  const buffers: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => buffers.push(chunk));

  const rooms = session.rooms ?? [];
  const { rows, seatsPerRow } = session.config;

  rooms.forEach((room, roomIdx) => {
    if (roomIdx > 0) doc.addPage();

    const pageWidth = doc.page.width - 80;
    const pageHeight = doc.page.height - 80;

    // ── Header ─────────────────────────────────────────────────────────
    doc.rect(40, 40, pageWidth, 44).fill('#1e3a5f');
    doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
      .text(`Mapa de Sala — ${room.roomName}`, 52, 48, { width: pageWidth - 20 });
    doc.fontSize(9).font('Helvetica')
      .text(
        `${session.config.sessionName}   •   ${session.config.examDate}   •   Total: ${room.allocations.length} alunos`,
        52, 64, { width: pageWidth - 20 }
      );

    // ── Legend ─────────────────────────────────────────────────────────
    const legendY = 94;
    const legendItems = [
      { label: '1ª Série', color: '#3b82f6', bg: '#dbeafe' },
      { label: '2ª Série', color: '#16a34a', bg: '#dcfce7' },
      { label: '3ª Série', color: '#ea580c', bg: '#ffedd5' },
      { label: 'Vazio', color: '#9ca3af', bg: '#f3f4f6' },
    ];
    let lx = 40;
    legendItems.forEach(item => {
      doc.rect(lx, legendY, 12, 12).fill(item.bg).stroke(item.color);
      doc.fillColor(item.color).fontSize(8).font('Helvetica-Bold')
        .text(item.label, lx + 15, legendY + 2);
      lx += 80;
    });

    // ── Seat grid ──────────────────────────────────────────────────────
    const gridTop = legendY + 20;
    const availH = pageHeight - gridTop + 40;
    const availW = pageWidth;

    const cellW = Math.min(Math.floor(availW / seatsPerRow) - 2, 90);
    const cellH = Math.min(Math.floor(availH / rows) - 4, 52);

    const seatMap = new Map<string, typeof room.allocations[0]>();
    room.allocations.forEach(a => seatMap.set(`${a.rowNumber}-${a.seatNumber}`, a));

    for (let r = 1; r <= rows; r++) {
      for (let s = 1; s <= seatsPerRow; s++) {
        const x = 40 + (s - 1) * (cellW + 2);
        const y = gridTop + (r - 1) * (cellH + 4);
        const alloc = seatMap.get(`${r}-${s}`);

        if (alloc) {
          const bg = gradeBg(alloc.grade);
          const border = gradeColor(alloc.grade);
          doc.rect(x, y, cellW, cellH).fill(bg);
          doc.rect(x, y, cellW, cellH).stroke(border);

          // Seat label
          doc.fillColor('#6b7280').fontSize(6).font('Helvetica')
            .text(`F${r}-C${s}`, x + 2, y + 2, { width: cellW - 4 });

          // Name (truncated)
          const nameParts = alloc.studentName.split(' ');
          const shortName =
            nameParts.length > 2
              ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
              : alloc.studentName;

          doc.fillColor('#111827').fontSize(7).font('Helvetica-Bold')
            .text(shortName, x + 2, y + 12, { width: cellW - 4, ellipsis: true });

          doc.fillColor(gradeColor(alloc.grade)).fontSize(6.5).font('Helvetica')
            .text(alloc.classCode, x + 2, y + cellH - 14, { width: cellW - 4 });
        } else {
          // Empty seat
          doc.rect(x, y, cellW, cellH).fill('#f9fafb').stroke('#d1d5db');
          doc.fillColor('#d1d5db').fontSize(6).font('Helvetica')
            .text(`F${r}-C${s}`, x + 2, y + 2, { width: cellW - 4 });
        }
      }
    }

    // ── Row labels ─────────────────────────────────────────────────────
    for (let r = 1; r <= rows; r++) {
      const y = gridTop + (r - 1) * (cellH + 4) + cellH / 2 - 4;
      doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold')
        .text(`Fileira ${r}`, 0, y, { width: 36, align: 'right' });
    }
  });

  doc.end();
  return Buffer.concat(buffers);
}
