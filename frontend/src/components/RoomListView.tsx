import { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Room } from '../types';
import { GradeBadge } from './UploadStep';

interface Props {
  rooms: Room[];
}

export default function RoomListView({ rooms }: Props) {
  const [openRoom, setOpenRoom] = useState<number>(1);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  const currentRoom = rooms.find(r => r.roomNumber === openRoom) ?? rooms[0];

  const filtered = currentRoom?.allocations.filter(a => {
    const matchSearch =
      !search || a.studentName.toLowerCase().includes(search.toLowerCase()) || a.classCode.toLowerCase().includes(search.toLowerCase());
    const matchGrade = gradeFilter === 'all' || a.grade === gradeFilter;
    return matchSearch && matchGrade;
  }) ?? [];

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Room sidebar */}
      <div className="w-44 shrink-0 card overflow-y-auto">
        <div className="p-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Salas</p>
        </div>
        <div className="divide-y divide-slate-100">
          {rooms.map(room => (
            <button
              key={room.roomNumber}
              onClick={() => setOpenRoom(room.roomNumber)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                room.roomNumber === openRoom
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div>{room.roomName}</div>
              <div className="text-xs text-slate-500 mt-0.5">{room.allocations.length} alunos</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 card flex flex-col">
        {currentRoom && (
          <>
            {/* Room header */}
            <div className="p-4 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{currentRoom.roomName}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className="text-slate-500">{currentRoom.allocations.length} alunos</span>
                    <GradeBar stats={currentRoom.stats} total={currentRoom.allocations.length} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="badge-grade-1">{currentRoom.stats.grade1} 1ª</span>
                  <span className="badge-grade-2">{currentRoom.stats.grade2} 2ª</span>
                  <span className="badge-grade-3">{currentRoom.stats.grade3} 3ª</span>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2 mt-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    className="input pl-8 py-1.5 text-xs"
                    placeholder="Buscar nome ou turma…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="input w-auto py-1.5 text-xs"
                  value={gradeFilter}
                  onChange={e => setGradeFilter(e.target.value)}
                >
                  <option value="all">Todas as séries</option>
                  <option value="1ª SÉRIE">1ª Série</option>
                  <option value="2ª SÉRIE">2ª Série</option>
                  <option value="3ª SÉRIE">3ª Série</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Nº</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Lugar</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Nome</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Série</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Turma</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Matrícula</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 text-sm">
                        Nenhum aluno encontrado
                      </td>
                    </tr>
                  ) : (
                    filtered.map((alloc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 group">
                        <td className="px-3 py-2 text-slate-400 text-xs">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1 text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            F{alloc.rowNumber}·C{alloc.seatNumber}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-900">{alloc.studentName}</td>
                        <td className="px-3 py-2">
                          <GradeBadge grade={alloc.grade} />
                        </td>
                        <td className="px-3 py-2 text-slate-600">{alloc.classCode}</td>
                        <td className="px-3 py-2 text-slate-400 font-mono text-xs">{alloc.studentId}</td>
                      </tr>
                    ))
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

function GradeBar({ stats, total }: { stats: { grade1: number; grade2: number; grade3: number }; total: number }) {
  if (total === 0) return null;
  const p1 = (stats.grade1 / total) * 100;
  const p2 = (stats.grade2 / total) * 100;
  const p3 = (stats.grade3 / total) * 100;
  return (
    <div className="flex h-2 w-32 rounded-full overflow-hidden bg-slate-100">
      <div className="bg-blue-500 h-full" style={{ width: `${p1}%` }} title={`1ª: ${stats.grade1}`} />
      <div className="bg-green-500 h-full" style={{ width: `${p2}%` }} title={`2ª: ${stats.grade2}`} />
      <div className="bg-orange-500 h-full" style={{ width: `${p3}%` }} title={`3ª: ${stats.grade3}`} />
    </div>
  );
}

// Re-export for use in other components
export { GradeBar };
