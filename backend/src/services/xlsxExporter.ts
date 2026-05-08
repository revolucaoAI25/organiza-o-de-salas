import ExcelJS from 'exceljs';
import { Session } from '../types';

const GRADE_FILLS: Record<string, { argb: string }> = {
  '1ª SÉRIE': { argb: 'FFDBEAFE' },
  '2ª SÉRIE': { argb: 'FFDCFCE7' },
  '3ª SÉRIE': { argb: 'FFFFEDD5' },
};

export async function generateXLSX(session: Session): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Distribuição de Salas';
  wb.created = new Date();

  const rooms = session.rooms ?? [];

  // ── Summary sheet ─────────────────────────────────────────────────────
  const hasBuildingInfo = rooms.some(r => r.building);
  const summary = wb.addWorksheet('Resumo');
  if (hasBuildingInfo) {
    summary.columns = [
      { header: 'Sala', key: 'room', width: 12 },
      { header: 'Prédio', key: 'building', width: 10 },
      { header: 'Andar', key: 'floor', width: 14 },
      { header: 'Total', key: 'total', width: 10 },
      { header: '1ª Série', key: 'g1', width: 12 },
      { header: '2ª Série', key: 'g2', width: 12 },
      { header: '3ª Série', key: 'g3', width: 12 },
    ];
  } else {
    summary.columns = [
      { header: 'Sala', key: 'room', width: 12 },
      { header: 'Total', key: 'total', width: 10 },
      { header: '1ª Série', key: 'g1', width: 12 },
      { header: '2ª Série', key: 'g2', width: 12 },
      { header: '3ª Série', key: 'g3', width: 12 },
    ];
  }

  summary.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summary.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };

  rooms.forEach(room => {
    summary.addRow({
      room: room.roomName,
      ...(hasBuildingInfo ? { building: room.building ?? '', floor: room.floor ?? '' } : {}),
      total: room.allocations.length,
      g1: room.stats.grade1,
      g2: room.stats.grade2,
      g3: room.stats.grade3,
    });
  });

  // ── Consolidated sheet (all students) ────────────────────────────────
  const consolidated = wb.addWorksheet('Todos os Alunos');
  consolidated.columns = [
    { header: 'Nº',        key: 'num',   width: 6  },
    { header: 'Nome',      key: 'name',  width: 42 },
    { header: 'Série',     key: 'grade', width: 14 },
    { header: 'Turma',     key: 'class', width: 14 },
    { header: 'Matrícula', key: 'id',    width: 14 },
    { header: 'Sala',      key: 'room',  width: 12 },
    { header: 'Fileira',   key: 'row',   width: 10 },
    { header: 'Carteira',  key: 'seat',  width: 10 },
  ];

  const chdr = consolidated.getRow(1);
  chdr.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  chdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
  chdr.alignment = { vertical: 'middle', horizontal: 'center' };

  // Flatten all allocations sorted by student name
  const allEntries = rooms.flatMap(room =>
    room.allocations.map(a => ({ ...a, roomName: room.roomName }))
  ).sort((a, b) => a.studentName.localeCompare(b.studentName, 'pt-BR'));

  allEntries.forEach((entry, idx) => {
    const row = consolidated.addRow({
      num:   idx + 1,
      name:  entry.studentName,
      grade: entry.grade,
      class: entry.classCode,
      id:    entry.studentId,
      room:  entry.roomName,
      row:   `Fileira ${entry.rowNumber}`,
      seat:  `C${entry.seatNumber}`,
    });
    const fill = GRADE_FILLS[entry.grade];
    if (fill) row.getCell('grade').fill = { type: 'pattern', pattern: 'solid', fgColor: fill };
    row.getCell('num').alignment = { horizontal: 'center' };
    row.getCell('seat').alignment = { horizontal: 'center' };
  });

  consolidated.views = [{ state: 'frozen', ySplit: 1 }];
  consolidated.autoFilter = { from: 'A1', to: 'H1' };

  // ── One sheet per room ────────────────────────────────────────────────
  rooms.forEach(room => {
    const ws = wb.addWorksheet(room.roomName);
    ws.columns = [
      { header: 'Nº', key: 'num', width: 6 },
      { header: 'Fileira', key: 'row', width: 10 },
      { header: 'Carteira', key: 'seat', width: 10 },
      { header: 'Nome', key: 'name', width: 40 },
      { header: 'Série', key: 'grade', width: 14 },
      { header: 'Turma', key: 'class', width: 14 },
      { header: 'Matrícula', key: 'id', width: 14 },
    ];

    // Header row style
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    room.allocations.forEach((alloc, idx) => {
      const row = ws.addRow({
        num: idx + 1,
        row: `Fileira ${alloc.rowNumber}`,
        seat: `C${alloc.seatNumber}`,
        name: alloc.studentName,
        grade: alloc.grade,
        class: alloc.classCode,
        id: alloc.studentId,
      });

      const fill = GRADE_FILLS[alloc.grade];
      if (fill) {
        row.getCell('grade').fill = { type: 'pattern', pattern: 'solid', fgColor: fill };
      }
      row.getCell('name').font = { bold: idx % 2 === 0 };
      row.getCell('num').alignment = { horizontal: 'center' };
    });

    // Freeze header
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.autoFilter = { from: 'A1', to: 'G1' };
  });

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
