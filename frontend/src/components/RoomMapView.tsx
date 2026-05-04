import { useState } from 'react';
import { Allocation, Room, Session } from '../types';

const GRADE_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  '1ª SÉRIE': { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900', badge: 'bg-blue-500' },
  '2ª SÉRIE': { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-900', badge: 'bg-green-500' },
  '3ª SÉRIE': { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-900', badge: 'bg-orange-500' },
};

interface Props {
  session: Session;
}

export default function RoomMapView({ session }: Props) {
  const [selectedRoom, setSelectedRoom] = useState(1);
  const [hovered, setHovered] = useState<Allocation | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const room = session.rooms?.find(r => r.roomNumber === selectedRoom) ?? session.rooms?.[0];
  const { rows, seatsPerRow } = session.config;

  if (!room) return null;

  const seatMap = new Map<string, Allocation>();
  room.allocations.forEach(a => seatMap.set(`${a.rowNumber}-${a.seatNumber}`, a));

  return (
    <div className="space-y-4 relative">
      {/* Room selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-slate-700">Sala:</span>
        <div className="flex gap-1.5 flex-wrap">
          {session.rooms?.map(r => (
            <button
              key={r.roomNumber}
              onClick={() => setSelectedRoom(r.roomNumber)}
              className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
                r.roomNumber === selectedRoom
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-300 text-slate-600 hover:border-blue-400'
              }`}
            >
              {r.roomNumber.toString().padStart(2, '0')}
            </button>
          ))}
        </div>
      </div>

      {/* Room info */}
      <div className="flex items-center gap-4 text-sm">
        <span className="font-bold text-slate-900">{room.roomName}</span>
        <span className="text-slate-500">{room.allocations.length} alunos</span>
        <div className="flex gap-2">
          <Legend color="bg-blue-500" label={`1ª: ${room.stats.grade1}`} />
          <Legend color="bg-green-500" label={`2ª: ${room.stats.grade2}`} />
          <Legend color="bg-orange-500" label={`3ª: ${room.stats.grade3}`} />
          <Legend color="bg-slate-200" label="Vazio" />
        </div>
      </div>

      {/* Grid */}
      <div className="card p-4 overflow-x-auto">
        {/* Direction indicator */}
        <div className="flex justify-center mb-2">
          <div className="px-6 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-full">
            ► Frente da Sala (Quadro)
          </div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: rows }, (_, ri) => {
            const rowNum = ri + 1;
            return (
              <div key={rowNum} className="flex items-center gap-2">
                {/* Row label */}
                <div className="w-16 shrink-0 text-right">
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    Fileira {rowNum}
                  </span>
                </div>

                {/* Seats */}
                <div className="flex gap-1.5 flex-wrap">
                  {Array.from({ length: seatsPerRow }, (_, si) => {
                    const seatNum = si + 1;
                    const alloc = seatMap.get(`${rowNum}-${seatNum}`);
                    const colors = alloc ? GRADE_COLORS[alloc.grade] : null;

                    return (
                      <div
                        key={seatNum}
                        className={`relative w-[88px] h-[62px] rounded-lg border-2 cursor-default transition-all ${
                          alloc
                            ? `${colors!.bg} ${colors!.border} hover:shadow-md hover:-translate-y-0.5`
                            : 'bg-slate-50 border-slate-200 border-dashed opacity-60'
                        }`}
                        onMouseEnter={e => {
                          if (alloc) {
                            setHovered(alloc);
                            setHoverPos({ x: e.clientX, y: e.clientY });
                          }
                        }}
                        onMouseMove={e => {
                          if (alloc) setHoverPos({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseLeave={() => setHovered(null)}
                      >
                        {/* Seat label */}
                        <div className="absolute top-1 left-1.5 text-[9px] text-slate-400 font-mono">
                          F{rowNum}·C{seatNum}
                        </div>

                        {alloc ? (
                          <>
                            <div className={`absolute top-1 right-1.5 w-2 h-2 rounded-full ${colors!.badge}`} />
                            <div className={`px-1.5 pt-3 pb-1 h-full flex flex-col justify-between`}>
                              <p className={`text-[10px] font-semibold leading-tight line-clamp-2 ${colors!.text}`}>
                                {abbreviateName(alloc.studentName)}
                              </p>
                              <p className={`text-[9px] ${colors!.text} opacity-70 truncate`}>
                                {alloc.classCode}
                              </p>
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
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <Tooltip alloc={hovered} x={hoverPos.x} y={hoverPos.y} />
      )}
    </div>
  );
}

function abbreviateName(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length <= 2) return name;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded-sm ${color}`} />
      <span className="text-xs text-slate-600">{label}</span>
    </div>
  );
}

function Tooltip({ alloc, x, y }: { alloc: Allocation; x: number; y: number }) {
  const colors = GRADE_COLORS[alloc.grade] ?? GRADE_COLORS['1ª SÉRIE'];
  return (
    <div
      className="fixed z-50 pointer-events-none bg-white rounded-xl shadow-xl border border-slate-200 p-3 min-w-[200px] text-sm"
      style={{ left: x + 14, top: y - 40 }}
    >
      <p className="font-bold text-slate-900 mb-1">{alloc.studentName}</p>
      <div className="space-y-0.5 text-xs text-slate-600">
        <div className="flex justify-between gap-4">
          <span>Lugar:</span>
          <span className="font-mono font-medium">F{alloc.rowNumber}·C{alloc.seatNumber}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Série:</span>
          <span className={`font-semibold ${colors.text}`}>{alloc.grade}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Turma:</span>
          <span className="font-medium">{alloc.classCode}</span>
        </div>
        {alloc.studentId && (
          <div className="flex justify-between gap-4">
            <span>Matrícula:</span>
            <span className="font-mono">{alloc.studentId}</span>
          </div>
        )}
      </div>
    </div>
  );
}
