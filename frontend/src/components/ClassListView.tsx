import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Session } from '../types';

interface Props {
  session: Session;
}

const GRADE_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  '1ª SÉRIE': { bg: 'bg-blue-50',   text: 'text-blue-900',   border: 'border-blue-200', badge: 'bg-blue-600' },
  '2ª SÉRIE': { bg: 'bg-green-50',  text: 'text-green-900',  border: 'border-green-200', badge: 'bg-green-600' },
  '3ª SÉRIE': { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200', badge: 'bg-orange-600' },
};

export default function ClassListView({ session }: Props) {
  const [openClass, setOpenClass] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Collect all allocations enriched with room info
  const allEntries = useMemo(() =>
    (session.rooms ?? []).flatMap(room =>
      room.allocations.map(a => ({
        ...a,
        roomName: room.roomName,
        building: room.building ?? '',
        floor: room.floor ?? '',
      }))
    ),
    [session]
  );

  // Group by classCode, sorted alphabetically
  const classMap = useMemo(() => {
    const map = new Map<string, typeof allEntries>();
    for (const e of allEntries) {
      if (!map.has(e.classCode)) map.set(e.classCode, []);
      map.get(e.classCode)!.push(e);
    }
    // Sort students within each class
    for (const [, students] of map) {
      students.sort((a, b) => a.studentName.localeCompare(b.studentName, 'pt-BR'));
    }
    return map;
  }, [allEntries]);

  const turmas = useMemo(() =>
    [...classMap.keys()].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [classMap]
  );

  // Default open the first class
  const effectiveOpen = openClass ?? turmas[0] ?? null;

  const currentStudents = effectiveOpen ? classMap.get(effectiveOpen) ?? [] : [];

  const filtered = currentStudents.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.studentName.toLowerCase().includes(q) || e.roomName.toLowerCase().includes(q);
  });

  const grade = currentStudents[0]?.grade ?? '';
  const colors = GRADE_COLORS[grade] ?? GRADE_COLORS['1ª SÉRIE'];

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Sidebar — class list */}
      <div className="w-44 shrink-0 card overflow-y-auto">
        <div className="p-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Turmas</p>
        </div>
        <div className="divide-y divide-slate-100">
          {turmas.map(turma => {
            const students = classMap.get(turma)!;
            const g = students[0]?.grade ?? '';
            const c = GRADE_COLORS[g] ?? GRADE_COLORS['1ª SÉRIE'];
            return (
              <button
                key={turma}
                onClick={() => setOpenClass(turma)}
                className={[
                  'w-full text-left px-3 py-2.5 text-sm transition-colors',
                  effectiveOpen === turma
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'hover:bg-slate-50 text-slate-700',
                ].join(' ')}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${c.badge} shrink-0`} />
                  <span className="truncate">{turma}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 pl-4">{students.length} alunos</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 card flex flex-col">
        {effectiveOpen && (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className={`font-bold text-lg ${colors.text}`}>{effectiveOpen}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className="text-slate-500">{currentStudents.length} alunos</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                      {grade}
                    </span>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="relative mt-3">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  className="input pl-8 py-1.5 text-xs w-full"
                  placeholder="Buscar nome ou sala…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Nº</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Nome</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Sala</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Localização</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Lugar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 text-sm">
                        Nenhum aluno encontrado
                      </td>
                    </tr>
                  ) : (
                    filtered.map((e, idx) => {
                      const location = e.building
                        ? `Prédio ${e.building}${e.floor ? ' · ' + e.floor : ''}`
                        : '';
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2 text-slate-400 text-xs">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium text-slate-900">{e.studentName}</td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {e.roomName}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-500 text-xs">{location}</td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              F{e.rowNumber}·C{e.seatNumber}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filtered.length > 0 && (
              <div className="px-3 py-2 border-t border-slate-100 text-xs text-slate-400 text-right">
                {filtered.length} aluno{filtered.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
