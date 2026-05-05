import { useEffect, useState } from 'react';
import { Pencil, X, ArrowLeftRight, MoveRight, Loader2 } from 'lucide-react';
import { Allocation, Session } from '../types';
import { SeatPos, swapSeats } from '../services/api';

type BoardPos = 'top' | 'bottom' | 'left' | 'right';

const GRADE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  '1ª SÉRIE': { bg: 'bg-blue-50',   border: 'border-blue-300',   text: 'text-blue-900',   dot: 'bg-blue-500'   },
  '2ª SÉRIE': { bg: 'bg-green-50',  border: 'border-green-300',  text: 'text-green-900',  dot: 'bg-green-500'  },
  '3ª SÉRIE': { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-900', dot: 'bg-orange-500' },
};

interface Props {
  session: Session;
  onSessionUpdate?: (updated: Session) => void;
}

function loadPositions(id: string): Record<number, BoardPos> {
  try { return JSON.parse(localStorage.getItem(`boardPos-${id}`) ?? '{}'); } catch { return {}; }
}
function savePositions(id: string, p: Record<number, BoardPos>) {
  localStorage.setItem(`boardPos-${id}`, JSON.stringify(p));
}

export default function RoomMapView({ session: initialSession, onSessionUpdate }: Props) {
  const [session, setSession] = useState<Session>(initialSession);
  const [selectedRoom, setSelectedRoom] = useState(1);
  const [boardPositions, setBoardPositions] = useState<Record<number, BoardPos>>({});

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<SeatPos | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const [hovered, setHovered] = useState<Allocation | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setSession(initialSession);
    setBoardPositions(loadPositions(initialSession.id));
  }, [initialSession.id]);

  // Keep local session in sync when parent updates (e.g. regenerate)
  useEffect(() => { setSession(initialSession); }, [initialSession]);

  function updateSession(updated: Session) {
    setSession(updated);
    onSessionUpdate?.(updated);
  }

  function setBoardPos(roomNum: number, pos: BoardPos) {
    setBoardPositions(prev => {
      const next = { ...prev, [roomNum]: pos };
      savePositions(session.id, next);
      return next;
    });
  }

  function exitEditMode() {
    setEditMode(false);
    setSelected(null);
    setLastAction(null);
  }

  async function handleSeatClick(pos: SeatPos, occupied: boolean) {
    if (!editMode) return;

    if (!selected) {
      if (!occupied) return; // must select an occupied seat first
      setSelected(pos);
      setLastAction(null);
      return;
    }

    // Clicking the already-selected seat → deselect
    if (selected.roomNumber === pos.roomNumber && selected.rowNumber === pos.rowNumber && selected.seatNumber === pos.seatNumber) {
      setSelected(null);
      return;
    }

    // Execute swap or move
    setSaving(true);
    try {
      const updated = await swapSeats(session.id, selected, pos);
      updateSession(updated);
      setLastAction(occupied ? 'Alunos trocados com sucesso.' : 'Aluno movido com sucesso.');
      setSelected(null);
    } catch (e) {
      setLastAction(`Erro: ${e instanceof Error ? e.message : 'falha na operação.'}`);
    } finally {
      setSaving(false);
    }
  }

  const room = session.rooms?.find(r => r.roomNumber === selectedRoom) ?? session.rooms?.[0];
  const { rows, seatsPerRow } = session.config;
  const boardPos: BoardPos = boardPositions[selectedRoom] ?? 'left';

  // 3 extra seat slots per row + 1 extra row as overflow buffer
  const maxOccupiedRow = room && room.allocations.length > 0
    ? Math.max(...room.allocations.map(a => a.rowNumber))
    : 0;
  const displayRows = Math.max(rows, maxOccupiedRow) + 1;
  const displaySeats = seatsPerRow + 3;

  if (!room) return null;

  const seatMap = new Map<string, Allocation>();
  room.allocations.forEach(a => seatMap.set(`${a.rowNumber}-${a.seatNumber}`, a));

  // Find the selected allocation for the banner (may be in a different room)
  const selectedAlloc: Allocation | null = (() => {
    if (!selected) return null;
    const r = session.rooms?.find(rm => rm.roomNumber === selected.roomNumber);
    return r?.allocations.find(a => a.rowNumber === selected.rowNumber && a.seatNumber === selected.seatNumber) ?? null;
  })();

  const boardIndicator = (
    <div className="flex justify-center">
      <div className="px-5 py-1.5 bg-slate-800 text-white text-[11px] font-bold rounded-full tracking-wide">
        ■ QUADRO / FRENTE DA SALA
      </div>
    </div>
  );

  const grid = (
    <div className="space-y-2">
      {Array.from({ length: displayRows }, (_, ri) => {
        const rowNum = ri + 1;
        return (
          <div key={rowNum} className="flex items-center gap-2">
            <div className="w-14 shrink-0 text-right">
              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                Fileira {rowNum}
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: displaySeats }, (_, si) => {
                const seatNum = si + 1;
                const pos: SeatPos = { roomNumber: room.roomNumber, rowNumber: rowNum, seatNumber: seatNum };
                const alloc = seatMap.get(`${rowNum}-${seatNum}`);
                const colors = alloc ? GRADE_COLORS[alloc.grade] : null;
                const isSelected = selected?.roomNumber === room.roomNumber && selected?.rowNumber === rowNum && selected?.seatNumber === seatNum;
                const isTargetable = editMode && selected && !isSelected;

                return (
                  <div
                    key={seatNum}
                    onClick={() => handleSeatClick(pos, !!alloc)}
                    onMouseEnter={e => { if (!editMode && alloc) { setHovered(alloc); setHoverPos({ x: e.clientX, y: e.clientY }); } }}
                    onMouseMove={e => { if (!editMode && alloc) setHoverPos({ x: e.clientX, y: e.clientY }); }}
                    onMouseLeave={() => setHovered(null)}
                    className={[
                      'relative w-[84px] h-[58px] rounded-lg border-2 transition-all',
                      // Edit mode cursor
                      editMode ? 'cursor-pointer' : 'cursor-default',
                      // Selected seat
                      isSelected
                        ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-400 ring-offset-1 scale-105 z-10'
                        : alloc
                        ? `${colors!.bg} ${colors!.border} ${!editMode ? 'hover:shadow-md hover:-translate-y-0.5' : isTargetable ? 'hover:ring-2 hover:ring-blue-400' : ''}`
                        : editMode && isTargetable
                        ? 'bg-blue-50 border-blue-300 border-dashed hover:ring-2 hover:ring-blue-400'
                        : 'bg-slate-50 border-slate-200 border-dashed opacity-50',
                    ].join(' ')}
                  >
                    <div className="absolute top-1 left-1.5 text-[8px] text-slate-400 font-mono">
                      F{rowNum}·C{seatNum}
                    </div>
                    {alloc ? (
                      <>
                        {!isSelected && <div className={`absolute top-1 right-1.5 w-2 h-2 rounded-full ${colors!.dot}`} />}
                        {isSelected && <div className="absolute top-1 right-1.5 text-amber-600 text-[9px] font-bold">✓</div>}
                        <div className="px-1.5 pt-3.5 pb-1 h-full flex flex-col justify-between">
                          <p className={`text-[9.5px] font-semibold leading-tight line-clamp-2 ${isSelected ? 'text-amber-900' : colors!.text}`}>
                            {abbreviate(alloc.studentName)}
                          </p>
                          <p className={`text-[8px] opacity-70 truncate ${isSelected ? 'text-amber-700' : colors!.text}`}>
                            {alloc.classCode}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        {editMode && isTargetable
                          ? <span className="text-[10px] text-blue-400 font-medium">mover aqui</span>
                          : <span className="text-[10px] text-slate-300">—</span>
                        }
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-3 relative">
      {/* Room selector + controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-700">Sala:</span>
          <div className="flex gap-1 flex-wrap">
            {session.rooms?.map(r => (
              <button
                key={r.roomNumber}
                onClick={() => setSelectedRoom(r.roomNumber)}
                className={[
                  'px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors',
                  r.roomNumber === selectedRoom
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-300 text-slate-600 hover:border-blue-400',
                  // Highlight room that has the selected student
                  selected?.roomNumber === r.roomNumber && r.roomNumber !== selectedRoom
                    ? 'ring-2 ring-amber-400'
                    : '',
                ].join(' ')}
              >
                {String(r.roomNumber).padStart(2, '0')}
                {selected?.roomNumber === r.roomNumber && r.roomNumber !== selectedRoom && (
                  <span className="ml-1 text-amber-500">●</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Board position */}
          {!editMode && (
            <>
              <span className="text-xs text-slate-500 font-medium">Quadro:</span>
              <div className="flex gap-0.5 p-1 bg-slate-100 rounded-lg">
                {(['top', 'bottom', 'left', 'right'] as BoardPos[]).map(pos => (
                  <button
                    key={pos}
                    title={posLabel(pos)}
                    onClick={() => setBoardPos(selectedRoom, pos)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors font-medium ${
                      boardPos === pos ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {posArrow(pos)}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Edit mode toggle */}
          <button
            onClick={() => editMode ? exitEditMode() : setEditMode(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              editMode
                ? 'bg-amber-100 border-amber-400 text-amber-800 hover:bg-amber-200'
                : 'bg-white border-slate-300 text-slate-600 hover:border-blue-400'
            }`}
          >
            {editMode ? <><X className="w-3.5 h-3.5" /> Cancelar edição</> : <><Pencil className="w-3.5 h-3.5" /> Editar lugares</>}
          </button>
        </div>
      </div>

      {/* Edit mode instruction banner */}
      {editMode && (
        <div className={`rounded-xl px-4 py-2.5 text-sm flex items-center gap-3 border ${
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
                {' '}selecionado (Sala {selected!.roomNumber} · F{selected!.rowNumber}·C{selected!.seatNumber}) —
                clique em outro aluno para <strong>trocar</strong>, ou em um lugar vazio para <strong>mover</strong>.
              </span>
            </>
          ) : (
            <>
              <MoveRight className="w-4 h-4 shrink-0 text-blue-600" />
              <span>Clique em um aluno para selecioná-lo. Depois clique em outro aluno para trocar, ou em um lugar vazio para mover.</span>
            </>
          )}
        </div>
      )}

      {/* Success/error feedback */}
      {lastAction && !saving && (
        <div className={`text-xs px-3 py-1.5 rounded-lg ${
          lastAction.startsWith('Erro') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {lastAction}
        </div>
      )}

      {/* Room stats */}
      <div className="flex items-center gap-3 text-sm">
        <span className="font-bold text-slate-900">{room.roomName}</span>
        <span className="text-slate-500">{room.allocations.length} alunos</span>
        <Legend color="bg-blue-500"   label={`1ª: ${room.stats.grade1}`} />
        <Legend color="bg-green-500"  label={`2ª: ${room.stats.grade2}`} />
        <Legend color="bg-orange-500" label={`3ª: ${room.stats.grade3}`} />
        <Legend color="bg-slate-200"  label="Vazio" />
      </div>

      {/* Grid with configurable board position */}
      <div className="card p-4 overflow-x-auto">
        {boardPos === 'top' && <div className="mb-3">{boardIndicator}</div>}
        <div className={`flex ${boardPos === 'left' || boardPos === 'right' ? 'flex-row gap-3 items-center' : 'flex-col gap-3'}`}>
          {boardPos === 'left' && (
            <div className="shrink-0 px-2 py-10 bg-slate-800 text-white text-[10px] font-bold rounded-lg tracking-widest"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
              ■ QUADRO / FRENTE
            </div>
          )}
          <div className="flex-1">{grid}</div>
          {boardPos === 'right' && (
            <div className="shrink-0 px-2 py-10 bg-slate-800 text-white text-[10px] font-bold rounded-lg tracking-widest"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
              ■ QUADRO / FRENTE
            </div>
          )}
        </div>
        {boardPos === 'bottom' && <div className="mt-3">{boardIndicator}</div>}
      </div>

      {/* Hover tooltip (only outside edit mode) */}
      {!editMode && hovered && <Tooltip alloc={hovered} x={hoverPos.x} y={hoverPos.y} />}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function abbreviate(name: string) {
  const p = name.trim().split(' ').filter(Boolean);
  return p.length <= 2 ? name : `${p[0]} ${p[p.length - 1]}`;
}
function posLabel(pos: BoardPos) {
  return { top: 'Acima', bottom: 'Abaixo', left: 'Esquerda', right: 'Direita' }[pos];
}
function posArrow(pos: BoardPos) {
  return { top: '↑', bottom: '↓', left: '←', right: '→' }[pos];
}
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
      <span className="text-xs text-slate-600">{label}</span>
    </div>
  );
}

function Tooltip({ alloc, x, y }: { alloc: Allocation; x: number; y: number }) {
  const c = GRADE_COLORS[alloc.grade] ?? GRADE_COLORS['1ª SÉRIE'];
  return (
    <div className="fixed z-50 pointer-events-none bg-white rounded-xl shadow-xl border border-slate-200 p-3 min-w-[200px] text-sm"
      style={{ left: x + 14, top: y - 40 }}>
      <p className="font-bold text-slate-900 mb-1.5">{alloc.studentName}</p>
      <div className="space-y-0.5 text-xs text-slate-600">
        <Row l="Lugar"    v={`Fileira ${alloc.rowNumber} · Carteira ${alloc.seatNumber}`} />
        <Row l="Série"    v={alloc.grade}    cls={c.text} />
        <Row l="Turma"    v={alloc.classCode} />
        {alloc.studentId && <Row l="Matrícula" v={alloc.studentId} mono />}
      </div>
    </div>
  );
}
function Row({ l, v, cls = '', mono = false }: { l: string; v: string; cls?: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-400">{l}:</span>
      <span className={`font-medium ${cls} ${mono ? 'font-mono' : ''}`}>{v}</span>
    </div>
  );
}
