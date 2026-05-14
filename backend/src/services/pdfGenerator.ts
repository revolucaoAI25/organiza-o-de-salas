import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Session } from '../types';

const GRADE_COLOR: Record<string, string> = {
  '1ª SÉRIE': '#1d4ed8', '2ª SÉRIE': '#15803d', '3ª SÉRIE': '#c2410c',
};
const GRADE_BG: Record<string, string> = {
  '1ª SÉRIE': '#dbeafe', '2ª SÉRIE': '#dcfce7', '3ª SÉRIE': '#ffedd5',
};
const gc = (g: string) => GRADE_COLOR[g] ?? '#374151';
const gb = (g: string) => GRADE_BG[g] ?? '#f3f4f6';

// Logo at backend/assets/logo.png — drop the file there and it appears automatically
const LOGO_PATH = path.join(__dirname, '..', '..', 'assets', 'Marca_CSDBH_BRANCA.png');

type BoardPos = 'top' | 'bottom' | 'left' | 'right';

function docToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

const HEADER_H = 64;

function drawHeader(
  doc: PDFKit.PDFDocument,
  pageW: number,
  institutionName: string,
  subtitle: string,
) {
  const hasLogo = fs.existsSync(LOGO_PATH);
  doc.rect(40, 40, pageW, HEADER_H).fill('#1e3a5f');
  if (hasLogo) {
    try { doc.image(LOGO_PATH, 44, 44, { fit: [120, 60] }); } catch { /* ignore */ }
  }
  const textX = hasLogo ? 175 : 50;
  const textW = pageW - (hasLogo ? 135 : 20);
  // Strip any embedded newlines that would overflow the fixed-height header
  const cleanName = (institutionName || 'Distribuição de Salas de Prova').replace(/[\r\n]+/g, ' ').trim();
  doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
    .text(cleanName, textX, 48, { width: textW, lineBreak: false, ellipsis: true });
  doc.fontSize(9).font('Helvetica')
    .text(subtitle, textX, 66, { width: textW, lineBreak: false });
}

// ── List PDF ───────────────────────────────────────────────────────────────

export async function generateListPDF(session: Session): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4', autoFirstPage: true });
  const buf = docToBuffer(doc);
  const rooms = session.rooms ?? [];
  const pageW = doc.page.width - 80;

  const subtitle = `${session.config.sessionName}   ·   ${session.config.examDate}`;

  const cols = { num: 50, place: 88, name: 145, grade: 390, turma: 462 };
  const colW = { num: 36, place: 52, name: 242, grade: 68, turma: 80 };

  function drawTableHeader(ty: number) {
    doc.rect(40, ty, pageW, 16).fill('#334155');
    doc.fillColor('white').fontSize(7.5).font('Helvetica-Bold');
    doc.text('Nº',    cols.num,   ty + 4, { width: colW.num,   lineBreak: false });
    doc.text('Lugar', cols.place, ty + 4, { width: colW.place, lineBreak: false });
    doc.text('Nome',  cols.name,  ty + 4, { width: colW.name,  lineBreak: false });
    doc.text('Série', cols.grade, ty + 4, { width: colW.grade, lineBreak: false });
    doc.text('Turma', cols.turma, ty + 4, { width: colW.turma, lineBreak: false });
    return ty + 16;
  }

  rooms.forEach((room, ri) => {
    if (ri > 0) doc.addPage();

    drawHeader(doc, pageW, session.config.institutionName || 'Distribuição de Salas de Prova', subtitle);

    const iy = 114;
    doc.rect(40, iy, pageW, 24).fill('#e8edf4');
    const roomLabel = room.building
      ? `${room.roomName}  (Prédio ${room.building}${room.floor ? ' · ' + room.floor : ''})`
      : room.roomName;
    doc.fillColor('#1e3a5f').fontSize(11).font('Helvetica-Bold')
      .text(roomLabel, 50, iy + 6, { width: 220, lineBreak: false });
    doc.fillColor('#374151').fontSize(9).font('Helvetica')
      .text(
        `Total: ${room.allocations.length}   |   1ª: ${room.stats.grade1}   2ª: ${room.stats.grade2}   3ª: ${room.stats.grade3}`,
        275, iy + 8, { width: pageW - 235, lineBreak: false }
      );

    let y = drawTableHeader(148);
    let curRow = 0;

    room.allocations.forEach((alloc, idx) => {
      if (alloc.rowNumber !== curRow) {
        curRow = alloc.rowNumber;
        if (y > doc.page.height - 60) { doc.addPage(); y = drawTableHeader(40); }
        doc.rect(40, y, pageW, 13).fill('#f1f5f9');
        doc.fillColor('#475569').fontSize(7).font('Helvetica-Bold')
          .text(`— Fileira ${curRow} —`, 50, y + 3, { width: pageW - 20, lineBreak: false });
        y += 13;
      }
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = drawTableHeader(40);
      }
      doc.rect(40, y, pageW, 15).fill(idx % 2 === 0 ? '#ffffff' : '#f8fafc');
      doc.fillColor('#111827').fontSize(7.5).font('Helvetica');
      doc.text(String(idx + 1),           cols.num,   y + 3.5, { width: colW.num,   lineBreak: false });
      doc.text(`F${alloc.rowNumber}·C${alloc.seatNumber}`, cols.place, y + 3.5, { width: colW.place, lineBreak: false });
      doc.text(alloc.studentName,          cols.name,  y + 3.5, { width: colW.name,  lineBreak: false, ellipsis: true });
      doc.rect(cols.grade - 1, y + 2, 64, 11).fill(gb(alloc.grade));
      doc.fillColor(gc(alloc.grade)).font('Helvetica-Bold').fontSize(7)
        .text(alloc.grade.replace(' SÉRIE', 'ª'), cols.grade + 1, y + 4, { width: 60, lineBreak: false });
      doc.fillColor('#374151').font('Helvetica').fontSize(7.5)
        .text(alloc.classCode, cols.turma, y + 3.5, { width: colW.turma, lineBreak: false });
      y += 15;
    });

    doc.fillColor('#9ca3af').fontSize(7).font('Helvetica')
      .text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 40, doc.page.height - 30, {
        width: pageW, align: 'center', lineBreak: false,
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
  const BOARD_THICK = 14;
  const BOARD_SIDE  = 18;

  rooms.forEach((room, ri) => {
    if (ri > 0) doc.addPage();

    const pageW = doc.page.width - 80;
    const pageH = doc.page.height - 80;
    const boardPos: BoardPos = (boardPositions[room.roomNumber] ?? 'left') as BoardPos;

    const hasLogo = fs.existsSync(LOGO_PATH);
    doc.rect(40, 40, pageW, 40).fill('#1e3a5f');
    if (hasLogo) {
      try { doc.image(LOGO_PATH, 46, 42, { fit: [80, 36] }); } catch { /* ignore */ }
    }
    const mapTX = hasLogo ? 135 : 52;
    const mapRoomLabel = room.building
      ? `Mapa de Sala — ${room.roomName}  (Prédio ${room.building}${room.floor ? ' · ' + room.floor : ''})`
      : `Mapa de Sala — ${room.roomName}`;
    doc.fillColor('white').fontSize(12).font('Helvetica-Bold')
      .text(mapRoomLabel, mapTX, 47, { width: pageW - (hasLogo ? 60 : 20), lineBreak: false });
    doc.fontSize(8.5).font('Helvetica')
      .text(
        `${session.config.sessionName}   ·   ${session.config.examDate}   ·   ${room.allocations.length} alunos   (1ª: ${room.stats.grade1}  2ª: ${room.stats.grade2}  3ª: ${room.stats.grade3})`,
        mapTX, 63, { width: pageW - (hasLogo ? 60 : 20), lineBreak: false }
      );

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
      doc.fillColor(item.color).fontSize(8).font('Helvetica-Bold').text(item.label, lx + 14, ly + 1.5, { lineBreak: false });
    });

    const effectiveRows  = room.allocations.length > 0
      ? Math.max(rows,       ...room.allocations.map(a => a.rowNumber))
      : rows;
    const effectiveSeats = room.allocations.length > 0
      ? Math.max(seatsPerRow, ...room.allocations.map(a => a.seatNumber))
      : seatsPerRow;

    const gridTop = ly + 20;
    const availH  = pageH - gridTop + 30;
    const cellW   = Math.min(Math.floor((pageW - (boardPos === 'left' || boardPos === 'right' ? BOARD_SIDE + 4 : 0)) / effectiveSeats) - 2, 88);
    const cellH   = Math.min(Math.floor((availH  - (boardPos === 'top'  || boardPos === 'bottom' ? BOARD_THICK + 4 : 0)) / effectiveRows) - 4, 50);

    const gridX = boardPos === 'left'  ? 40 + BOARD_SIDE + 4 : 40;
    const gridY = boardPos === 'top'   ? gridTop + BOARD_THICK + 4 : gridTop;

    if (boardPos === 'top' || boardPos === 'bottom') {
      const bW = effectiveSeats * (cellW + 2) - 2;
      const bY = boardPos === 'top'
        ? gridTop
        : gridY + effectiveRows * (cellH + 4);
      doc.rect(gridX, bY, bW, BOARD_THICK).fill('#1e293b');
      doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
        .text('QUADRO / FRENTE DA SALA', gridX, bY + 3.5, { width: bW, align: 'center', lineBreak: false });
    } else {
      const bH = effectiveRows * (cellH + 4);
      const bX = boardPos === 'left' ? 40 : gridX + effectiveSeats * (cellW + 2);
      doc.rect(bX, gridY, BOARD_SIDE, bH).fill('#1e293b');
      doc.save();
      const cx = bX + BOARD_SIDE / 2;
      const cy = gridY + bH / 2;
      doc.translate(cx, cy);
      doc.rotate(boardPos === 'left' ? -90 : 90);
      doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
        .text('QUADRO / FRENTE', -bH / 4, -5, { width: bH / 2, align: 'center', lineBreak: false });
      doc.restore();
    }

    const seatMap = new Map<string, typeof room.allocations[0]>();
    room.allocations.forEach(a => seatMap.set(`${a.rowNumber}-${a.seatNumber}`, a));

    for (let r = 1; r <= effectiveRows; r++) {
      const ry = gridY + (r - 1) * (cellH + 4);
      doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold')
        .text(`F${r}`, gridX - 20, ry + cellH / 2 - 4, { width: 18, align: 'right', lineBreak: false });

      for (let s = 1; s <= effectiveSeats; s++) {
        const cx = gridX + (s - 1) * (cellW + 2);
        const alloc = seatMap.get(`${r}-${s}`);
        if (alloc) {
          doc.rect(cx, ry, cellW, cellH).fill(gb(alloc.grade));
          doc.rect(cx, ry, cellW, cellH).stroke(gc(alloc.grade));
          doc.fillColor('#6b7280').fontSize(5.5).font('Helvetica')
            .text(`F${r}·C${s}`, cx + 2, ry + 2, { width: cellW - 4, lineBreak: false });
          const parts = alloc.studentName.trim().split(' ').filter(Boolean);
          const short = parts.length > 2 ? `${parts[0]} ${parts[parts.length - 1]}` : alloc.studentName;
          doc.fillColor('#111827').fontSize(6.5).font('Helvetica-Bold')
            .text(short, cx + 2, ry + 11, { width: cellW - 4, lineBreak: false, ellipsis: true });
          doc.fillColor(gc(alloc.grade)).fontSize(6).font('Helvetica')
            .text(alloc.classCode, cx + 2, ry + cellH - 13, { width: cellW - 4, lineBreak: false });
        } else {
          doc.rect(cx, ry, cellW, cellH).fill('#f9fafb');
          doc.rect(cx, ry, cellW, cellH).stroke('#d1d5db');
          doc.fillColor('#d1d5db').fontSize(5.5).font('Helvetica')
            .text(`F${r}·C${s}`, cx + 2, ry + 2, { width: cellW - 4, lineBreak: false });
        }
      }
    }
  });

  doc.end();
  return buf;
}

// ── Class list PDF (grouped by turma) ─────────────────────────────────────

export async function generateClassListPDF(session: Session): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4', autoFirstPage: true });
  const buf = docToBuffer(doc);
  const pageW = doc.page.width - 80;

  const allEntries = (session.rooms ?? []).flatMap(room =>
    room.allocations.map(a => ({
      ...a,
      roomName: room.roomName,
      building: room.building ?? '',
      floor: room.floor ?? '',
    }))
  );

  const classMap = new Map<string, typeof allEntries>();
  for (const e of allEntries) {
    if (!classMap.has(e.classCode)) classMap.set(e.classCode, []);
    classMap.get(e.classCode)!.push(e);
  }

  const turmas = [...classMap.keys()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  turmas.forEach(t => classMap.get(t)!.sort((a, b) => a.studentName.localeCompare(b.studentName, 'pt-BR')));

  const cols  = { num: 50, name: 90, room: 332, location: 382, place: 500 };
  const colW  = { num: 36, name: 238, room: 46,  location: 114,  place: 60  };
  const ROW_H = 15;

  const subtitle = `${session.config.sessionName}   ·   ${session.config.examDate}   ·   Lista por Turma`;

  function drawPageHeader() {
    drawHeader(doc, pageW, session.config.institutionName || 'Distribuição de Salas de Prova', subtitle);
  }

  function drawTableHeader(ty: number) {
    doc.rect(40, ty, pageW, 16).fill('#334155');
    doc.fillColor('white').fontSize(7.5).font('Helvetica-Bold');
    doc.text('Nº',          cols.num,      ty + 4, { width: colW.num,      lineBreak: false });
    doc.text('Nome',        cols.name,     ty + 4, { width: colW.name,     lineBreak: false });
    doc.text('Sala',        cols.room,     ty + 4, { width: colW.room,     lineBreak: false });
    doc.text('Localização', cols.location, ty + 4, { width: colW.location, lineBreak: false });
    doc.text('Lugar',       cols.place,    ty + 4, { width: colW.place,    lineBreak: false });
    return ty + 16;
  }

  drawPageHeader();
  let y = 114;

  turmas.forEach((turma, ti) => {
    const students = classMap.get(turma)!;
    const grade = students[0]?.grade ?? '';
    // Check if at least the header + a few rows fit; otherwise start new page
    const minNeeded = 18 + 16 + Math.min(students.length, 3) * ROW_H;
    if (ti > 0 && y + minNeeded > doc.page.height - 60) {
      doc.addPage();
      drawPageHeader();
      y = 114;
    }

    doc.rect(40, y, pageW, 18).fill(gb(grade));
    doc.fillColor(gc(grade)).fontSize(11).font('Helvetica-Bold')
      .text(turma, 50, y + 3.5, { width: 200, lineBreak: false });
    doc.fontSize(8.5).font('Helvetica')
      .text(`${grade}   ·   ${students.length} aluno${students.length !== 1 ? 's' : ''}`, 260, y + 5, { width: pageW - 220, lineBreak: false });
    y += 18;
    y = drawTableHeader(y);

    students.forEach((e, idx) => {
      if (y > doc.page.height - 60) {
        doc.addPage();
        drawPageHeader();
        y = 114;
        y = drawTableHeader(y);
      }
      const location = e.building
        ? `Préd. ${e.building}${e.floor ? ' · ' + e.floor : ''}`
        : '';
      doc.rect(40, y, pageW, ROW_H).fill(idx % 2 === 0 ? '#ffffff' : '#f8fafc');
      doc.fillColor('#111827').fontSize(7.5).font('Helvetica');
      doc.text(String(idx + 1), cols.num,      y + 3.5, { width: colW.num,      lineBreak: false });
      doc.text(e.studentName,   cols.name,     y + 3.5, { width: colW.name,     lineBreak: false, ellipsis: true });
      doc.text(e.roomName,      cols.room,     y + 3.5, { width: colW.room,     lineBreak: false, ellipsis: true });
      doc.text(location,        cols.location, y + 3.5, { width: colW.location, lineBreak: false });
      doc.fillColor('#6b7280').fontSize(7).font('Helvetica')
        .text(`F${e.rowNumber}·C${e.seatNumber}`, cols.place, y + 3.5, { width: colW.place, lineBreak: false });
      y += ROW_H;
    });
    y += 6;
  });

  doc.fillColor('#9ca3af').fontSize(7).font('Helvetica')
    .text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 40, doc.page.height - 30, {
      width: pageW, align: 'center', lineBreak: false,
    });
  doc.end();
  return buf;
}

// ── Signature list PDF (by room, one blank line per student for signing) ───

export async function generateSignaturePDF(session: Session): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4', autoFirstPage: true });
  const buf = docToBuffer(doc);
  const rooms = session.rooms ?? [];
  const pageW = doc.page.width - 80;
  const ROW_H = 28;

  // Layout: Nº | Lugar | Turma | Nome | Assinatura
  const C_NUM    = 50;  const W_NUM    = 24;
  const C_LUGAR  = 78;  const W_LUGAR  = 48;
  const C_TURMA  = 130; const W_TURMA  = 46;
  const C_NOME   = 180; const W_NOME   = 148;
  const C_SIG    = 334;
  const W_SIG    = pageW - (C_SIG - 40) - 10;

  const subtitle = `${session.config.sessionName}   ·   ${session.config.examDate}   ·   Lista de Presença`;

  function drawRoomTableHeader(ty: number) {
    doc.rect(40, ty, pageW, 16).fill('#334155');
    doc.fillColor('white').fontSize(7.5).font('Helvetica-Bold');
    doc.text('Nº',         C_NUM,   ty + 4, { width: W_NUM,   lineBreak: false });
    doc.text('Lugar',      C_LUGAR, ty + 4, { width: W_LUGAR, lineBreak: false });
    doc.text('Turma',      C_TURMA, ty + 4, { width: W_TURMA, lineBreak: false });
    doc.text('Nome',       C_NOME,  ty + 4, { width: W_NOME,  lineBreak: false });
    doc.text('Assinatura', C_SIG,   ty + 4, { width: W_SIG,   lineBreak: false });
    return ty + 16;
  }

  rooms.forEach((room, ri) => {
    if (ri > 0) doc.addPage();

    drawHeader(doc, pageW, session.config.institutionName || 'Distribuição de Salas de Prova', subtitle);

    const iy = 114;
    doc.rect(40, iy, pageW, 24).fill('#e8edf4');
    const roomLabel = room.building
      ? `${room.roomName}  (Prédio ${room.building}${room.floor ? ' · ' + room.floor : ''})`
      : room.roomName;
    doc.fillColor('#1e3a5f').fontSize(11).font('Helvetica-Bold')
      .text(roomLabel, 50, iy + 6, { width: 220, lineBreak: false });
    doc.fillColor('#374151').fontSize(9).font('Helvetica')
      .text(
        `Total: ${room.allocations.length}   |   1ª: ${room.stats.grade1}   2ª: ${room.stats.grade2}   3ª: ${room.stats.grade3}`,
        275, iy + 8, { width: pageW - 235, lineBreak: false }
      );

    let y = drawRoomTableHeader(148);

    const sorted = [...room.allocations].sort((a, b) =>
      a.rowNumber !== b.rowNumber ? a.rowNumber - b.rowNumber : a.seatNumber - b.seatNumber
    );

    sorted.forEach((alloc, idx) => {
      if (y + ROW_H > doc.page.height - 50) {
        doc.addPage();
        y = drawRoomTableHeader(40);
      }
      doc.rect(40, y, pageW, ROW_H).fill(idx % 2 === 0 ? '#ffffff' : '#f8fafc');

      // Center text vertically within ROW_H
      const ty = y + (ROW_H - 8) / 2;

      doc.fillColor('#9ca3af').fontSize(7).font('Helvetica')
        .text(String(idx + 1), C_NUM, ty, { width: W_NUM, lineBreak: false });
      doc.fillColor('#6b7280').fontSize(7)
        .text(`F${alloc.rowNumber}·C${alloc.seatNumber}`, C_LUGAR, ty, { width: W_LUGAR, lineBreak: false });
      doc.fillColor('#374151').fontSize(7.5).font('Helvetica')
        .text(alloc.classCode, C_TURMA, ty, { width: W_TURMA, lineBreak: false });
      doc.fillColor('#111827').fontSize(8).font('Helvetica-Bold')
        .text(alloc.studentName, C_NOME, ty, { width: W_NOME, lineBreak: true });

      // Signature line at 70% height of the row
      const lineY = y + ROW_H - 6;
      doc.moveTo(C_SIG, lineY).lineTo(C_SIG + W_SIG, lineY)
        .strokeColor('#94a3b8').lineWidth(0.5).stroke();

      y += ROW_H;
    });

    doc.fillColor('#9ca3af').fontSize(7).font('Helvetica')
      .text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 40, doc.page.height - 30, {
        width: pageW, align: 'center', lineBreak: false,
      });
  });

  doc.end();
  return buf;
}
