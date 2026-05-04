import { useEffect, useState } from 'react';
import { Allocation, Session } from '../types';

type BoardPos = 'top' | 'bottom' | 'left' | 'right';

const GRADE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  '1ª SÉRIE': { bg: 'bg-blue-50',   border: 'border-blue-300',   text: 'text-blue-900',   dot: 'bg-blue-500'   },
  '2ª SÉRIE': { bg: 'bg-green-50',  border: 'border-green-300',  text: 'text-green-900',  dot: 'bg-green-500'  },
  '3ª SÉRIE': { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-900', dot: 'bg-orange-500' },
};

interface Props {
  session: Session;
}

// Persist board positions in localStorage per session
function loadPositions(sessionId: string): Record<number, BoardPos> {
  try {
    const raw = localStorage.getItem(`boardPos-${sessionId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function savePositions(sessionId: string, pos: Record<number, BoardPos>) {
  localStorage.setItem(`boardPos-${sessionId}`, JSON.stringify(pos));
}

export default function RoomMapView({ session }: Props) {
  const [selectedRoom, setSelectedRoom] = useState(1);
  const [boardPositions, setBoardPositions] = useState<Record<number, BoardPos>>({});
  const [hovered, setHovered] = useState<Allocation | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setBoardPositions(loadPositions(session.id));
  }, [session.id]);

  function setBoardPos(roomNum: number, pos: BoardPos) {
    setBoardPositions(prev => {
      const next = { ...prev, [roomNum]: pos };
      savePositions(session.id, next);
      return next;
    });
  }

  const room = session.rooms?.find(r => r.roomNumber === selectedRoom) ?? session.rooms?.[0];
  const { rows, seatsPerRow } = session.config;
  const boardPos: BoardPos = boardPositions[selectedRoom] ?? 'top';

  if (!room) return null;

  const seatMap = new Map<string, Allocation>();
  room.allocations.forEach(a => seatMap.set(`${a.rowNumber}-${a.seatNumber}`, a));

  const boardIndicator = (
    <div className="flex items-center justify-center">
      <div className="px-5 py-1.5 bg-slate-800 text-white text-[11px] font-bold rounded-full tracking-wide shadow">
        ■ QUADRO / FRENTE DA SALA
      </div>
    </div>
  );

  const grid = (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, ri) => {
        const rowNum = ri + 1;
        return (
          <div key={rowNum} className="flex items-center gap-2">
            <div className="w-14 shrink-0 text-right">
              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                Fileira {rowNum}
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: seatsPerRow }, (_, si) => {
                const seatNum = si + 1;
                const alloc = seatMap.get(`${rowNum}-${seatNum}`);
                const colors = alloc ? GRADE_COLORS[alloc.grade] : null;
                return (
                  <div
                    key={seatNum}
                    className={`relative w-[84px] h-[58px] rounded-lg border-2 transition-all cursor-default ${
                      alloc
                        ? `${colors!.bg} ${colors!.border} hover:shadow-md hover:-translate-y-0.5`
                        : 'bg-slate-50 border-slate-200 border-dashed opacity-50'
                    }`}
                    onMouseEnter={e => { if (alloc) { setHovered(alloc); setHoverPos({ x: e.clientX, y: e.clientY }); } }}
                    onMouseMove={e => { if (alloc) setHoverPos({ x: e.clientX, y: e.clientY }); }}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div className="absolute top-1 left-1.5 text-[8px] text-slate-400 font-mono">
                      F{rowNum}·C{seatNum}
                    </div>
                    {alloc ? (
                      <>
                        <div className={`absolute top-1 right-1.5 w-2 h-2 rounded-full ${colors!.dot}`} />
                        <div className="px-1.5 pt-3.5 pb-1 h-full flex flex-col justify-between">
                          <p className={`text-[9.5px] font-semibold leading-tight line-clamp-2 ${colors!.text}`}>
                            {abbreviate(alloc.studentName)}
                          </p>
                          <p className={`text-[8px] ${colors!.text} opacity-70 truncate`}>{alloc.classCode}</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-[10px] text-slate-300">—</span>
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
    <div className="space-y-4 relative">
      {/* Room selector + board position controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-700">Sala:</span>
          <div className="flex gap-1 flex-wrap">
            {session.rooms?.map(r => (
              <button
                key={r.roomNumber}
                onClick={() => setSelectedRoom(r.roomNumber)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                  r.roomNumber === selectedRoom
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-300 text-slate-600 hover:border-blue-400'
                }`}
              >
                {String(r.roomNumber).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>

        {/* Board position control */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Quadro:</span>
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
            {(['top', 'bottom', 'left', 'right'] as BoardPos[]).map(pos => (
              <button
                key={pos}
                title={posLabel(pos)}
                onClick={() => setBoardPos(selectedRoom, pos)}
                className={`p-1.5 rounded-md transition-colors ${
                  boardPos === pos
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                <PosIcon pos={pos} />
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400">{posLabel(boardPos)}</span>
        </div>
      </div>

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
            <div className="shrink-0">
              <div className="px-2 py-10 bg-slate-800 text-white text-[10px] font-bold rounded-lg tracking-widest writing-mode-vertical"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
                ■ QUADRO / FRENTE
              </div>
            </div>
          )}

          <div className="flex-1">{grid}</div>

          {boardPos === 'right' && (
            <div className="shrink-0">
              <div className="px-2 py-10 bg-slate-800 text-white text-[10px] font-bold rounded-lg tracking-widest"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                ■ QUADRO / FRENTE
              </div>
            </div>
          )}
        </div>

        {boardPos === 'bottom' && <div className="mt-3">{boardIndicator}</div>}
      </div>

      {/* Hover tooltip */}
      {hovered && <Tooltip alloc={hovered} x={hoverPos.x} y={hoverPos.y} />}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function abbreviate(name: string): string {
  const p = name.trim().split(' ').filter(Boolean);
  return p.length <= 2 ? name : `${p[0]} ${p[p.length - 1]}`;
}

function posLabel(pos: BoardPos): string {
  return { top: 'Acima', bottom: 'Abaixo', left: 'Esquerda', right: 'Direita' }[pos];
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
      <span className="text-xs text-slate-600">{label}</span>
    </div>
  );
}

function PosIcon({ pos }: { pos: BoardPos }) {
  const arrows: Record<BoardPos, string> = { top: '↑', bottom: '↓', left: '←', right: '→' };
  return <span className="text-xs font-bold w-4 h-4 flex items-center justify-center">{arrows[pos]}</span>;
}

function Tooltip({ alloc, x, y }: { alloc: Allocation; x: number; y: number }) {
  const c = GRADE_COLORS[alloc.grade] ?? GRADE_COLORS['1ª SÉRIE'];
  return (
    <div
      className="fixed z-50 pointer-events-none bg-white rounded-xl shadow-xl border border-slate-200 p-3 min-w-[200px] text-sm"
      style={{ left: x + 14, top: y - 40 }}
    >
      <p className="font-bold text-slate-900 mb-1.5">{alloc.studentName}</p>
      <div className="space-y-0.5 text-xs text-slate-600">
        <Row label="Lugar" value={`Fileira ${alloc.rowNumber} · Carteira ${alloc.seatNumber}`} />
        <Row label="Série" value={alloc.grade} cls={c.text} />
        <Row label="Turma" value={alloc.classCode} />
        {alloc.studentId && <Row label="Matrícula" value={alloc.studentId} mono />}
      </div>
    </div>
  );
}

function Row({ label, value, cls = '', mono = false }: { label: string; value: string; cls?: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-400">{label}:</span>
      <span className={`font-medium ${cls} ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
