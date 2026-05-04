import * as XLSX from 'xlsx';
import { Grade, ParseResult, Student } from '../types';

// Normalize grade strings to canonical form
function normalizeGrade(raw: string): Grade {
  const s = raw.trim().normalize('NFC');
  if (/1/.test(s)) return '1ª SÉRIE';
  if (/2/.test(s)) return '2ª SÉRIE';
  if (/3/.test(s)) return '3ª SÉRIE';
  // Try stripping accents and checking again
  const plain = s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  if (plain.includes('1')) return '1ª SÉRIE';
  if (plain.includes('2')) return '2ª SÉRIE';
  if (plain.includes('3')) return '3ª SÉRIE';
  return raw.trim() as Grade;
}

// Flexible column detection: tries exact match, then case-insensitive, then partial
function findColumn(headers: string[], ...candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    const exact = headers.find(h => h === candidate);
    if (exact) return exact;
  }
  for (const candidate of candidates) {
    const ci = headers.find(h => h.toLowerCase() === candidate.toLowerCase());
    if (ci) return ci;
  }
  for (const candidate of candidates) {
    const partial = headers.find(h =>
      h.toLowerCase().includes(candidate.toLowerCase())
    );
    if (partial) return partial;
  }
  return undefined;
}

export function parseStudentsFromBuffer(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
  });

  if (rows.length === 0) {
    throw new Error('Planilha vazia ou sem dados reconhecíveis.');
  }

  const headers = Object.keys(rows[0]);

  const nameCol = findColumn(headers, 'AlunoNome', 'Nome', 'name', 'aluno');
  const gradeCol = findColumn(headers, 'Ciclo2026', 'Ciclo', 'Serie', 'Série', 'grade', 'ano');
  const classCol = findColumn(headers, 'Turma2026', 'Turma', 'class', 'turma');
  const idCol = findColumn(headers, 'AlunoMatricula', 'Matricula', 'Matrícula', 'id', 'matricula');
  const courseCol = findColumn(headers, 'Curso2026', 'Curso', 'course', 'curso');

  if (!nameCol || !gradeCol) {
    throw new Error(
      `Colunas obrigatórias não encontradas. Esperado: AlunoNome, Ciclo2026. Encontrado: ${headers.join(', ')}`
    );
  }

  const students: Student[] = rows
    .map(row => ({
      name: String(row[nameCol] ?? '').trim(),
      grade: normalizeGrade(String(row[gradeCol] ?? '')),
      classCode: classCol ? String(row[classCol] ?? '').trim() : '',
      studentId: idCol ? String(row[idCol] ?? '').trim() : '',
      course: courseCol ? String(row[courseCol] ?? '').trim() : '',
    }))
    .filter(s => s.name.length > 0 && s.grade.length > 0);

  const totals = {
    grade1: students.filter(s => s.grade === '1ª SÉRIE').length,
    grade2: students.filter(s => s.grade === '2ª SÉRIE').length,
    grade3: students.filter(s => s.grade === '3ª SÉRIE').length,
    total: students.length,
  };

  return { students, totals };
}
