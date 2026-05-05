import { useEffect, useState } from 'react';
import { Search, Pencil, X, ArrowLeftRight, MoveRight, Loader2 } from 'lucide-react';
import { Session } from '../types';
import { SeatPos, swapSeats } from '../services/api';
import { GradeBadge } from './UploadStep';

interface Props {
  session: Session;
  onSessionUpdate?: (updated: Session) => void;
}

export default function RoomListView({ session: initialSession, onSessionUpdate }: Props) {
  const [session, setSession] = useState<Session>(initialSession);
  const [openRoom, setOpenRoom] = useState<number>(initialSession.rooms?.[0]?.roomNumber ?? 1);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<SeatPos | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Reset when session ID changes (regenerate)
  useEffect(() => {
    setSession(initialSession);
    setOpenRoom(initialSession.rooms?.[0]?.roomNumber ?? 1);
    setEditMode(false);
    setSelected(null);
    setLastAction(null);
  }, [initialSession.id]);

  // Sync content when same session updates (swaps from map view, etc.)
  useEffect(() => { setSession(initialSession); }, [initialSession]);

  function updateSession(updated: Session) {
    setSession(updated);
    onSessionUpdate?.(updated);
  }

  function exitEditMode() {
    setEditMode(false);
    setSelected(null);
    setLastAction(null);
  }

  const rooms = session.rooms ?? [];
  const currentRoom = rooms.find(r => r.roomNumber === openRoom) ?? rooms[0];
  const { rows, seatsPerRow } = session.config;

  const filtered = currentRoom?.allocations.filter(a => {
    const matchSearch = !search || a.studentName.toLowerCase().includes(search.toLowerCase()) || a.classCode.toLowerCase().includes(search.toLowerCase());
    const matchGrade = gradeFilter === 'all' || a.grade === gradeFilter;
    return matchSearch && matchGrade;
  }) ?? [];

  const selectedAlloc = selected
    ? rooms.find(r => r.roomNumber === selected.roomNumber)
        ?.allocations.find(a => a.rowNumber === selected.rowNumber && a.seatNumber === selected.seatNumber)
    : null;

  // Empty seats in current room (shown in edit mode when a student is selected)
  const emptySeats: SeatPos[] = (() => {
    if (!editMode || !selected || !currentRoom) return [];
    const occupied = new Set(currentRoom.allocations.map(a => `${a.rowNumber}-${a.seatNumber}`));
    const empty: SeatPos[] = [];
    for (let r = 1; r <= rows + 3; r++) {
      for (let s = 1; s <= seatsPerRow; s++) {
        if (!occupied.has(`${r}-${s}`)) {
          empty.push({ roomNumber: currentRoom.roomNumber, rowNumber: r, seatNumber: s });
        }
      }
      if (empty.length >= 24) break;
    }
    return empty;
  })();

  async function handleAllocClick(pos: SeatPos) {
    if (!editMode) return;
    if (!selected) {
      setSelected(pos);
      setLastAction(null);
      return;
    }
    if (selected.roomNumber === pos.roomNumber && selected.rowNumber === pos.rowNumber && selected.seatNumber === pos.seatNumber) {
      setSelected(null);
      return;
    }
    setSaving(true);
    try {
      const updated = await swapSeats(session.id, selected, pos);
      updateSession(updated);
      setLastAction('Alunos trocados com sucesso.');
      setSelected(null);
    } catch (e) {
      setLastAction(`Erro: ${e instanceof Error ? e.message : 'falha na operação.'}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleEmptySeatClick(pos: SeatPos) {
    if (!editMode || !selected) return;
    setSaving(true);
    try {
      const updated = await swapSeats(session.id, selected, pos);
      updateSession(updated);
      setLastAction('Aluno movido com sucesso.');
      setSelected(null);
    } catch (e) {
      setLastAction(`Erro: ${e instanceof Error ? e.message : 'falha na operação.'}`);
    } finally {
      setSaving(false);
    }
  }

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
              className={[
                'w-full text-left px-3 py-2.5 text-sm transition-colors',
                room.roomNumber === openRoom
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'hover:bg-slate-50 text-slate-700',
                selected?.roomNumber === room.roomNumber && room.roomNumber !== openRoom
                  ? 'ring-2 ring-inset ring-amber-400'
                  : '',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <span>{room.roomName}</span>
                {selected?.roomNumber === room.roomNumber && room.roomNumber !== openRoom && (
                  <span className="text-amber-500 text-xs">●</span>
                )}
              </div>
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge-grade-1">{currentRoom.stats.grade1} 1ª</span>
                  <span className="badge-grade-2">{currentRoom.stats.grade2} 2ª</span>
                  <span className="badge-grade-3">{currentRoom.stats.grade3} 3ª</span>
                  <button
                    onClick={() => editMode ? exitEditMode() : setEditMode(true)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      editMode
                        ? 'bg-amber-100 border-amber-400 text-amber-800 hover:bg-amber-200'
                        : 'bg-white border-slate-300 text-slate-600 hover:border-blue-400'
                    }`}
                  >
                    {editMode
                      ? <><X className="w-3.5 h-3.5" /> Cancelar</>
                      : <><Pencil className="w-3.5 h-3.5" /> Editar lugares</>}
                  </button>
                </div>
              </div>

              {/* Edit mode banner */}
              {editMode && (
                <div className={`mt-3 rounded-xl px-4 py-2.5 text-sm flex items-center gap-3 border ${
                  selectedAlloc
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}>
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin shrink-0" /> Salvando…</>
                  ) : selectedAlloc ? (
                    <>
                      <ArrowLeftRight className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>
                        <strong>{selectedAlloc.studentName}</strong>
                        {' '}(Sala {selected!.roomNumber} · F{selected!.rowNumber}·C{selected!.seatNumber}) —
                        clique em outro aluno para <strong>trocar</strong>, ou em uma carteira vazia para <strong>mover</strong>.
                        Troque de sala no painel esquerdo para mover entre salas.
                      </span>
                    </>
                  ) : (
                    <>
                      <MoveRight className="w-4 h-4 shrink-0 text-blue-600" />
                      <span>Clique em um aluno para selecioná-lo. Depois clique em outro aluno para trocar, ou em uma carteira vazia para mover.</span>
                    </>
                  )}
                </div>
              )}

              {/* Success/error feedback */}
              {lastAction && !saving && (
                <div className={`mt-2 text-xs px-3 py-1.5 rounded-lg ${
                  lastAction.startsWith('Erro')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {lastAction}
                </div>
              )}

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
                    filtered.map((alloc, idx) => {
                      const pos: SeatPos = { roomNumber: currentRoom.roomNumber, rowNumber: alloc.rowNumber, seatNumber: alloc.seatNumber };
                      const isSelected = selected?.roomNumber === pos.roomNumber && selected?.rowNumber === pos.rowNumber && selected?.seatNumber === pos.seatNumber;
                      return (
                        <tr
                          key={idx}
                          onClick={() => handleAllocClick(pos)}
                          className={[
                            'transition-colors',
                            editMode ? 'cursor-pointer select-none' : '',
                            isSelected
                              ? 'bg-amber-50 border-l-4 border-amber-400'
                              : editMode
                              ? 'hover:bg-blue-50'
                              : 'hover:bg-slate-50',
                          ].join(' ')}
                        >
                          <td className="px-3 py-2 text-slate-400 text-xs">{idx + 1}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded ${
                              isSelected ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              F{alloc.rowNumber}·C{alloc.seatNumber}
                            </span>
                          </td>
                          <td className={`px-3 py-2 font-medium ${isSelected ? 'text-amber-900' : 'text-slate-900'}`}>
                            {alloc.studentName}
                          </td>
                          <td className="px-3 py-2">
                            <GradeBadge grade={alloc.grade} />
                          </td>
                          <td className="px-3 py-2 text-slate-600">{alloc.classCode}</td>
                          <td className="px-3 py-2 text-slate-400 font-mono text-xs">{alloc.studentId}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Empty seats — shown in edit mode when a student is selected */}
              {editMode && selected && emptySeats.length > 0 && (
                <div className="px-3 py-3 border-t border-slate-100 bg-slate-50">
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    Carteiras vazias nesta sala (clique para mover):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {emptySeats.map(pos => (
                      <button
                        key={`${pos.rowNumber}-${pos.seatNumber}`}
                        onClick={() => handleEmptySeatClick(pos)}
                        className="px-2.5 py-1 text-xs font-mono bg-white border border-dashed border-slate-300 text-slate-500 rounded-lg hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-colors"
                      >
                        F{pos.rowNumber}·C{pos.seatNumber}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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

export { GradeBar };
